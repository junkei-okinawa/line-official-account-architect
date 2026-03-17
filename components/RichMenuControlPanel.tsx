import React, { useState } from 'react';
import { RichMenuOperationResult, McpServerConfig } from '../types';
import { mcpService } from '../services/mcpService';
import {
  Layout,
  RefreshCw,
  Send as SendIcon,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Copy,
} from 'lucide-react';

interface RichMenuControlPanelProps {
  mcpConfig: McpServerConfig;
}

const RichMenuControlPanel: React.FC<RichMenuControlPanelProps> = ({ mcpConfig }) => {
  const [isConnected, setIsConnected] = useState(mcpService.isConnected());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [operationResult, setOperationResult] = useState<RichMenuOperationResult | null>(null);
  const [richMenuList, setRichMenuList] = useState<Array<{ richMenuId: string; name?: string }>>(
    []
  );
  const [selectedRichMenuId, setSelectedRichMenuId] = useState<string | null>(null);

  // リッチメニュー JSON テンプレート
  const defaultRichMenuJson = `{
  "size": {
    "width": 2500,
    "height": 1686
  },
  "selected": false,
  "name": "Default Menu",
  "chatBarText": "メニュー",
  "areas": [
    ${[...Array(8)].map((_, i) => `    { "bounds": { "left": ${(i % 4) * 625}, "top": ${Math.floor(i / 4) * 843} }, "action": {"type": "message", "text": "メニュー${i + 1}"}}`).join(',\n')}
  ]
}`;

  const [richMenuJson, setRichMenuJson] = useState(defaultRichMenuJson);

  React.useEffect(() => {
    setIsConnected(mcpService.isConnected());
  }, [mcpConfig.enabled]);

  // リッチメニューを AI で生成
  const handleGenerateRichMenu = async () => {
    if (!isConnected) {
      setOperationResult({ success: false, error: 'MCP サーバーに接続されていません' });
      return;
    }

    setIsGenerating(true);
    setOperationResult(null);

    try {
      // 実際の MCP サーバー呼び出し（現在はローカル生成シミュレーション）
      const result = await mcpService.richMenuOperation('generate', { prompt: 'カフェのメニュー' });

      if (result.success) {
        setOperationResult({ ...result, message: 'リッチメニュー JSON が生成されました' });
        // richMenuJson に結果をセット（実装に応じて調整）
      } else {
        setOperationResult(result);
      }
    } catch (error) {
      setOperationResult({ success: false, error: String(error) });
    } finally {
      setIsGenerating(false);
    }
  };

  // リッチメニュー画像をアップロード
  const handleUploadRichMenu = async () => {
    if (!isConnected) {
      setOperationResult({ success: false, error: 'MCP サーバーに接続されていません' });
      return;
    }

    setIsUploading(true);
    setOperationResult(null);

    try {
      const result = await mcpService.richMenuOperation('upload', { richMenuJson });

      if (result.success) {
        setSelectedRichMenuId(result.richMenuId || null);
        setOperationResult({ ...result, message: 'リッチメニュー画像がアップロードされました' });
      } else {
        setOperationResult(result);
      }
    } catch (error) {
      setOperationResult({ success: false, error: String(error) });
    } finally {
      setIsUploading(false);
    }
  };

  // リッチメニューをユーザーに登録
  const handleRegisterRichMenu = async () => {
    if (!isConnected) {
      setOperationResult({ success: false, error: 'MCP サーバーに接続されていません' });
      return;
    }

    if (!selectedRichMenuId) {
      setOperationResult({ success: false, error: 'リッチメニューが選択されていません' });
      return;
    }

    setIsRegistering(true);
    setOperationResult(null);

    try {
      const result = await mcpService.richMenuOperation('register', {
        richMenuId: selectedRichMenuId,
      });

      if (result.success) {
        setOperationResult({ ...result, message: 'リッチメニューが登録されました' });
      } else {
        setOperationResult(result);
      }
    } catch (error) {
      setOperationResult({ success: false, error: String(error) });
    } finally {
      setIsRegistering(false);
    }
  };

  // リッチメニューを削除
  const handleDeleteRichMenu = async () => {
    if (!isConnected) {
      setOperationResult({ success: false, error: 'MCP サーバーに接続されていません' });
      return;
    }

    try {
      const result = await mcpService.richMenuOperation('delete', {
        richMenuId: selectedRichMenuId || '',
      });

      if (result.success) {
        setOperationResult({ ...result, message: 'リッチメニューが削除されました' });
        setSelectedRichMenuId(null);
      } else {
        setOperationResult(result);
      }
    } catch (error) {
      setOperationResult({ success: false, error: String(error) });
    }
  };

  // リッチメニュー一覧を取得
  const handleGetRichMenuList = async () => {
    if (!isConnected) {
      return;
    }

    try {
      const list = await mcpService.getRichMenuList();
      setRichMenuList(list);
      if (list.length > 0) {
        setSelectedRichMenuId(list[0].richMenuId);
      }
    } catch (error) {
      console.error('一覧取得エラー:', error);
    }
  };

  // JSON コピー
  const handleCopyJson = () => {
    navigator.clipboard.writeText(richMenuJson);
    setOperationResult({ success: true, message: 'JSON をコピーしました' });
    setTimeout(() => setOperationResult(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Layout className="w-5 h-5" />
        リッチメニュー操作パネル
      </h3>

      {/* 接続ステータス */}
      {!isConnected && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>MCP サーバーに接続されていません。まずは設定画面から接続してください。</span>
        </div>
      )}

      {/* アクションボタングリッド */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={handleGenerateRichMenu}
          disabled={!isConnected || isGenerating || isUploading || isRegistering}
          className="flex flex-col items-center justify-center p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isGenerating ? (
            <Loader2 className="w-6 h-6 text-blue-600 mb-1 animate-spin" />
          ) : (
            <RefreshCw className="w-6 h-6 text-blue-600 mb-1 group-hover:rotate-180 transition-transform" />
          )}
          <span className="text-xs font-bold text-blue-700">AI 生成</span>
        </button>

        <button
          onClick={handleUploadRichMenu}
          disabled={!isConnected || isGenerating || isUploading || isRegistering}
          className="flex flex-col items-center justify-center p-4 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-purple-600 mb-1 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-purple-600 mb-1 group-hover:-translate-y-1 transition-transform" />
          )}
          <span className="text-xs font-bold text-purple-700">画像アップロード</span>
        </button>

        <button
          onClick={handleRegisterRichMenu}
          disabled={
            !isConnected || isGenerating || isUploading || isRegistering || !selectedRichMenuId
          }
          className="flex flex-col items-center justify-center p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isRegistering ? (
            <Loader2 className="w-6 h-6 text-green-600 mb-1 animate-spin" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-bold text-green-700">ユーザーに登録</span>
        </button>

        <button
          onClick={handleDeleteRichMenu}
          disabled={
            !isConnected || isGenerating || isUploading || isRegistering || !selectedRichMenuId
          }
          className="flex flex-col items-center justify-center p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <XCircle className="w-6 h-6 text-red-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-red-700">削除</span>
        </button>
      </div>

      {/* リッチメニュー JSON 編集 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">リッチメニュー JSON</label>
        <div className="relative">
          <textarea
            value={richMenuJson}
            onChange={(e) => setRichMenuJson(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 font-mono text-xs rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-green-500 outline-none resize-y"
          />
          <button
            onClick={handleCopyJson}
            className="absolute top-3 right-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            title="JSON をコピー"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 操作結果表示 */}
      {operationResult && (
        <div
          className={`rounded-lg p-3 mb-4 flex items-start gap-2 ${operationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
        >
          {operationResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${operationResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {operationResult.message || operationResult.error}
          </p>
        </div>
      )}

      {/* リッチメニューリスト */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-700">所有リッチメニュー</h4>
          <button
            onClick={handleGetRichMenuList}
            disabled={!isConnected || isGenerating || isUploading || isRegistering}
            className="text-xs text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} /> リフレッシュ
          </button>
        </div>

        {richMenuList.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {richMenuList.map((menu) => (
              <div
                key={menu.richMenuId}
                onClick={() => setSelectedRichMenuId(menu.richMenuId)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedRichMenuId === menu.richMenuId ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon
                    className={`w-4 h-4 ${selectedRichMenuId === menu.richMenuId ? 'text-blue-600' : 'text-gray-400'}`}
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {menu.name || `メニュー ${menu.richMenuId.slice(0, 8)}`}
                  </span>
                </div>
                {selectedRichMenuId === menu.richMenuId && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">リッチメニューがありません</p>
        )}
      </div>
    </div>
  );
};

export default RichMenuControlPanel;
