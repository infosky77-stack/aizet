'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Printer, ChevronLeft, Send, Calculator, Upload, Package, FolderOpen, Tag, Search, FileText, Star, ExternalLink } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Client, ClientFile } from '@/types/print-files';
import { clsx } from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  action?: PrintAction | null;
  actionResult?: ActionResult | null;
}

type PrintAction =
  | { type: 'SEARCH_FILES'; query: string; country?: string }
  | { type: 'CREATE_LABEL'; clientId?: string; product?: string; data: Record<string, unknown> }
  | { type: 'PRINT_MENU' };

type ActionResult =
  | { type: 'SEARCH_FILES'; clients: Client[]; files: ClientFile[] }
  | { type: 'CREATE_LABEL'; labelId: string; svgContent: string; productName: string; country: string }
  | { type: 'PRINT_MENU' };

const COUNTRY_FLAG: Record<string, string> = {
  US: '🇺🇸', DE: '🇩🇪', JP: '🇯🇵', CN: '🇨🇳', AU: '🇦🇺', KR: '🇰🇷', GB: '🇬🇧', FR: '🇫🇷',
};

const FILE_TYPE_COLORS: Record<string, string> = {
  '.ai': 'bg-orange-100 text-orange-700',
  '.cdr': 'bg-green-100 text-green-700',
  '.pdf': 'bg-red-100 text-red-700',
  '.jpg': 'bg-purple-100 text-purple-700',
  '.png': 'bg-indigo-100 text-indigo-700',
};

