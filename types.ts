
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

export enum Step {
  STRATEGY = 'STRATEGY',
  CONFIG = 'CONFIG',
  RICH_MENU = 'RICH_MENU',
  MESSAGING = 'MESSAGING',
  PREVIEW = 'PREVIEW'
}
