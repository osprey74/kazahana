import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChatBskyGroupDefs } from "@atproto/api";
import {
  useJoinLinkPreview,
  useRequestJoin,
  useWithdrawJoinRequest,
} from "../../hooks/useJoinLink";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";

function mapRequestJoinError(err: unknown): string {
  const name = (err as { error?: string })?.error;
  switch (name) {
    case "ConvoLocked":
      return "messages.joinLink.error.convoLocked";
    case "FollowRequired":
      return "messages.joinLink.error.followRequired";
    case "InvalidCode":
      return "messages.joinLink.error.invalidCode";
    case "LinkDisabled":
      return "messages.joinLink.error.linkDisabled";
    case "MemberLimitReached":
      return "messages.joinLink.error.memberLimitReached";
    case "UserKicked":
      return "messages.joinLink.error.userKicked";
    default:
      return "messages.joinLink.error.unknown";
  }
}

export function JoinLinkView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<"joined" | "pending" | "withdrawn" | null>(null);

  const previewQuery = useJoinLinkPreview(code);
  const requestJoin = useRequestJoin();
  const withdrawRequest = useWithdrawJoinRequest();

  const handleJoin = async () => {
    if (!code) return;
    setErrorKey(null);
    try {
      const res = await requestJoin.mutateAsync({ code });
      if (res.status === "joined" && res.convo) {
        navigate(`/messages/${res.convo.id}`);
      } else if (res.status === "pending") {
        setStatusBanner("pending");
      }
    } catch (e) {
      setErrorKey(mapRequestJoinError(e));
    }
  };

  const handleWithdraw = async (convoId: string) => {
    if (!confirm(t("messages.joinLink.withdrawConfirm"))) return;
    setErrorKey(null);
    try {
      await withdrawRequest.mutateAsync({ convoId });
      setStatusBanner("withdrawn");
      previewQuery.refetch();
    } catch {
      setErrorKey("messages.joinLink.error.unknown");
    }
  };

  if (previewQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  const preview = previewQuery.data;

  if (!preview || previewQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500 dark:text-gray-400">
        <Icon name="error_outline" size={32} className="text-gray-400 mb-2" />
        <p className="text-sm">{t("messages.joinLink.loadFailed")}</p>
      </div>
    );
  }

  if (ChatBskyGroupDefs.isDisabledJoinLinkPreviewView(preview)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500 dark:text-gray-400">
        <Icon name="link_off" size={32} className="text-gray-400 mb-2" />
        <p className="text-sm">{t("messages.joinLink.disabled")}</p>
      </div>
    );
  }

  if (ChatBskyGroupDefs.isInvalidJoinLinkPreviewView(preview)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500 dark:text-gray-400">
        <Icon name="error_outline" size={32} className="text-gray-400 mb-2" />
        <p className="text-sm">{t("messages.joinLink.invalid")}</p>
      </div>
    );
  }

  if (!ChatBskyGroupDefs.isJoinLinkPreviewView(preview)) {
    return null;
  }

  const ownerName = preview.owner.displayName || preview.owner.handle;
  const isAlreadyMember = !!preview.convo;
  const hasPendingRequest = !!preview.viewer?.requestedAt && !isAlreadyMember;
  const ctaLabel = preview.requireApproval
    ? t("messages.joinLink.joinPending")
    : t("messages.joinLink.join");

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center text-primary mb-3">
            <Icon name="group" size={32} />
          </div>
          <h1 className="text-lg font-semibold text-text-light dark:text-text-dark mb-1">
            {preview.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t("messages.joinLink.memberCount", { count: preview.memberCount })}
            {preview.memberLimit > 0 && ` / ${preview.memberLimit}`}
          </p>

          <button
            type="button"
            onClick={() => navigate(`/profile/${preview.owner.handle}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Avatar src={preview.owner.avatar} alt={ownerName} size="xs" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {t("messages.joinLink.ownerLabel", { name: ownerName })}
            </span>
          </button>
        </div>

        {statusBanner === "pending" && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Icon name="schedule" size={14} />
            {t("messages.joinLink.pendingStatus")}
          </div>
        )}
        {statusBanner === "withdrawn" && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Icon name="check_circle" size={14} />
            {t("messages.joinLink.withdrawn")}
          </div>
        )}
        {errorKey && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <Icon name="error_outline" size={14} />
            {t(errorKey)}
          </div>
        )}

        <div className="mt-5">
          {isAlreadyMember ? (
            <button
              type="button"
              onClick={() => navigate(`/messages/${preview.convo!.id}`)}
              className="w-full py-2.5 rounded-btn bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              {t("messages.joinLink.viewGroup")}
            </button>
          ) : hasPendingRequest ? (
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                <Icon name="schedule" size={14} />
                {t("messages.joinLink.alreadyRequested")}
              </div>
              <button
                type="button"
                onClick={() => handleWithdraw(preview.convoId)}
                disabled={withdrawRequest.isPending}
                className="w-full py-2.5 rounded-btn border border-border-light dark:border-border-dark text-sm font-medium text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {withdrawRequest.isPending
                  ? t("messages.joinLink.withdrawing")
                  : t("messages.joinLink.withdrawRequest")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={requestJoin.isPending}
              className="w-full py-2.5 rounded-btn bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {requestJoin.isPending ? t("messages.joinLink.requesting") : ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
