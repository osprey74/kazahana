import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AtpSessionData } from "@atproto/api";
import { useAuthStore } from "../../stores/authStore";
import { LoginForm } from "./LoginForm";
import { Icon } from "../common/Icon";

export function AccountPickerView() {
  const { t } = useTranslation();
  const { savedAccounts, switchAccount, removeAccount, isLoading } = useAuthStore();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [confirmRemoveDID, setConfirmRemoveDID] = useState<string | null>(null);

  if (showAddAccount) {
    return <LoginForm onBack={() => setShowAddAccount(false)} isAddAccount />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-bg-dark">
      <div className="w-full max-w-sm mx-auto p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">{t("app.title")}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t("auth.accountPicker.title")}</p>
        </div>

        {/* Account list */}
        <div className="space-y-2 mb-6">
          {savedAccounts.map((account: AtpSessionData) => (
            <div key={account.did} className="relative">
              <button
                onClick={() => switchAccount(account.did)}
                disabled={isLoading}
                className="w-full flex items-center justify-between px-4 py-3 rounded-btn border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                    @{account.handle}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{account.did}</p>
                </div>
                <Icon name="chevron_right" size={18} className="text-gray-400 shrink-0 ml-2" />
              </button>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmRemoveDID(account.did); }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"
                title={t("auth.accountPicker.removeAccount")}
              >
                <Icon name="close" size={16} />
              </button>

              {/* Remove confirmation */}
              {confirmRemoveDID === account.did && (
                <div className="mt-1 p-3 rounded-btn bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    {t("auth.accountPicker.removeConfirmTitle")}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                    {t("auth.accountPicker.removeConfirmMessage")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRemoveDID(null)}
                      className="px-3 py-1.5 text-xs rounded-btn border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t("post.deleteCancel")}
                    </button>
                    <button
                      onClick={() => { removeAccount(account.did); setConfirmRemoveDID(null); }}
                      className="px-3 py-1.5 text-xs rounded-btn bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      {t("auth.accountPicker.removeAccount")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add account button */}
        <button
          onClick={() => setShowAddAccount(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary border border-primary rounded-btn hover:bg-primary/5 transition-colors"
        >
          <Icon name="person_add" size={18} />
          {t("auth.accountPicker.addAccount")}
        </button>
      </div>
    </div>
  );
}
