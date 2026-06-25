'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, RefreshCw, Bot, User, CalendarClock } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const STARTERS = [
  '둥근 얼굴형에 어울리는 헤어스타일이 뭔가요?',
  '펌과 염색을 같이 해도 괜찮을까요?',
  '모발 손상이 심한데 어떤 시술이 좋을까요?',
  '숱이 많아서 볼륨을 줄이고 싶어요',
  '회사 다니는데 무난하게 변화를 주고 싶어요',
  '요즘 유행하는 헤어 트렌드가 뭔가요?',
];

const QUICK_LINKS = [
  { href: '/salon/reservation', icon: CalendarClock, label: '예약하기' },
];

export default function SalonChatPage() {
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
      const res = await fetch('/api/salon/chat', {
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
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim();
          if (!line) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === 'delta') {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.streaming) msgs[msgs.length - 1] = { ...last, content: last.content + ev.text };
                return msgs;
              });
            } else if (ev.type === 'done') {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.streaming) msgs[msgs.length - 1] = { ...last, streaming: false };
                return msgs;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: 'assistant', content: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
        return msgs;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* 빠른 링크 */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-4 flex items-center gap-2 flex-wrap">
        {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex items-center gap-1.5 bg-white border border-rose-200 text-rose-600 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors shadow-sm">
            <Icon size={12} />
            {label}
          </Link>
        ))}
        <span className="text-xs text-gray-400 ml-auto">AI 답변은 참고용입니다. 정확한 상담은 방문 후 받으세요.</span>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot size={28} className="text-rose-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">AI 스타일 상담</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                어떤 스타일을 원하시나요? 얼굴형·모발 상태·취향을 알려주시면 최적의 헤어스타일을 추천해 드립니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-sm bg-white border border-rose-100 text-rose-800 px-4 py-2.5 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={clsx('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={clsx(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                m.role === 'user' ? 'bg-rose-600' : 'bg-white border border-rose-200',
              )}>
                {m.role === 'user'
                  ? <User size={14} className="text-white" />
                  : <Bot size={14} className="text-rose-600" />}
              </div>
              <div className={clsx(
                'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-rose-600 text-white rounded-tr-sm'
                  : 'bg-white border border-rose-100 text-gray-700 rounded-tl-sm shadow-sm',
              )}>
                {m.content}
                {m.streaming && <span className="inline-block w-1.5 h-4 bg-rose-400 ml-0.5 animate-pulse rounded-sm" />}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력창 */}
      <div className="border-t border-rose-100 bg-white/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2 items-end">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0"
              title="대화 초기화"
            >
              <RefreshCw size={15} />
            </button>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="헤어 스타일 고민을 입력하세요 (Enter로 전송, Shift+Enter로 줄바꿈)"
            rows={1}
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-white"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
