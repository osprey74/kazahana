import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { moderateProfile } from "@atproto/api";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useFollow, useUnfollow, useMuteActor, useUnmuteActor, useBlockActor, useUnblockActor } from "../../hooks/useProfile";
import { useReportStore } from "../../stores/reportStore";
import { useListManagementStore } from "../../stores/listManagementStore";
import { Icon } from "../common/Icon";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useModerationOpts } from "../../contexts/ModerationContext";
import { Avatar } from "../common/Avatar";
import { ContentWarning } from "../common/ContentWarning";
import { ProfileDescription } from "./ProfileDescription";
interface ProfileHeaderProps {
  profile: ProfileViewDetailed;
  isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const muteActor = useMuteActor();
  const unmuteActor = useUnmuteActor();
  const blockActor = useBlockActor();
  const unblockActor = useUnblockActor();
  const moderationOpts = useModerationOpts();

  const [isFollowing, setIsFollowing] = useState(!!profile.viewer?.following);
  const [followUri, setFollowUri] = useState(profile.viewer?.following ?? "");
  const [isMuted, setIsMuted] = useState(!!profile.viewer?.muted);
  const [isBlocking, setIsBlocking] = useState(!!profile.viewer?.blocking);
  const [blockUri, setBlockUri] = useState(profile.viewer?.blocking ?? "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync local state when profile data is refetched
  useEffect(() => {
    setIsFollowing(!!profile.viewer?.following);
    setFollowUri(profile.viewer?.following ?? "");
    setIsMuted(!!profile.viewer?.muted);
    setIsBlocking(!!profile.viewer?.blocking);
    setBlockUri(profile.viewer?.blocking ?? "");
  }, [profile.viewer?.following, profile.viewer?.muted, profile.viewer?.blocking]);

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

  const handleToggleMute = async () => {
    setMenuOpen(false);
    if (isMuted) {
      await unmuteActor.mutateAsync({ did: profile.did });
      setIsMuted(false);
    } else {
      await muteActor.mutateAsync({ did: profile.did });
      setIsMuted(true);
    }
  };

  const handleBlockClick = () => {
    setMenuOpen(false);
    setShowBlockConfirm(true);
  };

  const handleConfirmBlock = async () => {
    setShowBlockConfirm(false);
    if (isBlocking) {
      if (blockUri) {
        await unblockActor.mutateAsync({ blockUri });
      }
      setIsBlocking(false);
      setBlockUri("");
    } else {
      const res = await blockActor.mutateAsync({ did: profile.did });
      setIsBlocking(true);
      setBlockUri(res.uri);
      // Block removes mutual follows
      setIsFollowing(false);
      setFollowUri("");
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
              {!isBlocking && (
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
              )}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <Icon name="more_horiz" size={18} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-10 z-50 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[180px] whitespace-nowrap">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          useListManagementStore.getState().open(profile.did, profile.displayName || profile.handle);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Icon name="list" size={16} />
                        <span>{t("profile.manageList")}</span>
                      </button>
                      <button
                        onClick={handleToggleMute}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Icon name={isMuted ? "volume_up" : "volume_off"} size={16} />
                        <span>{isMuted ? t("profile.unmute") : t("profile.mute")}</span>
                      </button>
                      <button
                        onClick={handleBlockClick}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          isBlocking
                            ? "text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                            : "text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon name={isBlocking ? "person_add" : "block"} size={16} />
                        <span>{isBlocking ? t("profile.unblock") : t("profile.block")}</span>
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); useReportStore.getState().open({ type: "user", did: profile.did }); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Icon name="flag" size={16} />
                        <span>{t("report.reportUser")}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
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
          <ProfileDescription text={profile.description} />
        )}

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-sm">
          <button
            onClick={() => navigate(`/profile/${profile.handle}/following`)}
            className="hover:underline"
          >
            <strong className="text-text-light dark:text-text-dark">{profile.followsCount ?? 0}</strong>{" "}
            <span className="text-gray-500">{t("profile.following")}</span>
          </button>
          <button
            onClick={() => navigate(`/profile/${profile.handle}/followers`)}
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

      {/* Muted / Blocked status banner */}
      {!isOwnProfile && (isMuted || isBlocking || profile.viewer?.blockedBy) && (
        <div className="px-4 py-2 border-t border-border-light dark:border-border-dark">
          {profile.viewer?.blockedBy && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <Icon name="block" size={16} />
              {t("profile.blockedByUser")}
            </p>
          )}
          {isBlocking && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <Icon name="block" size={16} />
              {t("profile.blockingUser")}
            </p>
          )}
          {isMuted && !isBlocking && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Icon name="volume_off" size={16} />
              {t("profile.mutedUser")}
            </p>
          )}
        </div>
      )}

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

      {showBlockConfirm && (
        <ConfirmDialog
          message={
            isBlocking
              ? t("confirm.unblock", { name: profile.displayName || profile.handle })
              : t("confirm.block", { name: profile.displayName || profile.handle })
          }
          confirmLabel={isBlocking ? t("confirm.unblock_btn") : t("confirm.block_btn")}
          danger={!isBlocking}
          onConfirm={handleConfirmBlock}
          onCancel={() => setShowBlockConfirm(false)}
        />
      )}
    </div>
  );
}
