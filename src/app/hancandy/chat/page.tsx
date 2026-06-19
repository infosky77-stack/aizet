'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, RefreshCw, Bot, User, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';
import { CANDY_PRODUCTS } from '@/lib/hancandy/products';
import { useCandyCart } from '@/store/candyCart';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const STARTER_PROMPTS = [
  '어떤 캔디가 제게 맞을까요?',
  '잠을 잘 못 자는데 도움이 될까요?',
  '피부 미용에 좋은 캔디 추천해 주세요',
  '운동 후 피로 회복에 좋은 제품이 있나요?',
  '임산부도 먹을 수 있나요?',
];

export default function CandyChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const addItem = useCandyCart(s => s.addItem);
  const [addedId, setAddedId] = useState<string | null>(null);

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
      const res = await fetch('/api/hancandy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
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
    } catch {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant' && last.streaming) {
          next[next.length - 1] = { role: 'assistant', content: '연결 오류가 발생했습니다. 다시 시도해 주세요.' };
        }
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleAdd(id: string) {
    const p = CANDY_PRODUCTS.find(p => p.id === id);
    if (p) {
      addItem(p);
      setAddedId(id);
      setTimeout(() => setAddedId(null), 1500);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">캔디 AI 상담사</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <div className="text-xs text-gray-400">건강 고민 · 제품 추천</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="대화 초기화"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-3xl">🍬</span>
            </div>
            <div className="text-sm font-bold text-gray-800 mb-1">캔디 AI에게 물어보세요</div>
            <div className="text-xs text-gray-400 mb-6 max-w-xs mx-auto">건강 목표나 고민을 알려주시면 딱 맞는 한캔디를 추천해 드립니다!</div>
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-sm px-4 py-2.5 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-colors text-left font-medium"
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
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0 mt-1 text-sm">
                🤖
              </div>
            )}
            <div
              className={clsx(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed',
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              )}
            >
              {msg.content}
              {msg.streaming && (
                <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1 align-middle rounded" />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 mt-1">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick product add (shown after chat started) */}
      {messages.length >= 2 && (
        <div className="mb-3 overflow-x-auto">
          <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
            {CANDY_PRODUCTS.map(p => (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id)}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all shrink-0 ${
                  addedId === p.id
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
                }`}
              >
                <span>{p.image}</span>
                <span>{p.name}</span>
                <ShoppingCart size={11} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="건강 고민이나 원하는 효능을 알려주세요..."
          rows={1}
          className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-28 px-2 py-1.5"
          style={{ minHeight: '36px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
          className="w-9 h-9 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white flex items-center justify-center transition-colors shrink-0"
        >
          <Send size={15} />
        </button>
      </div>

      {/* Cart link */}
      {messages.length >= 2 && (
        <div className="mt-2 text-center">
          <Link href="/hancandy/cart" className="text-xs text-green-600 hover:underline font-medium">
            장바구니 확인하기 →
          </Link>
        </div>
      )}
    </div>
  );
}
