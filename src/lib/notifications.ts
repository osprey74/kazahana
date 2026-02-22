import {
  isPermissionGranted,
  requestPermission,
  sendNotification as tauriSendNotification,
} from "@tauri-apps/plugin-notification";
import i18n from "../i18n";
import { useSettingsStore } from "../stores/settingsStore";

export type NotificationReasonCounts = Partial<
  Record<"like" | "repost" | "follow" | "mention" | "reply" | "quote", number>
>;

/**
 * Send an OS desktop notification for new Bluesky notifications.
 * Respects the user's desktopNotification setting.
 */
export async function sendNotification(
  reasons: NotificationReasonCounts,
): Promise<void> {
  const total = Object.values(reasons).reduce((s, n) => s + (n ?? 0), 0);
  if (total <= 0) return;
  if (!useSettingsStore.getState().desktopNotification) return;

  try {
    let permitted = await isPermissionGranted();
    if (!permitted) {
      const permission = await requestPermission();
      permitted = permission === "granted";
    }
    if (!permitted) return;

    const body = buildNotificationBody(reasons, total);

    tauriSendNotification({
      title: "kazahana",
      body,
    });
  } catch {
    // Non-critical: notification may not be available in dev mode
  }
}

const REASON_KEYS: (keyof NotificationReasonCounts)[] = [
  "like",
  "repost",
  "follow",
  "mention",
  "reply",
  "quote",
];

function buildNotificationBody(
  reasons: NotificationReasonCounts,
  total: number,
): string {
  const parts: string[] = [];
  for (const key of REASON_KEYS) {
    const count = reasons[key];
    if (count && count > 0) {
      parts.push(i18n.t(`notification.reason.${key}`, { count }));
    }
  }
  if (parts.length > 0) return parts.join(i18n.t("notification.separator"));
  return i18n.t("notification.osBody", { count: total });
}
