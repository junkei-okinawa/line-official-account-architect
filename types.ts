
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'flex' | 'richmenu';
  timestamp: Date;
}

export interface LineOASettings {
  accountName: string;
  description: string;
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  greetingMessage: string;
  richMenuJson?: string;
}

export interface McpServerConfig {
  serverUrl: string;        // MCP サーバー URL (例：ws://localhost:3000)
  channelToken: string;     // LINE Channel Token
  enabled: boolean;         // MCP サーバー接続有効フラグ
}

export interface RichMenuOperationResult {
  success: boolean;
  richMenuId?: string;
  message?: string;
  error?: string;
}

export interface MessageSendTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export enum Step {
  STRATEGY = 'STRATEGY',
  CONFIG = 'CONFIG',
  RICH_MENU = 'RICH_MENU',
  MESSAGING = 'MESSAGING',
  PREVIEW = 'PREVIEW',
  MCP_INTEGRATION = 'MCP_INTEGRATION'
}
