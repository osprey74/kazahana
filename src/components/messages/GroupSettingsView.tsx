import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppBskyActorDefs } from "@atproto/api";
import { ChatBskyActorDefs, ChatBskyConvoDefs, ChatBskyGroupDefs } from "@atproto/api";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getChatAgent } from "../../lib/chatAgent";
import { useAuthStore } from "../../stores/authStore";
import {
  useAddMembers,
  useConvoMembers,
  useCreateJoinLink,
  useDisableJoinLink,
  useEditGroup,
  useEditJoinLink,
  useEnableJoinLink,
  useLockConvo,
  useRemoveMembers,
  useUnlockConvo,
  isViewerGroupOwner,
} from "../../hooks/useGroup";
import { useLeaveConvo } from "../../hooks/useConversations";
import { getAgent } from "../../lib/agent";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";

type ChatProfileViewBasic = ChatBskyActorDefs.ProfileViewBasic;
type AppProfileViewBasic = AppBskyActorDefs.ProfileViewBasic;
type GroupConvoMemberLike = { role?: string };

function getMemberRole(profile: ChatProfileViewBasic): string | undefined {
  const k = profile.kind as (GroupConvoMemberLike | undefined) | null;
  return k?.role;
}

function mapError(err: unknown, name?: string): { key: string; vars?: Record<string, string> } {
  const e = (err as { error?: string })?.error;
  switch (e) {
    case "NewAccountCannotCreateGroup":
      return { key: "messages.group.error.newAccountCannotCreate" };
    case "UserForbidsGroups":
      return { key: "messages.group.error.userForbidsGroups", vars: { name: name ?? "" } };
    case "NotFollowedBySender":
      return { key: "messages.group.error.notFollowedBy", vars: { name: name ?? "" } };
    case "RecipientNotFound":
      return { key: "messages.group.error.recipientNotFound" };
    case "BlockedActor":
      return { key: "messages.group.error.blockedActor" };
    case "BlockedSubject":
      return { key: "messages.group.error.blockedSubject" };
    case "AccountSuspended":
      return { key: "messages.group.error.accountSuspended" };
    case "MemberLimitReached":
      return { key: "messages.group.error.memberLimitReached" };
    case "InsufficientRole":
      return { key: "messages.group.error.insufficientRole" };
    case "InvalidConvo":
      return { key: "messages.group.error.invalidConvo" };
    case "ConvoLocked":
      return { key: "messages.group.error.convoLocked" };
    case "EnabledJoinLinkAlreadyExists":
      return { key: "messages.group.error.enabledJoinLinkExists" };
    default:
      return { key: "messages.group.error.unknown" };
  }
}

function joinLinkUrl(code: string): string {
  return `https://bsky.app/chat/${code}`;
}

