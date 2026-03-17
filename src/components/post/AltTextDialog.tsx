import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settingsStore";
import { generateAltText, fileToBase64 } from "../../lib/claudeApi";
import { Icon } from "../common/Icon";

interface AltTextDialogProps {
  imagePreview: string;
  imageFile: File;
  alt: string;
  onSave: (alt: string) => void;
  onClose: () => void;
}

export function AltTextDialog({ imagePreview, imageFile, alt, onSave, onClose }: AltTextDialogProps) {
  const { t, i18n } = useTranslation();
  const claudeApiKey = useSettingsStore((s) => s.claudeApiKey);
  const [text, setText] = useState(alt);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!claudeApiKey) return;
    setGenerating(true);
    setError(null);
    try {
      const { base64, mediaType } = await fileToBase64(imageFile);
      const result = await generateAltText(claudeApiKey, base64, mediaType, i18n.language);
      setText(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }, [claudeApiKey, imageFile, i18n.language]);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[90vw] max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-medium text-text-light dark:text-text-dark">
            {t("image.editAlt")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Image preview */}
        <div className="px-4 pt-3">
          <img
            src={imagePreview}
            alt=""
            className="w-full max-h-48 object-contain rounded bg-gray-100 dark:bg-gray-700"
          />
        </div>

        {/* ALT text input */}
        <div className="px-4 py-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("image.altPlaceholder")}
            rows={3}
            className="w-full text-sm px-3 py-2 rounded border border-border-light dark:border-border-dark bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
          />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!claudeApiKey || generating}
            className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-btn transition-colors ${
              claudeApiKey && !generating
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Icon name="auto_awesome" size={14} />
            {generating ? t("image.altGenerating") : t("image.altGenerate")}
          </button>

          {!claudeApiKey && (
            <p className="mt-1.5 text-[11px] text-gray-400">
              {t("image.altGenerateHint")}
            </p>
          )}

          {error && (
            <p className="mt-1.5 text-[11px] text-red-500">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-btn text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t("compose.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm rounded-btn bg-primary text-white hover:opacity-90 transition-opacity"
          >
            {t("confirm.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}
