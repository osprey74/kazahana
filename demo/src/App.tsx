import { useState } from "react";
import { PostCard } from "./components/PostCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { useBsafFilter } from "./hooks/useBsafFilter";
import { jmaBotDefinition } from "./data/botDefinition";
import { mockPosts } from "./data/mockPosts";

type View = "timeline" | "settings";

export default function App() {
  const [view, setView] = useState<View>("timeline");
  const {
    bsafEnabled,
    setBsafEnabled,
    filters,
    filteredPosts,
    toggleFilter,
    selectAllFilter,
    clearAllFilter,
    getDuplicateCount,
  } = useBsafFilter(mockPosts, jmaBotDefinition);

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>❄</span>
            <span style={styles.logoText}>kazahana</span>
            <span style={styles.demoBadge}>BSAF Demo</span>
          </div>
          <div style={styles.headerInfo}>
            Bluesky Structured Alert Framework
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <button
            onClick={() => setView("timeline")}
            style={{
              ...styles.navBtn,
              ...(view === "timeline" ? styles.navBtnActive : {}),
            }}
          >
            <span>タイムライン</span>
          </button>
          <button
            onClick={() => setView("settings")}
            style={{
              ...styles.navBtn,
              ...(view === "settings" ? styles.navBtnActive : {}),
            }}
          >
            <span>BSAF設定</span>
          </button>

          {/* Status indicator */}
          <div style={styles.statusArea}>
            <div
              style={{
                ...styles.statusDot,
                backgroundColor: bsafEnabled ? "#0085FF" : "#D1D5DB",
              }}
            />
            <span style={styles.statusText}>
              {bsafEnabled ? "BSAF ON" : "BSAF OFF"}
            </span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main style={styles.main}>
        <div style={styles.content}>
          {view === "timeline" && (
            <div style={styles.timeline}>
              {/* Explanation banner */}
              <div style={styles.banner}>
                <div style={styles.bannerTitle}>
                  {bsafEnabled
                    ? "✨ BSAFパース有効 — Bot投稿が構造化表示されています"
                    : "📝 BSAFパース無効 — 全ての投稿が生テキストで表示されています"}
                </div>
                <div style={styles.bannerDesc}>
                  {bsafEnabled
                    ? "BSAF対応Botの投稿は、タグ情報に基づいて色分け・構造化された表示に変換されます。設定画面でフィルタを変更できます。"
                    : "設定画面からBSAFパースを有効にすると、BSAF対応Bot投稿の表示が変化します。"}
                </div>
              </div>

              {/* Posts */}
              <div style={styles.postList}>
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    bsafEnabled={bsafEnabled}
                    duplicateCount={getDuplicateCount(post.id)}
                  />
                ))}
              </div>

              {/* Stats */}
              <div style={styles.stats}>
                <span>
                  表示: {filteredPosts.length} / {mockPosts.length} 件
                </span>
                {bsafEnabled && (
                  <span>
                    （フィルタ適用中・重複折りたたみ済み）
                  </span>
                )}
              </div>
            </div>
          )}

          {view === "settings" && (
            <SettingsPanel
              botDef={jmaBotDefinition}
              bsafEnabled={bsafEnabled}
              onToggleBsaf={setBsafEnabled}
              filters={filters}
              onToggleFilter={toggleFilter}
              onSelectAll={selectAllFilter}
              onClearAll={clearAllFilter}
              bsafPosts={mockPosts.filter((p) => p.tags.includes("bsaf:v1"))}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span>
            kazahana BSAF Demo — BSAF Protocol v1
          </span>
          <span style={styles.footerLink}>
            github.com/osprey-dlt/kazahana
          </span>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    color: "#1A1A1A",
    fontFamily:
      "'Noto Sans JP', 'Hiragino Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E4E4E4",
    padding: "12px 0",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoIcon: {
    fontSize: "22px",
  },
  logoText: {
    fontWeight: "700",
    fontSize: "18px",
    letterSpacing: "-0.02em",
    color: "#1A1A1A",
  },
  demoBadge: {
    fontSize: "10px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "4px",
    backgroundColor: "rgba(0, 133, 255, 0.1)",
    color: "#0085FF",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  headerInfo: {
    fontSize: "11px",
    color: "#6B7280",
    letterSpacing: "0.02em",
  },
  nav: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E4E4E4",
  },
  navInner: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  navBtn: {
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#9CA3AF",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  navBtnActive: {
    color: "#1A1A1A",
    borderBottomColor: "#0085FF",
  },
  statusArea: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    transition: "background-color 0.2s ease",
  },
  statusText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "'JetBrains Mono', monospace",
  },
  main: {
    flex: 1,
    padding: "16px 0",
  },
  content: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "0 16px",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  banner: {
    padding: "14px 16px",
    backgroundColor: "#F9FAFB",
    borderRadius: "12px",
    border: "1px solid #E4E4E4",
  },
  bannerTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: "4px",
  },
  bannerDesc: {
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: "1.5",
  },
  postList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  stats: {
    textAlign: "center",
    fontSize: "12px",
    color: "#9CA3AF",
    padding: "10px 0",
  },
  footer: {
    borderTop: "1px solid #E4E4E4",
    padding: "16px 0",
    marginTop: "auto",
  },
  footerInner: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#9CA3AF",
  },
  footerLink: {
    color: "#6B7280",
  },
};
