import { useState } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { AppBskyActorDefs } from "@atproto/api";
import { Icon } from "../common/Icon";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { getProfileLinks, type ProfileLink } from "../../lib/profileLinks";

interface ProfileLinksProps {
  profile: AppBskyActorDefs.ProfileViewDetailed;
}

export function ProfileLinks({ profile }: ProfileLinksProps) {
  const { t } = useTranslation();
  const moderationOpts = useModerationOpts();
  const links = getProfileLinks(profile, moderationOpts);

  if (links.length === 0) return null;

  return (
    <nav aria-label={t("profile.links")} className="flex flex-wrap gap-2 mt-3">
      {links.map((link) => (
        <LinkPill key={link.uri} link={link} />
      ))}
    </nav>
  );
}

function LinkPill({ link }: { link: ProfileLink }) {
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <button
      onClick={() => openUrl(link.url)}
      title={link.url}
      className="max-w-full flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-light dark:border-border-dark text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {link.iconUrl && !iconFailed ? (
        <img
          src={link.iconUrl}
          alt=""
          className="w-4 h-4 rounded-sm shrink-0"
          onError={() => setIconFailed(true)}
        />
      ) : (
        <Icon name="link" size={16} className="shrink-0 text-gray-500" />
      )}
      <span className="truncate">{link.label}</span>
    </button>
  );
}
