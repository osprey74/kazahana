import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUnreadCount } from "../../hooks/useNotifications";
import { Icon } from "../common/Icon";

export function TabBar() {
  const { t } = useTranslation();
  const { data: unreadCount } = useUnreadCount();

  const tabs = [
    { to: "/", label: t("tabs.home"), icon: "home" },
    { to: "/search", label: t("tabs.search"), icon: "search" },
    { to: "/notifications", label: t("tabs.notifications"), icon: "notifications" },
    { to: "/profile", label: t("tabs.profile"), icon: "person" },
  ] as const;

  return (
    <nav className="flex border-b border-border-light dark:border-border-dark bg-white dark:bg-bg-dark">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          title={tab.label}
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center py-2.5 transition-colors relative ${
              isActive
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`
          }
        >
          <span className="relative">
            <Icon name={tab.icon} size={22} />
            {tab.to === "/notifications" && !!unreadCount && unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
