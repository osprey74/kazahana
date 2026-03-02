import type { BotDefinition, BsafPost, FilterState } from "../types/bsaf";

interface SettingsPanelProps {
  botDef: BotDefinition;
  bsafEnabled: boolean;
  onToggleBsaf: (enabled: boolean) => void;
  filters: FilterState;
  onToggleFilter: (tag: string, value: string) => void;
  onSelectAll: (tag: string) => void;
  onClearAll: (tag: string) => void;
  bsafPosts: BsafPost[];
}

export function SettingsPanel({
  botDef,
  bsafEnabled,
  onToggleBsaf,
  filters,
  onToggleFilter,
  onSelectAll,
  onClearAll,
  bsafPosts,
}: SettingsPanelProps) {
  return (
    <div style={styles.panel}>
      {/* Bot info card */}
      <div style={styles.botCard}>
        <div style={styles.botAvatar}>🤖</div>
        <div style={styles.botInfo}>
          <div style={styles.botName}>{botDef.bot.name}</div>
          <div style={styles.botHandle}>@{botDef.bot.handle}</div>
          <div style={styles.botDesc}>{botDef.bot.description}</div>
        </div>
      </div>

      {/* BSAF toggle */}
      <div style={styles.section}>
        <div style={styles.toggleRow}>
          <div>
            <div style={styles.toggleLabel}>BSAFパース</div>
            <div style={styles.toggleDesc}>
              BSAF対応Botの投稿を構造化表示に変換
            </div>
          </div>
          <button
            onClick={() => onToggleBsaf(!bsafEnabled)}
            style={{
              ...styles.toggleBtn,
              backgroundColor: bsafEnabled ? "#0085FF" : "#D1D5DB",
            }}
          >
            <div
              style={{
                ...styles.toggleKnob,
                transform: bsafEnabled
                  ? "translateX(22px)"
                  : "translateX(2px)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Filter sections - only shown when BSAF is enabled */}
      {bsafEnabled && (
        <div
          style={{
            ...styles.filtersContainer,
            opacity: bsafEnabled ? 1 : 0.3,
            pointerEvents: bsafEnabled ? "auto" : "none",
          }}
        >
          <div style={styles.sectionTitle}>フィルタ設定</div>
          <div style={styles.sectionSubtitle}>
            Bot Definition JSON から自動生成
          </div>

          {botDef.filters.map((filter) => (
            <div key={filter.tag} style={styles.filterGroup}>
              <div style={styles.filterHeader}>
                <span style={styles.filterLabel}>{filter.label}</span>
                <span style={styles.filterTag}>tag: {filter.tag}</span>
                <div style={styles.filterActions}>
                  <button
                    onClick={() => onSelectAll(filter.tag)}
                    style={styles.actionBtn}
                  >
                    全選択
                  </button>
                  <button
                    onClick={() => onClearAll(filter.tag)}
                    style={styles.actionBtn}
                  >
                    全解除
                  </button>
                </div>
              </div>
              <div style={styles.optionsGrid}>
                {filter.options.map((option) => {
                  const isActive = filters[filter.tag]?.has(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        onToggleFilter(filter.tag, option.value)
                      }
                      style={{
                        ...styles.optionBtn,
                        backgroundColor: isActive
                          ? "rgba(0, 133, 255, 0.08)"
                          : "#FFFFFF",
                        borderColor: isActive
                          ? "#0085FF"
                          : "#E4E4E4",
                        color: isActive ? "#0085FF" : "#6B7280",
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raw BSAF post data */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>BSAF Bot 投稿のRAWデータ</div>
        <div style={styles.sectionSubtitle}>
          AT Protocol (app.bsky.feed.post) レコード形式
        </div>
        {bsafPosts.map((post) => (
          <div key={post.id} style={styles.jsonPreview}>
            <code style={styles.jsonCode}>
              {JSON.stringify(
                {
                  $type: "app.bsky.feed.post",
                  text: post.text,
                  createdAt: post.createdAt,
                  langs: post.langs,
                  tags: post.tags,
                },
                null,
                2
              )}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  botCard: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E4E4E4",
  },
  botAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0,
  },
  botInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  botName: {
    fontWeight: "700",
    fontSize: "15px",
    color: "#1A1A1A",
  },
  botHandle: {
    fontSize: "12px",
    color: "#9CA3AF",
  },
  botDesc: {
    fontSize: "12px",
    color: "#6B7280",
    marginTop: "4px",
  },
  section: {
    padding: "0",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E4E4E4",
  },
  toggleLabel: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#1A1A1A",
  },
  toggleDesc: {
    fontSize: "12px",
    color: "#6B7280",
    marginTop: "2px",
  },
  toggleBtn: {
    width: "48px",
    height: "26px",
    borderRadius: "13px",
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "background-color 0.2s ease",
    flexShrink: 0,
  },
  toggleKnob: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#FFF",
    transition: "transform 0.2s ease",
    position: "absolute",
    top: "2px",
  },
  filtersContainer: {
    transition: "opacity 0.3s ease",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: "13px",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "4px",
  },
  sectionSubtitle: {
    fontSize: "11px",
    color: "#9CA3AF",
    marginBottom: "12px",
  },
  filterGroup: {
    padding: "14px",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E4E4E4",
    marginBottom: "10px",
  },
  filterHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  filterLabel: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#1A1A1A",
  },
  filterTag: {
    fontSize: "11px",
    color: "#9CA3AF",
    fontFamily: "'JetBrains Mono', monospace",
    padding: "1px 6px",
    backgroundColor: "#F3F4F6",
    borderRadius: "4px",
  },
  filterActions: {
    marginLeft: "auto",
    display: "flex",
    gap: "6px",
  },
  actionBtn: {
    fontSize: "11px",
    color: "#6B7280",
    backgroundColor: "transparent",
    border: "1px solid #E4E4E4",
    borderRadius: "4px",
    padding: "2px 8px",
    cursor: "pointer",
  },
  optionsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  optionBtn: {
    fontSize: "12px",
    padding: "5px 12px",
    borderRadius: "6px",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: "500",
  },
  jsonPreview: {
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    padding: "12px",
    overflow: "auto",
    border: "1px solid #E4E4E4",
    marginTop: "8px",
  },
  jsonCode: {
    fontSize: "11px",
    lineHeight: "1.5",
    color: "#4B5563",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    whiteSpace: "pre",
  },
};
