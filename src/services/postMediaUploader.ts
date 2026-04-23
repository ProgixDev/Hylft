// Uploads locally-picked images to the `post-media` bucket via Supabase-signed
// upload URLs and returns the storage paths to attach to a new post.
//
// Flow:
//   1) POST /api/posts/media/sign-upload { count, ext } → list of
//      { storage_path, signed_url, token }.
//   2) For each local image, PUT the bytes to the signed URL via
//      supabase.storage.uploadToSignedUrl.
//   3) Return storage_paths — caller sends them with createPost().

import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { api } from "./api";
import { supabase } from "./supabase";

const BUCKET = "post-media";
export const MAX_POST_IMAGES = 4;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type SignedUpload = {
  storage_path: string;
  signed_url: string;
  token: string;
};

type SignResponse = { bucket: string; uploads: SignedUpload[] };

export interface LocalImage {
  uri: string;
  // Optional hints when available from the image picker.
  mimeType?: string | null;
  fileName?: string | null;
  width?: number;
  height?: number;
}

function extFromHints(img: LocalImage): "jpg" | "png" | "webp" | "heic" {
  const src = (img.mimeType || img.fileName || img.uri).toLowerCase();
  if (src.includes("png")) return "png";
  if (src.includes("webp")) return "webp";
  if (src.includes("heic") || src.includes("heif")) return "heic";
  return "jpg";
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

async function fetchAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  // React Native's `fetch(localUri).blob()` returns a zero-byte blob on some
  // platforms. `arrayBuffer()` is reliable and Supabase accepts ArrayBuffer
  // as the body for uploadToSignedUrl.
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Failed to read local image (${res.status})`);
  }
  return res.arrayBuffer();
}

async function fetchAsBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Failed to read local image (${res.status})`);
  }
  return res.blob();
}

/**
 * Uploads all given local images in parallel and returns the storage paths in
 * the same order. Images must all use the same extension (we take it from the
 * first image) because the server signs N urls for a single extension.
 */
export async function uploadPostImages(
  images: LocalImage[],
): Promise<{ storage_path: string; width?: number; height?: number }[]> {
  if (images.length === 0) return [];
  if (images.length > 4) throw new Error("A post may have at most 4 images");

  const ext = extFromHints(images[0]);
  const mime = mimeFromExt(ext);

  const signed = (await api.signPostMediaUpload({
    count: images.length,
    ext,
  })) as SignResponse;
  if (!signed?.uploads || signed.uploads.length !== images.length) {
    throw new Error("Failed to sign upload URLs");
  }

  await Promise.all(
    images.map(async (img, idx) => {
      const slot = signed.uploads[idx];
      const body = await fetchAsArrayBuffer(img.uri);
      const { error } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(slot.storage_path, slot.token, body, {
          contentType: mime,
          upsert: false,
        });
      if (error) throw error;
    }),
  );

  return images.map((img, idx) => ({
    storage_path: signed.uploads[idx].storage_path,
    width: img.width,
    height: img.height,
  }));
}

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission requise", "L'accès à la photothèque est nécessaire.");
    return false;
  }
  return true;
}

async function resolveSize(
  asset: ImagePicker.ImagePickerAsset,
): Promise<number | undefined> {
  if (typeof asset.fileSize === "number") return asset.fileSize;
  try {
    const blob = await fetchAsBlob(asset.uri);
    return blob.size;
  } catch {
    return undefined;
  }
}

/**
 * Opens the media library and returns validated picked images (≤ 5 MB each,
 * up to `MAX_POST_IMAGES` total including `currentCount` already chosen).
 * Oversized picks are dropped and the user is alerted.
 */
export async function pickPostImages(
  currentCount = 0,
): Promise<LocalImage[]> {
  const remaining = MAX_POST_IMAGES - currentCount;
  if (remaining <= 0) {
    Alert.alert(
      "Limite atteinte",
      `Maximum ${MAX_POST_IMAGES} images par publication.`,
    );
    return [];
  }
  const allowed = await ensureLibraryPermission();
  if (!allowed) return [];

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.85,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) return [];

  const kept: LocalImage[] = [];
  let rejected = 0;
  for (const a of res.assets) {
    const size = await resolveSize(a);
    if (size != null && size > MAX_IMAGE_BYTES) {
      rejected++;
      continue;
    }
    kept.push({
      uri: a.uri,
      mimeType: a.mimeType,
      fileName: a.fileName ?? undefined,
      width: a.width,
      height: a.height,
    });
  }
  if (rejected > 0) {
    Alert.alert(
      "Image trop volumineuse",
      `${rejected} image(s) dépassent la taille maximale de 5 MB et ont été ignorées.`,
    );
  }
  return kept;
}
