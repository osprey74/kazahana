import { useNavigate } from "react-router-dom";
import type { Notification } from "@atproto/api/dist/client/types/app/bsky/notification/listNotifications";
import { formatDistanceToNowStrict } from "date-fns";
import { ja } from "date-fns/locale";
import { Avatar } from "../common/Avatar";

interface NotificationItemProps {
  notification: Notification;
}

const REASON_MAP: Record<string, { icon: string; label: string }> = {
  like: { icon: "❤️", label: "がいいねしました" },
  repost: { icon: "🔁", label: "がリポストしました" },
  follow: { icon: "👤", label: "にフォローされました" },
  mention: { icon: "💬", label: "があなたをメンションしました" },
  reply: { icon: "💬", label: "が返信しました" },
  quote: { icon: "🔁", label: "が引用しました" },
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const { author, reason, indexedAt, isRead } = notification;
  const info = REASON_MAP[reason] ?? { icon: "🔔", label: "" };

  const timeAgo = formatDistanceToNowStrict(new Date(indexedAt), {
    locale: ja,
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

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3 border-b border-border-light transition-colors cursor-pointer hover:bg-gray-50 ${
        !isRead ? "bg-blue-50/50" : ""
      }`}
    >
      <Avatar src={author.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 text-sm">
          <span className="mr-1">{info.icon}</span>
          <span className="font-bold text-text-light truncate">
            {author.displayName || author.handle}
          </span>
          <span className="text-gray-500 flex-shrink-0">{info.label}</span>
        </div>
        {(reason === "reply" || reason === "mention" || reason === "quote") &&
          record?.text && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {record.text}
            </p>
          )}
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>
    </div>
  );
}
