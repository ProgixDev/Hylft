import type { PostData } from "../components/ui/Post";

type BackendAuthor = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
};

type BackendMedia = {
  position: number;
  storage_path: string;
  url: string | null;
  width?: number | null;
  height?: number | null;
};

export type BackendPost = {
  id: string;
  author_id: string;
  kind: string;
  caption: string | null;
  privacy: "public" | "followers" | "private";
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
  workout_session_id: string | null;
  weight_entry_id: string | null;
  stats: {
    weight?: string | number;
    reps?: string | number;
    sets?: string | number;
    duration?: string | number;
  } | null;
  author: BackendAuthor | null;
  media: BackendMedia[];
};

export function mapPostToUi(p: BackendPost): PostData {
  const author = p.author;
  return {
    id: p.id,
    user: {
      id: p.author_id,
      username: author?.username ?? "unknown",
      avatar: author?.avatar_url ?? "",
      bio: author?.bio ?? undefined,
    },
    images: (p.media ?? [])
      .filter((m) => !!m.url)
      .map((m) => m.url as string),
    likes: p.likes_count,
    caption: p.caption ?? "",
    comments: p.comments_count,
    timestamp: p.created_at,
    isLiked: !!p.is_liked,
    privacy: p.privacy,
  };
}
