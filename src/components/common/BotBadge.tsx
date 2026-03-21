import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

interface BotBadgeProps {
  size?: number;
}

/**
 * Check if a profile has the bot self-label.
 * The label must be val === "bot" AND src === profile.did (self-applied).
 */
export function isBotAccount(profile: {
  did: string;
  labels?: { val: string; src: string }[];
}): boolean {
  return profile.labels?.some((l) => l.val === "bot" && l.src === profile.did) ?? false;
}

export function BotBadge({ size = 14 }: BotBadgeProps) {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="relative inline-flex items-center flex-shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip((v) => !v);
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon name="smart_toy" size={size} className="text-gray-400" />
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[11px] text-white bg-gray-800 dark:bg-gray-600 rounded whitespace-nowrap z-50">
          {t("bot.label")}
        </span>
      )}
    </span>
  );
}
