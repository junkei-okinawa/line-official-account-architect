# Leptos 移行実現可能性分析

**作成日**: 2026 年 3 月 20 日  
**対象プロジェクト**: LINE Official Account Architect (React + TypeScript)  
**結論**: ✅ **移行可能** - 高実現性

---

## 1. 現状のコードベース概要

### プロジェクト構造

```
/Users/junkei/Documents/line-official-account-architect/
├── App.tsx                    # メインコンポーネント (806 行)
├── index.tsx                  # エントリーポイント
├── components/                # UI コンポーネント群
│   ├── ErrorBoundary.tsx     # エラー境界処理
│   ├── McpServerConfigPanel.tsx  # MCP サーバー設定パネル (138 行)
│   ├── MessageSendTestUI.tsx    # メッセージ送信テスト UI (383 行)
│   ├── MobilePreview.tsx       # モバイルプレビュー (100 行)
│   └── RichMenuControlPanel.tsx # リッチメニュー管理パネル (331 行)
├── services/                  # API サービス層
│   ├── geminiService.ts      # Google Gemini API クライアント (160 行)
│   └── mcpService.ts         # WebSocket MCP コミュニケーション (254 行)
├── types.ts                   # TypeScript 型定義 (46 行)
├── index.css                  # Tailwind CSS 設定
└── package.json               # 依存関係
```

### 主要機能

- **チャット対話**: Gemini AI を使用した LINE OA 構築相談
- **基本設定**: アカウント名、説明文、あいさつメッセージの設定
- **リッチメニュー設計**: JSON 生成・編集・アップロード
- **MCP サーバー連携**: WebSocket 経由の LINE Messaging API 操作
- **プレビュー機能**: リアルタイムモバイル表示

---

## 2. 移行影響度分析

### 2.1 ステート管理パターン ✅ 低複雑性

**計数結果**: `useState` ~30 回、`useEffect` 2 回（App.tsx 限定）

| ファイル                 | Hooks 使用数               | 複雑性                                | レプトス移行影響 |
| ------------------------ | -------------------------- | ------------------------------------- | ---------------- |
| App.tsx                  | useState(15), useEffect(3) | Medium - センター化されたステート管理 | ⚠️ 中程度        |
| RichMenuControlPanel.tsx | useState(8)                | Low - ローカルコンポーネント状態      | ✅ 低            |
| McpServerConfigPanel.tsx | useState(3)                | Very low                              | ✅ 低            |
| MessageSendTestUI.tsx    | useState(7)                | Low-Medium                            | ⚠️ 中程度        |
| MobilePreview.tsx        | なし                       | Pure presentational                   | ✅ 低            |

**移行影響**: ✅ **LOW** - プロップドリリングパターン、Redux/Zustand なし。レプトスのリアクティブシステムで自然に処理可能。

---

### 2.2 コンポーネント構造 ⚠️ ミックスドパターン

```
App.tsx (806 行) - モノリシックだが論理的に分離されている:
├── ステート管理 (15 useState + 3 useEffect)
├── イベントハンドラ (handleSendMessage, handleLogin など)
├── レンダリングロジック (renderConfigStep スイッチ文句)
└── フルレイアウト実装 (サイドバー、メインコンテンツ、プレビューパネル)

子コンポーネント（良好に分離）:
- RichMenuControlPanel.tsx - 331 行、自己完結型
- McpServerConfigPanel.tsx - 138 行、プロップのみインターフェース
- MessageSendTestUI.tsx - 383 行、フォーム処理ロジック
- MobilePreview.tsx - 100 行、純粋な UI レンダリング
```

**移行影響**: ⚠️ **MEDIUM** - App.tsx は大規模だが論理的に分離されている。以下の分割を検討:

- `App.rs` (メインレイアウト)
- `ChatPanel.rs`, `ConfigPanel.rs`, `PreviewPanel.rs` を独立したモジュールとして

---

### 2.3 外部依存関係 ✅ ミニマル

```json
"dependencies": {
  "@google/genai": "^1.34.0",      // 外部 API クライアント (reqwest/axum で置換)
  "lucide-react": "^0.562.0",       // アイコンライブラリ (yew-icon や同等で置換)
  "react": "^19.2.3",               // コアフレームワーク
  "react-dom": "^19.2.3"            // DOM レンダラー
}
```

