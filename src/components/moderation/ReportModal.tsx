import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useReportStore } from "../../stores/reportStore";
import { getAgent } from "../../lib/agent";
import { Icon } from "../common/Icon";

const REASON_TYPES = [
  { id: "spam", value: "com.atproto.moderation.defs#reasonSpam" },
  { id: "violation", value: "com.atproto.moderation.defs#reasonViolation" },
  { id: "misleading", value: "com.atproto.moderation.defs#reasonMisleading" },
  { id: "sexual", value: "com.atproto.moderation.defs#reasonSexual" },
  { id: "rude", value: "com.atproto.moderation.defs#reasonRude" },
  { id: "other", value: "com.atproto.moderation.defs#reasonOther" },
] as const;

export function ReportModal() {
  const { t } = useTranslation();
  const { isOpen, target, close } = useReportStore();
  const [reasonType, setReasonType] = useState(REASON_TYPES[0].value);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  if (!isOpen || !target) return null;

  const handleClose = () => {
    close();
    setReasonType(REASON_TYPES[0].value);
    setReason("");
    setResult(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const agent = getAgent();
      const subject =
        target.type === "post"
          ? {
              $type: "com.atproto.repo.strongRef" as const,
              uri: target.uri!,
              cid: target.cid!,
            }
          : {
              $type: "com.atproto.admin.defs#repoRef" as const,
              did: target.did!,
            };

      await agent.createModerationReport({
        reasonType,
        reason: reason.trim() || undefined,
        subject,
      });
      setResult("success");
    } catch {
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  const isPost = target.type === "post";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl mx-4 max-w-[360px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-bold text-text-light dark:text-text-dark">
            {isPost ? t("report.reportPost") : t("report.reportUser")}
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Icon name="close" size={18} />
          </button>
        </div>

        {result === "success" ? (
          <div className="px-4 py-6 text-center">
            <Icon name="check_circle" size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm text-text-light dark:text-text-dark">{t("report.success")}</p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-btn bg-primary text-white hover:bg-blue-600 transition-colors"
            >
              {t("report.close")}
            </button>
          </div>
        ) : (
          <>
            {/* Reason selection */}
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("report.reason")}</p>
              <div className="space-y-1">
                {REASON_TYPES.map((rt) => (
                  <label key={rt.id} className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="radio"
                      name="reasonType"
                      value={rt.value}
                      checked={reasonType === rt.value}
                      onChange={() => setReasonType(rt.value)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-sm text-text-light dark:text-text-dark">{t(`report.reasons.${rt.id}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div className="px-4 pb-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("report.detailsPlaceholder")}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Error */}
            {result === "error" && (
              <p className="px-4 pb-2 text-xs text-red-500">{t("report.error")}</p>
            )}

            {/* Footer */}
            <div className="flex gap-3 px-4 py-3 border-t border-border-light dark:border-border-dark">
              <button
                onClick={handleClose}
                className="flex-1 py-2 text-sm font-medium rounded-btn border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("compose.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2 text-sm font-medium rounded-btn bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? t("report.submitting") : t("report.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
