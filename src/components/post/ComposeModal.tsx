import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useComposeStore } from "../../stores/composeStore";
import { useCreatePost, VideoUploadError } from "../../hooks/usePost";
import { useOgp } from "../../hooks/useOgp";
import { extractUrl } from "../../lib/ogp";
import { useSearchActorsTypeahead } from "../../hooks/useSearch";
import { ImageUpload, type ImageFile } from "./ImageUpload";
import { ImageEditModal } from "./ImageEditModal";
import { VideoUpload, type VideoFile } from "./VideoUpload";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

const MAX_GRAPHEMES = 300;
const IMAGE_MAX_BYTES = 1_000_000; // 1MB — Bluesky image upload limit (images exceeding this are auto-compressed)
const IMAGE_MAX_WIDTH = 2048;
const IMAGE_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Compress a pasted image (e.g. screenshot) to fit within Bluesky's upload limit. */
async function compressImageFile(file: File): Promise<File> {
  if (file.size <= IMAGE_MAX_BYTES) return file;

  const img = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_WIDTH / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  img.close();

  for (let quality = 0.85; quality >= 0.3; quality -= 0.1) {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    if (blob.size <= IMAGE_MAX_BYTES) {
      return new File([blob], "screenshot.jpg", { type: "image/jpeg" });
    }
  }
  const fallback = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.2 });
  return new File([fallback], "screenshot.jpg", { type: "image/jpeg" });
}

function countGraphemes(text: string): number {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    return [...segmenter.segment(text)].length;
  }
  return [...text].length;
}

/** Extract mention query from text at cursor position */
function getMentionQuery(text: string, cursorPos: number): { query: string; atIndex: number } | null {
  const before = text.substring(0, cursorPos);
  const lastAt = before.lastIndexOf("@");
  if (lastAt === -1) return null;

  // @ must be at start or preceded by whitespace/newline
  if (lastAt > 0 && !/\s/.test(before[lastAt - 1])) return null;

  const query = before.substring(lastAt + 1);
  // No spaces allowed in mention query
  if (/\s/.test(query)) return null;

  return { query, atIndex: lastAt };
}

/** Get video aspect ratio from a File */
function getVideoAspectRatio(file: File): Promise<{ width: number; height: number } | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight } = video;
      URL.revokeObjectURL(video.src);
      if (videoWidth && videoHeight) {
        resolve({ width: videoWidth, height: videoHeight });
      } else {
        resolve(undefined);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(undefined);
    };
    video.src = URL.createObjectURL(file);
  });
}

