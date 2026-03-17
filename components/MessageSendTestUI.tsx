import React, { useState } from 'react';
import { MessageSendTestResult, McpServerConfig } from '../types';
import { mcpService } from '../services/mcpService';
import {
  MessageSquare,
  Send as SendIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Text,
  LayoutTemplate,
  Paperclip,
} from 'lucide-react';

interface MessageSendTestUIProps {
  mcpConfig: McpServerConfig;
}

const MessageSendTestUI: React.FC<MessageSendTestUIProps> = ({ mcpConfig }) => {
  const [isConnected, setIsConnected] = useState(mcpService.isConnected());
  const [testUserId, setTestUserId] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'flex'>('text');
  const [testMessageContent, setTestMessageContent] = useState('');
  const [testFlexJson, setTestFlexJson] = useState(`{
  "type": "bubble",
  "body": {
    "type": "verticalBox",
    "paddingAll": "lg",
    "contents": [
      {
        "type": "text",
        "text": "こんにちは！",
        "weight": "bold",
        "size": "xl"
      },
      {
        "type": "text",
        "text": "これはテストメッセージです。",
        "margin": "md",
        "size": "sm"
      }
    ]
  }
}`);
  const [isSending, setIsSending] = useState(false);
  const [sendHistory, setSendHistory] = useState<MessageSendTestResult[]>([]);

  React.useEffect(() => {
    setIsConnected(mcpService.isConnected());
  }, [mcpConfig.enabled]);

  // テストメッセージを送信
  const handleSendMessage = async () => {
    if (!isConnected) {
      alert('MCP サーバーに接続されていません');
      return;
    }

    if (!testUserId.trim()) {
      alert('受信ユーザー ID を入力してください');
      return;
    }

    if (messageType === 'text' && !testMessageContent.trim()) {
      alert('メッセージ本文を入力してください');
      return;
    }

    setIsSending(true);

    try {
      let content: any;
      if (messageType === 'flex') {
        try {
          content = JSON.parse(testFlexJson);
        } catch (e) {
          alert('Flex Message JSON が無効です');
          return;
        }
      } else {
        content = testMessageContent.trim();
      }

      const result = await mcpService.testMessageSend(testUserId.trim(), messageType, content);

      setSendHistory((prev) => [result, ...prev].slice(0, 10)); // 直近 10 件を保持

      if (!result.success) {
        alert(`送信に失敗しました：${result.error}`);
      } else {
        console.log('メッセージ送信成功:', result);
      }
    } catch (error) {
      setSendHistory((prev) =>
        [{ success: false, error: String(error), timestamp: new Date() }, ...prev].slice(0, 10)
      );
      alert(`エラーが発生しました：${error}`);
    } finally {
      setIsSending(false);
    }
  };

  // プリセット Flex Message テンプレート
  const loadFlexTemplate = (type: 'product' | 'card' | 'button') => {
    const templates: Record<string, string> = {
      product: `{
  "type": "bubble",
  "body": {
    "type": "verticalBox",
    "paddingAll": "lg",
    "contents": [
      {
        "type": "image",
        "url": "https://via.placeholder.com/320x160",
        "size": "full",
        "aspectRatio": "20:10"
      },
      {
        "type": "text",
        "text": "商品名",
        "weight": "bold",
        "size": "xl",
        "margin": "md"
      },
      {
        "type": "text",
        "text": "￥1,980",
        "color": "#ff6b6b",
        "weight": "bold",
        "size": "lg"
      }
    ]
  }
}`,
      card: `{
  "type": "bubble",
  "body": {
    "type": "verticalBox",
    "paddingAll": "md",
    "contents": [
      {
        "type": "text",
        "text": "お知らせ",
        "weight": "bold",
        "size": "lg"
      },
      {
        "type": "separator",
        "margin": "sm"
      },
      {
        "type": "text",
        "text": "新機能が追加されました！",
        "margin": "md",
        "size": "sm"
      }
    ]
  }
}`,
      button: `{
  "type": "bubble",
  "body": {
    "type": "verticalBox",
    "paddingAll": "lg",
    "contents": [
      {
        "type": "text",
        "text": "ご予約ありがとうございます",
        "weight": "bold",
        "size": "xl"
      },
      {
        "type": "button",
        "style": "link",
        "height": "sm",
        "action": {
          "type": "uri",
          "label": "詳細を見る",
          "uri": "https://example.com"
        }
      },
      {
        "type": "button",
        "style": "link",
        "height": "sm",
        "action": {
          "type": "message",
          "label": "キャンセルする",
          "text": "予約をキャンセルしたいです"
        }
      }
    ]
  }
}`,
    };

    setTestFlexJson(templates[type]);
  };

  const hasContent =
    messageType === 'text' ? testMessageContent.trim().length > 0 : testFlexJson.trim().length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        メッセージ送信テスト
      </h3>

      {/* 接続ステータス */}
      {!isConnected && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>MCP サーバーに接続されていません。まずは設定画面から接続してください。</span>
        </div>
      )}

      {/* ユーザー ID 入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">受信ユーザー ID</label>
        <input
          type="text"
          value={testUserId}
          onChange={(e) => setTestUserId(e.target.value)}
          placeholder="Uxxxxxxxxxxxxxx..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono text-sm disabled:bg-gray-100"
          disabled={!isConnected}
        />
      </div>

      {/* メッセージタイプ選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">メッセージタイプ</label>
        <div className="flex gap-3">
          <button
            onClick={() => setMessageType('text')}
            disabled={!isConnected}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 ${messageType === 'text' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <Text className="w-4 h-4" /> テキスト
          </button>
          <button
            onClick={() => setMessageType('flex')}
            disabled={!isConnected}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 ${messageType === 'flex' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <LayoutTemplate className="w-4 h-4" /> Flex Message
          </button>
        </div>
      </div>

      {/* メッセージコンテンツ入力 */}
      {messageType === 'text' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">メッセージ本文</label>
          <textarea
            value={testMessageContent}
            onChange={(e) => setTestMessageContent(e.target.value)}
            rows={3}
            placeholder="テストメッセージを入力"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none resize-y disabled:bg-gray-100"
            disabled={!isConnected}
          />
        </div>
      )}

      {messageType === 'flex' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flex Message JSON
            </label>
            <textarea
              value={testFlexJson}
              onChange={(e) => setTestFlexJson(e.target.value)}
              rows={10}
              placeholder='{"type":"bubble","body":{"contents":[]}}'
              className="w-full px-4 py-2 font-mono text-xs rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none resize-y disabled:bg-gray-100"
              disabled={!isConnected}
            />
          </div>

          {/* テンプレート選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">テンプレート</label>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => loadFlexTemplate('product')}
                disabled={!isConnected}
                className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-all text-xs font-medium disabled:opacity-50"
              >
                商品カード
              </button>
              <button
                onClick={() => loadFlexTemplate('card')}
                disabled={!isConnected}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-xs font-medium disabled:opacity-50"
              >
                通知カード
              </button>
              <button
                onClick={() => loadFlexTemplate('button')}
                disabled={!isConnected}
                className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-all text-xs font-medium disabled:opacity-50"
              >
                ボタンアクション
              </button>
            </div>
          </div>
        </>
      )}

      {/* 送信ボタン */}
      <button
        onClick={handleSendMessage}
        disabled={!isConnected || isSending || !testUserId.trim() || !hasContent}
        className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
      >
        {isSending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> 送信中...
          </>
        ) : (
          <>
            <SendIcon className="w-5 h-5" /> テスト送信
          </>
        )}
      </button>

      {/* 送信履歴表示 */}
      {sendHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            送信履歴
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {sendHistory.map((entry, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border text-sm ${entry.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  {entry.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {entry.success ? (
                  <p className="text-sm font-medium text-green-700">送信成功</p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">{entry.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ヒント */}
      {!isConnected && sendHistory.length === 0 && (
        <p className="mt-4 text-xs text-gray-500">
          MCP サーバーに接続すると、実際のユーザー ID にテストメッセージを送信できます。
          <br />
          ユーザー ID は LINE Developers コンソールや API レスポンスから取得してください。
        </p>
      )}
    </div>
  );
};

export default MessageSendTestUI;
