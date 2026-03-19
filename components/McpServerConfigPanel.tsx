import React, { useState } from 'react';
import { McpServerConfig } from '../types';
import { mcpService } from '../services/mcpService';
import { Settings, CheckCircle2, XCircle, Loader2, Link as LinkIcon } from 'lucide-react';

interface McpServerConfigPanelProps {
  initialConfig: McpServerConfig;
  onSave: (config: McpServerConfig) => void;
}

const McpServerConfigPanel: React.FC<McpServerConfigPanelProps> = ({ initialConfig, onSave }) => {
  const [serverUrl, setServerUrl] = useState(initialConfig.serverUrl);
  const [channelToken, setChannelToken] = useState(initialConfig.channelToken);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSaveSettings = () => {
    const config: McpServerConfig = {
      serverUrl,
      channelToken,
      enabled: initialConfig.enabled,
    };
    onSave(config);
    localStorage.setItem('mcp_server_config', JSON.stringify(config));
  };

  const handleConnect = async () => {
    if (!serverUrl || !channelToken) {
      alert('サーバー URL と Channel Token を入力してください');
      return;
    }

    setIsConnecting(true);
    try {
      await mcpService.connect({ serverUrl, channelToken, enabled: true });
      handleSaveSettings();
    } catch (error) {
      console.error('接続エラー:', error);
      alert('接続に失敗しました。設定を確認してください');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await mcpService.disconnect();
    const config: McpServerConfig = { serverUrl, channelToken, enabled: false };
    onSave(config);
    localStorage.setItem('mcp_server_config', JSON.stringify(config));
  };

  const isConnected = mcpService.isConnected();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        MCP サーバー設定
      </h3>

      {/* サーバー URL 入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">MCP サーバー URL</label>
        <input
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="https://your-mcp-server.com"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
          disabled={isConnected}
        />
      </div>

      {/* Channel Token 入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Channel Access Token</label>
        <input
          type="password"
          value={channelToken}
          onChange={(e) => setChannelToken(e.target.value)}
          placeholder="xxxxxx..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 font-mono text-sm"
          disabled={isConnected}
        />
      </div>

      {/* 接続状態表示 */}
      {isConnected && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>✓ MCP サーバーに接続済み</span>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex gap-3">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting || !serverUrl || !channelToken}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 px-4 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 接続中...
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" /> 接続する
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white py-2.5 px-4 rounded-lg hover:bg-gray-600 transition-all font-semibold"
          >
            <XCircle className="w-4 h-4" /> 切断する
          </button>
        )}

        <button
          onClick={handleSaveSettings}
          className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2.5 px-6 rounded-lg hover:bg-blue-600 transition-all font-semibold"
        >
          保存
        </button>
      </div>

      {/* ヘルプテキスト */}
      <p className="mt-3 text-xs text-gray-500">
        MCP サーバーは別途デプロイが必要です。詳細は GitHub の line-bot-mcp-server
        を参照してください。
      </p>
    </div>
  );
};

export default McpServerConfigPanel;
