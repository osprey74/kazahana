import { useTranslation } from "react-i18next";
import { useDraftStore, type PostDraft } from "../../stores/draftStore";
import { Icon } from "../common/Icon";

interface DraftListModalProps {
  onLoad: (draft: PostDraft) => void;
  onClose: () => void;
}

export function DraftListModal({ onLoad, onClose }: DraftListModalProps) {
  const { t } = useTranslation();
  const { drafts, deleteDraft, clearAllDrafts } = useDraftStore();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16 bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-bg-dark rounded-card w-full max-w-md mx-4 shadow-xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h3 className="text-sm font-bold text-text-light dark:text-text-dark">
            {t("draft.title")} ({drafts.length}/20)
          </h3>
          <div className="flex items-center gap-2">
            {drafts.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(t("draft.clearAllConfirm"))) clearAllDrafts();
                }}
                className="text-xs text-red-500 hover:text-red-600"
              >
                {t("draft.clearAll")}
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {drafts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">{t("draft.empty")}</p>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer flex gap-3"
                onClick={() => onLoad(draft)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-light dark:text-text-dark line-clamp-2 leading-snug">
                    {draft.text || (
                      <span className="text-gray-400 italic">
                        {draft.images.length > 0 ? t("draft.imageOnly") : t("draft.empty")}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400">{formatDate(draft.createdAt)}</span>
                    {draft.images.length > 0 && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                        <Icon name="image" size={12} />
                        {draft.images.length}
                      </span>
                    )}
                    {draft.replyTo && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                        <Icon name="reply" size={12} />
                      </span>
                    )}
                    {draft.quoteTo && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                        <Icon name="format_quote" size={12} />
                      </span>
                    )}
                  </div>
                </div>
                {/* Thumbnail preview */}
                {draft.images.length > 0 && (
                  <img
                    src={draft.images[0].dataUrl}
                    alt=""
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDraft(draft.id);
                  }}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0 self-center"
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