export function ComposeModal() {
  const { t } = useTranslation();
  const { isOpen, replyTo, quoteTo, initialText, close } = useComposeStore();
  const createPost = useCreatePost();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<{ width: number; height: number } | undefined>();
  const [videoProgress, setVideoProgress] = useState<{ progress: number; state: string } | null>(null);
  const [replyGate, setReplyGate] = useState<"everyone" | "mention" | "follower" | "following" | "nobody">("everyone");
  const [disableQuote, setDisableQuote] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  // OGP link card (manual trigger)
  const { detectedUrl, ogp, isLoading: ogpLoading, fetchCard, fetchCardForUrl, dismiss: dismissOgp, reset: resetOgp } = useOgp(text);

  // Mention autocomplete
  const mentionInfo = getMentionQuery(text, cursorPos);
  const mentionQuery = mentionInfo?.query ?? "";
  const { data: mentionResults } = useSearchActorsTypeahead(mentionQuery);
  const showMention = !!(mentionInfo && mentionQuery.length > 0 && mentionResults && mentionResults.length > 0);

  const graphemeCount = countGraphemes(text);
  const isOverLimit = graphemeCount > MAX_GRAPHEMES;
  const canPost = text.trim().length > 0 && !isOverLimit && !createPost.isPending;

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !createPost.isPending) {
        close();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, close, createPost.isPending]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setText(initialText ?? "");
      setCursorPos(0);
      setImages([]);
      setVideo(null);
      setVideoAspectRatio(undefined);
      setVideoProgress(null);
      setReplyGate("everyone");
      setDisableQuote(false);
      setMentionIndex(0);
      createPost.reset();
      resetOgp();
      // Auto-fetch OGP card for deep-link URLs
      if (initialText) {
        const url = extractUrl(initialText);
        if (url) fetchCardForUrl(url);
      }
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset mention index when results change
  useEffect(() => {
    setMentionIndex(0);
  }, [mentionResults]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCursorPos(e.target.selectionStart);
  };

  const handleAddImages = useCallback((files: File[]) => {
    const newImages: ImageFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      alt: "",
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  /** Compress files that exceed the upload limit and add them as images. */
  const compressAndAddImages = useCallback(async (rawFiles: File[]) => {
    setIsCompressing(true);
    try {
      const compressed: File[] = [];
      for (const file of rawFiles) {
        compressed.push(await compressImageFile(file));
      }
      if (compressed.length > 0) handleAddImages(compressed);
    } finally {
      setIsCompressing(false);
    }
  }, [handleAddImages]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Handle clipboard image paste (screenshots, copied images)
    if (!video && images.length < 4) {
      const imageItems = Array.from(e.clipboardData.items).filter(
        (item) => item.kind === "file" && IMAGE_ACCEPTED.includes(item.type),
      );
      if (imageItems.length > 0) {
        e.preventDefault();
        const rawFiles: File[] = [];
        for (const item of imageItems) {
          const raw = item.getAsFile();
          if (raw) rawFiles.push(raw);
        }
        if (rawFiles.length > 0) compressAndAddImages(rawFiles);
        return;
      }
    }

    // Handle text paste (URL → OGP link card)
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;
    const url = extractUrl(pasted);
    if (!url) return;
    // ogp/images/video/quote already present → skip
    if (ogp || images.length > 0 || video || quoteTo) return;
    fetchCardForUrl(url);
  }, [fetchCardForUrl, ogp, images.length, video, quoteTo, compressAndAddImages]);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPos((e.target as HTMLTextAreaElement).selectionStart);
  };

  const insertMention = useCallback((handle: string) => {
    const info = getMentionQuery(text, cursorPos);
    if (!info) return;

    const newText =
      text.substring(0, info.atIndex) +
      "@" + handle + " " +
      text.substring(info.atIndex + 1 + info.query.length);

    setText(newText);
    const newCursorPos = info.atIndex + 1 + handle.length + 1;
    setCursorPos(newCursorPos);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [text, cursorPos]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Alt+Enter to submit post
    if (e.altKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (!showMention || !mentionResults) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => (i + 1) % mentionResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(mentionResults[mentionIndex].handle);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCursorPos(0); // Force close dropdown
    }
  };

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleUpdateImageAlt = useCallback((id: string, alt: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, alt } : img)));
  }, []);

  const handleEditImage = useCallback((id: string) => {
    setEditingImageId(id);
  }, []);

  const handleEditApply = useCallback(async (editedFile: File) => {
    const compressed = await compressImageFile(editedFile);
    setImages((prev) => prev.map((img) => {
      if (img.id !== editingImageId) return img;
      URL.revokeObjectURL(img.preview);
      return { ...img, file: compressed, preview: URL.createObjectURL(compressed) };
    }));
    setEditingImageId(null);
  }, [editingImageId]);

  const handleSelectVideo = useCallback(async (file: File) => {
    const preview = URL.createObjectURL(file);
    setVideo({ file, preview, alt: "" });
    const ratio = await getVideoAspectRatio(file);
    setVideoAspectRatio(ratio);
  }, []);

  const handleRemoveVideo = useCallback(() => {
    if (video) URL.revokeObjectURL(video.preview);
    setVideo(null);
    setVideoAspectRatio(undefined);
    setVideoProgress(null);
  }, [video]);

  const handleUpdateVideoAlt = useCallback((alt: string) => {
    setVideo((prev) => prev ? { ...prev, alt } : null);
  }, []);

  const handleSubmit = async () => {
    if (!canPost) return;

    // Read image files into Uint8Array
    const imageData = await Promise.all(
      images.map(async (img) => {
        const buf = await img.file.arrayBuffer();
        return { data: new Uint8Array(buf), mimeType: img.file.type, alt: img.alt };
      }),
    );

    createPost.mutate(
      {
        text,
        images: imageData.length > 0 ? imageData : undefined,
        video: video ? { file: video.file, alt: video.alt, aspectRatio: videoAspectRatio } : undefined,
        external: !quoteTo && ogp ? { uri: ogp.url, title: ogp.title, description: ogp.description, thumbUrl: ogp.imageUrl } : undefined,
        replyTo: replyTo
          ? { uri: replyTo.uri, cid: replyTo.cid, root: replyTo.root }
          : undefined,
        quoteTo: quoteTo
          ? { uri: quoteTo.uri, cid: quoteTo.cid }
          : undefined,
        threadgate: !replyTo && !quoteTo ? replyGate : undefined,
        postgate: !replyTo && !quoteTo && disableQuote ? { disableQuote: true } : undefined,
        onVideoProgress: (progress, state) => setVideoProgress({ progress, state }),
      },
      {
        onSuccess: () => {
          images.forEach((img) => URL.revokeObjectURL(img.preview));
          if (video) URL.revokeObjectURL(video.preview);
          close();
        },
      },
    );
  };

  const handleModalDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!video) setIsDragging(true);
  }, [video]);

  const handleModalDragLeave = useCallback((e: React.DragEvent) => {
    // Only trigger when leaving the modal container itself
    if (e.currentTarget === e.target) setIsDragging(false);
  }, []);

  const handleModalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (video || images.length >= 4) return;
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => IMAGE_ACCEPTED.includes(f.type),
    );
    if (files.length > 0) compressAndAddImages(files);
  }, [video, images.length, compressAndAddImages]);

  if (!isOpen) return null;

  const hasVideo = video !== null;
  const hasImages = images.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40"
      onDragOver={handleModalDragOver}
      onDragLeave={handleModalDragLeave}
      onDrop={handleModalDrop}
    >
      <div className="bg-white dark:bg-bg-dark rounded-card w-full max-w-md mx-4 shadow-xl relative">
        {/* Drag overlay */}
        {isDragging && !video && (
          <div className="absolute inset-0 z-10 bg-primary/10 border-2 border-dashed border-primary rounded-card flex items-center justify-center pointer-events-none">
            <p className="text-primary font-medium text-sm">{t("image.dropHere")}</p>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <button
            onClick={close}
            disabled={createPost.isPending}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          >
            {t("compose.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canPost}
            className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createPost.isPending ? t("compose.posting") : t("compose.post")}
          </button>
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-4 pt-3 flex gap-2 items-start">
            <Avatar src={replyTo.author.avatar} size="sm" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">
                <span className="font-medium text-text-light dark:text-text-dark">
                  {replyTo.author.displayName || replyTo.author.handle}
                </span>{" "}
                {t("post.replyTo")}
              </p>
              <p className="text-xs text-gray-400 truncate">{replyTo.text}</p>
            </div>
          </div>
        )}

        {/* Text input + mention dropdown */}
        <div className="px-4 py-3 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onPaste={handlePaste}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? t("compose.replyPlaceholder") : quoteTo ? t("compose.quotePlaceholder") : t("compose.placeholder")}
            className="w-full min-h-[120px] resize-none text-sm text-text-light dark:text-text-dark bg-transparent placeholder-gray-400 focus:outline-none"
            autoFocus
          />

          {/* Mention autocomplete dropdown */}
          {showMention && mentionResults && (
            <div className="absolute left-4 right-4 z-10 bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
              {mentionResults.map((actor, i) => (
                <button
                  key={actor.did}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent textarea blur
                    insertMention(actor.handle);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    i === mentionIndex
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Avatar src={actor.avatar} alt={actor.displayName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                      {actor.displayName || actor.handle}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{actor.handle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quote preview */}
        {quoteTo && (
          <div className="px-4 pb-3">
            <div className="border border-border-light dark:border-border-dark rounded-lg p-3">
              <div className="flex items-center gap-1.5">
                <Avatar src={quoteTo.author.avatar} alt={quoteTo.author.displayName} size="sm" />
                <span className="font-bold text-xs text-text-light dark:text-text-dark truncate">
                  {quoteTo.author.displayName || quoteTo.author.handle}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  @{quoteTo.author.handle}
                </span>
              </div>
              {quoteTo.text && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-3">{quoteTo.text}</p>
              )}
            </div>
          </div>
        )}

        {/* Image upload (hidden when video is attached) */}
        {!hasVideo && (
          <div className="px-4 pb-3">
            <ImageUpload
              images={images}
              onAdd={compressAndAddImages}
              onRemove={handleRemoveImage}
              onUpdateAlt={handleUpdateImageAlt}
              onEdit={handleEditImage}
            />
          </div>
        )}

        {/* Image compression indicator */}
        {isCompressing && (
          <div className="px-4 pb-2 flex items-center gap-2 text-xs text-gray-500">
            <svg className="animate-spin h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{t("image.compressing")}</span>
          </div>
        )}

        {/* Video upload (hidden when images are attached) */}
        {!hasImages && (
          <div className="px-4 pb-3">
            <VideoUpload
              video={video}
              onSelect={handleSelectVideo}
              onRemove={handleRemoveVideo}
              onUpdateAlt={handleUpdateVideoAlt}
              disabled={createPost.isPending}
            />
          </div>
        )}

        {/* Video upload / processing progress */}
        {createPost.isPending && videoProgress && (
          <div className="px-4 pb-2">
            {videoProgress.state === "uploading" ? (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Icon name="videocam" size={14} />
                  <span>{t("video.uploading")}</span>
                  <span>{videoProgress.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${videoProgress.progress}%` }}
                  />
                </div>
              </>
            ) : videoProgress.state === "processing" ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="animate-spin h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t("video.processing")}</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Link card: manual trigger or preview (hidden when quoting) */}
        {!hasImages && !hasVideo && !quoteTo && (
          <div className="px-4 pb-3">
            {ogpLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Icon name="link" size={14} />
                <span>{t("compose.fetchingLink")}</span>
              </div>
            ) : ogp ? (
              <div className="relative border border-border-light dark:border-border-dark rounded-card overflow-hidden">
                <button
                  onClick={dismissOgp}
                  className="absolute top-1 right-1 z-10 w-6 h-6 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/80"
                >
                  <Icon name="close" size={16} />
                </button>
                {ogp.imageUrl && (
                  <img src={ogp.imageUrl} alt="" className="w-full h-28 object-cover" loading="lazy" />
                )}
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-500 truncate">{new URL(ogp.url).hostname}</p>
                  {ogp.title && <p className="text-sm font-medium text-text-light dark:text-text-dark line-clamp-2 leading-snug">{ogp.title}</p>}
                  {ogp.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-snug">{ogp.description}</p>}
                </div>
              </div>
            ) : detectedUrl ? (
              <button
                onClick={fetchCard}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Icon name="link" size={14} />
                <span>{t("compose.generateLinkCard")}</span>
              </button>
            ) : null}
          </div>
        )}

        {/* Gate settings (new posts only, not replies or quotes) */}
        {!replyTo && !quoteTo && (
          <div className="px-4 pb-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon name="lock" size={14} className="text-gray-400 flex-shrink-0" />
              <select
                value={replyGate}
                onChange={(e) => setReplyGate(e.target.value as typeof replyGate)}
                className="flex-1 text-xs bg-transparent text-text-light dark:text-text-dark border border-border-light dark:border-border-dark rounded px-2 py-1 focus:outline-none focus:border-primary"
              >
                <option value="everyone">{t("gate.replyAll")}</option>
                <option value="mention">{t("gate.replyMention")}</option>
                <option value="follower">{t("gate.replyFollower")}</option>
                <option value="following">{t("gate.replyFollowing")}</option>
                <option value="nobody">{t("gate.replyNobody")}</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={disableQuote}
                onChange={(e) => setDisableQuote(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{t("gate.disableQuote")}</span>
            </label>
          </div>
        )}

        {/* Footer: character count + error */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-light dark:border-border-dark">
          <div>
            {createPost.isError && (
              <p className="text-xs text-red-500">
                {createPost.error instanceof VideoUploadError
                  ? t(`video.error.${createPost.error.i18nKey}`)
                  : t("compose.postFailed")}
                {createPost.error && (
                  <span className="block text-[10px] text-red-400 mt-0.5 break-all">
                    {createPost.error instanceof VideoUploadError
                      ? createPost.error.detail
                      : (createPost.error as Error).message}
                  </span>
                )}
              </p>
            )}
          </div>
          <span
            className={`text-xs ${
              isOverLimit
                ? "text-red-500 font-bold"
                : graphemeCount > MAX_GRAPHEMES * 0.9
                  ? "text-yellow-500"
                  : "text-gray-400"
            }`}
          >
            {graphemeCount}/{MAX_GRAPHEMES}
          </span>
        </div>
      </div>

      {/* Image edit modal */}
      {editingImageId && (() => {
        const editingImage = images.find((img) => img.id === editingImageId);
        if (!editingImage) return null;
        return (
          <ImageEditModal
            file={editingImage.file}
            onApply={handleEditApply}
            onClose={() => setEditingImageId(null)}
          />
        );
      })()}
    </div>
  );
}
