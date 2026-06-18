'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, RefreshCw, Bot, User } from 'lucide-react';
import clsx from 'clsx';

type Lang = 'en' | 'zh' | 'ja' | 'vi';
type Level = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

const LANG_LABELS: Record<Lang, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  zh: { label: '中文', flag: '🇨🇳' },
  ja: { label: '日本語', flag: '🇯🇵' },
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
};

const LEVEL_LABELS: Record<Level, string> = {
  beginner: '입문',
  elementary: '초급',
  intermediate: '중급',
  advanced: '고급',
};

const STARTER_PROMPTS: Record<Lang, string[]> = {
  en: ['안녕하세요!', 'Please teach me how to order food in Korean.', '한국 음식 추천해 주세요.'],
  zh: ['안녕하세요!', '请用韩语教我点餐。', '韩国有什么好吃的食物？'],
  ja: ['안녕하세요!', '韓国語で食事の注文の仕方を教えてください。', '한국어로 자기소개 해주세요.'],
  vi: ['안녕하세요!', 'Dạy tôi cách gọi món ăn bằng tiếng Hàn.', '한국에 대해 알려주세요.'],
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export default function ChatPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [level, setLevel] = useState<Level>('elementary');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput('');

    const userMsg: Message = { role: 'user', content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch('/api/korean/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          lang,
          level,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'delta') {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: last.content + evt.text };
                }
                return next;
              });
            } else if (evt.type === 'done') {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.role === 'assistant') {
                  next[next.length - 1] = { ...last, streaming: false };
                }
                return next;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant' && last.streaming) {
          next[next.length - 1] = { role: 'assistant', content: '연결 오류가 발생했습니다. 다시 시도해주세요.' };
        }
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <MessageCircle size={18} />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">AI 한국어 회화 선생님</div>
            <div className="text-xs text-gray-400">발음 · 문법 피드백 실시간 제공</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Lang */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Lang)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
          >
            {(Object.entries(LANG_LABELS) as [Lang, { label: string; flag: string }][]).map(([code, info]) => (
              <option key={code} value={code}>{info.flag} {info.label}</option>
            ))}
          </select>
          {/* Level */}
          <select
            value={level}
            onChange={e => setLevel(e.target.value as Level)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
          >
            {(Object.entries(LEVEL_LABELS) as [Level, string][]).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => setMessages([])}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="대화 초기화"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bot size={22} />
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-1">선생님이 대기 중입니다</div>
            <div className="text-xs text-gray-400 mb-5">한국어로 말하거나, 질문을 입력해보세요!</div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS[lang].map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} />
              </div>
            )}
            <div
              className={clsx(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              )}
            >
              {msg.content}
              {msg.streaming && <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle rounded" />}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="한국어로 말해보세요... (Enter로 전송)"
          rows={1}
          className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-28 px-2 py-1.5"
          style={{ minHeight: '36px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white flex items-center justify-center transition-colors shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
