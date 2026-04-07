import { useTranslation } from "react-i18next";

interface Props {
  previewUrls: string[];
  onConfirm: () => void;
  onPostWithoutWatermark: () => void;
  onCancel: () => void;
}

export function WatermarkConfirmModal({ previewUrls, onConfirm, onPostWithoutWatermark, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-bg-dark rounded-card w-full max-w-lg mx-4 shadow-xl">
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-medium text-text-light dark:text-text-dark">
            {t("watermark.confirmTitle")}
          </h3>
        </div>

        <div className="px-4 py-3">
          <div className={`grid gap-2 ${previewUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {previewUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Preview ${i + 1}`}
                className={`w-full rounded border border-border-light dark:border-border-dark object-contain ${
                  previewUrls.length > 1 ? "max-h-56" : "max-h-72"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("watermark.confirmMessage")}</p>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t("compose.cancel")}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onPostWithoutWatermark}
              className="px-3 py-1.5 text-sm text-gray-500 border border-border-light dark:border-border-dark rounded-btn hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t("watermark.postWithout")}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-blue-600"
            >
              {t("compose.post")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
