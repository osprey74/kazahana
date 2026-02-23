import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { ModerationUI } from "@atproto/api";
import { getAgent } from "../../lib/agent";
import { Icon } from "./Icon";

interface ContentWarningProps {
  ui: ModerationUI;
  isMedia?: boolean;
  postUri?: string;
  children: React.ReactNode;
}

export function getCauseLabel(cause: ModerationUI["blurs"][0], t: (key: string) => string): string {
  if (cause.type === "label") {
    return cause.labelDef.locales?.[0]?.name ?? cause.labelDef.identifier;
  }
  if (cause.type === "muted") return t("moderation.muted");
  if (cause.type === "mute-word") return t("moderation.muteWord");
  if (cause.type === "blocking") return t("moderation.blocked");
  if (cause.type === "blocked-by") return t("moderation.blockedBy");
  if (cause.type === "hidden") return t("moderation.hiddenByYou");
  return t("moderation.contentWarning");
}

export function ContentWarning({ ui, isMedia = false, postUri, children }: ContentWarningProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [revealed, setRevealed] = useState(false);

  const cause = ui.blurs[0];
  const isHidden = cause?.type === "hidden";

  const handleUnhide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!postUri) return;
    try {
      await getAgent().unhidePost(postUri);
      queryClient.invalidateQueries({ queryKey: ["moderationOpts"] });
    } catch {
      // silently fail
    }
  };

  if (!ui.blur) {
    return <>{children}</>;
  }

  if (revealed) {
    return (
      <div className="relative">
        {children}
        <div className="absolute top-2 right-2 flex gap-1">
          {isHidden && postUri && (
            <button
              onClick={handleUnhide}
              className="px-2 py-0.5 text-[11px] font-medium bg-black/50 text-white rounded-btn hover:bg-black/70 transition-colors"
            >
              {t("post.unhidePost")}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setRevealed(false); }}
            className="px-2 py-0.5 text-[11px] font-medium bg-black/50 text-white rounded-btn hover:bg-black/70 transition-colors"
          >
            {t("moderation.hide")}
          </button>
        </div>
      </div>
    );
  }

  const label = cause ? getCauseLabel(cause, t) : t("moderation.contentWarning");

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className={isMedia ? "blur-xl" : "blur-sm opacity-20 select-none"} aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/70 dark:bg-gray-800/70">
        <Icon name="visibility_off" size={20} className="text-gray-500 dark:text-gray-400 mb-1" />
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 px-3 text-center">
          {label}
        </p>
        <div className="flex gap-2">
          {!ui.noOverride && (
            <button
              onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
              className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-btn hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t("moderation.show")}
            </button>
          )}
          {isHidden && postUri && (
            <button
              onClick={handleUnhide}
              className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-btn hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t("post.unhidePost")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
