import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useApproveJoinRequest,
  useListJoinRequests,
  useRejectJoinRequest,
  useUpdateJoinRequestsRead,
} from "../../hooks/useGroup";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";

function formatDate(iso: string, lang: string): string {
  try {
    return new Date(iso).toLocaleDateString(lang.startsWith("ja") ? "ja-JP" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function JoinRequestsView() {
  const { convoId } = useParams<{ convoId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const requestsQuery = useListJoinRequests(convoId);
  const approve = useApproveJoinRequest();
  const reject = useRejectJoinRequest();
  const updateRead = useUpdateJoinRequestsRead();

  // Mark requests as read once the screen is opened
  useEffect(() => {
    if (!convoId) return;
    updateRead.mutate({ convoId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convoId]);

  const requests = useMemo(() => {
    if (!requestsQuery.data?.pages) return [];
    return requestsQuery.data.pages.flatMap((p) => p.requests);
  }, [requestsQuery.data]);

  const handleApprove = async (member: string) => {
    if (!convoId) return;
    setErrorKey(null);
    try {
      await approve.mutateAsync({ convoId, member });
    } catch (e) {
      const name = (e as { error?: string })?.error;
      setErrorKey(
        name === "MemberLimitReached"
          ? "messages.group.error.memberLimitReached"
          : "messages.group.error.unknown",
      );
    }
  };

  const handleReject = async (member: string) => {
    if (!convoId) return;
    setErrorKey(null);
    try {
      await reject.mutateAsync({ convoId, member });
    } catch {
      setErrorKey("messages.group.error.unknown");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => navigate(`/messages/${convoId}/settings`)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title={t("messages.group.cancel")}
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <h1 className="text-base font-bold text-text-light dark:text-text-dark">
          {t("messages.group.joinRequestsTitle")}
        </h1>
      </div>

      {errorKey && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <Icon name="error_outline" size={14} />
          {t(errorKey)}
        </div>
      )}

      {requestsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">
          {t("messages.group.joinRequestsEmpty")}
        </p>
      ) : (
        <div className="divide-y divide-border-light dark:divide-border-dark">
          {requests.map((req) => {
            const user = req.requestedBy;
            const name = user.displayName || user.handle;
            return (
              <div key={user.did} className="py-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${user.handle}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 text-left"
                >
                  <Avatar src={user.avatar} alt={name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                      {name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">@{user.handle}</p>
                    <p className="text-[11px] text-gray-400">
                      {formatDate(req.requestedAt, i18n.language)}
                    </p>
                  </div>
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleReject(user.did)}
                    disabled={reject.isPending}
                    className="px-2.5 py-1 rounded-btn border border-border-light dark:border-border-dark text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                  >
                    {t("messages.group.rejectRequest")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(user.did)}
                    disabled={approve.isPending}
                    className="px-2.5 py-1 rounded-btn bg-primary text-white text-xs hover:bg-blue-600 disabled:opacity-40"
                  >
                    {t("messages.group.approveRequest")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {requestsQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => requestsQuery.fetchNextPage()}
          disabled={requestsQuery.isFetchingNextPage}
          className="mt-3 w-full text-center text-xs text-primary hover:underline py-2"
        >
          {requestsQuery.isFetchingNextPage ? <LoadingSpinner /> : t("messages.loadOlder")}
        </button>
      )}
    </div>
  );
}
