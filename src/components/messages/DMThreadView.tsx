import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatBskyConvoDefs } from "@atproto/api";
import { useMessages, useSendMessage, useMarkConvoAsRead } from "../../hooks/useMessages";
import { getChatAgent } from "../../lib/chatAgent";
import { useAuthStore } from "../../stores/authStore";
import { MessageBubble } from "./MessageBubble";
import { Avatar } from "../common/Avatar";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Icon } from "../common/Icon";

export function DMThreadView() {
  const { convoId } = useParams<{ convoId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const myDid = useAuthStore((s) => s.profile?.did);
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const convoQuery = useQuery({
    queryKey: ["conversation", convoId],
    queryFn: async () => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.getConvo({ convoId: convoId! });
      return res.data.convo;
    },
    enabled: !!convoId,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useMessages(convoId!);

  const sendMessage = useSendMessage();
  const markAsRead = useMarkConvoAsRead();

  // Mark as read when viewing
  useEffect(() => {
    if (convoId) markAsRead(convoId);
  }, [convoId, markAsRead]);

  // Poll for new messages
  useEffect(() => {
    if (!convoId) return;
    const id = setInterval(() => refetch(), 15_000);
    return () => clearInterval(id);
  }, [convoId, refetch]);

  const messages = useMemo(() => {
    if (!data?.pages) return [];
    // Messages come newest-first from API, reverse for display
    // Filter to known message types (exclude unknown { $type: string } variants)
    return data.pages
      .flatMap((page) => page.messages)
      .filter(
        (msg) =>
          ChatBskyConvoDefs.isMessageView(msg) || ChatBskyConvoDefs.isDeletedMessageView(msg),
      ) as (ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView)[];
  }, [data]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !convoId) return;
    setText("");
    try {
      await sendMessage.mutateAsync({ convoId, text: trimmed });
    } catch {
      setText(trimmed);
    }
  }, [text, convoId, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const convo = convoQuery.data;
  const other = convo?.members.find((m) => m.did !== myDid) ?? convo?.members[0];
  const isRequest = convo?.status === "request";

  const handleMuteToggle = useCallback(async () => {
    if (!convoId || !convo) return;
    const agent = getChatAgent();
    if (convo.muted) {
      await agent.chat.bsky.convo.unmuteConvo({ convoId });
    } else {
      await agent.chat.bsky.convo.muteConvo({ convoId });
    }
    convoQuery.refetch();
    setShowMenu(false);
  }, [convoId, convo, convoQuery]);

  const handleLeave = useCallback(async () => {
    if (!convoId) return;
    if (!confirm(t("messages.leaveConfirm"))) return;
    const agent = getChatAgent();
    await agent.chat.bsky.convo.leaveConvo({ convoId });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    navigate("/messages");
  }, [convoId, t, queryClient, navigate]);

  const handleAccept = useCallback(async () => {
    if (!convoId) return;
    const agent = getChatAgent();
    await agent.chat.bsky.convo.acceptConvo({ convoId });
    convoQuery.refetch();
  }, [convoId, convoQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => navigate("/messages")}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Icon name="arrow_back" size={20} />
        </button>
        {other && (
          <button
            onClick={() => navigate(`/profile/${other.handle}`)}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <Avatar src={other.avatar} alt={other.displayName || other.handle} size="sm" />
            <div className="text-left">
              <p className="text-sm font-medium text-text-light dark:text-text-dark leading-tight">
                {other.displayName || other.handle}
              </p>
              <p className="text-xs text-gray-400">@{other.handle}</p>
            </div>
          </button>
        )}
        <div className="ml-auto relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Menu"
          >
            <Icon name="more_vert" size={20} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-[160px]"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={handleMuteToggle}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Icon name={convo?.muted ? "notifications" : "notifications_off"} size={14} />
                {convo?.muted ? t("messages.unmute") : t("messages.mute")}
              </button>
              <button
                onClick={handleLeave}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Icon name="logout" size={14} />
                {t("messages.leave")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Request accept bar */}
      {isRequest && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-border-light dark:border-border-dark">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t("messages.requests")}</span>
          <button
            onClick={handleAccept}
            className="px-3 py-1 bg-primary text-white text-xs rounded-btn hover:bg-blue-600"
          >
            {t("messages.accept")}
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin py-2"
      >
        {isLoading && <LoadingSpinner />}
        {isError && (
          <div className="flex flex-col items-center py-8 text-gray-500">
            <p>{t("messages.loadFailed")}</p>
            <button onClick={() => refetch()} className="mt-2 px-4 py-1.5 bg-primary text-white text-sm rounded-btn hover:bg-blue-600">
              {t("common.retry")}
            </button>
          </div>
        )}
        {hasNextPage && (
          <div className="flex justify-center py-2">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs text-primary hover:underline"
            >
              {isFetchingNextPage ? <LoadingSpinner /> : t("messages.loadOlder")}
            </button>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={ChatBskyConvoDefs.isMessageView(msg) && msg.sender.did === myDid}
            convoId={convoId!}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-light dark:border-border-dark px-4 py-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("messages.placeholder")}
            rows={1}
            className="flex-1 resize-none bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm rounded-2xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary scrollbar-thin"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full disabled:opacity-40 hover:bg-blue-600 transition-colors"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
