import * as Notifications from "expo-notifications";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export function useCommuteNotifications() {
  const [status, setStatus] = useState<string | null>(null);

  const scheduleReminder = useCallback(async (routeName: string) => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("commutes", {
        name: "Commutes",
        importance: Notifications.AndroidImportance.DEFAULT
      });
    }

    const permissions = await Notifications.requestPermissionsAsync();
    if (!permissions.granted) {
      setStatus("Notification permission was not granted.");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Thanal commute check",
        body: `${routeName}: refresh today's sun, glare, and rain recommendation before leaving.`,
        data: { routeName }
      },
      trigger: {
        seconds: 60,
        channelId: "commutes"
      }
    });

    setStatus("Reminder scheduled for one minute from now.");
    return notificationId;
  }, []);

  return { notificationStatus: status, scheduleReminder };
}
