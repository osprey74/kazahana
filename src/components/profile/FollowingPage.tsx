import { useState, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FollowingList } from "./FollowingList";
import { Icon } from "../common/Icon";

export function FollowingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handle } = useParams<{ handle: string }>();
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setScrollParent(document.querySelector("main"));
  }, []);

  if (!handle) return null;

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-light dark:text-text-dark hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
        >
          <Icon name="arrow_back" size={20} />
          <span className="text-sm font-bold">{t("profile.followingTitle", { name: `@${handle}` })}</span>
        </button>
      </div>
      <FollowingList handle={handle} scrollParent={scrollParent} />
    </div>
  );
}
