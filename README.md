# LINE Official Account Architect

LINE公式アカウント向けの運用支援を想定したフロントエンドツールです。メッセージ送信のテストや、リッチメニューのJSON生成・登録などを行うためのUIを提供します。

## できること

- MCP サーバー設定の管理
- メッセージ送信テスト
- リッチメニューの JSON 生成、画像アップロード、ユーザー登録

## 必要要件

- Node.js 20+
- Yarn Berry (corepack)

## セットアップ

```bash
corepack enable
corepack prepare yarn@stable --activate

yarn install --immutable
```

## 開発

```bash
yarn dev
```

## テスト

```bash
yarn test
yarn test:run
yarn test:coverage
```

## Lint / Format

```bash
yarn lint
yarn lint:fix
```

## Yarn ポリシー

- Yarn Berry + PnP を使用します（`node_modules` は使いません）
- ゼロインストールは採用しません（`.yarn/cache` はコミットしません）
- `.pnp.cjs` と `.pnp.loader.mjs` はリポジトリに含めます

## 主要スクリプト

- `yarn dev` 開発サーバー起動
- `yarn build` ビルド
- `yarn test` テスト（watch）
- `yarn test:run` テスト（CI向け）
- `yarn lint` Lint
- `yarn lint:fix` Lint + Fix
