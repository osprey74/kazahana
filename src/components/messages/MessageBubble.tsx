import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict, type Locale } from "date-fns";
import { ja, enUS, de, es, fr, ko, pt, ru, id, zhTW, zhCN } from "date-fns/locale";
import { ChatBskyConvoDefs, ChatBskyEmbedJoinLink } from "@atproto/api";
import { useDeleteMessage, useAddReaction, useRemoveReaction } from "../../hooks/useMessages";
import { getAgent } from "../../lib/agent";
import { parseRichText } from "../../lib/richtext";
import { resolveInAppRoute } from "../../lib/externalLink";
import { Icon } from "../common/Icon";
import { JoinLinkEmbed } from "./JoinLinkEmbed";

const dateFnsLocales: Record<string, Locale> = {
  ja, en: enUS, de, es, fr, ko, pt, ru, id, "zh-TW": zhTW, "zh-CN": zhCN,
};

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🎉"];

export interface ReplyTargetSelection {
  messageId: string;
  preview: string;
  isDeleted: boolean;
}

interface MessageBubbleProps {
  message: ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView;
  isMine: boolean;
  convoId: string;
  onReply?: (target: ReplyTargetSelection) => void;
}

export function MessageBubble({ message, isMine, convoId, onReply }: MessageBubbleProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const deleteMessage = useDeleteMessage();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  const myDid = getAgent().session?.did;
  const isDeleted = ChatBskyConvoDefs.isDeletedMessageView(message);
  const locale = dateFnsLocales[i18n.language] ?? enUS;
  const timeAgo = formatDistanceToNowStrict(new Date(message.sentAt), {
    addSuffix: false,
    locale,
  });

  if (isDeleted) {
    return (
      <div
        data-message-id={(message as ChatBskyConvoDefs.DeletedMessageView).id}
        className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-1`}
      >
        <div className="px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm italic">
          {t("messages.deleted")}
        </div>
      </div>
    );
  }

  const msg = message as ChatBskyConvoDefs.MessageView;
  const reactions = msg.reactions ?? [];
  const joinLinkEmbed = ChatBskyEmbedJoinLink.isView(msg.embed) ? msg.embed : null;
  const replyTarget = resolveReplyTarget(msg.replyTo);

  // Group reactions by emoji value: { emoji: { count, senders[], myReaction } }
  const grouped = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const existing = grouped.get(r.value);
    const isMineReaction = r.sender.did === myDid;
    if (existing) {
      existing.count++;
      if (isMineReaction) existing.mine = true;
    } else {
      grouped.set(r.value, { count: 1, mine: isMineReaction });
    }
  }

  const handleReaction = (emoji: string) => {
    const existing = grouped.get(emoji);
    if (existing?.mine) {
      removeReaction.mutate({ convoId, messageId: msg.id, value: emoji });
    } else {
      addReaction.mutate({ convoId, messageId: msg.id, value: emoji });
    }
    setShowEmojiPicker(false);
  };

  return (
    <div
      data-message-id={msg.id}
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-1 group`}
      onMouseLeave={() => { setShowMenu(false); setShowEmojiPicker(false); }}
    >
      <div className="relative max-w-[75%]">
        {replyTarget && (
          <button
            type="button"
            onClick={() => scrollAndFlashMessage(replyTarget.id)}
            className={`flex items-stretch gap-1.5 mb-1 max-w-full text-left ${
              isMine ? "ml-auto" : ""
            }`}
            title={replyTarget.isDeleted ? t("messages.deleted") : replyTarget.preview}
          >
            <span
              className={`w-0.5 rounded-full ${
                isMine ? "bg-primary/60" : "bg-gray-400 dark:bg-gray-500"
              }`}
            />
            <span className="flex flex-col min-w-0 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium opacity-80">
                {t("messages.reply.replyingTo")}
              </span>
              <span className={`truncate ${replyTarget.isDeleted ? "italic" : ""}`}>
                {replyTarget.isDeleted ? t("messages.deleted") : replyTarget.preview}
              </span>
            </span>
          </button>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isMine
              ? "bg-primary text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-bl-md"
          }`}
        >
          {parseRichText(msg.text, msg.facets).map((seg, i) => {
            if (seg.link) {
              const inApp = resolveInAppRoute(seg.link.uri);
              if (inApp) {
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => navigate(inApp)}
                    className={isMine ? "underline hover:opacity-80" : "text-primary hover:underline"}
                  >
                    {seg.text}
                  </button>
                );
              }
              return (
                <a
                  key={i}
                  href={seg.link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={isMine ? "underline hover:opacity-80" : "text-primary hover:underline"}
                >
                  {seg.text}
                </a>
              );
            }
            if (seg.mention) {
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => navigate(`/profile/${seg.mention!.did}`)}
                  className={isMine ? "underline hover:opacity-80" : "text-primary hover:underline"}
                >
                  {seg.text}
                </button>
              );
            }
            if (seg.tag) {
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(`#${seg.tag!.tag}`)}`)}
                  className={isMine ? "underline hover:opacity-80" : "text-primary hover:underline"}
                >
                  {seg.text}
                </button>
              );
            }
            return <span key={i}>{seg.text}</span>;
          })}
        </div>

        {joinLinkEmbed && (
          <div className={`mt-1 ${isMine ? "flex justify-end" : ""}`}>
            <JoinLinkEmbed embed={joinLinkEmbed} isMine={isMine} />
          </div>
        )}

        {/* Reactions display */}
        {grouped.size > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {[...grouped.entries()].map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                  mine
                    ? "border-primary/40 bg-primary/10 dark:bg-primary/20"
                    : "border-border-light dark:border-border-dark bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px] text-gray-500 dark:text-gray-400">{count}</span>}
              </button>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-gray-400">{timeAgo}</span>
          {/* Emoji reaction button */}
          <button
            type="button"
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowMenu(false); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={t("messages.addReaction")}
          >
            <Icon name="add_reaction" size={14} />
          </button>
          {(isMine || onReply) && (
            <button
              type="button"
              onClick={() => { setShowMenu(!showMenu); setShowEmojiPicker(false); }}
              className="text-gray-400 hover:text-gray-600"
              title={t("common.menu")}
            >
              <Icon name="more_horiz" size={14} />
            </button>
          )}
        </div>

        {/* Emoji quick picker */}
        {showEmojiPicker && (
          <div className={`absolute ${isMine ? "right-0" : "left-0"} top-full mt-1 flex items-center gap-0.5 px-2 py-1.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-full shadow-lg z-10`}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Action menu */}
        {showMenu && (isMine || onReply) && (
          <div className={`absolute ${isMine ? "right-0" : "left-0"} top-full mt-1 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10`}>
            {onReply && (
              <button
                type="button"
                onClick={() => {
                  onReply({ messageId: msg.id, preview: msg.text, isDeleted: false });
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
              >
                <Icon name="reply" size={14} />
                {t("messages.reply.action")}
              </button>
            )}
            {isMine && (
              <button
                type="button"
                onClick={() => {
                  deleteMessage.mutate({ convoId, messageId: msg.id });
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
              >
                <Icon name="delete" size={14} />
                {t("messages.deleteForMe")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ReplyTarget {
  id: string;
  preview: string;
  isDeleted: boolean;
}

function resolveReplyTarget(
  replyTo: ChatBskyConvoDefs.MessageView["replyTo"],
): ReplyTarget | null {
  if (!replyTo) return null;
  if (ChatBskyConvoDefs.isMessageView(replyTo)) {
    return {
      id: replyTo.id,
      preview: replyTo.text,
      isDeleted: false,
    };
  }
  if (ChatBskyConvoDefs.isDeletedMessageView(replyTo)) {
    return {
      id: replyTo.id,
      preview: "",
      isDeleted: true,
    };
  }
  return null;
}

function scrollAndFlashMessage(messageId: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-message-id="${CSS.escape(messageId)}"]`,
  );
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("kazahana-message-flash");
  // Re-trigger animation by reading offsetWidth between toggles.
  void el.offsetWidth;
  el.classList.add("kazahana-message-flash");
  window.setTimeout(() => el.classList.remove("kazahana-message-flash"), 1000);
}
