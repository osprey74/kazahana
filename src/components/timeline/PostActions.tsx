import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { AppBskyFeedDefs } from "@atproto/api";
type PostView = AppBskyFeedDefs.PostView;
import { getAgent } from "../../lib/agent";
import { useComposeStore } from "../../stores/composeStore";
import { usePostListStore } from "../../stores/postListStore";
import { useReportStore } from "../../stores/reportStore";
import { useDeletePost } from "../../hooks/usePost";
import { useMuteActor, useUnmuteActor, useBlockActor, useUnblockActor } from "../../hooks/useProfile";
import { openUrl } from "@tauri-apps/plugin-opener";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Icon } from "../common/Icon";

interface PostActionsProps {
  post: PostView;
  onSavingMediaChange?: (saving: boolean) => void;
}

export function PostActions({ post, onSavingMediaChange }: PostActionsProps) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [likeUri, setLikeUri] = useState(post.viewer?.like ?? "");

  const [reposted, setReposted] = useState(!!post.viewer?.repost);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [repostUri, setRepostUri] = useState(post.viewer?.repost ?? "");

  const [bookmarked, setBookmarked] = useState(!!post.viewer?.bookmarked);
  const [quoteMenuOpen, setQuoteMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Sync state when Virtuoso recycles this component for a different post
  useEffect(() => {
    setLiked(!!post.viewer?.like);
    setLikeCount(post.likeCount ?? 0);
    setLikeUri(post.viewer?.like ?? "");
    setReposted(!!post.viewer?.repost);
    setRepostCount(post.repostCount ?? 0);
    setRepostUri(post.viewer?.repost ?? "");
    setBookmarked(!!post.viewer?.bookmarked);
  }, [post.uri]); // eslint-disable-line react-hooks/exhaustive-deps

  const replyCount = post.replyCount ?? 0;
  const quoteCount = post.quoteCount ?? 0;
  const replyDisabled = !!post.viewer?.replyDisabled;
  const openCompose = useComposeStore((s) => s.open);
  const openPostList = usePostListStore((s) => s.open);

  const isOwnPost = post.author.did === getAgent().session?.did;

  // Check if quoting is disabled on this post
  const quoteDisabled = !!(post.viewer as { embeddingDisabled?: boolean } | undefined)?.embeddingDisabled;

  const handleReply = () => {
    const record = post.record as { text?: string; reply?: { root: { uri: string; cid: string } } };
    // If the post is itself a reply, its record.reply.root is the thread root.
    // Otherwise, this post IS the root.
    const root = record.reply?.root ?? { uri: post.uri, cid: post.cid };
    openCompose({ replyTo: {
      uri: post.uri,
      cid: post.cid,
      root,
      author: {
        handle: post.author.handle,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
      },
      text: record.text ?? "",
    }});
  };

  const handleQuotePost = () => {
    setQuoteMenuOpen(false);
    const record = post.record as { text?: string };
    openCompose({ quoteTo: {
      uri: post.uri,
      cid: post.cid,
      author: {
        handle: post.author.handle,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
      },
      text: record.text ?? "",
    }});
  };

  const handleLike = async () => {
    const agent = getAgent();
    try {
      if (liked) {
        if (likeUri) {
          await agent.deleteLike(likeUri);
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

  const handleBookmark = async () => {
    const agent = getAgent();
    try {
      if (bookmarked) {
        await agent.app.bsky.bookmark.deleteBookmark({ uri: post.uri });
        setBookmarked(false);
      } else {
        await agent.app.bsky.bookmark.createBookmark({ uri: post.uri, cid: post.cid });
        setBookmarked(true);
      }
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    } catch {
      // revert on error
    }
  };

  const handleRepost = async () => {
    const agent = getAgent();
    try {
      if (reposted) {
        if (repostUri) {
          await agent.deleteRepost(repostUri);
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
    <div className="flex items-center gap-6 -ml-1">
      <ActionButton
        icon="chat_bubble_outline"
        count={replyCount}
        active={false}
        disabled={replyDisabled}
        onClick={handleReply}
      />
      <ActionButton
        icon="repeat"
        count={repostCount}
        active={reposted}
        activeColor="text-green-600"
        onClick={handleRepost}
        onCountClick={() => openPostList("reposts", post.uri)}
      />
      <ActionButton
        icon={liked ? "favorite" : "favorite_border"}
        count={likeCount}
        active={liked}
        activeColor="text-red-500"
        onClick={handleLike}
        onCountClick={() => openPostList("likes", post.uri)}
      />
      <div className="relative">
        <ActionButton
          icon="format_quote"
          count={quoteCount}
          active={false}
          onClick={() => setQuoteMenuOpen((v) => !v)}
          onCountClick={() => openPostList("quotes", post.uri)}
        />
        {quoteMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setQuoteMenuOpen(false); }} />
            <div className="absolute left-0 bottom-6 z-50 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[160px] whitespace-nowrap">
              {!quoteDisabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuotePost(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon name="edit" size={16} />
                  <span>{t("post.quotePost")}</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setQuoteMenuOpen(false); openPostList("quotes", post.uri); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="format_quote" size={16} />
                <span>{t("post.viewQuotes")}</span>
              </button>
            </div>
          </>
        )}
      </div>
      <ActionButton
        icon="bookmark"
        count={0}
        active={bookmarked}
        activeColor="text-amber-500"
        onClick={handleBookmark}
      />
      <PostMenu post={post} isOwnPost={isOwnPost} onSavingMediaChange={onSavingMediaChange} />
    </div>
  );
}

function hasMediaInPost(post: PostView): boolean {
  const embed = post.embed;
  if (!embed) return false;
  if (embed.$type === "app.bsky.embed.images#view") return true;
  if (embed.$type === "app.bsky.embed.video#view") return true;
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = (embed as { media?: { $type?: string } }).media;
    return media?.$type === "app.bsky.embed.images#view" || media?.$type === "app.bsky.embed.video#view";
  }
  return false;
}

interface MediaImage { fullsize: string; thumb: string; alt?: string }
interface MediaVideo { playlist: string; thumbnail?: string }

function getMediaImages(post: PostView): MediaImage[] {
  const embed = post.embed;
  if (!embed) return [];
  if (embed.$type === "app.bsky.embed.images#view") {
    return (embed as { images?: MediaImage[] }).images ?? [];
  }
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = (embed as { media?: { $type?: string; images?: MediaImage[] } }).media;
    if (media?.$type === "app.bsky.embed.images#view") return media.images ?? [];
  }
  return [];
}

function getMediaVideo(post: PostView): MediaVideo | null {
  const embed = post.embed;
  if (!embed) return null;
  if (embed.$type === "app.bsky.embed.video#view") return embed as unknown as MediaVideo;
  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    const media = (embed as { media?: { $type?: string } }).media;
    if (media?.$type === "app.bsky.embed.video#view") return media as unknown as MediaVideo;
  }
  return null;
}

interface OriginalImageInfo {
  index: number;
  cid: string;
  mimeType: string;
  size: number;
  aspectRatio?: { width: number; height: number };
}

/**
 * Extract image blob metadata from the raw post record.
 * BlobRef carries size/mimeType/cid inline, so we can show original bytes
 * without hitting com.atproto.sync.getBlob — handy for verifying that the
 * 2 MB upload path (atproto #4823) is actually round-tripping end-to-end,
 * since cdn.bsky.app always re-encodes for display.
 */
function getImageBlobs(post: PostView): OriginalImageInfo[] {
  const record = post.record as { embed?: unknown } | undefined;
  const embed = record?.embed as
    | {
        $type?: string;
        images?: unknown[];
        media?: { $type?: string; images?: unknown[] };
      }
    | undefined;
  if (!embed) return [];

  let rawImages: unknown[] | undefined;
  if (embed.$type === "app.bsky.embed.images") {
    rawImages = embed.images;
  } else if (
    embed.$type === "app.bsky.embed.recordWithMedia" &&
    embed.media?.$type === "app.bsky.embed.images"
  ) {
    rawImages = embed.media.images;
  }
  if (!rawImages) return [];

  const out: OriginalImageInfo[] = [];
  for (let i = 0; i < rawImages.length; i++) {
    const entry = rawImages[i] as { image?: unknown; aspectRatio?: unknown } | undefined;
    const blob = entry?.image as
      | {
          size?: number;
          mimeType?: string;
          ref?: { $link?: string; toString?: () => string };
        }
      | undefined;
    if (!blob || typeof blob.size !== "number") continue;

    const refLink =
      blob.ref && typeof blob.ref === "object" && typeof blob.ref.$link === "string"
        ? blob.ref.$link
        : blob.ref
          ? String(blob.ref)
          : "";
    if (!refLink) continue;

    const ar = entry?.aspectRatio as { width?: number; height?: number } | undefined;
    const aspectRatio =
      ar && typeof ar.width === "number" && typeof ar.height === "number"
        ? { width: ar.width, height: ar.height }
        : undefined;

    out.push({
      index: i,
      cid: refLink,
      mimeType: typeof blob.mimeType === "string" ? blob.mimeType : "",
      size: blob.size,
      aspectRatio,
    });
  }
  return out;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function detectImageExt(buffer: Uint8Array): string {
  if (buffer.length >= 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return "png";
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return "gif";
    if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
      && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return "webp";
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return "jpg";
  }
  return "jpg";
}


function PostMenu({ post, isOwnPost, onSavingMediaChange }: { post: PostView; isOwnPost: boolean; onSavingMediaChange?: (saving: boolean) => void }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [showOriginalSize, setShowOriginalSize] = useState(false);
  const [threadMuted, setThreadMuted] = useState(!!post.viewer?.threadMuted);
  const imageBlobs = getImageBlobs(post);
  const deletePost = useDeletePost();
  const muteActor = useMuteActor();
  const unmuteActor = useUnmuteActor();
  const blockActor = useBlockActor();
  const unblockActor = useUnblockActor();
  const [userMuted, setUserMuted] = useState(!!post.author.viewer?.muted);
  const [userBlocking, setUserBlocking] = useState(!!post.author.viewer?.blocking);
  const [blockUri, setBlockUri] = useState(post.author.viewer?.blocking ?? "");

  useEffect(() => {
    setUserMuted(!!post.author.viewer?.muted);
    setUserBlocking(!!post.author.viewer?.blocking);
    setBlockUri(post.author.viewer?.blocking ?? "");
  }, [post.author.viewer?.muted, post.author.viewer?.blocking]);

  const handleDelete = () => {
    setOpen(false);
    setConfirming(true);
  };

  const confirmDelete = () => {
    setConfirming(false);
    deletePost.mutate(post.uri);
  };

  const handleHidePost = async () => {
    setOpen(false);
    try {
      await getAgent().hidePost(post.uri);
      queryClient.invalidateQueries({ queryKey: ["moderationOpts"] });
    } catch {
      // silently fail
    }
  };

  const handleCopyLink = () => {
    setOpen(false);
    const rkey = post.uri.split("/").pop();
    const url = `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
    navigator.clipboard.writeText(url);
  };

  const handleSaveMedia = async () => {
    setOpen(false);
    setSavingMedia(true);
    onSavingMediaChange?.(true);
    try {
      // Save images
      const images = getMediaImages(post);
      for (const img of images) {
        try {
          const res = await tauriFetch(img.fullsize);
          const blob = await res.blob();
          const buffer = new Uint8Array(await blob.arrayBuffer());
          const ext = detectImageExt(buffer);
          const pathname = new URL(img.fullsize).pathname;
          const baseName = pathname.split("/").pop()?.split("@")[0] || "image";
          const fileName = `${baseName}.${ext}`;
          const filePath = await save({
            defaultPath: fileName,
            filters: [{ name: "Image", extensions: [ext] }],
          });
          if (filePath) await writeFile(filePath, buffer);
        } catch { /* continue with next */ }
      }
      // Save video via AT Protocol getBlob (direct PDS access)
      const video = getMediaVideo(post);
      if (video?.playlist) {
        try {
          // Extract DID and CID from playlist URL: https://video.bsky.app/watch/{did}/{cid}/playlist.m3u8
          const parts = decodeURIComponent(new URL(video.playlist).pathname).split("/");
          if (parts.length >= 5) {
            const did = parts[2];
            const cid = parts[3];

            // Resolve the author's PDS URL from DID document
            let pdsUrl: string | null = null;
            if (did.startsWith("did:plc:")) {
              const plcRes = await tauriFetch(`https://plc.directory/${did}`);
              const plcText = await plcRes.text();
              const plcJson = JSON.parse(plcText);
              const services = Array.isArray(plcJson.service) ? plcJson.service : [];
              for (const svc of services) {
                if (svc.type === "AtprotoPersonalDataServer" && svc.serviceEndpoint) {
                  pdsUrl = svc.serviceEndpoint;
                  break;
                }
              }
            } else if (did.startsWith("did:web:")) {
              pdsUrl = `https://${did.slice("did:web:".length)}`;
            }

            if (!pdsUrl) {
              console.error("[MediaSave] Failed to resolve PDS for:", did);
            } else {
              // Download blob from author's PDS
              const blobUrl = `${pdsUrl}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
              console.log("[MediaSave] Downloading video from:", blobUrl);
              const blobRes = await tauriFetch(blobUrl);
              if (!blobRes.ok) {
                console.error("[MediaSave] Blob fetch failed:", blobRes.status, await blobRes.text().catch(() => ""));
              } else {
                const blob = await blobRes.blob();
                const buffer = new Uint8Array(await blob.arrayBuffer());
                console.log("[MediaSave] Video downloaded:", buffer.length, "bytes");
                const contentType = blobRes.headers.get("content-type") ?? "";
                const ext = contentType.includes("quicktime") ? "mov" : "mp4";
                const filePath = await save({
                  defaultPath: `video_${cid.slice(0, 8)}.${ext}`,
                  filters: [{ name: "Video", extensions: [ext] }],
                });
                if (filePath) await writeFile(filePath, buffer);
              }
            }
          }
        } catch (e) { console.error("[MediaSave] Video save error:", e); }
      }
    } finally {
      setSavingMedia(false);
      onSavingMediaChange?.(false);
    }
  };

  const handleToggleMuteThread = async () => {
    setOpen(false);
    try {
      const agent = getAgent();
      if (threadMuted) {
        await agent.app.bsky.graph.unmuteThread({ root: post.uri });
        setThreadMuted(false);
      } else {
        await agent.app.bsky.graph.muteThread({ root: post.uri });
        setThreadMuted(true);
      }
    } catch {
      // silently fail
    }
  };

  const handleToggleMuteUser = async () => {
    setOpen(false);
    try {
      if (userMuted) {
        await unmuteActor.mutateAsync({ did: post.author.did });
        setUserMuted(false);
      } else {
        await muteActor.mutateAsync({ did: post.author.did });
        setUserMuted(true);
      }
    } catch {
      // silently fail
    }
  };

  const handleBlockClick = () => {
    setOpen(false);
    setConfirmingBlock(true);
  };

  const confirmBlock = async () => {
    setConfirmingBlock(false);
    try {
      if (userBlocking) {
        if (blockUri) {
          await unblockActor.mutateAsync({ blockUri });
        }
        setUserBlocking(false);
        setBlockUri("");
      } else {
        const res = await blockActor.mutateAsync({ did: post.author.did });
        setUserBlocking(true);
        setBlockUri(res.uri);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <>
      <div className="relative ml-auto">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 transition-colors"
        >
          <Icon name="more_vert" size={16} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
            <div className="absolute right-0 bottom-6 z-50 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[160px] whitespace-nowrap">
              {isOwnPost && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon name="delete" size={16} />
                  <span>{t("post.delete")}</span>
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="link" size={16} />
                <span>{t("post.copyLink")}</span>
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  const postText = (post.record as { text?: string })?.text ?? "";
                  const lang = i18n.language.startsWith("ja") ? "ja" : i18n.language.split("-")[0];
                  openUrl(`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(postText)}&op=translate`);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="translate" size={16} />
                <span>{t("post.translate")}</span>
              </button>
              {hasMediaInPost(post) && (
                <button
                  onClick={handleSaveMedia}
                  disabled={savingMedia}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Icon name="download" size={16} />
                  <span>{savingMedia ? t("post.savingMedia") : t("post.saveMedia")}</span>
                </button>
              )}
              {imageBlobs.length > 0 && (
                <button
                  onClick={() => { setOpen(false); setShowOriginalSize(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon name="photo_size_select_large" size={16} />
                  <span>{t("post.showOriginalSize")}</span>
                </button>
              )}
              {!isOwnPost && (
                <>
                  <div className="my-1 border-t border-border-light dark:border-border-dark" />
                  <button
                    onClick={handleHidePost}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name="visibility_off" size={16} />
                    <span>{t("post.hidePost")}</span>
                  </button>
                  <button
                    onClick={() => { setOpen(false); useReportStore.getState().open({ type: "post", uri: post.uri, cid: post.cid }); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name="flag" size={16} />
                    <span>{t("report.reportPost")}</span>
                  </button>
                  <button
                    onClick={handleToggleMuteThread}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name={threadMuted ? "notifications_active" : "notifications_off"} size={16} />
                    <span>{threadMuted ? t("post.unmuteThread") : t("post.muteThread")}</span>
                  </button>
                  <div className="my-1 border-t border-border-light dark:border-border-dark" />
                  <button
                    onClick={handleToggleMuteUser}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name={userMuted ? "volume_up" : "volume_off"} size={16} />
                    <span>{userMuted ? t("post.unmuteUser") : t("post.muteUser")}</span>
                  </button>
                  <button
                    onClick={handleBlockClick}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${userBlocking ? "text-red-500" : "text-text-light dark:text-text-dark"}`}
                  >
                    <Icon name="block" size={16} />
                    <span>{userBlocking ? t("post.unblockUser") : t("post.blockUser")}</span>
                  </button>
                  <button
                    onClick={() => { setOpen(false); useReportStore.getState().open({ type: "user", did: post.author.did }); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name="person_alert" size={16} />
                    <span>{t("report.reportUser")}</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setConfirming(false); }}>
          <div className="bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl p-5 mx-4 max-w-[280px] w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-text-light dark:text-text-dark text-center mb-4">{t("post.deleteConfirm")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("post.deleteCancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {t("post.deleteAction")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original image size modal */}
      {showOriginalSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setShowOriginalSize(false); }}>
          <div className="bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl p-5 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-text-light dark:text-text-dark mb-3">{t("post.originalSizeTitle")}</p>
            <div className="space-y-2 mb-3 max-h-[50vh] overflow-y-auto">
              {imageBlobs.map((info) => (
                <div key={info.cid} className="text-xs text-text-light dark:text-text-dark border border-border-light dark:border-border-dark rounded p-2">
                  <div className="font-medium mb-0.5">{t("post.originalSizeImage", { n: info.index + 1 })}</div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400">{t("post.originalSizeBytes")}</span>
                    <span className="font-mono">{formatBytes(info.size)}</span>
                  </div>
                  {info.aspectRatio && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400">{t("post.originalSizeDimensions")}</span>
                      <span className="font-mono">{info.aspectRatio.width}×{info.aspectRatio.height}</span>
                    </div>
                  )}
                  {info.mimeType && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400">{t("post.originalSizeType")}</span>
                      <span className="font-mono">{info.mimeType}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-snug">{t("post.originalSizeNote")}</p>
            <button
              onClick={() => setShowOriginalSize(false)}
              className="w-full py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t("post.originalSizeClose")}
            </button>
          </div>
        </div>
      )}

      {/* Block confirmation modal */}
      {confirmingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { e.stopPropagation(); setConfirmingBlock(false); }}>
          <div className="bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl p-5 mx-4 max-w-[280px] w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-text-light dark:text-text-dark text-center mb-4">
              {userBlocking
                ? t("confirm.unblock", { name: post.author.displayName || post.author.handle })
                : t("confirm.block", { name: post.author.displayName || post.author.handle })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingBlock(false)}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("post.deleteCancel")}
              </button>
              <button
                onClick={confirmBlock}
                className={`flex-1 py-2 text-sm font-medium rounded-lg text-white transition-colors ${userBlocking ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                {userBlocking ? t("confirm.unblock_btn") : t("confirm.block_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({
  icon,
  count,
  active,
  activeColor = "",
  disabled = false,
  onClick,
  onCountClick,
}: {
  icon: string;
  count: number;
  active: boolean;
  activeColor?: string;
  disabled?: boolean;
  onClick: () => void;
  onCountClick?: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`flex items-center gap-1 text-xs transition-colors ${
        disabled
          ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          : active
            ? activeColor
            : "text-gray-500 hover:text-primary"
      }`}
    >
      <Icon name={icon} size={16} filled={active} />
      {count > 0 && (
        <span
          onClick={onCountClick ? (e) => { e.stopPropagation(); onCountClick(); } : undefined}
          className={onCountClick ? "hover:underline" : ""}
        >
          {count}
        </span>
      )}
    </button>
  );
}
