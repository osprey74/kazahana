import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSavedFeeds, useMyLists } from "../../hooks/useMyFeeds";
import { useFeedStore } from "../../stores/feedStore";
import { Icon } from "../common/Icon";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface FeedItem {
  uri: string;
  name: string;
  type: "custom" | "list";
  pinned?: boolean;
}

function SortableFeedRow({
  feed,
  isHidden,
  onToggle,
  t,
}: {
  feed: FeedItem;
  isHidden: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feed.uri });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-1.5 ${isHidden ? "opacity-60" : ""} ${isDragging ? "opacity-80 bg-gray-50 dark:bg-gray-800 rounded z-10 relative" : ""}`}
    >
      <button
        type="button"
        className="touch-none p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <Icon name="drag_handle" size={18} />
      </button>
      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
        <input
          type="checkbox"
          checked={!isHidden}
          onChange={onToggle}
          className="w-4 h-4 rounded accent-primary flex-shrink-0"
        />
        <span className="text-sm text-text-light dark:text-text-dark truncate">{feed.name}</span>
        {feed.pinned && (
          <Icon name="push_pin" size={12} className="text-gray-400 flex-shrink-0" />
        )}
        <span className="text-[10px] text-gray-400 flex-shrink-0">
          {feed.type === "custom" ? t("feed.feeds") : t("feed.lists")}
        </span>
      </label>
    </div>
  );
}

export function FeedVisibilityView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hiddenFeeds, toggleFeedVisibility, feedOrder, setFeedOrder, showAllInQuickJump, setShowAllInQuickJump } = useFeedStore();
  const { data: savedFeeds, isLoading: feedsLoading } = useSavedFeeds();
  const { data: myLists, isLoading: listsLoading } = useMyLists();

  const isLoading = feedsLoading || listsLoading;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  // Build a single ordered list: visible feeds (ordered) first, then hidden feeds
  const allFeeds = useMemo(() => {
    const items: FeedItem[] = [];
    if (savedFeeds) {
      for (const f of savedFeeds) {
        items.push({ uri: f.uri, name: f.name, type: "custom", pinned: f.pinned });
      }
    }
    if (myLists) {
      for (const l of myLists) {
        items.push({ uri: l.uri, name: l.name, type: "list" });
      }
    }
    // Sort by feedOrder within each group
    if (feedOrder.length > 0) {
      items.sort((a, b) => {
        const ai = feedOrder.indexOf(a.uri);
        const bi = feedOrder.indexOf(b.uri);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }
    // Partition: visible first, hidden last
    const visible = items.filter((f) => !hiddenFeeds.includes(f.uri));
    const hidden = items.filter((f) => hiddenFeeds.includes(f.uri));
    return [...visible, ...hidden];
  }, [savedFeeds, myLists, feedOrder, hiddenFeeds]);

  const visibleFeeds = useMemo(() => allFeeds.filter((f) => !hiddenFeeds.includes(f.uri)), [allFeeds, hiddenFeeds]);
  const hiddenFeedItems = useMemo(() => allFeeds.filter((f) => hiddenFeeds.includes(f.uri)), [allFeeds, hiddenFeeds]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeUri = active.id as string;
    const overUri = over.id as string;

    // Determine which group both belong to
    const activeIsHidden = hiddenFeeds.includes(activeUri);
    const overIsHidden = hiddenFeeds.includes(overUri);

    // Only allow reorder within the same group
    if (activeIsHidden !== overIsHidden) return;

    const group = activeIsHidden ? hiddenFeedItems : visibleFeeds;
    const oldIndex = group.findIndex((f) => f.uri === activeUri);
    const newIndex = group.findIndex((f) => f.uri === overUri);
    if (oldIndex === -1 || newIndex === -1) return;

    // Build new full order: reorder within the group, keep other group as-is
    const reordered = [...group];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const newOrder = activeIsHidden
      ? [...visibleFeeds.map((f) => f.uri), ...reordered.map((f) => f.uri)]
      : [...reordered.map((f) => f.uri), ...hiddenFeedItems.map((f) => f.uri)];

    setFeedOrder(newOrder);
  };

  return (
    <div>
      <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-primary hover:underline"
          >
            <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
          </button>
          <h2 className="text-sm font-bold text-text-light dark:text-text-dark">{t("settings.feedVisibility")}</h2>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="px-4 py-3">
          {/* Quick jump dropdown option */}
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={showAllInQuickJump}
              onChange={(e) => setShowAllInQuickJump(e.target.checked)}
              className="w-4 h-4 rounded accent-primary flex-shrink-0"
            />
            <span className="text-sm text-text-light dark:text-text-dark">{t("settings.showAllInQuickJump")}</span>
          </label>

          <hr className="border-border-light dark:border-border-dark my-3" />

          {allFeeds.length > 0 ? (
            <>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">{t("settings.feedOrderHint")}</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* Visible feeds */}
                <SortableContext items={visibleFeeds.map((f) => f.uri)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {visibleFeeds.map((feed) => (
                      <SortableFeedRow
                        key={feed.uri}
                        feed={feed}
                        isHidden={false}
                        onToggle={() => toggleFeedVisibility(feed.uri)}
                        t={t}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Hidden feeds */}
                {hiddenFeedItems.length > 0 && (
                  <>
                    <div className="border-t border-border-light dark:border-border-dark my-2 pt-1">
                      <span className="text-[11px] text-gray-400">{t("settings.hiddenFeedsLabel")}</span>
                    </div>
                    <SortableContext items={hiddenFeedItems.map((f) => f.uri)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1">
                        {hiddenFeedItems.map((feed) => (
                          <SortableFeedRow
                            key={feed.uri}
                            feed={feed}
                            isHidden={true}
                            onToggle={() => toggleFeedVisibility(feed.uri)}
                            t={t}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </>
                )}
              </DndContext>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm">{t("settings.noFeeds")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
