import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDistanceToNowStrict, type Locale } from "date-fns";
import { ja, enUS, de, es, fr, ko, pt, ru, id, zhTW, zhCN } from "date-fns/locale";
import { ChatBskyConvoDefs } from "@atproto/api";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { useAuthStore } from "../../stores/authStore";

const dateFnsLocales: Record<string, Locale> = {
  ja, en: enUS, de, es, fr, ko, pt, ru, id, "zh-TW": zhTW, "zh-CN": zhCN,
};

interface ConversationItemProps {
  conversation: ChatBskyConvoDefs.ConvoView;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const myDid = useAuthStore((s) => s.profile?.did);

  const group = ChatBskyConvoDefs.isGroupConvo(conversation.kind) ? conversation.kind : null;
  const isGroup = !!group;
  const isLocked = group?.lockStatus === "locked" || group?.lockStatus === "locked-permanently";
  const other = conversation.members.find((m) => m.did !== myDid) ?? conversation.members[0];
  const displayName = isGroup
    ? group!.name
    : other?.displayName || other?.handle || t("messages.unknown");

  const lastMessage = conversation.lastMessage;
  let preview = "";
  let sentAt: string | undefined;
  if (lastMessage && ChatBskyConvoDefs.isMessageView(lastMessage)) {
    preview = lastMessage.text;
    sentAt = lastMessage.sentAt;
  } else if (lastMessage && ChatBskyConvoDefs.isDeletedMessageView(lastMessage)) {
    preview = t("messages.deleted");
    sentAt = lastMessage.sentAt;
  } else if (lastMessage && ChatBskyConvoDefs.isSystemMessageView(lastMessage)) {
    preview = t("messages.system.unknownSystemMessage");
    sentAt = lastMessage.sentAt;
  }

  const locale = dateFnsLocales[i18n.language] ?? enUS;
  const timeAgo = sentAt
    ? formatDistanceToNowStrict(new Date(sentAt), { addSuffix: false, locale })
    : "";

  const isUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={() => navigate(`/messages/${conversation.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-border-light dark:border-border-dark text-left"
    >
      {isGroup ? (
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center text-primary">
          <Icon name="group" size={22} />
        </div>
      ) : (
        <Avatar src={other?.avatar} alt={displayName} size="md" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate flex items-center gap-1 ${isUnread ? "font-bold text-text-light dark:text-text-dark" : "font-medium text-text-light dark:text-text-dark"}`}>
            <span className="truncate">{displayName}</span>
            {isGroup && (
              <span className="text-[10px] font-normal text-gray-400 flex-shrink-0">
                · {t("messages.group.memberCount", { count: group!.memberCount })}
              </span>
            )}
            {isLocked && (
              <Icon
                name={group?.lockStatus === "locked-permanently" ? "lock" : "lock_outline"}
                size={12}
                className="text-gray-400 flex-shrink-0"
              />
            )}
          </span>
          {timeAgo && (
            <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <p className={`text-xs truncate ${isUnread ? "font-semibold text-text-light dark:text-text-dark" : "text-gray-500 dark:text-gray-400"}`}>
            {preview || t("messages.noMessages")}
          </p>
          {isUnread && (
            <span className="flex-shrink-0 min-w-[16px] h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