export function GroupSettingsView() {
  const { convoId } = useParams<{ convoId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const myDid = useAuthStore((s) => s.profile?.did);

  const convoQuery = useQuery({
    queryKey: ["conversation", convoId],
    queryFn: async () => {
      const agent = getChatAgent();
      const res = await agent.chat.bsky.convo.getConvo({ convoId: convoId! });
      return res.data.convo;
    },
    enabled: !!convoId,
  });

  const membersQuery = useConvoMembers(convoId);
  const editGroup = useEditGroup();
  const addMembers = useAddMembers();
  const removeMembers = useRemoveMembers();
  const createJoinLink = useCreateJoinLink();
  const editJoinLink = useEditJoinLink();
  const enableJoinLink = useEnableJoinLink();
  const disableJoinLink = useDisableJoinLink();
  const lockConvo = useLockConvo();
  const unlockConvo = useUnlockConvo();
  const leaveConvo = useLeaveConvo();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<AppProfileViewBasic[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorVars, setErrorVars] = useState<Record<string, string> | undefined>(undefined);
  const [copiedToast, setCopiedToast] = useState(false);

  const convo = convoQuery.data;
  const group = ChatBskyConvoDefs.isGroupConvo(convo?.kind) ? convo?.kind : null;
  const isOwner = isViewerGroupOwner(convo, myDid);
  const joinLink = group?.joinLink;
  const isLocked = group?.lockStatus !== "unlocked";
  const isPermanentlyLocked = group?.lockStatus === "locked-permanently";

  const allMembers = useMemo(() => {
    if (!membersQuery.data?.pages) return [];
    return membersQuery.data.pages.flatMap((p) => p.members);
  }, [membersQuery.data]);

  const memberDids = useMemo(() => new Set(allMembers.map((m) => m.did)), [allMembers]);

  // Redirect non-groups back to the conversation view
  useEffect(() => {
    if (convoQuery.isSuccess && !group) {
      navigate(`/messages/${convoId}`);
    }
  }, [convoQuery.isSuccess, group, convoId, navigate]);

  const handleSaveName = useCallback(async () => {
    if (!convoId) return;
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === group?.name) {
      setEditingName(false);
      return;
    }
    setErrorKey(null);
    try {
      await editGroup.mutateAsync({ convoId, name: trimmed });
      setEditingName(false);
    } catch (e) {
      const mapped = mapError(e);
      setErrorKey(mapped.key);
      setErrorVars(mapped.vars);
    }
  }, [convoId, draftName, group, editGroup]);

  const handleSearchAdd = useCallback(
    (value: string) => {
      setAddQuery(value);
      if (!value.trim()) {
        setAddResults([]);
        return;
      }
      setAddSearching(true);
      const timer = setTimeout(async () => {
        try {
          const agent = getAgent();
          const res = await agent.searchActorsTypeahead({ q: value, limit: 8 });
          setAddResults(res.data.actors.filter((u) => !memberDids.has(u.did)));
        } catch {
          setAddResults([]);
        } finally {
          setAddSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    },
    [memberDids],
  );

  const handleAddMember = useCallback(
    async (user: AppProfileViewBasic) => {
      if (!convoId) return;
      setErrorKey(null);
      try {
        await addMembers.mutateAsync({ convoId, members: [user.did] });
        setAddQuery("");
        setAddResults([]);
        queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      } catch (e) {
        const mapped = mapError(e, user.displayName || user.handle);
        setErrorKey(mapped.key);
        setErrorVars(mapped.vars);
      }
    },
    [convoId, addMembers, queryClient],
  );

  const handleRemoveMember = useCallback(
    async (user: ChatProfileViewBasic) => {
      if (!convoId) return;
      const name = user.displayName || user.handle;
      if (!confirm(t("messages.group.removeMemberConfirm", { name }))) return;
      setErrorKey(null);
      try {
        await removeMembers.mutateAsync({ convoId, members: [user.did] });
        queryClient.invalidateQueries({ queryKey: ["conversation", convoId] });
      } catch (e) {
        const mapped = mapError(e);
        setErrorKey(mapped.key);
        setErrorVars(mapped.vars);
      }
    },
    [convoId, removeMembers, queryClient, t],
  );

  const handleCreateJoinLink = useCallback(
    async (joinRule: ChatBskyGroupDefs.JoinRule, requireApproval: boolean) => {
      if (!convoId) return;
      setErrorKey(null);
      try {
        await createJoinLink.mutateAsync({ convoId, joinRule, requireApproval });
      } catch (e) {
        const mapped = mapError(e);
        setErrorKey(mapped.key);
        setErrorVars(mapped.vars);
      }
    },
    [convoId, createJoinLink],
  );

  const handleEditJoinLink = useCallback(
    async (joinRule?: ChatBskyGroupDefs.JoinRule, requireApproval?: boolean) => {
      if (!convoId) return;
      setErrorKey(null);
      try {
        await editJoinLink.mutateAsync({ convoId, joinRule, requireApproval });
      } catch (e) {
        const mapped = mapError(e);
        setErrorKey(mapped.key);
        setErrorVars(mapped.vars);
      }
    },
    [convoId, editJoinLink],
  );

  const handleToggleEnableJoinLink = useCallback(async () => {
    if (!convoId || !joinLink) return;
    setErrorKey(null);
    try {
      if (joinLink.enabledStatus === "enabled") {
        await disableJoinLink.mutateAsync({ convoId });
      } else {
        await enableJoinLink.mutateAsync({ convoId });
      }
    } catch (e) {
      const mapped = mapError(e);
      setErrorKey(mapped.key);
      setErrorVars(mapped.vars);
    }
  }, [convoId, joinLink, enableJoinLink, disableJoinLink]);

  const handleCopyJoinLink = useCallback(async () => {
    if (!joinLink) return;
    try {
      await navigator.clipboard.writeText(joinLinkUrl(joinLink.code));
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {
      // ignore
    }
  }, [joinLink]);

  const handleToggleLock = useCallback(async () => {
    if (!convoId || !group) return;
    setErrorKey(null);
    const confirmMsg = isLocked
      ? t("messages.group.unlockConfirm")
      : t("messages.group.lockConfirm");
    if (!confirm(confirmMsg)) return;
    try {
      if (isLocked) {
        await unlockConvo.mutateAsync({ convoId });
      } else {
        await lockConvo.mutateAsync({ convoId });
      }
    } catch (e) {
      const mapped = mapError(e);
      setErrorKey(mapped.key);
      setErrorVars(mapped.vars);
    }
  }, [convoId, group, isLocked, t, lockConvo, unlockConvo]);

  const handleLeave = useCallback(async () => {
    if (!convoId) return;
    if (!confirm(t("messages.group.leaveConfirmGroup"))) return;
    try {
      await leaveConvo.mutateAsync({ convoId });
      navigate("/messages");
    } catch {
      // ignore
    }
  }, [convoId, t, leaveConvo, navigate]);

  if (convoQuery.isLoading || !convo) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => navigate(`/messages/${convoId}`)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title={t("messages.group.cancel")}
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <h1 className="text-base font-bold text-text-light dark:text-text-dark">
          {t("messages.group.settingsTitle")}
        </h1>
      </div>

      {errorKey && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <Icon name="error_outline" size={14} />
          {t(errorKey, errorVars)}
        </div>
      )}

      {/* Group name */}
      <section className="mb-6">
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {t("messages.group.nameLabel")}
        </h2>
        {editingName && isOwner ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              aria-label={t("messages.group.nameLabel")}
              placeholder={t("messages.group.namePlaceholder")}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={editGroup.isPending}
              className="px-3 py-1.5 bg-primary text-white text-sm rounded-btn hover:bg-blue-600 disabled:opacity-40"
            >
              {editGroup.isPending ? t("messages.group.saving") : t("messages.group.save")}
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-btn"
            >
              {t("messages.group.cancel")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-text-light dark:text-text-dark">{group.name}</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  setDraftName(group.name);
                  setEditingName(true);
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Icon name="edit" size={12} />
                {t("messages.group.editName")}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Lock state (owner only controls) */}
      <section className="mb-6">
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {t("messages.group.lockSection")}
        </h2>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-text-light dark:text-text-dark flex items-center gap-2">
            <Icon
              name={isLocked ? "lock" : "lock_open"}
              size={16}
              className={isLocked ? "text-red-500" : "text-gray-400"}
            />
            {isPermanentlyLocked
              ? t("messages.group.lockLockedPermanently")
              : isLocked
                ? t("messages.group.lockLocked")
                : t("messages.group.lockUnlocked")}
          </p>
          {isOwner && !isPermanentlyLocked && (
            <button
              type="button"
              onClick={handleToggleLock}
              disabled={lockConvo.isPending || unlockConvo.isPending}
              className="text-xs px-3 py-1.5 rounded-btn border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              {isLocked ? t("messages.group.unlockAction") : t("messages.group.lockAction")}
            </button>
          )}
        </div>
      </section>

      {/* Join link (owner only) */}
      {isOwner && (
        <section className="mb-6">
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t("messages.group.joinLinkSection")}
          </h2>
          {joinLink ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="link" size={14} className="text-gray-400" />
                <span className="text-xs text-text-light dark:text-text-dark font-mono truncate flex-1">
                  {joinLinkUrl(joinLink.code)}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    joinLink.enabledStatus === "enabled"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {joinLink.enabledStatus}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleCopyJoinLink}
                  className="px-2 py-1 rounded-btn border border-border-light dark:border-border-dark hover:bg-white dark:hover:bg-gray-800 flex items-center gap-1"
                >
                  <Icon name="content_copy" size={12} />
                  {copiedToast
                    ? t("messages.group.joinLinkCopied")
                    : t("messages.group.joinLinkCopy")}
                </button>
                <button
                  type="button"
                  onClick={() => openUrl(joinLinkUrl(joinLink.code))}
                  className="px-2 py-1 rounded-btn border border-border-light dark:border-border-dark hover:bg-white dark:hover:bg-gray-800 flex items-center gap-1"
                >
                  <Icon name="open_in_new" size={12} />
                  {t("messages.group.joinLinkOpenBrowser")}
                </button>
                <button
                  type="button"
                  onClick={handleToggleEnableJoinLink}
                  disabled={enableJoinLink.isPending || disableJoinLink.isPending}
                  className="px-2 py-1 rounded-btn border border-border-light dark:border-border-dark hover:bg-white dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  {joinLink.enabledStatus === "enabled"
                    ? t("messages.group.joinLinkDisable")
                    : t("messages.group.joinLinkEnable")}
                </button>
              </div>
              <div className="border-t border-border-light dark:border-border-dark pt-2 space-y-1.5">
                <label className="block text-[11px] text-gray-500 dark:text-gray-400">
                  {t("messages.group.joinRuleLabel")}
                </label>
                <select
                  value={joinLink.joinRule}
                  onChange={(e) =>
                    handleEditJoinLink(e.target.value as ChatBskyGroupDefs.JoinRule, undefined)
                  }
                  aria-label={t("messages.group.joinRuleLabel")}
                  className="w-full bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark text-xs rounded px-2 py-1"
                >
                  <option value="anyone">{t("messages.group.joinRuleAnyone")}</option>
                  <option value="followedByOwner">
                    {t("messages.group.joinRuleFollowedByOwner")}
                  </option>
                </select>
                <label className="flex items-center gap-2 text-xs text-text-light dark:text-text-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={joinLink.requireApproval}
                    onChange={(e) => handleEditJoinLink(undefined, e.target.checked)}
                  />
                  {t("messages.group.requireApprovalLabel")}
                </label>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleCreateJoinLink("anyone", false)}
              disabled={createJoinLink.isPending}
              className="w-full px-3 py-2 rounded-btn border border-dashed border-border-light dark:border-border-dark text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Icon name="add_link" size={16} />
              {t("messages.group.joinLinkCreate")}
            </button>
          )}
        </section>
      )}

      {/* Join requests (owner only) */}
      {isOwner && group.joinRequestCount !== undefined && group.joinRequestCount > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t("messages.group.joinRequestsSection")}
          </h2>
          <button
            type="button"
            onClick={() => navigate(`/messages/${convoId}/requests`)}
            className="w-full px-3 py-2 rounded-btn bg-blue-50 dark:bg-blue-900/20 text-text-light dark:text-text-dark text-sm flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <span className="flex items-center gap-2">
              <Icon name="person_add" size={16} className="text-primary" />
              {t("messages.group.joinRequestsCount", { count: group.joinRequestCount })}
            </span>
            <Icon name="chevron_right" size={16} className="text-gray-400" />
          </button>
        </section>
      )}

      {/* Members */}
      <section className="mb-6">
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center justify-between">
          <span>
            {t("messages.group.membersSectionTitle")} ({group.memberCount} / {group.memberLimit})
          </span>
        </h2>

        {isOwner && group.memberCount < group.memberLimit && (
          <div className="mb-3">
            <input
              type="text"
              value={addQuery}
              onChange={(e) => handleSearchAdd(e.target.value)}
              placeholder={t("messages.searchUser")}
              className="w-full bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            />
            {(addSearching || addResults.length > 0) && (
              <div className="mt-1 border border-border-light dark:border-border-dark rounded-lg overflow-hidden bg-white dark:bg-bg-dark">
                {addSearching && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                  </div>
                )}
                {!addSearching &&
                  addResults.map((u) => (
                    <button
                      type="button"
                      key={u.did}
                      onClick={() => handleAddMember(u)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
                    >
                      <Avatar src={u.avatar} alt={u.displayName || u.handle} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                          {u.displayName || u.handle}
                        </p>
                        <p className="text-xs text-gray-400 truncate">@{u.handle}</p>
                      </div>
                      <Icon name="add" size={16} className="text-primary" />
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="divide-y divide-border-light dark:divide-border-dark">
          {allMembers.map((m) => {
            const role = getMemberRole(m);
            const isOwnerMember = role === "owner";
            const isSelf = m.did === myDid;
            return (
              <div
                key={m.did}
                className="flex items-center gap-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${m.handle}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 text-left"
                >
                  <Avatar src={m.avatar} alt={m.displayName || m.handle} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                      {m.displayName || m.handle}
                      {isSelf && (
                        <span className="text-xs text-gray-400">
                          {t("messages.group.you")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 truncate">@{m.handle}</p>
                  </div>
                </button>
                {isOwnerMember && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                    {t("messages.group.owner")}
                  </span>
                )}
                {isOwner && !isOwnerMember && !isSelf && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title={t("messages.group.removeMember")}
                  >
                    <Icon name="person_remove" size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {membersQuery.hasNextPage && (
          <button
            type="button"
            onClick={() => membersQuery.fetchNextPage()}
            disabled={membersQuery.isFetchingNextPage}
            className="mt-2 w-full text-center text-xs text-primary hover:underline py-2"
          >
            {membersQuery.isFetchingNextPage ? <LoadingSpinner /> : t("messages.loadOlder")}
          </button>
        )}
      </section>

      {/* Leave group */}
      <section className="mt-8 border-t border-border-light dark:border-border-dark pt-4">
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaveConvo.isPending}
          className="w-full text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-btn flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Icon name="logout" size={16} />
          {t("messages.group.leaveGroup")}
        </button>
      </section>
    </div>
  );
}
