import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { PostData } from "../components/ui/Post";
import { mapPostToUi, type BackendPost } from "../services/feedMappers";
import { useAuth } from "../contexts/AuthContext";
import { getFeedCache, setFeedCache } from "../services/preloadCache";

type Scope = "timeline" | "author";

type Options = {
  scope?: Scope;
  authorId?: string;
  pageSize?: number;
};

type ListResponse = { items: BackendPost[]; next_cursor: string | null };

export function useFeedTimeline({
  scope = "timeline",
  authorId,
  pageSize = 20,
}: Options = {}) {
  const { user } = useAuth();
  const initialCache =
    scope === "timeline" ? getFeedCache(user?.id) : null;
  const [posts, setPosts] = useState<PostData[]>(
    initialCache?.posts ?? [],
  );
  const [loading, setLoading] = useState(!initialCache);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(
    initialCache?.cursor ?? null,
  );
  const [hasMore, setHasMore] = useState(initialCache?.hasMore ?? true);
  const reqRef = useRef(0);
  const skipInitialFetchRef = useRef(!!initialCache);

  const fetchPage = useCallback(
    async (nextCursor?: string | null, replace = false) => {
      const reqId = ++reqRef.current;
      try {
        const res: ListResponse = await api.listPosts({
          scope,
          author_id: authorId,
          limit: pageSize,
          cursor: nextCursor ?? undefined,
        });
        if (reqId !== reqRef.current) return; // stale
        const ui = (res.items ?? []).map(mapPostToUi);
        const nextPosts = replace ? ui : null;
        setPosts((prev) => (nextPosts ? nextPosts : [...prev, ...ui]));
        setCursor(res.next_cursor);
        setHasMore(!!res.next_cursor);
        setError(null);
        if (replace && scope === "timeline" && user?.id) {
          setFeedCache({
            userId: user.id,
            posts: ui,
            cursor: res.next_cursor,
            hasMore: !!res.next_cursor,
          });
        }
      } catch (e) {
        if (reqId !== reqRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load feed");
      }
    },
    [scope, authorId, pageSize, user?.id],
  );

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await fetchPage(null, /*replace*/ true);
    setLoading(false);
  }, [fetchPage]);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      // Refresh in background so cached data stays fresh.
      void fetchPage(null, /*replace*/ true);
      return;
    }
    initialLoad();
  }, [initialLoad, fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(null, /*replace*/ true);
    setRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    await fetchPage(cursor, /*replace*/ false);
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, fetchPage]);

  const toggleLike = useCallback(async (postId: string) => {
    // Optimistic update, then reconcile.
    let prevState: { isLiked: boolean; likes: number } | null = null;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        prevState = { isLiked: p.isLiked, likes: p.likes };
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? Math.max(p.likes - 1, 0) : p.likes + 1,
        };
      }),
    );
    try {
      if (prevState?.isLiked) {
        await api.unlikePost(postId);
      } else {
        await api.likePost(postId);
      }
    } catch {
      // Rollback on error.
      if (prevState) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: prevState!.isLiked, likes: prevState!.likes }
              : p,
          ),
        );
      }
    }
  }, []);

  const prependPost = useCallback((post: PostData) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const patchPost = useCallback(
    (postId: string, patch: Partial<PostData>) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    toggleLike,
    prependPost,
    removePost,
    patchPost,
    reload: initialLoad,
  };
}
