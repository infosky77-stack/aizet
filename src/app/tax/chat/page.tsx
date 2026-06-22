'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, RefreshCw, Bot, User, Calculator, CalendarDays, CalendarClock } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const STARTERS = [
  '종합소득세 신고 어떻게 하나요?',
  '부가세 환급 받을 수 있나요?',
  '프리랜서 세금 신고 방법 알려주세요',
  '법인세 절세 방법이 있나요?',
  '소득공제 항목이 어떤 게 있나요?',
  '내년 부가세 신고 기한이 언제예요?',
];

const QUICK_LINKS = [
  { href: '/tax/calculator', icon: Calculator, label: '세금 계산기' },
  { href: '/tax/calendar', icon: CalendarDays, label: '신고 캘린더' },
  { href: '/tax/reservation', icon: CalendarClock, label: '상담 예약' },
];

export default function TaxChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput('');

    const userMsg: Message = { role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/tax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
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
                if (last.role === 'assistant') next[next.length - 1] = { ...last, content: last.content + evt.text };
                return next;
              });
            } else if (evt.type === 'done') {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.role === 'assistant') next[next.length - 1] = { ...last, streaming: false };
                return next;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'assistant' && last.streaming) next[next.length - 1] = { role: 'assistant', content: '연결 오류가 발생했습니다. 다시 시도해 주세요.' };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base">AI 세무 상담사</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-sm text-slate-600">세금 질문 24시간 답변</div>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="p-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-3xl">⚖️</span>
            </div>
            <div className="text-base font-bold text-slate-900 mb-1">세무 AI에게 질문하세요</div>
            <div className="text-sm text-slate-600 mb-5 max-w-xs mx-auto">소득세·부가세·법인세·절세 전략 등 세금 관련 모든 질문에 답변드립니다.</div>
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {STARTERS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-sm text-left px-3 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-blue-800 flex items-center justify-center shrink-0 mt-1 text-sm">
                🤖
              </div>
            )}
            <div className={clsx(
              'max-w-[85%] rounded-2xl px-4 py-3 text-base whitespace-pre-wrap leading-relaxed',
              msg.role === 'user'
                ? 'bg-slate-800 text-white rounded-br-sm'
                : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'
            )}>
              {msg.content}
              {msg.streaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle rounded" />}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick links (shown after chat started) */}
      {messages.length >= 2 && (
        <div className="flex gap-2 mb-2">
          {QUICK_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-slate-400 hover:text-slate-900 transition-colors">
              <l.icon size={12} />
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="세금 관련 질문을 입력하세요..."
          rows={1}
          className="flex-1 resize-none outline-none text-base text-slate-900 placeholder-slate-500 max-h-28 px-2 py-1.5"
          style={{ minHeight: '36px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
      <p className="text-center text-sm text-slate-600 mt-1.5">AI 답변은 참고용입니다. 실제 세무 신고는 전문 세무사와 상담하세요.</p>
    </div>
  );
}
