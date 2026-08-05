import { api } from "./api";

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

type ProfileCache = {
  userId: string;
  profile: MyProfile | null;
  stats: UserStats;
};

let profileCache: ProfileCache | null = null;
let inflight: Promise<void> | null = null;
let inflightUserId: string | null = null;

export function getProfileCache(userId: string | undefined | null) {
  if (!userId || profileCache?.userId !== userId) return null;
  return profileCache;
}

export function setProfileCache(cache: ProfileCache | null) {
  profileCache = cache;
}

export function clearPreloadCache() {
  profileCache = null;
  inflight = null;
  inflightUserId = null;
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
  inflight = preloadProfile(userId).then(() => {
    inflight = null;
    inflightUserId = null;
  });
  return inflight;
}
