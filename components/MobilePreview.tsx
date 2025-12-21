
import React from 'react';
import { LineOASettings, Message } from '../types';
import { User, Send, ChevronLeft, MoreHorizontal, Smile } from 'lucide-react';

interface MobilePreviewProps {
  settings: LineOASettings;
  previewMessages: Message[];
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ settings, previewMessages }) => {
  return (
    <div className="relative mx-auto border-8 border-gray-800 rounded-[3rem] h-[650px] w-[320px] shadow-2xl bg-white overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-xl z-20 flex justify-center items-end pb-1">
        <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
      </div>

      {/* App Header */}
      <div className="bg-[#1e1e1e] text-white pt-8 pb-3 px-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold truncate max-w-[150px]">{settings.accountName || "New Account"}</span>
        </div>
        <div className="flex gap-3">
          <Send className="w-4 h-4 rotate-[-45deg]" />
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="h-[calc(100%-140px)] bg-[#8cabd9] p-4 overflow-y-auto flex flex-col gap-4">
        {/* Timestamp */}
        <div className="text-center text-[10px] text-white opacity-80 py-2">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Greeting */}
        {settings.greetingMessage && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
              {settings.accountName?.charAt(0) || "L"}
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[80%]">
              <p className="text-xs text-gray-800 whitespace-pre-wrap">{settings.greetingMessage}</p>
            </div>
          </div>
        )}

        {/* Mock Messages */}
        {previewMessages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                {settings.accountName?.charAt(0) || "L"}
              </div>
            )}
            <div className={`${m.role === 'user' ? 'bg-[#76f16d] rounded-tr-none' : 'bg-white rounded-tl-none'} rounded-2xl p-3 shadow-sm max-w-[80%]`}>
              <p className="text-xs text-gray-800">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rich Menu Placeholder */}
      <div className="absolute bottom-[56px] inset-x-0 h-32 bg-gray-100 border-t border-gray-300 grid grid-cols-3 grid-rows-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="border-[0.5px] border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-medium">
             Menu {i}
          </div>
        ))}
        <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 bg-gray-200 px-3 py-1 rounded-t-lg text-[8px] text-gray-600 border border-b-0 border-gray-300">
          ▲ Rich Menu
        </div>
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 inset-x-0 h-14 bg-white border-t border-gray-200 px-4 flex items-center gap-3">
        <Smile className="w-6 h-6 text-gray-400" />
        <div className="flex-1 bg-gray-100 rounded-full h-9 flex items-center px-4">
          <span className="text-xs text-gray-400">Message</span>
        </div>
        <User className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );
};

export default MobilePreview;