**移行影響**: ✅ **LOW** - 重い外部依存は `@google/genai` のみ。Rust HTTP クライアント (`reqwest`) で Gemini API コールを置換可能。

---

### 2.4 スタイリングアプローチ ✅ Tailwind CSS

- **主要**: Tailwind CSS via `index.css` (`@tailwind base/components/utilities`)
- **アイコン**: lucide-react インポートがコンポーネント全体に散在
- **なし**: styled-components、CSS modules、インラインスタイル（ユーティリティクラスのみ）

**移行影響**: ✅ **LOW** - Tailwind はレプトスと相性が良い。検討事項:

- `leptos-tailwind` インテグレーションを使用可能か確認
- あるいは Rust コンポーネント内の最小限の CSS でスタイリング

---

### 2.5 API インテグレーションパターン ⚠️ ミックスドアプローチ

```typescript
// 外部 API (geminiService.ts) - async/await パターン
const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({...});

// WebSocket ベース MCP (mcpService.ts) - クラス + async メソッド
class McpService {
  private ws: WebSocket | null;
  async connect(config: McpServerConfig): Promise<void> { ... }
  async richMenuOperation(action, data?): Promise<Result> { ... }
}

// axios なし - サービス層経由でネイティブ fetch パターン使用
```

**移行影響**: ⚠️ **MEDIUM** -

- Gemini API: `reqwest` crate で置換（async/await 互換）
- MCP WebSocket: Rust の `tokio::net::TcpStream` またはブラウザ用 `wasm-bindgen-futures` にポート可能

---

### 2.6 型定義 ✅ クリーンでシンプル

```typescript
// types.ts - 明確なインターフェース
interface Message { id, role, content, timestamp }
interface LineOASettings { accountName, description, channelId, ... }
interface McpServerConfig { serverUrl, channelToken, enabled }
enum Step { STRATEGY, CONFIG, RICH_MENU, MESSAGING, PREVIEW }
```

**移行影響**: ✅ **LOW** - シンプルな型は Rust struct/enum に直接マッピング可能。高度な TypeScript 機能（ジェネリクスなど）の複雑な使用なし。

---

### 2.7 テストセットアップ ✅ モダンスタック

- **フレームワーク**: Vitest (Jest なし)
- **DOM テスト**: @testing-library/react + happy-dom
- **カバレッジ**: @vitest/coverage-v8 設定済み
- **テストファイル**:
  - `src/__tests__/components/ErrorBoundary.test.tsx` (63 行)
  - `src/__tests__/services/mcpService.test.ts` (49 行)
  - `src/__tests__/services/geminiService.test.ts` (121 行)

**移行影響**: ⚠️ **MEDIUM** - React Testing Library から Leptos テストユーティリティへのテストスイート移行が必要。Happy-dom は Rust WASM と既に互換性あり。

---

## 3. 移行推奨事項

### ✅ 容易にポート可能

- コンポーネント構造（小規模で焦点を絞った子コンポーネント）
- TypeScript 型 → Rust struct/enum
- Tailwind CSS スタイリング
- シンプルなステート管理パターン

### ⚠️ 中程度の労力が必要

- App.tsx の複数モジュールへのリファクタリング
- サービス層の移行 (@google/genai → reqwest)
- WebSocket MCP サービス (tokio/wasm-bindgen)
- テストスイートの Leptos テストユーティリティへ

### 📋 移行優先順位

#### Phase 1: タイプとサービス（最優先）

```rust
// types.rs - Rust 型定義の作成
pub struct Message {
    pub id: String,
    pub role: Role, // enum
    pub content: String,
    pub timestamp: DateTime<Utc>,
}

pub struct LineOASettings {
    pub account_name: String,
    pub description: String,
    pub channel_id: String,
    pub channel_secret: String,
    pub channel_access_token: String,
    pub greeting_message: String,
    pub rich_menu_json: Option<String>,
}

pub enum Step {
    Strategy,
    Config,
    RichMenu,
    Messaging,
    Preview,
}
```

#### Phase 2: サービス層移行

- `geminiService.ts` → `gemini_service.rs` (reqwest crate)
- `mcpService.ts` → `mcp_service.rs` (tokio/wasm-bindgen)

#### Phase 3: コンポーネントポート

