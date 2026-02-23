import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModerationUI } from "@atproto/api";
import { Icon } from "./Icon";

interface ContentWarningProps {
  ui: ModerationUI;
  isMedia?: boolean;
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
  return t("moderation.contentWarning");
}

export function ContentWarning({ ui, isMedia = false, children }: ContentWarningProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);

  if (!ui.blur) {
    return <>{children}</>;
  }

  if (revealed) {
    return (
      <div className="relative">
        {children}
        <button
          onClick={(e) => { e.stopPropagation(); setRevealed(false); }}
          className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-medium bg-black/50 text-white rounded-btn hover:bg-black/70 transition-colors"
        >
          {t("moderation.hide")}
        </button>
      </div>
    );
  }

  const cause = ui.blurs[0];
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
        {!ui.noOverride && (
          <button
            onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
            className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-btn hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t("moderation.show")}
          </button>
        )}
      </div>
    </div>
  );
}
