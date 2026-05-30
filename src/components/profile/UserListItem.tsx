import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { AppBskyActorDefs } from "@atproto/api";
type ProfileView = AppBskyActorDefs.ProfileView;
import { Avatar } from "../common/Avatar";
import { BotBadge, isBotAccount } from "../common/BotBadge";

interface UserListItemProps {
  actor: ProfileView;
  action?: ReactNode;
}

export function UserListItem({ actor, action }: UserListItemProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/profile/${actor.handle}`)}
      className="flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
    >
      <Avatar src={actor.avatar} alt={actor.displayName} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-text-light dark:text-text-dark truncate flex items-center gap-1">
          <span className="truncate">{actor.displayName || actor.handle}</span>
          {isBotAccount(actor) && <BotBadge size={14} />}
        </p>
        <p className="text-xs text-gray-500 truncate">@{actor.handle}</p>
        {actor.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{actor.description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