function SearchResultCard({ result }: { result: Extract<ActionResult, { type: 'SEARCH_FILES' }> }) {
  if (result.clients.length === 0 && result.files.length === 0) {
    return (
      <div className="mt-2 rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-500 text-center">
        <Search size={20} className="mx-auto mb-1 opacity-40" />
        검색 결과가 없습니다
      </div>
    );
  }

  const filesByClient = result.files.reduce<Record<string, ClientFile[]>>((acc, f) => {
    if (!acc[f.clientId]) acc[f.clientId] = [];
    acc[f.clientId].push(f);
    return acc;
  }, {});

  return (
    <div className="mt-2 rounded-xl bg-white border border-blue-100 shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-4 py-2.5 flex items-center gap-2 border-b border-blue-100">
        <Search size={13} className="text-blue-600" />
        <span className="text-xs font-bold text-blue-700">파일 검색 결과</span>
        <span className="text-[10px] text-blue-500 ml-auto">{result.clients.length}개 거래처 · {result.files.length}개 파일</span>
      </div>
      <div className="divide-y divide-stone-50">
        {result.clients.map(c => {
          const cFiles = (filesByClient[c.id] ?? []).sort((a, b) => b.version - a.version);
          return (
            <div key={c.id} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{COUNTRY_FLAG[c.countryCode] ?? '🌐'}</span>
                <span className="text-xs font-bold text-stone-700">{c.company}</span>
                <span className="text-[10px] text-stone-400">{c.country}</span>
              </div>
              {cFiles.length > 0 && (
                <div className="flex flex-col gap-1 ml-7">
                  {cFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-2">
                      <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded', FILE_TYPE_COLORS[f.fileType] ?? 'bg-stone-100 text-stone-500')}>
                        {f.fileType.replace('.', '').toUpperCase()}
                      </span>
                      <span className="text-xs text-stone-600 truncate flex-1">{f.filename}</span>
                      {f.isLatest && <Star size={9} className="text-blue-500 shrink-0" />}
                      <span className="text-[9px] text-stone-400 shrink-0">v{f.version}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100">
        <Link href="/print/files" className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
          <ExternalLink size={10} />파일 관리 페이지에서 전체 보기
        </Link>
      </div>
    </div>
  );
}

function LabelResultCard({ result }: { result: Extract<ActionResult, { type: 'CREATE_LABEL' }> }) {
  function handleDownload() {
    const blob = new Blob([result.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-${result.productName}-${result.country}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-2 rounded-xl bg-white border border-blue-100 shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-4 py-2.5 flex items-center gap-2 border-b border-blue-100">
        <Tag size={13} className="text-blue-600" />
        <span className="text-xs font-bold text-blue-700">라벨 생성 완료</span>
        <span className="text-[10px] text-blue-500 ml-auto">ID: {result.labelId}</span>
      </div>
      <div className="p-3">
        <div className="rounded-lg overflow-hidden border border-stone-100 mb-3" dangerouslySetInnerHTML={{ __html: result.svgContent }} />
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <FileText size={12} />SVG 다운로드
          </button>
          <Link
            href="/print/labels"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-colors"
          >
            <ExternalLink size={12} />라벨 생성기
          </Link>
        </div>
      </div>
    </div>
  );
}

function MenuPrintCard() {
  return (
    <div className="mt-2 rounded-xl bg-white border border-amber-100 shadow-sm overflow-hidden">
      <div className="bg-amber-50 px-4 py-2.5 flex items-center gap-2 border-b border-amber-100">
        <Printer size={13} className="text-amber-600" />
        <span className="text-xs font-bold text-amber-700">메뉴판 AI 자동 디자인</span>
      </div>
      <div className="p-3">
        <p className="text-xs text-stone-600 mb-3">
          등록된 메뉴 데이터로 AI가 자동으로 메뉴판을 디자인해 드립니다.
          A4 양면 · 무광 코팅 · 고급 아트지 · 전국 배송
        </p>
        <Link
          href="/admin/menu-print"
          className="flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
        >
          <Printer size={12} />
          메뉴판 디자인 &amp; 주문하기
        </Link>
      </div>
    </div>
  );
}

function ActionCard({ action, result }: { action: PrintAction; result: ActionResult | null }) {
  if (!result) {
    const loadingText =
      action.type === 'SEARCH_FILES' ? '파일 검색 중...' :
      action.type === 'CREATE_LABEL' ? '라벨 생성 중...' :
      '준비 중...';
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-stone-500 bg-stone-50 rounded-xl px-3 py-2">
        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        {loadingText}
      </div>
    );
  }
  if (result.type === 'SEARCH_FILES') return <SearchResultCard result={result} />;
  if (result.type === 'CREATE_LABEL') return <LabelResultCard result={result} />;
  if (result.type === 'PRINT_MENU') return <MenuPrintCard />;
  return null;
}

const INITIAL = `안녕하세요! AIZET 인쇄소 AI 상담사입니다 🖨️

명함, 전단, 책자, 배너 등 인쇄 상담은 물론, **거래처 파일 검색**과 **수출 라벨 생성**까지 자연어로 처리해 드립니다!

예시: "독일 거래처 파일 찾아줘" / "미국 수출 라벨 만들어줘"`;

const QUICK_REPLIES = [
  '명함 추천해줘',
  '전단 1000장 얼마야?',
  '독일 거래처 파일 찾아줘',
  '미국 수출 라벨 만들어줘',
  '납기 얼마나 걸려?',
];

export default function PrintChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'assistant', content: INITIAL },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  async function executeAction(action: PrintAction, msgId: string) {
    try {
      let result: ActionResult;
      if (action.type === 'SEARCH_FILES') {
        const params = new URLSearchParams({ q: action.query });
        if (action.country) params.set('country', action.country);
        const res = await fetch(`/api/print/search?${params}`);
        const data = await res.json();
        result = { type: 'SEARCH_FILES', clients: data.clients, files: data.files };
      } else if (action.type === 'PRINT_MENU') {
        result = { type: 'PRINT_MENU' };
      } else {
        const res = await fetch('/api/print/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: action.clientId, product: action.product, data: action.data }),
        });
        const { label } = await res.json();
        result = { type: 'CREATE_LABEL', labelId: label.id, svgContent: label.svgContent, productName: label.data.productName, country: label.data.country };
      }
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, actionResult: result } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, actionResult: null } : m));
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    const assistantId = `a-${Date.now()}`;

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/print/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          const event = JSON.parse(payload);
          if (event.type === 'chunk') {
            accumulated += event.text;
            const visible = accumulated.replace(/<<<PRINT_ACTION>>>[\s\S]*?<<<END_PRINT_ACTION>>>/g, '').trim();
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: visible, streaming: true } : m)
            );
          } else if (event.type === 'done') {
            const action: PrintAction | null = event.action ?? null;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? {
                ...m,
                content: event.fullText,
                streaming: false,
                action,
                actionResult: action ? undefined : null,
              } : m)
            );
            if (action) {
              void executeAction(action, assistantId);
            }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: '죄송합니다. 잠시 후 다시 시도해 주세요.', streaming: false } : m
        )
      );
    }

    setIsStreaming(false);
    inputRef.current?.focus();
  }, [messages, isStreaming]);

  return (
    <div className="flex flex-col h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-stone-100 px-4 h-14 flex items-center gap-3">
        <Link href="/print" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <Printer size={14} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">AI 인쇄 상담사</p>
          <p className="text-xs text-stone-400">파일검색 · 라벨생성 · 인쇄상담</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          응대 중
        </span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatBubble role={msg.role} content={msg.content} streaming={msg.streaming} />
            {msg.action && (
              <div className="ml-10 mr-4">
                <ActionCard action={msg.action} result={msg.actionResult ?? null} />
              </div>
            )}
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.content === '' && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {!isStreaming && messages.length <= 2 && (
        <div className="shrink-0 px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-blue-300 text-blue-700 text-xs font-medium hover:bg-blue-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Shortcut buttons */}
      <div className="shrink-0 px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { href: '/print/quote', icon: Calculator, label: '견적 계산기' },
          { href: '/print/upload', icon: Upload, label: '파일 업로드' },
          { href: '/print/status', icon: Package, label: '주문 현황' },
          { href: '/print/files', icon: FolderOpen, label: '파일 관리' },
          { href: '/print/labels', icon: Tag, label: '라벨 생성기' },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium hover:bg-blue-100 hover:text-blue-700 transition-colors"
          >
            <Icon size={11} />
            {label}
          </Link>
        ))}
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-stone-100 px-4 py-3">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="파일 검색, 라벨 생성, 인쇄 상담..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:border-blue-400 focus:outline-none text-sm disabled:bg-stone-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-stone-200 text-white flex items-center justify-center transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
