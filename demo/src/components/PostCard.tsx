import type { BsafPost } from "../types/bsaf";
import { getSeverityColor } from "../utils/bsafParser";

interface PostCardProps {
  post: BsafPost;
  bsafEnabled: boolean;
  duplicateCount: number;
}

export function PostCard({ post, bsafEnabled, duplicateCount }: PostCardProps) {
  const timeStr = new Date(post.createdAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });

  const showDuplicate = bsafEnabled && duplicateCount > 0;
  const isBsaf = bsafEnabled && !!post.bsaf;
  const borderColor = isBsaf ? getSeverityColor(post.bsaf!.value).border : undefined;

  return (
    <div style={{
      ...styles.card,
      ...(borderColor ? { borderLeft: `5px solid ${borderColor}` } : {}),
    }}>
      <div style={styles.header}>
        <div style={styles.avatar}>
          {post.author.displayName.charAt(0)}
        </div>
        <div style={styles.authorInfo}>
          <span style={styles.displayName}>{post.author.displayName}</span>
          <span style={styles.handle}>@{post.author.handle}</span>
        </div>
        <span style={styles.time}>{timeStr}</span>
      </div>
      <div style={styles.body}>
        {post.text.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < post.text.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
      {showDuplicate && (
        <div style={styles.duplicateRow}>
          <span style={styles.duplicateIcon}>&#xE14D;</span>
          <span style={styles.duplicateText}>
            他{duplicateCount}件のBotが同じイベントを報告しています
          </span>
        </div>
      )}
      {post.tags.length > 0 && (
        <>
          <div style={styles.divider} />
          <div style={styles.tags}>
            {post.tags.map((tag, i) => (
              <span key={i} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: "12px 16px",
    borderBottom: "1px solid #E4E4E4",
    transition: "background-color 0.15s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "600",
    color: "#6B7280",
    flexShrink: 0,
  },
  authorInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#1A1A1A",
  },
  handle: {
    fontSize: "12px",
    color: "#9CA3AF",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  time: {
    fontSize: "12px",
    color: "#9CA3AF",
    flexShrink: 0,
  },
  body: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#1A1A1A",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  duplicateRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "6px",
  },
  duplicateIcon: {
    fontFamily: "'Material Symbols Outlined', sans-serif",
    fontSize: "12px",
    color: "#9CA3AF",
  },
  duplicateText: {
    fontSize: "11px",
    color: "#9CA3AF",
  },
  divider: {
    borderTop: "1px solid #666",
    marginTop: "8px",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "8px",
  },
  tag: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "4px",
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
};
