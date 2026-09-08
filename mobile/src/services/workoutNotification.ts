import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIFICATION_ID = "active-workout";
const CHANNEL_ID = "workout-session";

/** Set up the notification channel (Android), request permissions, and configure handler. */
export async function setupWorkoutNotificationChannel() {
  // Request permission (iOS needs explicit ask; Android auto-grants for local)
  const { status } = await Notifications.requestPermissionsAsync();
  console.log("[WorkoutNotif] Permission status:", status);
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Workout Session",
      importance: Notifications.AndroidImportance.LOW, // no sound, persistent
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: false,
      showBadge: false,
    });
  }

  // Don't show in-app banner for this notification
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Show or update the ongoing workout notification. */
export async function showWorkoutNotification({
  exerciseName,
  setLabel,
  routineName,
}: {
  exerciseName: string;
  setLabel: string;
  routineName: string;
}) {
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: `🏋️ ${exerciseName}`,
      body: setLabel,
      subtitle: routineName,
      sticky: true, // Android: can't be swiped away
      autoDismiss: false,
      ...(Platform.OS === "android"
        ? {
            priority: Notifications.AndroidNotificationPriority.LOW,
            channelId: CHANNEL_ID,
          }
        : {}),
    },
    trigger: null, // show immediately
  });
}

/** Dismiss the workout notification. */
export async function dismissWorkoutNotification() {
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
}
