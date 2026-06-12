import { useTranslation } from "react-i18next";
import { ChatBskyActorDefs, ChatBskyConvoDefs } from "@atproto/api";

interface SystemMessageProps {
  message: ChatBskyConvoDefs.SystemMessageView;
  members: ChatBskyActorDefs.ProfileViewBasic[];
}

function shortDid(did: string): string {
  if (!did.startsWith("did:")) return did;
  const tail = did.slice(did.lastIndexOf(":") + 1);
  return tail.length > 8 ? `${tail.slice(0, 4)}…${tail.slice(-4)}` : tail;
}

function resolveName(
  did: string,
  members: ChatBskyActorDefs.ProfileViewBasic[],
): string {
  const m = members.find((x) => x.did === did);
  return m?.displayName || m?.handle || shortDid(did);
}

export function SystemMessage({ message, members }: SystemMessageProps) {
  const { t } = useTranslation();
  const data = message.data;
  let text: string;

  if (ChatBskyConvoDefs.isSystemMessageDataAddMember(data)) {
    const member = resolveName(data.member.did, members);
    const actor = resolveName(data.addedBy.did, members);
    text =
      data.member.did === data.addedBy.did
        ? t("messages.system.addMember", { member })
        : t("messages.system.addMemberBy", { member, actor });
  } else if (ChatBskyConvoDefs.isSystemMessageDataRemoveMember(data)) {
    const member = resolveName(data.member.did, members);
    const actor = resolveName(data.removedBy.did, members);
    text = t("messages.system.removeMemberBy", { member, actor });
  } else if (ChatBskyConvoDefs.isSystemMessageDataMemberJoin(data)) {
    const member = resolveName(data.member.did, members);
    text = t("messages.system.memberJoin", { member });
  } else if (ChatBskyConvoDefs.isSystemMessageDataMemberLeave(data)) {
    const member = resolveName(data.member.did, members);
    text = t("messages.system.memberLeave", { member });
  } else if (ChatBskyConvoDefs.isSystemMessageDataLockConvo(data)) {
    const actor = resolveName(data.lockedBy.did, members);
    text = t("messages.system.lockConvoBy", { actor });
  } else if (ChatBskyConvoDefs.isSystemMessageDataUnlockConvo(data)) {
    const actor = resolveName(data.unlockedBy.did, members);
    text = t("messages.system.unlockConvoBy", { actor });
  } else if (ChatBskyConvoDefs.isSystemMessageDataLockConvoPermanently(data)) {
    text = t("messages.system.lockConvoPermanently");
  } else if (ChatBskyConvoDefs.isSystemMessageDataEditGroup(data)) {
    text =
      data.oldName && data.newName
        ? t("messages.system.editGroupRename", {
            oldName: data.oldName,
            newName: data.newName,
          })
        : t("messages.system.editGroup");
  } else if (ChatBskyConvoDefs.isSystemMessageDataCreateJoinLink(data)) {
    text = t("messages.system.createJoinLink");
  } else if (ChatBskyConvoDefs.isSystemMessageDataEditJoinLink(data)) {
    text = t("messages.system.editJoinLink");
  } else if (ChatBskyConvoDefs.isSystemMessageDataEnableJoinLink(data)) {
    text = t("messages.system.enableJoinLink");
  } else if (ChatBskyConvoDefs.isSystemMessageDataDisableJoinLink(data)) {
    text = t("messages.system.disableJoinLink");
  } else {
    text = t("messages.system.unknownSystemMessage");
  }

  return (
    <div className="flex justify-center px-4 py-1">
      <div className="text-[11px] text-gray-500 dark:text-gray-400 italic text-center">
        {text}
      </div>
    </div>
  );
}
