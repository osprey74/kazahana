import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

interface NotificationItemProps {
  notification: Notification;
  subjectPost?: PostView;
}

const REASON_ICONS: Record<string, string> = {
  like: "favorite",
  repost: "repeat",
  follow: "person_add",
  mention: "chat_bubble",
  reply: "chat_bubble",
  quote: "repeat",
};

const REASON_KEYS: Record<string, string> = {
  like: "notification.liked",
  repost: "notification.reposted",
  follow: "notification.followed",
  mention: "notification.mentioned",
  reply: "notification.replied",
  quote: "notification.quoted",
};

export function NotificationItem({ notification, subjectPost }: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { author, reason, indexedAt, isRead } = notification;
  const icon = REASON_ICONS[reason] ?? "notifications";
  const labelKey = REASON_KEYS[reason];
  const label = labelKey ? t(labelKey) : "";

  const locale = i18n.language.startsWith("ja") ? ja : enUS;
  const timeAgo = formatDistanceToNowStrict(new Date(indexedAt), {
    locale,
    addSuffix: false,
  });

  const record = notification.record as { text?: string } | undefined;
  const subjectUri = notification.reasonSubject;

  const handleClick = () => {
    if (reason === "follow") return;
    const uri = subjectUri || notification.uri;
    if (uri) {
      navigate(`/post/${encodeURIComponent(uri)}`);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${author.handle}`);
  };

  // For reply/mention/quote: show the notification's own record text
  // For like/repost: show the subject post's text
  const displayText =
    (reason === "reply" || reason === "mention" || reason === "quote")
      ? record?.text
      : (reason === "like" || reason === "repost")
        ? (subjectPost?.record as { text?: string } | undefined)?.text
        : undefined;

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
        !isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
      }`}
    >
      <button onClick={handleProfileClick} className="self-start hover:opacity-80">
        <Avatar src={author.avatar} size="sm" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm">
          <Icon name={icon} size={16} className="text-gray-500 flex-shrink-0" filled={reason === "like"} />
          <button onClick={handleProfileClick} className="font-bold text-text-light dark:text-text-dark truncate hover:underline">
            {author.displayName || author.handle}
          </button>
          <span className="text-gray-500 flex-shrink-0">{label}</span>
        </div>
        {displayText && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {displayText}
          </p>
        )}
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>
    </div>
  );
}