1. **MobilePreview.rs** - シンプルなコンポーネントで移行アプローチを検証
2. **McpServerConfigPanel.rs** - フォーム処理の基本的なパターン
3. **RichMenuControlPanel.rs** - 複雑な状態管理パターン
4. **MessageSendTestUI.rs** - テストフォームロジック

#### Phase 4: メインアプリケーションリファクタリング

- `App.tsx` → `app.rs` + パネルコンポーネントの分割
- レイアウト構造のレプトス互換への変換

#### Phase 5: スタイリングとテスト

- Tailwind CSS のレプトス設定確認
- テストスイートの移行（happy-dom はそのまま使用可能）

---

## 4. 技術的考慮事項

### 4.1 レクトスプロジェクトセットアップ

```bash
# プロジェクト作成
cargo leptos new line-oa-architect --template server-wasm

cd line-oa-architect

# Tailwind CSS インストール（レプトス互換）
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Cargo.toml への追加依存関係
[dependencies]
leptos = "0.7"
leptos_router = "0.7"
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["full"] }
wasm-bindgen-futures = "0.4"

[dev-dependencies]
happy-dom = "0"
```

### 4.2 レクトスコンポーネントパターン例

```rust
// App.rs - メインアプリケーション
#[component]
pub fn App() -> impl IntoView {
    // リアクティブなステート管理（レプトス信号）
    let messages = create_signal(Vec::<Message>::new());

    view! {
        <div class="app-container">
            <Sidebar>
                <!-- ナビゲーション -->
            </Sidebar>

            <MainContent>
                <ChatPanel messages={messages.0} />
                <ConfigPanel />
                <PreviewPanel />
            </MainContent>
        </div>
    }
}

// ChatPanel.rs - チャットパネルコンポーネント
#[component]
pub fn ChatPanel(messages: ReadSignal<Vec<Message>>) -> impl IntoView {
    let add_message = move |_| {
        // メッセージ追加ロジック
    };

    view! {
        <div class="chat-panel">
            <MessagesList messages={messages} />
            <MessageInput on_send={add_message} />
        </div>
    }
}
```

### 4.3 API サービス移行例

```rust
// gemini_service.rs - Google Gemini API クライアント
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct GeminiResponse {
    pub text: String,
}

pub async fn chat_with_gemini(
    messages: &[Message],
    settings: &LineOASettings,
    api_key: &str,
) -> Result<String, ApiError> {
    let client = Client::new();

    // Gemini API への HTTP リクエスト（reqwest で実装）
    let response = client.post()
        .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request_body)
        .send()
        .await?;

    let gemini_response: GeminiResponse = response.json().await?;
    Ok(gemini_response.text)
}
```

---

## 5. 移行コスト見積もり

### 推定開発期間：2-3 週間（1 名）

| フェーズ | 作業内容                                             | 想定日数 |
| -------- | ---------------------------------------------------- | -------- |
| Phase 1  | タイプ定義、サービス層の Rust 実装                   | 3-4 日   |
| Phase 2  | MobilePreview, McpServerConfigPanel のポート         | 3-4 日   |
| Phase 3  | RichMenuControlPanel, MessageSendTestUI のポート     | 4-5 日   |
| Phase 4  | App.tsx リファクタリング、メインアプリケーション構築 | 4-5 日   |
| Phase 5  | テスト移行、デバッグ、最適化                         | 3-4 日   |

### リスク要因

1. **レプトスバージョン**: v0.7+ の最新機能を確認（v0.6 との互換性）
2. **Tailwind CSS インテグレーション**: レクトスとの公式サポート状況確認が必要
3. **WebSocket ブラウザ対応**: wasm-bindgen-futures の制限事項に注意

---

## 6. 結論

### ✅ 移行可能 - 高実現性

このコードベースは、明確な分離と最小限の複雑なパターンを持つため、レプトスへの移行に適しています。

**移行推奨度**: ⭐⭐⭐⭐☆ (4/5)  
**技術的障壁**: 低〜中程度  
**推定労力**: 2-3 週間（1 名）

### 次のステップ

1. **App.tsx 構造のレビュー** - `App.rs`, `ChatPanel.rs`, `ConfigPanel.rs` への分割を検討
2. **タイプ定義を最初にポート** - `types.rs` に Rust 対応物を作成
3. **サービス層を移行** - geminiService から reqwest crate を使用して開始
4. **レプトスプロジェクトを設定** - `cargo leptos new` で作成し、Tailwind CSS と統合
5. **MobilePreview からポート** - シンプルなコンポーネントで移行アプローチを検証

