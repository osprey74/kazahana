import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl mx-4 max-w-[300px] w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-text-light dark:text-text-dark text-center mb-4">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium rounded-btn border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelLabel ?? t("compose.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-sm font-medium rounded-btn text-white transition-colors ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-blue-600"
            }`}
          >
            {confirmLabel ?? t("confirm.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}
