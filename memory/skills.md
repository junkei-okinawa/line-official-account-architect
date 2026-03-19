# MCP Skills Guide - LINE Official Account Architect

このドキュメントは、LINE 公式アカウントアーキテクトで MCP サーバーを効果的に使うためのスキル（コマンド）を解説します。

---

## 基本コンセプト

MCP（Model Context Protocol）を使うと、AI が LINE Messaging API を直接操作できます。チャットで指示するだけで、リッチメニューの作成から登録、メッセージ送信まで自動化されます。

### 前提条件

MCP サーバー機能を使用するには、事前に設定画面で MCP サーバー情報を登録する必要があります：

- **サーバー URL**: `https://your-mcp-server.com`
- **Channel Access Token**: LINE Developers コンソールで発行
- **Channel ID/Secret**: アカウント認証用情報

---

## 利用可能なスキル

### `/richmenu:create` - リッチメニュー作成

**説明**: 新しいリッチメニューを AI が自動生成し、LINE に登録します。

**使用例**:

```
/richmenu:create カフェの予約用のリッチメニューを作成して。2 段 3 コラムで、上段に「メニュー」「予約」「キャンペーン」、下段に「店舗情報」「お問い合わせ」「SNS」のボタンをつけて。
```

**対応機能**:

- JSON 構造の自動生成
- バナー画像の AI 生成（Gemini DALL-E）
- LINE API へのアップロードと登録

---

### `/richmenu:preview` - リッチメニュープレビュー

**説明**: 現在設定されているリッチメニューの内容をプレビューします。

**使用例**:

```
/richmenu:preview 今設定されてるメニューを見せて
```

---

### `/richmenu:delete` - リッチメニュー削除

**説明**: 指定したリッチメニューを削除します。

**使用例**:

```
/richmenu:delete 旧バージョンのメニューを削除して
```

---

### `/message:send` - メッセージ送信テスト

**説明**: 特定のユーザーにメッセージを送信して動作を確認します（テスト環境のみ）。

**使用例**:

```
/message:send user_id=Uxxxxxxxxxx "こんにちは！新メニューのお知らせです"
```

**対応機能**:

- テキストメッセージ
- Flex Message（カード型）
- スタンプ/画像メッセージ

---

### `/flex:builder` - Flex Message ビルダー

**説明**: 視覚的に Flex Message を作成・編集します。

**使用例**:

```
/flex:builder 商品紹介の Flex Message を作って。画像、タイトル、価格、ボタン（詳細ページへ）をつけて。
```

---

### `/template:create` - テンプレートメッセージ作成

**説明**: プリセットテンプレートを使ったメッセージを自動生成します。

**使用例**:

```
/template:create 予約確認のテンプレートを作って。店舗名、予約日時、お客様名を含めて。
```

**対応テンプレート**:

- 予約確認
- お届け状況通知
- プロモーション告知
- イベント案内

---

### `/webhook:test` - Webhook テスト

**説明**: Webhook エンドポイントの動作をテストします。

**使用例**:

```
/webhook:test ウェブフックが正常に受信できるかテストして
```

---

## 高度な使い方

### 複数スキルの連携

複数のスキルを組み合わせて複雑な操作も可能です：

```
1. /richmenu:create でメニュー作成
2. /flex:builder でボタンアクション設定
3. /message:send でテストレポート取得
```

### コンテキスト保持

会話履歴を保持しながら、以前の設定を参照・変更できます：

```
前に作ったカフェのメニューをベースに、キャンペーン用のものに更新して
```

---

## 注意事項

1. **本番環境での送信**: `/message:send` はテスト環境でのみ使用してください。本番利用は別途承認が必要です。
2. **API 制限**: LINE Messaging API にはレート制限があります。大量送信時は時間间隔を空けてください。
3. **画像生成**: AI による画像生成には時間がかかる場合があります（約 10-30 秒）。

---

## よくある質問

**Q: MCP サーバーが接続できない**
A: 設定画面で Channel Access Token が有効か確認してください。期限切れの場合は再発行が必要です。

**Q: リッチメニューが反映されない**
A: LINE アプリを再起動するか、キャッシュクリア後にお試しください。

**Q: Flex Message のボタンが動作しない**
A: ボタンの `action` 設定を確認してください。URI アクションとメッセージアクションの区別にご注意ください。

---

## 関連リンク

- [LINE Bot MCP Server](https://github.com/line/line-bot-mcp-server)
- [LINE Messaging API Docs](https://developers.line.biz/ja/docs/messaging-api/overview/)
- [Flex Message Layout](https://developers.line.biz/ja/docs/messaging-api/flex-message-layout/)
