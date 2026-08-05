// Avatar upload flow:
//   1) Pick an image from the device library or camera (expo-image-picker).
//   2) POST /users/me/avatar/sign-upload → { bucket, storage_path, signed_url,
//      token, public_url }.
//   3) PUT the bytes to the signed URL via supabase.storage.uploadToSignedUrl.
//   4) PATCH /users/me with { avatar_url: public_url } (caller).

import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { api } from "./api";
import { supabase } from "./supabase";

const BUCKET = "avatars";

type SignedAvatarUpload = {
  bucket: string;
  storage_path: string;
  signed_url: string;
  token: string;
  public_url: string;
};

type Source = "library" | "camera";

function extFromAsset(asset: ImagePicker.ImagePickerAsset): "jpg" | "png" | "webp" | "heic" {
  const src = (asset.mimeType || asset.fileName || asset.uri || "").toLowerCase();
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

async function ensurePermission(source: Source): Promise<boolean> {
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed to take a photo.");
      return false;
    }
    return true;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission required", "Photo library access is needed.");
    return false;
  }
  return true;
}

async function pickImage(source: Source): Promise<ImagePicker.ImagePickerAsset | null> {
  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  };
  const res =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  return res.assets[0];
}

async function fetchAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  // React Native's `fetch(localUri).blob()` returns a zero-byte blob on some
  // platforms, which causes signed PUTs to fail with 400. `arrayBuffer()` is
  // reliable and Supabase accepts ArrayBuffer as the body.
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to read local image (${res.status})`);
  return res.arrayBuffer();
}

/**
 * Picks an avatar and uploads it to the avatars bucket.
 * Returns the public URL to store as avatar_url, or null if the user cancelled.
 */
export async function pickAndUploadAvatar(source: Source): Promise<string | null> {
  const allowed = await ensurePermission(source);
  if (!allowed) return null;

  const asset = await pickImage(source);
  if (!asset) return null;

  const ext = extFromAsset(asset);
  const mime = mimeFromExt(ext);

  const signed = (await api.signAvatarUpload({ ext })) as SignedAvatarUpload;
  if (!signed?.signed_url || !signed?.storage_path || !signed?.token) {
    throw new Error("Failed to sign avatar upload");
  }

  const body = await fetchAsArrayBuffer(asset.uri);
  const { error } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signed.storage_path, signed.token, body, {
      contentType: mime,
      upsert: true,
    });
  if (error) throw error;

  return signed.public_url;
}
