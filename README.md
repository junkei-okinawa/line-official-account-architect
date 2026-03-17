<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LINE Official Account Architect

AI 駆動の LINE 公式アカウント構築ツール。Google Gemini API を使用して、チャット画面で直感的に OA の設計から実装までサポートします。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/test_vitest-67f449?logo=vitest)](https://vitest.dev/)

## 🌟 特徴

- **AI 駆動の設計支援**: Gemini AI と対話して OA の構成を自動生成
- **リアルタイムプレビュー**: LINE メッセージの動作を確認可能
- **MCP サーバー統合**: リッチメニュー・メッセージ送信などの自動化対応
- **LIFF 認証**: LINE ID でログインし、ユーザー情報を取得

## 📋 機能一覧

### 基本機能

- [x] AI チャットインターフェース（Ctrl+Enter で送信）
- [x] LIFF 認証とプロフィール取得
- [x] Gemini API キー管理（LocalStorage 保存）
- [x] プロジェクト進行度表示
- [x] モバイルプレビューモード

### LINE OA 設計機能

- [ ] **リッチメニュー作成**
  - [x] AI による構成生成提案
  - [ ] JSON エディタと検証ツール
  - [ ] LIFF 経由での登録・更新
  - [ ] リッチメニュー一括操作
- [ ] **メッセージ送信テスト**
  - [x] テスト UI コンポーネント実装済み
  - [ ] Flex Message テンプレート生成
  - [ ] メッセージ履歴取得

## 🚀 クイックスタート

### 環境準備

1. Node.js 20+ をインストール

```bash
node --version
corepack enable
yarn --version
```

2. プロジェクトをクローン

```bash
git clone <your-repo-url>
cd line-official-account-architect
```

3. 依存関係をインストール

```bash
yarn install --immutable
```

### API キー設定

1. Google AI Studio から Gemini API キーを取得  
   [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. `.env.local` を作成（または既存ファイルを確認）

```bash
# 環境変数の設定例
GEMINI_API_KEY=your_gemini_api_key_here
```

3. ブラウザでアプリを実行

```bash
yarn dev
```

4. アプリが起動したら、[http://localhost:3000](http://localhost:3000) にアクセス

## 📱 リンク先

- [AI Studio App](https://ai.studio/apps/drive/1B77KftTqZUTf380pYSWM8M6GEcEbB-FF)
- [Google AI Studio](https://aistudio.google.com/app/apikey)

## 🛠️ 開発者向け

### ローカル実行

```bash
# 開発サーバー起動
yarn dev

# プロジェクトをビルド
yarn build

# テストを実行
yarn test

# TypeScript チェック
yarn type-check

# コードスタイルチェック（Prettier）
yarn lint

# コード自動整形
yarn lint:fix
```

### テスト

```bash
# ユニットテスト実行
yarn test

# カバレッジレポート生成
yarn test:coverage
```

## 📂 プロジェクト構造

```
line-official-account-architect/
├── App.tsx                    # メインアプリケーションコンポーネント
├── components/                # リアクティブコンポーネント
│   ├── ErrorBoundary.tsx     # エラーバウンダリー
│   ├── McpServerConfigPanel.tsx  # MCP サーバー設定パネル
│   ├── MessageSendTestUI.tsx      # メッセージ送信テスト UI
│   ├── MobilePreview.tsx        # モバイルプレビューコンポーネント
│   └── RichMenuControlPanel.tsx    # リッチメニュー管理パネル
├── services/                  # ビジネスロジック層
│   ├── geminiService.ts      # Gemini AI 連携サービス
│   └── mcpService.ts         # MCP サーバー通信サービス
├── src/__tests__/            # テストファイル
│   ├── components/           # コンポーネントテスト
│   └── services/             # サービス層テスト
├── docs/                     # ドキュメント
│   └── requirements.md       # 機能要件定義書
├── types.ts                  # TypeScript インターフェース定義
├── vite.config.ts            # Vite コンフィグレーション
├── tsconfig.json             # TypeScript コンパイラー設定
└── package.json              # プロジェクト依存関係
```

## 🔧 技術スタック

- **Frontend**: React 19, TypeScript, Vite
- **AI**: Google Gemini API (gemini-1.5-pro-latest)
- **Testing**: Vitest, Testing Library
- **Styling**: Tailwind CSS (クラスベース)
- **Icons**: Lucide React

## 🤝 貢献について

Issue や Pull Request をご自由に作成ください。

### コントリビューションガイド

1. ブランチを作成して変更をコミット (`git checkout -b feature/AmazingFeature`)
2. 変更をプッシュする (`git push origin feature/AmazingFeature`)
3. Pull Request を作成する

## 📄 ライセンス

MIT License - [LICENSE](LICENSE) を参照

<div align="center">
Made with ❤️ by LINE Developers
</div>
