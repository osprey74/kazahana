import type { BotDefinition } from "../types/bsaf";

export const jmaBotDefinition: BotDefinition = {
  bsaf_schema: "1.0",
  updated_at: "2026-02-24T00:00:00Z",
  self_url: "https://example.com/bsaf-jma-bot.json",

  bot: {
    handle: "jma-alert.bsky.social",
    did: "did:plc:demo-jma-bot",
    name: "防災情報Bot（非公式）",
    description: "気象庁の公開データに基づく防災情報",
    source: "気象庁 防災情報XML",
    source_url: "https://www.data.jma.go.jp/developer/xml/feed/",
  },

  filters: [
    {
      tag: "type",
      label: "情報種別",
      options: [
        { value: "earthquake", label: "地震" },
        { value: "tsunami", label: "津波" },
        { value: "eruption", label: "噴火" },
        { value: "ashfall", label: "降灰" },
        { value: "weather-warning", label: "気象警報" },
        { value: "special-warning", label: "特別警報" },
        { value: "landslide-warning", label: "土砂災害警戒" },
        { value: "tornado-warning", label: "竜巻注意" },
        { value: "heavy-rain", label: "記録的大雨" },
      ],
    },
    {
      tag: "value",
      label: "重み付け",
      options: [
        { value: "1", label: "震度1" },
        { value: "2", label: "震度2" },
        { value: "3", label: "震度3" },
        { value: "4", label: "震度4" },
        { value: "5-", label: "震度5弱" },
        { value: "5+", label: "震度5強" },
        { value: "6-", label: "震度6弱" },
        { value: "6+", label: "震度6強" },
        { value: "7", label: "震度7" },
        { value: "info", label: "情報" },
        { value: "advisory", label: "注意報" },
        { value: "warning", label: "警報" },
        { value: "severe-warning", label: "重大警報" },
        { value: "special-warning", label: "特別警報" },
      ],
    },
    {
      tag: "target",
      label: "地域",
      options: [
        { value: "jp-hokkaido", label: "北海道" },
        { value: "jp-tohoku", label: "東北" },
        { value: "jp-kanto", label: "関東" },
        { value: "jp-hokuriku", label: "北陸" },
        { value: "jp-chubu", label: "中部" },
        { value: "jp-kinki", label: "近畿" },
        { value: "jp-chugoku", label: "中国" },
        { value: "jp-shikoku", label: "四国" },
        { value: "jp-kyushu", label: "九州" },
        { value: "jp-okinawa", label: "沖縄" },
      ],
    },
  ],
};
