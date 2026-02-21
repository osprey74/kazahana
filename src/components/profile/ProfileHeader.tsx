import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useFollow, useUnfollow } from "../../hooks/useProfile";
import { Avatar } from "../common/Avatar";

interface ProfileHeaderProps {
  profile: ProfileViewDetailed;
  isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const follow = useFollow();
  const unfollow = useUnfollow();

  const [isFollowing, setIsFollowing] = useState(!!profile.viewer?.following);
  const [followUri, setFollowUri] = useState(profile.viewer?.following ?? "");

  const handleToggleFollow = async () => {
    if (isFollowing) {
      if (followUri) {
        await unfollow.mutateAsync({ followUri });
      }
      setIsFollowing(false);
      setFollowUri("");
    } else {
      const res = await follow.mutateAsync({ did: profile.did });
      setIsFollowing(true);
      setFollowUri(res.uri);
    }
  };

  const isPending = follow.isPending || unfollow.isPending;

  return (
    <div className="border-b border-border-light">
      {/* Banner */}
      {profile.banner ? (
        <img
          src={profile.banner}
          alt=""
          className="w-full h-28 object-cover"
        />
      ) : (
        <div className="w-full h-28 bg-gradient-to-r from-blue-400 to-blue-600" />
      )}

      <div className="px-4 pb-4">
        {/* Avatar + Follow button row */}
        <div className="flex items-end justify-between -mt-10">
          <Avatar src={profile.avatar} alt={profile.displayName} size="lg" />
          {!isOwnProfile && (
            <button
              onClick={handleToggleFollow}
              disabled={isPending}
              className={`px-4 py-1.5 text-sm font-medium rounded-btn transition-colors disabled:opacity-50 ${
                isFollowing
                  ? "bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600"
                  : "bg-primary text-white hover:bg-blue-600"
              }`}
            >
              {isFollowing ? t("profile.following") : t("profile.follow")}
            </button>
          )}
          {isOwnProfile && (
            <button
              onClick={() => {}}
              className="px-4 py-1.5 text-sm font-medium rounded-btn border border-border-light text-gray-700 hover:bg-gray-50"
            >
              {t("profile.logout")}
            </button>
          )}
        </div>

        {/* Name & handle */}
        <div className="mt-3">
          <h2 className="text-lg font-bold text-text-light">
            {profile.displayName || profile.handle}
          </h2>
          <p className="text-sm text-gray-500">@{profile.handle}</p>
        </div>

        {/* Bio */}
        {profile.description && (
          <p className="text-sm text-text-light mt-2 whitespace-pre-wrap">
            {profile.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-sm">
          <span>
            <strong className="text-text-light">{profile.followsCount ?? 0}</strong>{" "}
            <span className="text-gray-500">{t("profile.following")}</span>
          </span>
          <span>
            <strong className="text-text-light">{profile.followersCount ?? 0}</strong>{" "}
            <span className="text-gray-500">{t("profile.followers")}</span>
          </span>
          <span>
            <strong className="text-text-light">{profile.postsCount ?? 0}</strong>{" "}
            <span className="text-gray-500">{t("profile.posts")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
