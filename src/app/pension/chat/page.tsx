'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, TreePine, ChevronRight, Bot } from 'lucide-react';
import Link from 'next/link';

type Message = { role: 'user' | 'assistant'; content: string };

const QUICK = [
  '커플 여행인데 어떤 객실이 좋을까요?',
  '아이랑 가도 괜찮은가요?',
  '주변에 볼 것이 뭐가 있나요?',
  '바베큐도 할 수 있나요?',
  '취소·환불 정책이 궁금해요',
];

export default function PensionChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setStarted(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages([...next, assistantMsg]);

    try {
      const res = await fetch('/api/pension/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.type === 'delta') {
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: (copy[copy.length - 1].content) + ev.text };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: '죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 112px)' }}>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
          <Bot size={26} className="text-white" />
        </div>
        <h1 className="text-xl font-black text-gray-900">AI 여행 컨시어지</h1>
        <p className="text-sm text-gray-500 mt-1">여행 목적·인원·날짜를 알려주시면 최적의 객실을 추천해 드려요</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-3xl border border-teal-100 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '55vh' }}>

          {/* Welcome */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-teal-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <TreePine size={14} className="text-white" />
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl rounded-tl-sm p-3.5 max-w-xs">
              <p className="text-sm text-gray-800 leading-relaxed">
                안녕하세요! 하늘정원 AI 컨시어지입니다 🌿<br />
                커플여행, 가족여행, 친구 모임 등 어떤 여행이든 맞춤 추천해 드릴게요.<br />
                어떤 여행을 계획하고 계신가요?
              </p>
            </div>
          </div>

          {/* Quick replies (shown before first user message) */}
          {!started && (
            <div className="flex gap-2 flex-wrap pl-11">
              {QUICK.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="flex items-center gap-1.5 bg-white border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-teal-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 bg-teal-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TreePine size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-xs rounded-2xl p-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-teal-700 text-white rounded-tr-sm'
                  : 'bg-teal-50 border border-teal-100 text-gray-800 rounded-tl-sm'
              }`}>
                {m.content || (loading && i === messages.length - 1 ? (
                  <span className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-teal-50 p-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="궁금한 점을 물어보세요..."
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:opacity-60 transition"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Reservation CTA */}
      <div className="mt-4 bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageCircle size={18} className="text-teal-600 flex-shrink-0" />
          <p className="text-sm text-teal-800 font-semibold">원하는 객실을 찾으셨나요?</p>
        </div>
        <Link href="/pension/reservation" className="flex items-center gap-1.5 bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-teal-800 transition-colors whitespace-nowrap">
          예약하기 <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
