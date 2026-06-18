'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Printer,
  ChevronLeft,
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  X,
  Info,
  FileImage,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'checking' | 'ok' | 'warning';
  warning?: string;
}

const ACCEPTED_TYPES = ['.ai', '.eps', '.pdf', '.tif', '.tiff', '.psd', '.png', '.jpg', '.jpeg'];
const FORMAT_TIPS = [
  { icon: '✅', text: 'AI, EPS, PDF (벡터) — 권장 포맷' },
  { icon: '✅', text: 'TIFF, PSD — 300dpi 이상 래스터 이미지' },
  { icon: '⚠️', text: 'PNG, JPG — 300dpi 이상, 재단선 포함 시 가능' },
  { icon: '❌', text: 'PPT, DOCX, HWP — 변환 불가' },
];

function simulateCheck(file: File): Promise<UploadedFile> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      let status: UploadedFile['status'] = 'ok';
      let warning: string | undefined;

      if (['jpg', 'jpeg', 'png'].includes(ext)) {
        status = 'warning';
        warning = '해상도 확인 필요 — 300dpi 이상인지 확인 후 담당자가 검토합니다.';
      } else if (!['ai', 'eps', 'pdf', 'tif', 'tiff', 'psd'].includes(ext)) {
        status = 'warning';
        warning = '지원하지 않는 형식입니다. 담당자 확인 후 안내드립니다.';
      }

      resolve({ name: file.name, size: file.size, type: file.type, status, warning });
    }, 1200 + Math.random() * 800);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [checking, setChecking] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [submitted, setSubmitted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const category = searchParams.get('category') ?? '';
  const quantity = searchParams.get('quantity') ?? '';
  const price = searchParams.get('price') ?? '';

  const handleFiles = useCallback(async (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setChecking((prev) => [...prev, ...arr.map((f) => f.name)]);
    const results = await Promise.all(arr.map((f) => simulateCheck(f)));
    setFiles((prev) => [...prev, ...results]);
    setChecking((prev) => prev.filter((n) => !arr.find((f) => f.name === n)));
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0 || !customerName || !customerPhone) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const catLabel: Record<string, string> = {
      'business-card': '명함',
      flyer: '전단',
      booklet: '책자',
      banner: '배너',
      sticker: '스티커',
      package: '패키지',
    };

    await fetch('/api/print/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerPhone,
        category: category || 'business-card',
        productName: catLabel[category] ?? '인쇄 상품',
        options: { category: category || 'business-card', size: '', paper: 'art', quantity: Number(quantity) || 100, binding: 'none', coating: 'none', sides: 'single' },
        totalPrice: Number(price) || 0,
        status: 'received',
        fileUploaded: true,
        memo,
        estimatedDays: 3,
      }),
    });

    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-xl mb-1">접수 완료!</h2>
            <p className="text-stone-500 text-sm">파일 검수 후 담당자가 연락드립니다.<br />일반 납기 기준 영업일 기준 1–2시간 내 확인됩니다.</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 w-full text-left">
            <p className="text-xs text-blue-700 font-semibold mb-1">주문자 정보</p>
            <p className="text-sm text-stone-700">{customerName} · {customerPhone}</p>
            {price && <p className="text-xs text-stone-400 mt-1">예상 견적: {Number(price).toLocaleString()}원</p>}
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => router.push('/print/status')}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              주문 현황 보기
            </button>
            <button
              onClick={() => router.push('/print')}
              className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
              처음으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/print" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Printer size={13} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-blue-900 text-sm leading-tight">파일 업로드</p>
            <p className="text-[10px] text-stone-400">인쇄 파일 전송 및 주문 접수</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 pb-16 flex flex-col gap-5">
        {/* Format guide */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-blue-600" />
            <p className="text-xs font-bold text-blue-800">파일 형식 안내</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {FORMAT_TIPS.map((tip) => (
              <div key={tip.text} className="flex items-start gap-2 text-xs text-stone-600">
                <span>{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          data-testid="drop-zone"
          data-dragging={isDragging}
          onDragEnter={onDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all',
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-stone-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
          )}
        >
          <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors', isDragging ? 'bg-blue-100' : 'bg-stone-100')}>
            <Upload size={22} className={isDragging ? 'text-blue-600' : 'text-stone-400'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-700">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-xs text-stone-400 mt-0.5">{ACCEPTED_TYPES.join(', ')} · 최대 500MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Checking files */}
        {checking.length > 0 && (
          <div className="flex flex-col gap-2">
            {checking.map((name) => (
              <div key={name} className="bg-white border border-stone-100 rounded-xl p-3 flex items-center gap-3">
                <Loader2 size={16} className="text-blue-600 animate-spin shrink-0" />
                <span className="text-xs text-stone-600 flex-1 truncate">{name}</span>
                <span className="text-[10px] text-stone-400">검수 중...</span>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded files */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-stone-500">업로드된 파일 ({files.length})</p>
            {files.map((file) => (
              <div
                key={file.name}
                className={clsx(
                  'bg-white border rounded-xl p-3 flex items-start gap-3',
                  file.status === 'ok' ? 'border-emerald-200' : 'border-amber-200'
                )}
              >
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', file.status === 'ok' ? 'bg-emerald-50' : 'bg-amber-50')}>
                  <FileImage size={14} className={file.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-stone-700 truncate">{file.name}</p>
                    {file.status === 'ok' ? (
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle size={12} className="text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400">{formatBytes(file.size)}</p>
                  {file.warning && (
                    <p className="text-[10px] text-amber-600 mt-0.5">{file.warning}</p>
                  )}
                </div>
                <button
                  onClick={() => removeFile(file.name)}
                  className="shrink-0 w-6 h-6 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Order form */}
        <form onSubmit={handleSubmit} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <h3 className="font-bold text-stone-800 text-sm">주문자 정보</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 mb-1.5 block">이름 *</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 mb-1.5 block">연락처 *</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 mb-1.5 block">요청 사항 (선택)</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="특별 요청 사항이나 디자인 수정 사항을 입력해 주세요."
                rows={3}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {price && (
            <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-blue-700 font-semibold">예상 견적</span>
              <span className="text-sm font-black text-blue-700">{Number(price).toLocaleString()}원</span>
            </div>
          )}

          <button
            type="submit"
            disabled={files.length === 0 || !customerName || !customerPhone || submitting}
            className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-200 text-white font-bold rounded-xl text-sm transition-colors"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {submitting ? '접수 중...' : '주문 접수하기'}
          </button>

          {files.length === 0 && (
            <p className="text-center text-xs text-stone-400">파일을 먼저 업로드해 주세요</p>
          )}
        </form>

        <div className="text-center">
          <Link href="/print/chat" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            파일 관련 문의가 있으신가요? AI 상담하기
            <ArrowRight size={11} />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}
