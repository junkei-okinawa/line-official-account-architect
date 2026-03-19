import React, { useState, useRef, useEffect } from 'react';
import { Message, LineOASettings, Step, McpServerConfig } from './types';
import { chatWithGemini, generateLineConfig, GeminiError } from './services/geminiService';
import MobilePreview from './components/MobilePreview';
import McpServerConfigPanel from './components/McpServerConfigPanel';
import MessageSendTestUI from './components/MessageSendTestUI';
import RichMenuControlPanel from './components/RichMenuControlPanel';
import {
  Send,
  MessageSquare,
  Settings,
  Layout,
  Code,
  Eye,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Menu as MenuIcon,
  X,
  RefreshCw,
  Copy,
  ChevronRight,
  User as UserIcon,
  Loader2,
} from 'lucide-react';

type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

declare const liff: {
  init: (options: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  getProfile: () => Promise<LiffProfile>;
  login: () => void;
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'こんにちは！LINE公式アカウントの構築をサポートするAIです。どんなアカウントを作りたいですか？（例：カフェの予約、ECサイトの顧客対応、など）',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(Step.STRATEGY);
  const [settings, setSettings] = useState<LineOASettings>({
    accountName: '',
    description: '',
    channelId: '',
    channelSecret: '',
    channelAccessToken: '',
    greetingMessage: '友だち追加ありがとうございます！',
    richMenuJson: '',
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'config' | 'preview'>('chat');

  // LIFF States
  const [liffState, setLiffState] = useState<{
    isInit: boolean;
    error: string | null;
    profile: LiffProfile | null;
  }>({
    isInit: false,
    error: null,
    profile: null,
  });

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!localStorage.getItem('gemini_api_key'));
  const [tempApiKey, setTempApiKey] = useState('');

  // MCP Server State
  const [mcpConfig, setMcpConfig] = useState<McpServerConfig>(() => {
    const saved = localStorage.getItem('mcp_server_config');
    return saved ? JSON.parse(saved) : { serverUrl: '', channelToken: '', enabled: false };
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // LIFF Initialization
  useEffect(() => {
    const initLiff = async () => {
      try {
        // Check if LIFF SDK is loaded
        if (typeof liff === 'undefined') {
          console.error(
            'LIFF SDK not found. Please check your internet connection and script tag.'
          );
          setLiffState({ isInit: true, error: 'SDK not loaded', profile: null });
          return;
        }

        // LIFF IDは本番環境では環境変数などから取得しますが、
        // ここではデモンストレーション用に初期化エラーを許容する構成にします。
        await liff.init({ liffId: 'YOUR_LIFF_ID_HERE' }).catch((err: unknown) => {
          console.warn(
            'LIFF initialization failed. This might be a local browser environment.',
            err
          );
          setLiffState((prev) => ({ ...prev, isInit: true }));
        });

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLiffState({ isInit: true, error: null, profile });
        } else {
          setLiffState((prev) => ({ ...prev, isInit: true }));
        }
      } catch (error) {
        console.error('LIFF initialization error', error);
        setLiffState({ isInit: true, error: 'Initialization error', profile: null });
      }
    };
    initLiff();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mobileTab]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('mcp_server_config', JSON.stringify(mcpConfig));
  }, [mcpConfig]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithGemini([...messages, userMessage], settings, apiKey);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || '申し訳ありません。エラーが発生しました。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (settings.accountName === '' && input.length > 5) {
        const config = await generateLineConfig(input, apiKey);
        if (config) {
          setSettings((prev) => ({
            ...prev,
            accountName: config.accountName || prev.accountName,
            description: config.description || prev.description,
            greetingMessage: config.greetingMessage || prev.greetingMessage,
          }));
        }
      }
    } catch (error) {
      const geminiError = error as GeminiError;
      let errorMessage = '申し訳ありません。エラーが発生しました。';

      if (geminiError instanceof GeminiError) {
        switch (geminiError.code) {
          case 'MISSING_API_KEY':
            errorMessage =
              'Gemini API キーが設定されていません。設定画面から API キーを入力してください。';
            setShowApiKeyInput(true);
            break;
          case 'INVALID_API_KEY':
            errorMessage = 'API キーが無効です。正しい API キーを入力してください。';
            setShowApiKeyInput(true);
            break;
          case 'RATE_LIMITED':
            errorMessage = 'リクエストが多すぎます。しばらく待ってからもう一度お試しください。';
            break;
          case 'SERVER_ERROR':
            errorMessage =
              'Gemini サーバーに一時的な問題が発生しました。しばらく待ってからもう一度お試しください。';
            break;
          default:
            errorMessage = geminiError.message;
        }
      }

      const errorResponseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof LineOASettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey);
      localStorage.setItem('gemini_api_key', tempApiKey);
      setShowApiKeyInput(false);
    }
  };

  const handleLogin = () => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  };

  const renderConfigStep = () => {
    const inputClasses =
      'w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all';

    switch (currentStep) {
      case Step.CONFIG:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">アカウント名</label>
              <input
                type="text"
                value={settings.accountName}
                onChange={(e) => updateSetting('accountName', e.target.value)}
                placeholder="例: Gemini Cafe"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明文</label>
              <textarea
                value={settings.description}
                onChange={(e) => updateSetting('description', e.target.value)}
                placeholder="アカウントの目的や特徴"
                rows={3}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                あいさつメッセージ
              </label>
              <textarea
                value={settings.greetingMessage}
                onChange={(e) => updateSetting('greetingMessage', e.target.value)}
                placeholder="友だち追加時に自動送信される文章"
                rows={4}
                className={inputClasses}
              />
            </div>
          </div>
        );
      case Step.MESSAGING:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-xs text-yellow-700">
                LINE Developersコンソールから取得した情報を入力してください。
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel ID</label>
              <input
                type="text"
                value={settings.channelId}
                onChange={(e) => updateSetting('channelId', e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel Secret</label>
              <input
                type="password"
                value={settings.channelSecret}
                onChange={(e) => updateSetting('channelSecret', e.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-6">
              <McpServerConfigPanel initialConfig={mcpConfig} onSave={setMcpConfig} />
              <RichMenuControlPanel mcpConfig={mcpConfig} />
              <MessageSendTestUI mcpConfig={mcpConfig} />
            </div>
          </div>
        );
      case Step.RICH_MENU:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Rich Menu JSON</h3>
              <button className="text-green-600 text-xs font-medium flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3 h-3" /> AIで再生成
              </button>
            </div>
            <div className="relative">
              <textarea
                value={
                  settings.richMenuJson ||
                  '{\n  "size": {\n    "width": 2500,\n    "height": 1686\n  },\n  "selected": true,\n  "name": "Default Menu",\n  "chatBarText": "Menu",\n  "areas": []\n}'
                }
                onChange={(e) => updateSetting('richMenuJson', e.target.value)}
                rows={10}
                className="w-full px-4 py-2 font-mono text-xs rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <button className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
                <Copy className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-10 opacity-50">
            <Rocket className="w-12 h-12 mx-auto mb-3" />
            <p>このセクションは準備中です</p>
          </div>
        );
    }
  };

  if (!liffState.isInit) {
    return (
      <div className="liff-loading-screen">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">LIFFを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden relative">
      {/* API Key Modal Overlay */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 lg:p-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 line-gradient rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-green-200">
                <Rocket className="text-white w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">AI構築を開始しましょう</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                本アプリは Google Gemini を使用して LINE
                公式アカウントの構築をサポートします。機能を利用するには、あなたの{' '}
                <span className="font-bold text-gray-700">Gemini API Key</span> を入力してください。
              </p>
            </div>

            {/* Guide Section */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-green-500" />
                APIキーの取得手順
              </h3>
              <ol className="text-xs text-gray-600 space-y-3 list-decimal list-inside">
                <li>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline font-bold"
                  >
                    Google AI Studio
                  </a>{' '}
                  にアクセスします。
                </li>
                <li>「Get API key」ボタンをクリックします。</li>
                <li>
                  既存のプロジェクトを選択するか、新規プロジェクトを作成して「Create API key in new
                  project」をクリックします。
                </li>
                <li>
                  生成された <span className="font-mono bg-gray-200 px-1 rounded">AIza...</span>{' '}
                  から始まる文字列をコピーして、下の入力欄に貼り付けます。
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="ここにAPIキーを貼り付け"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl transition-all outline-none text-gray-800 font-mono text-sm shadow-inner"
                />
              </div>

              <div className="flex items-start gap-3 px-1 py-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <div className="shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-[10px] text-blue-700 leading-normal">
                  入力されたAPIキーはあなたのブラウザ（LocalStorage）にのみ保存されます。サーバー側に送信されたり、サービス提供者が知ることはありません。
                </p>
              </div>

              <button
                onClick={handleSaveApiKey}
                disabled={!tempApiKey.trim()}
                className="w-full line-gradient text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 hover:brightness-105 transition-all disabled:opacity-50 disabled:shadow-none mt-2"
              >
                AIアシスタントを起動
              </button>

              <button
                onClick={() => setShowApiKeyInput(false)}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="APIキーなしでもUIの確認は可能です。AI機能のみ制限されます。"
              >
                あとで設定する
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 w-72 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 line-gradient rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <Rocket className="text-white w-6 h-6" />
            </div>
            <h1 className="font-bold text-xl text-gray-800 tracking-tight leading-none">
              OA Architect
              <br />
              <span className="text-[10px] text-green-500 uppercase tracking-widest">
                LIFF Edition
              </span>
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="対話プランニング"
            active={currentStep === Step.STRATEGY}
            onClick={() => {
              setCurrentStep(Step.STRATEGY);
              setMobileTab('chat');
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            label="基本設定"
            active={currentStep === Step.CONFIG}
            onClick={() => {
              setCurrentStep(Step.CONFIG);
              setMobileTab('config');
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={<Layout className="w-5 h-5" />}
            label="リッチメニュー"
            active={currentStep === Step.RICH_MENU}
            onClick={() => {
              setCurrentStep(Step.RICH_MENU);
              setMobileTab('config');
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={<Code className="w-5 h-5" />}
            label="API連携"
            active={currentStep === Step.MESSAGING}
            onClick={() => {
              setCurrentStep(Step.MESSAGING);
              setMobileTab('config');
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={<Eye className="w-5 h-5" />}
            label="全体プレビュー"
            active={currentStep === Step.PREVIEW}
            onClick={() => {
              setCurrentStep(Step.PREVIEW);
              setMobileTab('preview');
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
          />
        </nav>

        {/* User Profile Area (LIFF) */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          {liffState.profile ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <img
                src={liffState.profile.pictureUrl}
                alt=""
                className="w-10 h-10 rounded-full border-2 border-green-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {liffState.profile.displayName}
                </p>
                <p className="text-[10px] text-gray-400">Connected via LINE</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold"
            >
              <UserIcon className="w-4 h-4" />
              LINEでログイン
            </button>
          )}

          <button className="w-full mt-3 flex items-center justify-center gap-2 line-gradient text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-200 hover:brightness-105 transition-all">
            <CheckCircle2 className="w-5 h-5" />
            <span>完成・デプロイ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
              <span className="text-[10px] lg:text-sm font-medium text-gray-500">
                プロジェクト:
              </span>
              <span className="text-sm lg:text-sm font-bold text-gray-800 truncate max-w-[120px] lg:max-w-none">
                {settings.accountName || '名称未設定'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex h-2 w-16 lg:w-24 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-2/5 transition-all duration-500"></div>
            </div>
            <span className="text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Progress: 40%
            </span>
          </div>
        </header>

        {/* Content Tabs (Mobile Only) */}
        <div className="flex lg:hidden bg-white border-b border-gray-200 px-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${mobileTab === 'chat' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}
          >
            チャット
          </button>
          <button
            onClick={() => setMobileTab('config')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${mobileTab === 'config' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}
          >
            設定
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${mobileTab === 'preview' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}
          >
            プレビュー
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex relative">
          {/* Chat Side */}
          <div
            className={`flex-1 flex flex-col ${mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'} border-r border-gray-200 bg-white relative`}
          >
            <div
              ref={scrollRef}
              className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6 bg-gray-50/30"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] lg:max-w-[85%] rounded-2xl p-3 lg:p-4 shadow-sm border ${
                      m.role === 'user'
                        ? 'bg-green-50 border-green-100 text-green-900 rounded-tr-none'
                        : 'bg-white border-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                      {m.content}
                    </p>
                    <div className="mt-2 text-[10px] opacity-40">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animation-delay-200"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animation-delay-400"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 lg:p-4 border-t border-gray-100 bg-white shadow-up">
              <div className="relative group flex items-end gap-2 max-w-4xl mx-auto w-full">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="AIに相談して構築を進める..."
                  rows={1}
                  className="flex-1 pl-4 lg:pl-6 pr-4 lg:pr-6 py-3 lg:py-4 bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl transition-all outline-none resize-none min-h-[48px] lg:min-h-[56px] max-h-32 text-gray-800"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="mb-1 p-3 lg:p-3.5 line-gradient text-white rounded-xl shadow-lg disabled:opacity-30 transition-all hover:scale-105 shrink-0"
                  title="Ctrl + Enter で送信"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] lg:text-[10px] text-gray-400 font-medium px-2 max-w-4xl mx-auto w-full">
                <span className="hidden sm:inline">Enterで改行 / Ctrl + Enter で送信</span>
                <span className="sm:hidden">Ctrl+Enter で送信</span>
                <span className="text-right">AIが最適な構成を提案します</span>
              </div>
            </div>
          </div>

          {/* Config Side */}
          <div
            className={`flex-1 p-6 lg:p-8 overflow-y-auto bg-white ${mobileTab === 'config' ? 'block' : 'hidden lg:block'}`}
          >
            <div className="max-w-xl mx-auto">
              <div className="mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                  {currentStep === Step.STRATEGY
                    ? '構成概要'
                    : currentStep === Step.CONFIG
                      ? '基本プロファイル'
                      : currentStep === Step.RICH_MENU
                        ? 'リッチメニュー設計'
                        : '詳細設定'}
                </h2>
                <p className="text-gray-500 text-xs lg:text-sm">
                  AIとの対話から自動入力されます。直接編集も可能です。
                </p>
              </div>

              {renderConfigStep()}

              <div className="mt-8 lg:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="text-blue-600 font-bold text-sm lg:text-lg mb-1">AI 提案</div>
                  <p className="text-[11px] lg:text-xs text-blue-700 leading-relaxed">
                    リッチメニューを活用して、予約ページへの誘導率を高める構成を推奨します。
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                  <div className="text-purple-600 font-bold text-sm lg:text-lg mb-1">Tips</div>
                  <p className="text-[11px] lg:text-xs text-purple-700 leading-relaxed">
                    Flex Messageを使えば、カード形式で商品を見やすく紹介できます。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <aside
            className={`w-full lg:w-[350px] xl:w-[400px] border-l border-gray-200 bg-[#f0f2f5] p-4 lg:p-8 overflow-y-auto shrink-0 ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'} flex-col items-center`}
          >
            <div className="w-full mb-6 flex items-center justify-between shrink-0">
              <h2 className="text-sm lg:text-lg font-bold text-gray-700">プレビュー</h2>
              <div className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] lg:text-[10px] font-bold rounded uppercase">
                Realtime
              </div>
            </div>

            <div className="transform scale-[0.85] sm:scale-90 lg:scale-100 origin-top shrink-0">
              <MobilePreview
                settings={settings}
                previewMessages={messages.filter((m) => m.id !== '1')}
              />
            </div>

            <div className="mt-4 lg:mt-8 w-full max-w-[320px] bg-white rounded-2xl p-4 shadow-sm border border-gray-200 shrink-0">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3">
                Preview Options
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600">通知プレビュー</span>
                  <div className="w-8 h-4 bg-green-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-green-50 text-green-600 shadow-sm'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
      }`}
    >
      <span className={`${active ? 'text-green-600' : 'text-gray-400'}`}>{icon}</span>
      <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
        {label}
      </span>
      {active && <ChevronRight className="ml-auto w-4 h-4 text-green-400 shrink-0" />}
    </button>
  );
};

export default App;
