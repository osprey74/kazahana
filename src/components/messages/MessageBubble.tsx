import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNowStrict } from "date-fns";
import { ja, enUS, de, es, fr, ko, pt, ru, id, zhTW, zhCN } from "date-fns/locale";
import { ChatBskyConvoDefs } from "@atproto/api";
import { useDeleteMessage } from "../../hooks/useMessages";
import { Icon } from "../common/Icon";

const dateFnsLocales: Record<string, Locale> = {
  ja, en: enUS, de, es, fr, ko, pt, ru, id, "zh-TW": zhTW, "zh-CN": zhCN,
};

interface MessageBubbleProps {
  message: ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView;
  isMine: boolean;
  convoId: string;
}

export function MessageBubble({ message, isMine, convoId }: MessageBubbleProps) {
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const deleteMessage = useDeleteMessage();

  const isDeleted = ChatBskyConvoDefs.isDeletedMessageView(message);
  const locale = dateFnsLocales[i18n.language] ?? enUS;
  const timeAgo = formatDistanceToNowStrict(new Date(message.sentAt), {
    addSuffix: false,
    locale,
  });

  if (isDeleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-1`}>
        <div className="px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm italic">
          {t("messages.deleted")}
        </div>
      </div>
    );
  }

  const msg = message as ChatBskyConvoDefs.MessageView;

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-1 group`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="relative max-w-[75%]">
        <div
          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isMine
              ? "bg-primary text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-bl-md"
          }`}
        >
          {msg.text}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-gray-400">{timeAgo}</span>
          {isMine && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
            >
              <Icon name="more_horiz" size={14} />
            </button>
          )}
        </div>
        {showMenu && isMine && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                deleteMessage.mutate({ convoId, messageId: msg.id });
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              <Icon name="delete" size={14} />
              {t("messages.deleteForMe")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
