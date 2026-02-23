import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { moderateProfile } from "@atproto/api";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useFollow, useUnfollow } from "../../hooks/useProfile";
import { useAuthStore } from "../../stores/authStore";
import { useReportStore } from "../../stores/reportStore";
import { Icon } from "../common/Icon";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { Avatar } from "../common/Avatar";
import { ContentWarning } from "../common/ContentWarning";
import type { ProfileTab } from "./ProfileView";

interface ProfileHeaderProps {
  profile: ProfileViewDetailed;
  isOwnProfile: boolean;
  onTabChange?: (tab: ProfileTab) => void;
}

export function ProfileHeader({ profile, isOwnProfile, onTabChange }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const follow = useFollow();
  const unfollow = useUnfollow();
  const moderationOpts = useModerationOpts();

  const [isFollowing, setIsFollowing] = useState(!!profile.viewer?.following);
  const [followUri, setFollowUri] = useState(profile.viewer?.following ?? "");
  const [showConfirm, setShowConfirm] = useState(false);

  // Sync local state when profile data is refetched
  useEffect(() => {
    setIsFollowing(!!profile.viewer?.following);
    setFollowUri(profile.viewer?.following ?? "");
  }, [profile.viewer?.following]);

  // Moderation for avatar & banner
  const modDecision = moderationOpts ? moderateProfile(profile, moderationOpts) : null;
  const avatarUI = modDecision?.ui("avatar");
  const bannerUI = modDecision?.ui("banner");

  const handleFollowClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmFollow = async () => {
    setShowConfirm(false);
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
    <div className="border-b border-border-light dark:border-border-dark">
      {/* Banner */}
      {bannerUI?.blur ? (
        <ContentWarning ui={bannerUI} isMedia>
          {profile.banner ? (
            <img src={profile.banner} alt="" className="w-full h-28 object-cover" />
          ) : (
            <div className="w-full h-28 bg-gradient-to-r from-blue-400 to-blue-600" />
          )}
        </ContentWarning>
      ) : profile.banner ? (
        <img src={profile.banner} alt="" className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-gradient-to-r from-blue-400 to-blue-600" />
      )}

      <div className="px-4 pb-4">
        {/* Avatar + Follow button row */}
        <div className="flex items-end justify-between -mt-10">
          {avatarUI?.blur ? (
            <ContentWarning ui={avatarUI} isMedia>
              <Avatar src={profile.avatar} alt={profile.displayName} size="lg" />
            </ContentWarning>
          ) : (
            <Avatar src={profile.avatar} alt={profile.displayName} size="lg" />
          )}
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFollowClick}
                disabled={isPending}
                className={`px-4 py-1.5 text-sm font-medium rounded-btn transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600"
                    : "bg-primary text-white hover:bg-blue-600"
                }`}
              >
                {isFollowing ? t("profile.following") : t("profile.follow")}
              </button>
              <button
                onClick={() => useReportStore.getState().open({ type: "user", did: profile.did })}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/60 text-white hover:bg-red-500/80 transition-colors"
                title={t("report.reportUser")}
              >
                <Icon name="flag" size={16} />
              </button>
            </div>
          )}
          {isOwnProfile && (
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="px-4 py-1.5 text-sm font-medium rounded-btn bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t("profile.logout")}
            </button>
          )}
        </div>

        {/* Name & handle */}
        <div className="mt-3">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
            {profile.displayName || profile.handle}
          </h2>
          <p className="text-sm text-gray-500">@{profile.handle}</p>
        </div>

        {/* Bio */}
        {profile.description && (
          <p className="text-sm text-text-light dark:text-text-dark mt-2 whitespace-pre-wrap">
            {profile.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-sm">
          <button
            onClick={() => onTabChange?.("following")}
            className="hover:underline"
          >
            <strong className="text-text-light dark:text-text-dark">{profile.followsCount ?? 0}</strong>{" "}
            <span className="text-gray-500">{t("profile.following")}</span>
          </button>
          <button
            onClick={() => onTabChange?.("followers")}
            className="hover:underline"
          >
            <strong className="text-text-light dark:text-text-dark">{profile.followersCount ?? 0}</strong>{" "}
            <span className="text-gray-500">{t("profile.followers")}</span>
          </button>
          <span>
            <strong className="text-text-light dark:text-text-dark">{profile.postsCount ?? 0}</strong>{" "}
            <span className="text-gray-500">{t("profile.posts")}</span>
          </span>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          message={
            isFollowing
              ? t("confirm.unfollow", { name: profile.displayName || profile.handle })
              : t("confirm.follow", { name: profile.displayName || profile.handle })
          }
          confirmLabel={isFollowing ? t("confirm.unfollow_btn") : t("confirm.follow_btn")}
          danger={isFollowing}
          onConfirm={handleConfirmFollow}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
