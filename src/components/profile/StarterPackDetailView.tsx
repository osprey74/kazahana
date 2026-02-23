import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ProfileViewBasic } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import type { GeneratorView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useStarterPack } from "../../hooks/useProfile";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

export function StarterPackDetailView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uri } = useParams<{ uri: string }>();
  const decodedUri = uri ? decodeURIComponent(uri) : "";
  const { data, isLoading, isError } = useStarterPack(decodedUri);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <p>{t("profile.loadFailed")}</p>
      </div>
    );
  }

  const pack = data.starterPack;
  const record = pack.record as { name?: string; description?: string };
  const members = pack.listItemsSample ?? [];
  const feeds = pack.feeds ?? [];

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-3 transition-colors"
        >
          <Icon name="arrow_back" size={18} />
          <span>{t("starterPack.back")}</span>
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name="backpack" size={28} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text-light dark:text-text-dark">
              {record.name || decodedUri}
            </h1>
            <div
              className="flex items-center gap-2 mt-1 cursor-pointer hover:underline"
              onClick={() => navigate(`/profile/${pack.creator.handle}`)}
            >
              <Avatar src={pack.creator.avatar} alt={pack.creator.displayName} size="xs" />
              <span className="text-sm text-gray-500">
                {pack.creator.displayName || pack.creator.handle}
              </span>
            </div>
          </div>
        </div>

        {record.description && (
          <p className="text-sm text-text-light dark:text-text-dark mt-3 whitespace-pre-wrap">
            {record.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          {pack.list?.listItemCount != null && (
            <span>{t("starterPack.members", { count: pack.list.listItemCount })}</span>
          )}
          {pack.joinedAllTimeCount != null && pack.joinedAllTimeCount > 0 && (
            <span>{t("starterPack.joined", { count: pack.joinedAllTimeCount })}</span>
          )}
          {pack.joinedWeekCount != null && pack.joinedWeekCount > 0 && (
            <span>{t("starterPack.joinedThisWeek", { count: pack.joinedWeekCount })}</span>
          )}
        </div>
      </div>

      {/* Feeds section */}
      {feeds.length > 0 && (
        <div className="border-b border-border-light dark:border-border-dark">
          <h2 className="px-4 pt-3 pb-2 text-sm font-medium text-gray-500">
            {t("starterPack.feeds")}
          </h2>
          {feeds.map((feed: GeneratorView) => (
            <FeedItem key={feed.uri} feed={feed} />
          ))}
        </div>
      )}

      {/* Members section */}
      <div>
        <h2 className="px-4 pt-3 pb-2 text-sm font-medium text-gray-500">
          {t("starterPack.membersList")}
        </h2>
        {members.length > 0 ? (
          members.map((item) => {
            const subject = item.subject as ProfileViewBasic;
            return (
              <MemberItem key={subject.did} actor={subject} />
            );
          })
        ) : (
          <p className="px-4 py-4 text-sm text-gray-400">{t("starterPack.noMembers")}</p>
        )}
      </div>
    </div>
  );
}

function MemberItem({ actor }: { actor: ProfileViewBasic }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/profile/${actor.handle}`)}
      className="flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
    >
      <Avatar src={actor.avatar} alt={actor.displayName} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-text-light dark:text-text-dark truncate">
          {actor.displayName || actor.handle}
        </p>
        <p className="text-xs text-gray-500 truncate">@{actor.handle}</p>
      </div>
    </div>
  );
}

function FeedItem({ feed }: { feed: GeneratorView }) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark">
      {feed.avatar ? (
        <img src={feed.avatar} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
          <Icon name="dynamic_feed" size={20} className="text-blue-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-text-light dark:text-text-dark truncate">
          {feed.displayName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {t("starterPack.feedBy", { name: feed.creator.displayName || feed.creator.handle })}
        </p>
        {feed.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{feed.description}</p>
        )}
      </div>
    </div>
  );
}
