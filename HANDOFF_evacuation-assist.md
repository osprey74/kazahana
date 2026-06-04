# HANDOFF: kazahana 避難誘導補助機能（お節介避難ナビ）

| 項目 | 内容 |
|:--|:--|
| 機能名（仮） | 避難誘導補助機能 / Evacuation Assist |
| 対象アプリ | kazahana モバイル版（iOS / Android） |
| 元設計書 | DESIGN_evacuation-assist.md |
| ステータス | HANDOFF（iOS 実装完了 / Android 未実装） |
| 作成日 | 2026-06-03 |
| iOS 完了日 | 2026-06-04（v3.2.0） |
| iOS リポジトリ | https://github.com/osprey74/kazahana-ios |
| 想定実装環境 | Claude Code |

> 本書は DESIGN_evacuation-assist.md を実装可能な単位に分解した指示書です。各フェーズは独立してコミット・テスト可能な粒度で構成しています。実装中の仕様変更は都度反映してください。

> **iOS 実装完了**: kazahana-ios で全 5 フェーズを実装し v3.2.0 で App Store 審査提出済み。以下の HANDOFF は Tauri v2 ベースの記述だが、Android（Kotlin / Jetpack Compose）実装時は iOS 実装 (`kazahana-ios/Documentation/HANDOFF-evacuation-assist.md`) も参照し、実装判断・データ形式・審査対応のノウハウを活用すること。

---

## 0. 前提と全体方針

### 0.1 設計思想（実装中も常に意識すること）

- **主体は人間、アプリは一助**。避難判断を代行する実装を入れないこと。自動避難判定・強制遷移は禁止。
- **お節介機能**。設定でオン／オフ可能な任意機能。デフォルトはオフとし、初回起動時に案内のみ行う。
- **先回り型の動線**。レベル3でバナー常駐、レベル4で動線が既に整っている状態を作る。即時プッシュには初期段階で依存しない。
- **オフライン耐性が最優先要件**。避難所データは端末同梱。通信途絶でもコンパス簡易ナビが動くこと。

### 0.2 扱う情報の性質（UI・文言で絶対に取り違えないこと）

- 本機能が扱うのは **気象庁の警報級・危険度情報（キキクル相当 / bsaf-kikikuru-bot）** であり、**自治体の避難指示そのものではない**。
- 文言で「避難指示が出ました」等の断定表現を使わないこと。「警報級の気象情報」「危険度情報」と表現する。

### 0.3 リポジトリ構成上の注意

- kazahana は Desktop / iOS / Android の3リポジトリ構成で、PLATFORM_MATRIX.md が単一の真実の源（SSOT）。本機能はモバイル限定機能のため、PLATFORM_MATRIX.md に「Desktop: 非対象 / iOS: 対象 / Android: 対象」を追記すること。
- 本機能の Issue・ラベルは集中管理側に登録する。

---

## 1. データモデル定義

### 1.1 避難所データ（同梱）

国土地理院 CSV から変換した GeoJSON または SQLite。最小フィールドは以下。

```typescript
interface Shelter {
  id: string;            // 共通ID（国土地理院）
  name: string;          // 施設・場所名
  lat: number;           // 緯度
  lng: number;           // 経度
  prefecture: string;    // 都道府県（jp-xxxx 形式に正規化）
  hazards: {             // 対応災害種別フラグ
    flood: boolean;          // 洪水
    landslide: boolean;      // 崖崩れ・土石流・地滑り
    stormSurge: boolean;     // 高潮
    earthquake: boolean;     // 地震
    tsunami: boolean;        // 津波
    fire: boolean;           // 大規模な火事
    inlandFlood: boolean;    // 内水氾濫
    volcano: boolean;        // 火山現象
  };
}
```

### 1.2 警報状態（バナー制御用）

```typescript
type AlertLevel = "level3" | "level4" | "level5";

interface ActiveAlert {
  type: string;          // BSAF type（heavy-rain-warning など）
  value: AlertLevel;     // BSAF value
  time: string;          // BSAF time（ISO8601, dedupe key の一部）
  target: string;        // BSAF target（jp-xxxx）
  receivedAt: number;    // 受信時刻（タイムアウト判定用 epoch ms）
}

interface BannerState {
  visible: boolean;
  highestLevel: AlertLevel | null;
  alerts: ActiveAlert[]; // 複数現象同時発令に対応
}
```

### 1.3 設定

```typescript
interface EvacuationSettings {
  enabled: boolean;            // 機能オン/オフ（デフォルト false）
  prefectureOverride: string | null; // 手動設定した都道府県（null なら測位で判定）
}
```

---

## 2. Phase 1：避難所データ変換・同梱＋設定トグル

### 2.1 タスク

