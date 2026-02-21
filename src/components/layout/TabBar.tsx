import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "ホーム", icon: "🏠" },
  { to: "/search", label: "検索", icon: "🔍" },
  { to: "/notifications", label: "通知", icon: "🔔" },
  { to: "/profile", label: "プロフィール", icon: "👤" },
] as const;

export function TabBar() {
  return (
    <nav className="flex border-b border-border-light bg-white">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`
          }
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
