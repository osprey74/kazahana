import { useState } from "react";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { getAgent } from "../../lib/agent";

interface PostActionsProps {
  post: PostView;
}

export function PostActions({ post }: PostActionsProps) {
  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [likeUri, setLikeUri] = useState(post.viewer?.like ?? "");

  const [reposted, setReposted] = useState(!!post.viewer?.repost);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [repostUri, setRepostUri] = useState(post.viewer?.repost ?? "");

  const replyCount = post.replyCount ?? 0;

  const handleLike = async () => {
    const agent = getAgent();
    try {
      if (liked) {
        if (likeUri) {
          const { rkey } = parseUri(likeUri);
          await agent.deleteLike(rkey);
        }
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
        setLikeUri("");
      } else {
        const res = await agent.like(post.uri, post.cid);
        setLiked(true);
        setLikeCount((c) => c + 1);
        setLikeUri(res.uri);
      }
    } catch {
      // revert on error
    }
  };

  const handleRepost = async () => {
    const agent = getAgent();
    try {
      if (reposted) {
        if (repostUri) {
          const { rkey } = parseUri(repostUri);
          await agent.deleteRepost(rkey);
        }
        setReposted(false);
        setRepostCount((c) => Math.max(0, c - 1));
        setRepostUri("");
      } else {
        const res = await agent.repost(post.uri, post.cid);
        setReposted(true);
        setRepostCount((c) => c + 1);
        setRepostUri(res.uri);
      }
    } catch {
      // revert on error
    }
  };

  return (
    <div className="flex items-center gap-6 mt-2 -ml-1">
      <ActionButton
        icon="💬"
        count={replyCount}
        active={false}
        onClick={() => {}}
      />
      <ActionButton
        icon="🔁"
        count={repostCount}
        active={reposted}
        activeColor="text-green-600"
        onClick={handleRepost}
      />
      <ActionButton
        icon={liked ? "❤️" : "♡"}
        count={likeCount}
        active={liked}
        activeColor="text-red-500"
        onClick={handleLike}
      />
    </div>
  );
}

function ActionButton({
  icon,
  count,
  active,
  activeColor = "",
  onClick,
}: {
  icon: string;
  count: number;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs transition-colors hover:text-primary ${
        active ? activeColor : "text-gray-500"
      }`}
    >
      <span>{icon}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function parseUri(uri: string) {
  const parts = uri.split("/");
  return {
    rkey: parts[parts.length - 1],
  };
}