1. **データ変換スクリプト作成**（`scripts/build-shelters.ts` など）
   - 国土地理院 CSV（全国版）を入力。
   - 1.1 の `Shelter` 形式へ変換し、GeoJSON もしくは SQLite を生成。
   - 都道府県名を `jp-xxxx` 形式に正規化（bsaf の target と突き合わせるため）。
   - 災害種別フラグを確実にマッピング（CSV の各列 → boolean）。
   - 出力サイズを確認（数MB目安。超過する場合はフィールド削減や分割を検討）。
2. **同梱**：生成データをアプリリソースとしてバンドル。オフライン読み込みを確認。
3. **設定トグル**：設定画面に「避難誘導機能をオンにする／しない」を追加。`EvacuationSettings.enabled` を永続化（デフォルト false）。
4. **初回案内**：機能の存在を初回のみ控えめに案内（オンを強制しない）。

### 2.2 受け入れ条件

- [ ] CSV から正しい件数・座標・災害種別フラグで変換される（ユニットテスト）
- [ ] 都道府県が `jp-xxxx` に正規化される（47都道府県すべて検証）
- [ ] オフライン状態でデータが読み込める
- [ ] 設定トグルが永続化され、デフォルト false

### 2.3 注意点

- 国土地理院データは「最新でない場合・未掲載施設あり」。出典と注記を表示する準備をしておく（文言は Phase 5 で確定）。

---

## 3. Phase 2：位置情報取得＋最寄り避難所表示＋OSナビ委譲

### 3.1 タスク

1. **Geolocation 導入**：Tauri v2 Geolocation Plugin を追加。
   - iOS: `Info.plist` に `NSLocationWhenInUseUsageDescription`。
   - Android: `AndroidManifest.xml` に `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`。
   - **バックグラウンド常時測位は実装しない**。フォアグラウンド・オンデマンド測位のみ。
2. **都道府県判定**：測位した緯度経度から都道府県を判定する関数。`prefectureOverride` が設定されていればそれを優先。
3. **最近傍探索**：`findNearestShelters(lat, lng, hazardFilter, limit)` を実装。
   - Haversine 距離で計算。
   - `hazardFilter` で災害種別に対応する施設のみ候補化（必須）。
   - 近い順に複数件返す（limit 件）。
4. **避難所詳細表示**：施設名・住所・対応災害種別・直線距離を表示する画面/コンポーネント。
5. **OSナビ委譲**：避難所の緯度経度を URI スキームで OS 地図に渡し徒歩ナビ起動。
   - iOS: `maps://?daddr=lat,lng&dirflg=w` 等。
   - Android: `google.navigation:q=lat,lng&mode=w` または `geo:` スキーム。

### 3.2 受け入れ条件

- [ ] 権限リクエストが iOS / Android 双方で正しく表示される
- [ ] 測位拒否時にクラッシュせず、手動都道府県設定にフォールバックできる
- [ ] `findNearestShelters` が災害種別フィルタを正しく適用する（ユニットテスト）
- [ ] Haversine 距離が既知の2点で正しい（ユニットテスト）
- [ ] OSナビが実機で起動する（iOS / Android）

### 3.3 注意点

- 災害種別フィルタを外すと「津波非対応施設を津波時に案内」等の事故が起きる。フィルタは省略不可。

---

## 4. Phase 3：BSAF購読・バナー状態遷移

### 4.1 タスク

1. **BSAF購読フィルタ**：kazahana 既存の BSAF 購読基盤を利用し、bsaf-kikikuru-bot の投稿から以下を抽出。
   - `source:jma` かつ bsaf-kikikuru-bot 由来。
   - `target` == 現在地都道府県。
   - `value` ∈ {`level3`, `level4`, `level5`}（必要に応じて警報級体系 `warning` / `special-warning` も対象に含めるか判断）。
2. **バナー状態管理**（`BannerState`）：
   - level3+ を検知 → `visible = true`、該当 alert を `alerts` に追加。
   - レベル昇格（level3 → level4）→ `highestLevel` 更新、バナー強調。
   - `cancelled`（同一 type+target）受信 → 該当 alert を除去。`alerts` が空なら `visible = false`。
3. **タイムアウト失効**：各 alert は `receivedAt` から一定時間（例: N 時間。要確定）経過で自動失効。`cancelled` 見逃し対策。
4. **複数現象表示**：`alerts` が複数のとき「複数の警報級情報」とまとめ表示 or 最高レベル現象を代表表示（UI ルールを実装）。
5. **バナーUI**：画面下部に常駐バナー。
   - level3: 控えめ。「⚠️ ○○県に警報級の気象情報。最寄り避難所を見る ＞」
   - level4/5: 強調。タップで Phase 2 の避難所詳細へ遷移。

