export const APP_TUTORIAL_PENDING_KEY = "@hylift_app_tutorial_pending";
export const APP_TUTORIAL_COMPLETED_KEY = "@hylift_app_tutorial_completed";

export function userTutorialStorageKey(baseKey: string, userId: string) {
  return `${baseKey}:${userId}`;
}
