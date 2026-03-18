import { McpServerConfig, RichMenuOperationResult, MessageSendTestResult } from '../types';

/**
 * MCP サーバーとの通信サービス
 */
export class McpService {
  private ws: WebSocket | null = null;
  private config: McpServerConfig | null = null;
  private messageQueue: Array<{
    id: number;
    data: unknown;
    resolve: (value: JsonRpcResponse) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private messageIdCounter = 0;

  /**
   * MCP サーバーに接続
   */
  async connect(config: McpServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.config = config;
        const wsUrl = config.serverUrl.replace(/^http/, 'ws');

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('MCP サーバーに接続されました');
          this.processQueue();
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('MCP サーバー接続エラー:', error);
          reject(new Error('サーバーへの接続に失敗しました'));
        };

        this.ws.onclose = () => {
          console.log('MCP サーバーとの接続が切断されました');
          this.config = null;
        };

        this.ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            this.handleResponse(response);
          } catch (e) {
            console.error('レスポンス解析エラー:', e);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * MCP サーバーから切断
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws) {
        this.ws.onclose = () => {
          this.ws = null;
          this.config = null;
          this.messageQueue = [];
          resolve();
        };
        this.ws.close();
      } else {
        resolve();
      }
    });
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    if (!this.ws || !this.config || typeof WebSocket === 'undefined') {
      return false;
    }

    return this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * リッチメニュー操作を実行
   */
  async richMenuOperation(
    action: 'generate' | 'upload' | 'register' | 'delete' | 'list',
    data?: Record<string, unknown>
  ): Promise<RichMenuOperationResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'MCP サーバーに接続されていません' };
    }

    try {
      const response = await this.sendRequest({
        method: 'richmenu.' + action,
        params: data || {},
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const richMenuId = toStringValue(response.result?.richMenuId);
      const message = asString(response.result?.message) ?? '操作が完了しました';

      return {
        success: true,
        richMenuId,
        message,
      };
    } catch (error) {
      console.error('リッチメニュー操作エラー:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * テストメッセージを送信
   */
  async testMessageSend(
    toUserId: string,
    messageType: 'text' | 'flex',
    content: string | Record<string, unknown>
  ): Promise<MessageSendTestResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'MCP サーバーに接続されていません', timestamp: new Date() };
    }

    try {
      const response = await this.sendRequest({
        method: 'message.send',
        params: {
          to: toUserId,
          type: messageType,
          message: content,
        },
      });

      if (response.error) {
        return { success: false, error: response.error.message, timestamp: new Date() };
      }

      const messageId =
        toStringValue(response.result?.messageId) ?? toStringValue(response.result?.success);

      return {
        success: true,
        messageId,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      return { success: false, error: String(error), timestamp: new Date() };
    }
  }

  /**
   * リッチメニュー一覧を取得
   */
  async getRichMenuList(): Promise<Array<{ richMenuId: string; name?: string }>> {
    const result = await this.richMenuOperation('list');
    if (result.success && result.richMenuId) {
      return [{ richMenuId: result.richMenuId, name: 'Default' }];
    }
    return [];
  }

  /**
   * リクエストを送信（内部）
   */
  private sendRequest(request: {
    method: string;
    params?: Record<string, unknown>;
  }): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      const id = this.messageIdCounter++;
      const message = {
        jsonrpc: '2.0',
        id,
        ...request,
      };

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));

        // タイムアウト設定（5 秒）
        const timeoutId = setTimeout(() => {
          reject(new Error('リクエストのタイムアウト'));
        }, 5000);

        // レスポンスハンドラーを一時登録
        const handler = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data) as JsonRpcResponse;
            if (response.id === id) {
              this.ws?.removeEventListener('message', handler);
              clearTimeout(timeoutId);
              resolve(response);
            }
          } catch {
            // 解析エラーは無視
          }
        };

        this.ws.addEventListener('message', handler);
      } else {
        reject(new Error('WebSocket が開いていません'));
      }
    });
  }

  /**
   * レスポンスを処理（内部）
   */
  private handleResponse(_response: JsonRpcResponse): void {
    // 現在はこの実装ではキュー処理を使用
    this.processQueue();
  }

  /**
   * キュー内のリクエストを処理（内部）
   */
  private processQueue(): void {
    // 現在のところキューは使用しないが、将来の拡張のために予約
  }
}

type JsonRpcError = {
  message: string;
};

type JsonRpcResponse = {
  id?: number;
  result?: Record<string, unknown>;
  error?: JsonRpcError;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

// シングルトンインスタンス
export const mcpService = new McpService();