### 4.2 dedupe / 状態遷移の正確性

- BSAF の重複排除キーは `type + value + time + target` の完全一致。これを尊重し、同一イベントの二重追加を防ぐ。
- 昇格・解除を取りこぼさないこと。特に「解除を見逃してバナーが残り続ける」事故を防ぐためタイムアウトは必須。

### 4.3 受け入れ条件

- [ ] 現在地都道府県以外の target でバナーが出ない
- [ ] level3 検知でバナー出現、level4 昇格で強調
- [ ] `cancelled` でバナーが消える
- [ ] タイムアウトで自動失効する（テストで時間モック）
- [ ] 複数現象同時発令で表示が破綻しない
- [ ] 機能オフ時は購読・バナーとも無効

### 4.4 遅延の扱い

- bsaf-kikikuru-bot は10分間隔ポーリング。最大10分超の遅延は許容（レベル3先回り表示のため）。即時性は本フェーズの要件外。

---

## 5. Phase 4：kazahana内簡易ナビ＋オフライン挙動

### 5.1 タスク

1. **方位角計算**：現在地と避難所座標から方位角（bearing）を計算。
2. **コンパス連携**：デバイス磁気センサ（Tauri 経由）で端末の向きを取得し、「避難所はこの方向」の矢印を表示。
3. **簡易ナビUI**：矢印（方向）＋直線距離をリアルタイム更新で表示。地図上のピン表示も。
4. **オフライン挙動**：
   - 通信途絶を検知した場合でも、同梱データ＋コンパスで簡易ナビが動作すること。
   - OSナビ委譲は通信前提のため、オフライン時は簡易ナビにフォールバックする導線を用意。

### 5.2 受け入れ条件

- [ ] 方位角計算が既知座標で正しい（ユニットテスト）
- [ ] コンパスが実機で動作し、矢印が端末の向きに追従する
- [ ] 機内モード（オフライン）で簡易ナビが動作する（実機確認）
- [ ] オフライン時に OSナビではなく簡易ナビへ誘導される

### 5.3 注意点

- 磁気センサのキャリブレーション不良時の表示（精度警告など）を考慮。

---

## 6. Phase 5：免責文言確定・ストア審査対応・（任意）push backend拡張

### 6.1 免責・文言（必須）

1. バナー近傍と設定画面に免責の一文を表示。
   - 例:「この情報は気象庁の危険度情報（警報級）に基づく補助です。避難の判断は自治体の避難指示や公式情報をご確認ください。」
2. 避難所データに国土地理院出典と「最新でない場合がある」注記。
3. 「自治体の避難指示そのものではない」性質の明示。
4. **専門家確認**：表示文言・免責・責任範囲をリリース前に専門家（弁護士、可能なら防災に明るい者）に通すこと。← この確認完了をリリース条件とする。

### 6.2 ストア審査

- 位置情報利用目的（最寄り避難所算出）を Privacy 説明に明記。
- 通知・災害関連機能の用途説明を準備。
- Michi-Navi の審査ノウハウを流用。

### 6.3 （任意・将来）push backend拡張

- 即時性を高める場合のみ。既存 kazahana push backend（Fly.io nrt + Bun + Hono）に以下を追加。
  - bsaf-kikikuru-bot のタグ監視。
  - level4+ かつ該当都道府県を購読するユーザーへ APNs/FCM プッシュ。
- 初期リリースには含めない（スコープ外）。アプリ側ポーリングで成立させる。

### 6.4 受け入れ条件

- [ ] 免責文言が表示される（バナー近傍・設定画面）
- [ ] 出典・注記が表示される
- [ ] 専門家確認が完了している（リリースゲート）
- [ ] ストア審査用の説明文が準備済み

---

## 7. 全体の受け入れ条件（リリース判定）

- [ ] Phase 1〜5 の各受け入れ条件をすべて満たす
- [ ] 機能オフ時、位置情報取得・購読・バナーがすべて無効であることを確認
- [ ] オフライン（機内モード）で「避難所データ閲覧＋最寄り探索＋簡易ナビ」が動作
- [ ] iOS / Android 実機での通し動作確認
- [ ] 免責・専門家確認が完了
- [ ] PLATFORM_MATRIX.md 更新（Desktop非対象 / iOS・Android対象）
- [ ] バージョン bump（位置情報・通知基盤追加のため minor〜major を判断）

---

## 8. テスト方針

| 種別 | 対象 |
|:--|:--|
| ユニット | CSV変換、都道府県正規化、Haversine距離、災害種別フィルタ、方位角計算、バナー状態遷移（昇格・解除・タイムアウト） |
| 結合 | BSAF購読→バナー表示→避難所詳細→ナビ委譲の一連フロー |
| 実機 | 位置情報権限、OSナビ起動、コンパス追従、オフライン簡易ナビ（iOS / Android） |
| 異常系 | 測位拒否、データ未該当、解除見逃し（タイムアウト）、複数現象同時 |