---

## 7. 参考リソース

### レクトス公式ドキュメント

- [Getting Started](https://leptos.dev/getting_started/)
- [Component Model](https://leptos.dev/guide/components)
- [Server-Side Rendering](https://leptos.dev/guide/ssr)
- [Routing](https://leptos.dev/guide/routing)

### 関連ライブラリ

- `reqwest` - HTTP クライアント（Gemini API 用）
- `tokio` - アシンクランタイム（MCP WebSocket 用）
- `wasm-bindgen-futures` - ブラウザ用アシンクサポート
- `happy-dom` - テスト環境（React Testing Library と互換性あり）

---

---

## 8. 詳細アーキテクチャ分析結果

### ステート管理パターン

- **useState 使用頻度**: 全コンポーネントにわたって広範な使用 (RichMenuControlPanel.tsx:12+ hooks, McpServerConfigPanel.tsx:3 hooks)
- **useEffect パターン**: WebSocket 接続状態同期用 (mcpService.ts:46-52)
- **カスタムフック**: なし - すべてのロジックはインラインまたはサービスクラス内

### コンポーネント構造

```
components/
├── App.tsx (806 lines) - メインコンテナ、チャット/設定/プレビュータブ
├── RichMenuControlPanel.tsx (331 lines) - MCP リッチメニュー操作
├── McpServerConfigPanel.tsx (138 lines) - WebSocket 設定 UI
├── MessageSendTestUI.tsx (383 lines) - メッセージテストインターフェース
├── MobilePreview.tsx (100 lines) - チャットプレビューコンポーネント
└── ErrorBoundary.tsx (109 lines) - クラスベースのエラー処理
```

### 外部依存関係

- **@google/genai**: Rust ワASM/FFI バインディングで代替可能
- **lucide-react**: leptos_icons または SVG コンポーネントに置換必要
- **react/react-dom**: Leptos 用削除必須

### スタイリングアプローチ

- **100% Tailwind CSS ユーティリティクラス** (例：`className="bg-white rounded-xl shadow-lg p-6"`)
- スタイルドコンポーネントまたはインラインスタイルなし
- index.css にカスタムアニメーション定義

### API インテグレーションパターン

- **WebSocket MCP サービス**: async/await パターン、メッセージキュー実装 (mcpService.ts:9-15)
- **HTTP クライアント**: @google/genai を介したネイティブ fetch 使用、axios なし
- **エラー処理**: カスタムエラークラス (GeminiError)、try-catch 内蔵

### TypeScript 型定義

- シンプルなインターフェース、プリミティブ型のみ
- 高度なジェネリクスまたは複雑な型機能なし
- ユニオン型とオプションフィールド使用

### テストセットアップ

- **Vitest + happy-dom**: Leptos と互換性あり
- **@testing-library/react**: Leptos テストユーティリティに置換必要
- **テストファイル**: mcpService.test.ts (49 行), ErrorBoundary.test.tsx (63 行), geminiService.test.ts (121 行)

---

## 9. 移行推奨ワークフロー

### Phase 1: サービス層と型定義（最優先）

```rust
// types.rs - Rust 型定義の作成
pub struct Message {
    pub id: String,
    pub role: Role, // enum
    pub content: String,
    pub timestamp: DateTime<Utc>,
}

pub struct LineOASettings {
    pub account_name: String,
    pub description: String,
    pub channel_id: String,
    pub channel_secret: String,
    pub channel_access_token: String,
    pub greeting_message: String,
    pub rich_menu_json: Option<String>,
}

pub enum Step {
    Strategy,
    Config,
    RichMenu,
    Messaging,
    Preview,
}
```

### Phase 2: サービス層移行

- `geminiService.ts` → `gemini_service.rs` (reqwest crate)
- `mcpService.ts` → `mcp_service.rs` (tokio/wasm-bindgen)

### Phase 3: コンポーネントポート

1. **MobilePreview.rs** - シンプルなコンポーネントで移行アプローチを検証
2. **McpServerConfigPanel.rs** - フォーム処理の基本的なパターン
3. **RichMenuControlPanel.rs** - 複雑な状態管理パターン
4. **MessageSendTestUI.rs** - テストフォームロジック

### Phase 4: メインアプリケーションリファクタリング

- `App.tsx` → `app.rs` + パネルコンポーネントの分割
- レイアウト構造のレプトス互換への変換

### Phase 5: スタイリングとテスト

- Tailwind CSS のレプトス設定確認
- テストスイートの移行（happy-dom はそのまま使用可能）

---

## 10. 移行コスト見積もり

| フェーズ | 作業内容                                             | 想定日数 |
| -------- | ---------------------------------------------------- | -------- |
| Phase 1  | タイプ定義、サービス層の Rust 実装                   | 3-4 日   |
| Phase 2  | MobilePreview, McpServerConfigPanel のポート         | 3-4 日   |
| Phase 3  | RichMenuControlPanel, MessageSendTestUI のポート     | 4-5 日   |
| Phase 4  | App.tsx リファクタリング、メインアプリケーション構築 | 4-5 日   |
| Phase 5  | テスト移行、デバッグ、最適化                         | 3-4 日   |

---

## 11. 結論と次のステップ

### ✅ 移行可能 - 高実現性

このコードベースは、明確な分離と最小限の複雑なパターンを持つため、レプトスへの移行に適しています。

**移行推奨度**: ⭐⭐⭐⭐☆ (4/5)  
**技術的障壁**: 低〜中程度  
**推定労力**: 2-3 週間（1 名）

### 直後のアクション

1. **Feature ブランチ作成完了** - `feat/migrate-to-leptos` に切り替え済み
2. **移行計画保存完了** - docs/leptos-migration-plan.md に詳細記録
3. **Phase 1 開始準備** - types.rs の Rust 実装から着手

### 次のステップ

1. **App.tsx 構造のレビュー** - `App.rs`, `ChatPanel.rs`, `ConfigPanel.rs` への分割を検討
2. **タイプ定義を最初にポート** - `types.rs` に Rust 対応物を作成
3. **サービス層を移行** - geminiService から reqwest crate を使用して開始
4. **レプトスプロジェクトを設定** - `cargo leptos new` で作成し、Tailwind CSS と統合
5. **MobilePreview からポート** - シンプルなコンポーネントで移行アプローチを検証

---

## 12. 参考リソース

### レクトス公式ドキュメント

- [Getting Started](https://leptos.dev/getting_started/)
- [Component Model](https://leptos.dev/guide/components)
- [Server-Side Rendering](https://leptos.dev/guide/ssr)
- [Routing](https://leptos.dev/guide/routing)

### 関連ライブラリ

- `reqwest` - HTTP クライアント（Gemini API 用）
- `tokio` - アシンクランタイム（MCP WebSocket 用）
- `wasm-bindgen-futures` - ブラウザ用アシンクサポート
- `happy-dom` - テスト環境（React Testing Library と互換性あり）

---

**作成者**: Sisyphus  
**最終更新**: 2026 年 3 月 20 日

---

## 13. 移行進捗状況（2026 年 3 月 20 日）

### ✅ Phase 1: タイプ定義とプロジェクト構造 - **完了**

- [x] `src/types.rs` 作成 - TypeScript 型定義の Rust 実装
- [x] `Cargo.toml` 設定 - Leptos 0.7, chrono, serde 依存関係追加
- [x] `src/lib.rs` モジュール構造作成
- [x] ユニットテスト 7 つの実装とパス確認

**コミット履歴:**
```
564d9ce fix: types.rs のテストアサーション修正
8ff3b15 build: 初期 Rust プロジェクト構造を作成
290ff69 feat: 移行 Phase 1 - Rust 型定義を作成
```

### 🔄 Phase 2: サービス層移行 - **進行中**

- [ ] `gemini_service.rs` - reqwest クライアント実装
- [ ] `mcp_service.rs` - tokio WebSocket 実装

### ⏳ Phase 3-5: コンポーネントポート、リファクタリング、テスト移行

---

## 14. 次のステップ

1. **geminiService.ts → gemini_service.rs**
   - @google/genai API コールを reqwest に置換
   - async/await パターン維持
   
2. **mcpService.ts → mcp_service.rs**
   - WebSocket 接続を tokio::net::TcpStream に移行
   - wasm-bindgen-futures ブラウザ対応

3. **MobilePreview.rs ポート**
   - シンプルなコンポーネントでレプトス rsx! マクロ習得
