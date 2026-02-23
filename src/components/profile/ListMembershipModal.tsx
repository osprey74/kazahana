import { useTranslation } from "react-i18next";
import { useListManagementStore } from "../../stores/listManagementStore";
import { useMyLists } from "../../hooks/useMyFeeds";
import { useListMemberships, useAddToList, useRemoveFromList } from "../../hooks/useProfile";
import { Icon } from "../common/Icon";

export function ListMembershipModal() {
  const { t } = useTranslation();
  const { isOpen, targetDid, targetName, close } = useListManagementStore();
  const { data: myLists, isLoading: listsLoading } = useMyLists();
  const { data: memberships, isLoading: membershipsLoading } = useListMemberships(targetDid);
  const addToList = useAddToList();
  const removeFromList = useRemoveFromList();

  if (!isOpen) return null;

  const isLoading = listsLoading || membershipsLoading;
  const lists = myLists ?? [];

  const handleToggle = async (listUri: string) => {
    if (!memberships) return;
    const itemUri = memberships[listUri];
    if (itemUri) {
      await removeFromList.mutateAsync({ did: targetDid, itemUri });
    } else {
      await addToList.mutateAsync({ did: targetDid, listUri });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={close}>
      <div
        className="bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl mx-4 max-w-[360px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-bold text-text-light dark:text-text-dark">
            {t("listManagement.title")}
          </h3>
          <button onClick={close} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Target user */}
        <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{targetName}</p>
        </div>

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : lists.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("listManagement.noLists")}
            </p>
          ) : (
            lists.map((list) => {
              const isMember = !!(memberships && memberships[list.uri]);
              const isPending =
                (addToList.isPending && addToList.variables?.listUri === list.uri) ||
                (removeFromList.isPending && removeFromList.variables?.itemUri === memberships?.[list.uri]);

              return (
                <button
                  key={list.uri}
                  onClick={() => handleToggle(list.uri)}
                  disabled={isPending || !memberships}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      isMember
                        ? "bg-primary text-white"
                        : "border-2 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isMember && <Icon name="check" size={14} />}
                  </div>
                  <span className="text-sm text-text-light dark:text-text-dark truncate">
                    {list.name}
                  </span>
                  {isPending && (
                    <div className="ml-auto w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={close}
            className="w-full py-2 text-sm font-medium rounded-btn border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t("report.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
