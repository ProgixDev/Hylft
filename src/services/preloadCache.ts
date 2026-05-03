import { api } from "./api";
import { mapPostToUi, type BackendPost } from "./feedMappers";
import type { PostData } from "../components/ui/Post";

export type MyProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string | null;
};

export type UserStats = {
  posts_count: number;
  followers_count: number;
  following_count: number;
  likes_count: number;
};

export const DEFAULT_USER_STATS: UserStats = {
  posts_count: 0,
  followers_count: 0,
  following_count: 0,
  likes_count: 0,
};

type FeedCache = {
  userId: string;
  posts: PostData[];
  cursor: string | null;
  hasMore: boolean;
};

type ProfileCache = {
  userId: string;
  profile: MyProfile | null;
  stats: UserStats;
};

let feedCache: FeedCache | null = null;
let profileCache: ProfileCache | null = null;
let inflight: Promise<void> | null = null;
let inflightUserId: string | null = null;

const FEED_PAGE_SIZE = 20;

export function getFeedCache(userId: string | undefined | null) {
  if (!userId || feedCache?.userId !== userId) return null;
  return feedCache;
}

export function setFeedCache(cache: FeedCache | null) {
  feedCache = cache;
}

export function getProfileCache(userId: string | undefined | null) {
  if (!userId || profileCache?.userId !== userId) return null;
  return profileCache;
}

export function setProfileCache(cache: ProfileCache | null) {
  profileCache = cache;
}

export function clearPreloadCache() {
  feedCache = null;
  profileCache = null;
  inflight = null;
  inflightUserId = null;
}

async function preloadFeed(userId: string) {
  try {
    const res = (await api.listPosts({
      scope: "timeline",
      limit: FEED_PAGE_SIZE,
    })) as { items: BackendPost[]; next_cursor: string | null };
    const posts = (res.items ?? []).map(mapPostToUi);
    feedCache = {
      userId,
      posts,
      cursor: res.next_cursor,
      hasMore: !!res.next_cursor,
    };
  } catch {
    // Swallow; screen will retry on mount.
  }
}

async function preloadProfile(userId: string) {
  try {
    const [prof, stats] = await Promise.all([
      api.getProfile() as Promise<MyProfile>,
      api.getUserStats(userId) as Promise<UserStats>,
    ]);
    profileCache = { userId, profile: prof, stats };
  } catch {
    // Swallow; screen will retry on mount.
  }
}

export function preloadAppData(userId: string): Promise<void> {
  if (!userId) return Promise.resolve();
  if (inflight && inflightUserId === userId) return inflight;

  inflightUserId = userId;
  inflight = Promise.all([preloadFeed(userId), preloadProfile(userId)]).then(
    () => {
      inflight = null;
      inflightUserId = null;
    },
  );
  return inflight;
}
