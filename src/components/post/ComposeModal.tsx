import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useComposeStore } from "../../stores/composeStore";
import { useCreatePost } from "../../hooks/usePost";
import { useOgp } from "../../hooks/useOgp";
import { useSearchActorsTypeahead } from "../../hooks/useSearch";
import { ImageUpload, type ImageFile } from "./ImageUpload";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

const MAX_GRAPHEMES = 300;

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

export function ComposeModal() {
  const { t } = useTranslation();
  const { isOpen, replyTo, close } = useComposeStore();
  const createPost = useCreatePost();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [replyGate, setReplyGate] = useState<"everyone" | "mention" | "follower" | "following" | "nobody">("everyone");
  const [disableQuote, setDisableQuote] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);

  // OGP link card (manual trigger)
  const { detectedUrl, ogp, isLoading: ogpLoading, fetchCard, dismiss: dismissOgp, reset: resetOgp } = useOgp(text);

  // Mention autocomplete
  const mentionInfo = getMentionQuery(text, cursorPos);
  const mentionQuery = mentionInfo?.query ?? "";
  const { data: mentionResults } = useSearchActorsTypeahead(mentionQuery);
  const showMention = !!(mentionInfo && mentionQuery.length > 0 && mentionResults && mentionResults.length > 0);

  const graphemeCount = countGraphemes(text);
  const isOverLimit = graphemeCount > MAX_GRAPHEMES;
  const canPost = text.trim().length > 0 && !isOverLimit && !createPost.isPending;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setText("");
      setCursorPos(0);
      setImages([]);
      setReplyGate("everyone");
      setDisableQuote(false);
      setMentionIndex(0);
      createPost.reset();
      resetOgp();
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

  const handleAddImages = useCallback((files: File[]) => {
    const newImages: ImageFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      alt: "",
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleUpdateAlt = useCallback((id: string, alt: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, alt } : img)));
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
        external: ogp ? { uri: ogp.url, title: ogp.title, description: ogp.description, thumbUrl: ogp.imageUrl } : undefined,
        replyTo: replyTo
          ? { uri: replyTo.uri, cid: replyTo.cid }
          : undefined,
        threadgate: !replyTo ? replyGate : undefined,
        postgate: !replyTo && disableQuote ? { disableQuote: true } : undefined,
      },
      {
        onSuccess: () => {
          images.forEach((img) => URL.revokeObjectURL(img.preview));
          close();
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40">
      <div className="bg-white dark:bg-bg-dark rounded-card w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <button
            onClick={close}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? t("compose.replyPlaceholder") : t("compose.placeholder")}
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

        {/* Image upload */}
        <div className="px-4 pb-3">
          <ImageUpload
            images={images}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            onUpdateAlt={handleUpdateAlt}
          />
        </div>

        {/* Link card: manual trigger or preview */}
        {images.length === 0 && (
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

        {/* Gate settings (new posts only, not replies) */}
        {!replyTo && (
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
              <p className="text-xs text-red-500">{t("compose.postFailed")}</p>
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
    </div>
  );
}
