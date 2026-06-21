'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { OrderConfirmCard, ConfirmedItem } from '@/components/chat/OrderConfirmCard';
import { ArrowLeft, Send, UtensilsCrossed, Home } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  confirmedOrder?: ConfirmedItem[];
}

function parseOrder(text: string): ConfirmedItem[] | null {
  const match = text.match(/<<<ORDER_CONFIRMED>>>\s*([\s\S]*?)\s*<<<END_ORDER>>>/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return parsed.ORDER_CONFIRMED ? parsed.items : null;
  } catch {
    return null;
  }
}

const INITIAL_GREETING = (table: number) =>
  `안녕하세요! 테이블 ${table}번 고객님 😊 중화가정에 오신 것을 환영합니다!\n가정집의 주방처럼 정성껏 준비한 중식 메뉴를 소개해 드릴게요. 오늘 어떤 메뉴가 끌리세요? 🥢`;

export default function ChatPage() {
  const router = useRouter();
  const tableNumber = useCartStore((s) => s.tableNumber);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Guard: redirect if no table
  useEffect(() => {
    if (!tableNumber) { router.replace('/'); return; }
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: INITIAL_GREETING(tableNumber),
      },
    ]);
  }, [tableNumber, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !tableNumber) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
      const assistantId = `a-${Date.now()}`;

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsStreaming(true);

      // Build history for API (exclude streaming placeholder)
      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];

      // Add empty streaming message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, tableNumber }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value, { stream: true });
          const lines = raw.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (!payload.trim()) continue;

            const event = JSON.parse(payload);

            if (event.type === 'chunk') {
              accumulated += event.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, streaming: true }
                    : m
                )
              );
            } else if (event.type === 'done') {
              const full = event.fullText as string;
              const order = parseOrder(full);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: full, streaming: false, confirmedOrder: order ?? undefined }
                    : m
                )
              );
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: '죄송합니다, 잠시 후 다시 시도해 주세요.', streaming: false }
              : m
          )
        );
      }

      setIsStreaming(false);
      inputRef.current?.focus();
    },
    [messages, isStreaming, tableNumber]
  );

  function handleOrderDone() {
    setMessages((prev) => [
      ...prev,
      {
        id: `a-done-${Date.now()}`,
        role: 'assistant',
        content: '주문이 접수됐습니다! 다른 메뉴가 필요하시면 언제든지 말씀해 주세요 😊',
      },
    ]);
  }

  const quickReplies = ['추천해줘', '인기 메뉴 뭐야?', '매운 메뉴 있어?', '세트 메뉴 알려줘'];

  return (
    <div className="flex flex-col h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-stone-100 px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => router.push('/menu')}
          className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
          <UtensilsCrossed size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">중화가정 AI 주문 도우미</p>
          <p className="text-xs text-stone-400">테이블 {tableNumber}번</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => router.replace('/demo')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 text-stone-500 hover:border-amber-400 hover:text-amber-600 text-xs font-medium transition-colors"
          >
            <Home size={13} />
            홈으로
          </button>
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            응대 중
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatBubble
              role={msg.role}
              content={msg.content}
              streaming={msg.streaming}
            />
            {msg.confirmedOrder && !msg.streaming && (
              <div className="mt-3">
                <OrderConfirmCard
                  items={msg.confirmedOrder}
                  tableNumber={tableNumber!}
                  onDone={handleOrderDone}
                />
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {!isStreaming && messages.length <= 2 && (
        <div className="shrink-0 px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
          {quickReplies.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-stone-100 px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메뉴를 물어보거나 주문하세요..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-sm disabled:bg-stone-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 text-white flex items-center justify-center transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
