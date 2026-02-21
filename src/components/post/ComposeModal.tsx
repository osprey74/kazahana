import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useComposeStore } from "../../stores/composeStore";
import { useCreatePost } from "../../hooks/usePost";
import { ImageUpload, type ImageFile } from "./ImageUpload";
import { Avatar } from "../common/Avatar";

const MAX_GRAPHEMES = 300;

function countGraphemes(text: string): number {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    return [...segmenter.segment(text)].length;
  }
  return [...text].length;
}

export function ComposeModal() {
  const { t } = useTranslation();
  const { isOpen, replyTo, close } = useComposeStore();
  const createPost = useCreatePost();
  const [text, setText] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);

  const graphemeCount = countGraphemes(text);
  const isOverLimit = graphemeCount > MAX_GRAPHEMES;
  const canPost = text.trim().length > 0 && !isOverLimit && !createPost.isPending;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setText("");
      setImages([]);
      createPost.reset();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddImages = useCallback((files: File[]) => {
    const newImages: ImageFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
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

  const handleSubmit = async () => {
    if (!canPost) return;

    // Read image files into Uint8Array
    const imageData = await Promise.all(
      images.map(async (img) => {
        const buf = await img.file.arrayBuffer();
        return { data: new Uint8Array(buf), mimeType: img.file.type };
      }),
    );

    await createPost.mutateAsync({
      text,
      images: imageData.length > 0 ? imageData : undefined,
      replyTo: replyTo
        ? { uri: replyTo.uri, cid: replyTo.cid }
        : undefined,
    });

    // Cleanup previews
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40">
      <div className="bg-white dark:bg-bg-dark rounded-card w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <button
            onClick={close}
            className="text-sm text-gray-500 hover:text-gray-700"
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
                <span className="font-medium text-text-light">
                  {replyTo.author.displayName || replyTo.author.handle}
                </span>{" "}
                {t("post.replyTo")}
              </p>
              <p className="text-xs text-gray-400 truncate">{replyTo.text}</p>
            </div>
          </div>
        )}

        {/* Text input */}
        <div className="px-4 py-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? t("compose.replyPlaceholder") : t("compose.placeholder")}
            className="w-full min-h-[120px] resize-none text-sm text-text-light dark:text-text-dark bg-transparent placeholder-gray-400 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Image upload */}
        <div className="px-4 pb-3">
          <ImageUpload
            images={images}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
          />
        </div>

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