---

## 9. 実装順序の推奨

1. Phase 1（データ基盤・設定）→ 単体で価値が出る最小単位
2. Phase 2（測位・最寄り・OSナビ）→ 手動操作での避難所案内が成立
3. Phase 3（BSAF・バナー）→ 自動検知の動線が加わる
4. Phase 4（簡易ナビ・オフライン）→ オフライン耐性の最終防衛線
5. Phase 5（免責・審査）→ リリース準備

> Phase 1〜2 完了時点で「手動で最寄り避難所を調べてナビする」最小機能としてリリース可能。Phase 3 以降は段階的に上乗せできる構成です。

---

## 出典

| 情報 | URL |
|:--|:--|
| 国土地理院 指定緊急避難場所・指定避難所データ | https://www.gsi.go.jp/bousaichiri/hinanbasho.html |
| 同 データダウンロード | https://hinanmap.gsi.go.jp/index.html |
| bsaf-kikikuru-bot | https://github.com/osprey74/bsaf-kikikuru-bot |
| bsaf-jma-bot | https://github.com/osprey74/bsaf-jma-bot |
| BSAF Protocol | https://github.com/osprey74/bsaf-protocol |
| Tauri v2 Geolocation Plugin | https://v2.tauri.app/plugin/geolocation/ |
| 気象庁 防災情報XMLフィード | https://www.data.jma.go.jp/developer/xml/ |

---

## 10. iOS 実装からの申し送り事項（Android 向け）

### データ形式（iOS 実績）
- CSV → コンパクト JSON → **zlib 圧縮**（`shelters.zlib`、2.1MB）。`id` フィールドを除去し `hazards` を8ビットのビットマスクに圧縮することでサイズを大幅削減。
- 変換スクリプト `kazahana-ios/scripts/build-shelters.py` は iOS/Android 共用可。出力ファイルをそのまま Android の `assets/` に配置可能。
- Android 側: `java.util.zip.Inflater` で解凍 → `Gson` / `kotlinx.serialization` でパース。

### 設定プロパティ（iOS 実績）
- `evacuationEnabled: Boolean`（デフォルト false）
- `evacuationPrefectureOverride: String?`（null = 自動判定）
- `evacuationOnboardingShown: Boolean`（デフォルト false）
- Android: `SharedPreferences` または `DataStore` で永続化。

### Bot 定義 URL
- **正しい URL**: `https://raw.githubusercontent.com/osprey74/bsaf-kikikuru-bot/main/bsaf-bot.json`
- GitHub の `blob` URL ではなく `raw` URL を使用すること（iOS で初期実装時に誤って blob URL を使用し修正した経緯あり）。

### ストア審査（iOS で得たノウハウ）
- **デモモード**: `BuildConfig.DEBUG` ゲートではなく、設定画面のバージョン番号を5回タップで Release ビルドでもデモボタンを表示する方式を推奨。審査官がアラートバナー → 避難所一覧 → コンパスナビの一連フローを自分で操作できる。
- **審査ノート記載例**: 「Settings > App Info > tap version 5 times to enable demo mode. Use Demo buttons in Evacuation Assist section to simulate weather alerts.」
- **プライバシー**: 位置情報は「アプリの機能」用途として申告。バックグラウンド測位は行わない。

### オンボーディング
- 初回起動時に1回だけダイアログ表示（「避難誘導機能が利用できます。設定からいつでもオンにできます」）。
- 「あとで」ボタンのみ（設定への直接遷移は不要）。

### 免責文言（専門家確認済み・iOS と同一文言を使用）
- `evacuation.disclaimer`: 「避難誘導機能は気象庁発令の危険度情報に基づき、国土地理院 指定緊急避難場所のデータから最寄りの指定緊急避難場所を掲出、避難誘導をサポートする事を目的としています。避難の判断は自治体の避難指示や公式情報をご確認ください。」
- `evacuation.dataSource`: 「出典: 国土地理院 指定緊急避難場所データ」
- `evacuation.dataWarning`: 「データが最新でない場合や実際の避難場所と異なる場合があります。最新情報は自治体にご確認ください。」

### アラートタイムアウト
- iOS 実装: 6時間（`alertTimeoutInterval = 6 * 3600`）。
- 10分間隔で `expireStaleAlerts()` を実行 + フォアグラウンド復帰時にも即時チェック。

### Bluesky 公式アカウント
- `@kazahana.app`（旧 `@app-kazahana.bsky.social` から変更済み）。アプリ内の設定画面表示を更新すること。
