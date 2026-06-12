import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChatBskyEmbedJoinLink, ChatBskyGroupDefs } from "@atproto/api";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

interface JoinLinkEmbedProps {
  embed: ChatBskyEmbedJoinLink.View;
  isMine: boolean;
}

export function JoinLinkEmbed({ embed, isMine }: JoinLinkEmbedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const preview = embed.joinLinkPreview;

  const baseCls = `mt-1 rounded-2xl overflow-hidden border ${
    isMine
      ? "border-white/20 bg-primary/80"
      : "border-border-light dark:border-border-dark bg-white dark:bg-gray-800"
  }`;

  if (ChatBskyGroupDefs.isDisabledJoinLinkPreviewView(preview)) {
    return (
      <div className={`${baseCls} px-3 py-2 flex items-center gap-2 text-xs italic`}>
        <Icon
          name="link_off"
          size={14}
          className={isMine ? "text-white/80" : "text-gray-400"}
        />
        <span className={isMine ? "text-white/80" : "text-gray-500 dark:text-gray-400"}>
          {t("messages.joinLink.disabled")}
        </span>
      </div>
    );
  }

  if (ChatBskyGroupDefs.isInvalidJoinLinkPreviewView(preview)) {
    return (
      <div className={`${baseCls} px-3 py-2 flex items-center gap-2 text-xs italic`}>
        <Icon
          name="error_outline"
          size={14}
          className={isMine ? "text-white/80" : "text-gray-400"}
        />
        <span className={isMine ? "text-white/80" : "text-gray-500 dark:text-gray-400"}>
          {t("messages.joinLink.invalid")}
        </span>
      </div>
    );
  }

  if (!ChatBskyGroupDefs.isJoinLinkPreviewView(preview)) {
    return null;
  }

  const ownerName =
    preview.owner.displayName || preview.owner.handle || preview.owner.did;

  return (
    <button
      type="button"
      onClick={() => navigate(`/chat/${preview.code}`)}
      className={`${baseCls} px-3 py-2.5 max-w-[280px] text-left w-full transition-opacity hover:opacity-90`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon
          name="group"
          size={14}
          className={isMine ? "text-white/90" : "text-primary"}
        />
        <span
          className={`text-[10px] uppercase tracking-wide font-semibold ${
            isMine ? "text-white/90" : "text-primary"
          }`}
        >
          {t("messages.joinLink.label")}
        </span>
      </div>
      <div
        className={`text-sm font-semibold truncate ${
          isMine ? "text-white" : "text-text-light dark:text-text-dark"
        }`}
      >
        {preview.name}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <Avatar src={preview.owner.avatar} alt={ownerName} size="xs" />
        <div className="flex-1 min-w-0">
          <div
            className={`text-[11px] truncate ${
              isMine ? "text-white/80" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {t("messages.joinLink.ownerLabel", { name: ownerName })}
          </div>
          <div
            className={`text-[11px] ${
              isMine ? "text-white/70" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {t("messages.joinLink.memberCount", { count: preview.memberCount })}
          </div>
        </div>
      </div>
    </button>
  );
}
