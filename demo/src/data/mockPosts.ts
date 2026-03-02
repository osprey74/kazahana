import type { BsafPost } from "../types/bsaf";

const jmaBot = {
  handle: "jma-alert.bsky.social",
  displayName: "防災情報Bot（非公式）",
  avatar: undefined,
};

const secondBot = {
  handle: "disaster-jp.bsky.social",
  displayName: "日本災害速報Bot",
  avatar: undefined,
};

const normalUser = {
  handle: "tanaka-taro.bsky.social",
  displayName: "田中太郎",
  avatar: undefined,
};

export const mockPosts: BsafPost[] = [
  // --- Normal user post (non-BSAF) ---
  {
    id: "post-normal-1",
    text: "今日はいい天気ですね☀️ 洗濯日和です。",
    tags: [],
    langs: ["ja"],
    createdAt: "2026-03-02T01:30:00Z",
    author: normalUser,
  },

  // --- BSAF: Earthquake (severe) ---
  {
    id: "post-eq-1",
    text: "🔴 地震情報\n3月2日 10:23 — 茨城県南部\nM5.2（深さ約50km）\n最大震度：5強\n津波の心配なし\n(情報源: 気象庁)",
    tags: [
      "bsaf:v1",
      "type:earthquake",
      "value:5+",
      "time:2026-03-02T01:23:00Z",
      "target:jp-kanto",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T01:25:54Z",
    author: jmaBot,
  },

  // --- BSAF: Same earthquake from second bot (duplicate) ---
  {
    id: "post-eq-1-dup",
    text: "【地震速報】茨城県南部で震度5強（M5.2）\n発生: 2026/03/02 10:23 JST\n深さ: 約50km\n津波の心配なし\n出典: 気象庁",
    tags: [
      "bsaf:v1",
      "type:earthquake",
      "value:5+",
      "time:2026-03-02T01:23:00Z",
      "target:jp-kanto",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T01:26:30Z",
    author: secondBot,
  },

  // --- Normal user post ---
  {
    id: "post-normal-2",
    text: "地震すごかった！棚の上の物が落ちてきた…みなさん大丈夫ですか？",
    tags: [],
    langs: ["ja"],
    createdAt: "2026-03-02T01:28:00Z",
    author: normalUser,
  },

  // --- BSAF: Tsunami advisory ---
  {
    id: "post-tsunami-1",
    text: "🟡 津波注意報\n3月2日 10:30 発表\n対象: 茨城県・千葉県九十九里沿岸\n予想高さ: 0.5m\n(情報源: 気象庁)",
    tags: [
      "bsaf:v1",
      "type:tsunami",
      "value:advisory",
      "time:2026-03-02T01:30:00Z",
      "target:jp-kanto",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T01:32:00Z",
    author: jmaBot,
  },

  // --- BSAF: Earthquake (minor, different region) ---
  {
    id: "post-eq-2",
    text: "🟢 地震情報\n3月2日 11:45 — 宮城県沖\nM3.8（深さ約60km）\n最大震度：2\n津波の心配なし\n(情報源: 気象庁)",
    tags: [
      "bsaf:v1",
      "type:earthquake",
      "value:2",
      "time:2026-03-02T02:45:00Z",
      "target:jp-tohoku",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T02:47:12Z",
    author: jmaBot,
  },

  // --- BSAF: Weather warning ---
  {
    id: "post-weather-1",
    text: "🟠 大雨警報\n3月2日 12:00 発表\n対象: 静岡県中部・西部\n24時間予想雨量: 200mm\n土砂災害に警戒\n(情報源: 気象庁)",
    tags: [
      "bsaf:v1",
      "type:weather-warning",
      "value:warning",
      "time:2026-03-02T03:00:00Z",
      "target:jp-chubu",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T03:02:30Z",
    author: jmaBot,
  },

  // --- Normal user post ---
  {
    id: "post-normal-3",
    text: "お昼ご飯はカレーにしました🍛 最近ハマってるスパイスカレーのレシピ、今度シェアしますね。",
    tags: [],
    langs: ["ja"],
    createdAt: "2026-03-02T03:15:00Z",
    author: normalUser,
  },

  // --- BSAF: Special warning (critical) ---
  {
    id: "post-special-1",
    text: "🟣 特別警報\n3月2日 14:00 発表\n大雨特別警報: 鹿児島県（奄美地方）\n重大な災害の危険性が著しく高まっています\nただちに命を守る行動をとってください\n(情報源: 気象庁)",
    tags: [
      "bsaf:v1",
      "type:special-warning",
      "value:special-warning",
      "time:2026-03-02T05:00:00Z",
      "target:jp-kyushu",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T05:01:15Z",
    author: jmaBot,
  },

  // --- BSAF: Eruption ---
  {
    id: "post-eruption-1",
    text: "🔴 噴火速報\n3月2日 15:30 — 桜島（昭和火口）\n噴煙高度: 3000m\n大きな噴石: 火口から1.3km\n(情報源: 気象庁)",
    tags: [
      "bsaf:v1",
      "type:eruption",
      "value:warning",
      "time:2026-03-02T06:30:00Z",
      "target:jp-kyushu",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T06:32:45Z",
    author: jmaBot,
  },

  // --- BSAF: Earthquake (moderate, Hokkaido) ---
  {
    id: "post-eq-3",
    text: "🟡 地震情報\n3月2日 16:10 — 十勝地方南部\nM4.5（深さ約30km）\n最大震度：4\n津波の心配なし\n(情報源: 気象庁)",
    tags: [
      "bsaf:v1",
      "type:earthquake",
      "value:4",
      "time:2026-03-02T07:10:00Z",
      "target:jp-hokkaido",
      "source:jma",
    ],
    langs: ["ja"],
    createdAt: "2026-03-02T07:12:00Z",
    author: jmaBot,
  },
];
