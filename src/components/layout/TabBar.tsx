import { NavLink } from "react-router-dom";
import { useUnreadCount } from "../../hooks/useNotifications";

const tabs = [
  { to: "/", label: "ホーム", icon: "🏠" },
  { to: "/search", label: "検索", icon: "🔍" },
  { to: "/notifications", label: "通知", icon: "🔔" },
  { to: "/profile", label: "プロフィール", icon: "👤" },
] as const;

export function TabBar() {
  const { data: unreadCount } = useUnreadCount();

  return (
    <nav className="flex border-b border-border-light bg-white">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
              isActive
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`
          }
        >
          <span className="relative">
            {tab.icon}
            {tab.to === "/notifications" && !!unreadCount && unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
