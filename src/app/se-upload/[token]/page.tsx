'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Camera, CheckCircle, XCircle, Loader2, ImagePlus } from 'lucide-react';

type Status = 'checking' | 'ready' | 'uploading' | 'done' | 'error' | 'expired';

export default function MobileUploadPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus]   = useState<Status>('checking');
  const [message, setMessage] = useState('');
  const [uploads, setUploads] = useState<{ name: string; ok: boolean }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/se-upload/${token}`)
      .then(r => {
        if (r.status === 410) { setStatus('expired'); return; }
        if (!r.ok) { setStatus('error'); setMessage('연결 오류가 발생했습니다.'); return; }
        setStatus('ready');
      })
      .catch(() => { setStatus('error'); setMessage('네트워크 오류가 발생했습니다.'); });
  }, [token]);

  async function handleFiles(files: FileList) {
    if (!files.length) return;
    setStatus('uploading');

    const results: { name: string; ok: boolean }[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch(`/api/se-upload/${token}`, { method: 'POST', body: fd });
        results.push({ name: file.name, ok: res.ok });
        if (!res.ok && res.status === 410) {
          setStatus('expired');
          setUploads(results);
          return;
        }
      } catch {
        results.push({ name: file.name, ok: false });
      }
    }

    setUploads(results);
    setStatus('done');
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* 헤더 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg">
            <Camera size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-stone-800">AIZET 슈퍼에디터</h1>
          <p className="text-sm text-stone-500">사진·영상을 PC 편집 화면으로 전송합니다</p>
        </div>

        {/* 상태별 UI */}
        {status === 'checking' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={36} className="animate-spin text-violet-400" />
            <p className="text-sm text-stone-500">연결 확인 중...</p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full py-5 rounded-2xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-base flex items-center justify-center gap-3 shadow-md transition-colors"
            >
              <ImagePlus size={22} />
              사진 / 영상 선택
            </button>
            <p className="text-xs text-stone-400 text-center">
              선택한 파일이 즉시 PC 캔버스에 추가됩니다<br />
              여러 파일을 한 번에 선택할 수 있습니다
            </p>
          </>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={36} className="animate-spin text-violet-400" />
            <p className="text-sm text-stone-500">전송 중...</p>
          </div>
        )}

        {status === 'done' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle size={44} className="text-green-500" />
              <p className="font-bold text-stone-800">전송 완료!</p>
              <p className="text-sm text-stone-500">PC 편집 화면에 이미지가 추가됐습니다</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-100 divide-y divide-stone-50 overflow-hidden">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  {u.ok
                    ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    : <XCircle size={16} className="text-red-400 flex-shrink-0" />
                  }
                  <span className="text-sm text-stone-700 truncate">{u.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setStatus('ready'); setUploads([]); }}
              className="w-full py-3.5 rounded-xl border-2 border-violet-300 text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-colors"
            >
              추가 전송
            </button>
          </div>
        )}

        {status === 'expired' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <XCircle size={44} className="text-stone-400" />
            <p className="font-bold text-stone-700">QR 코드가 만료됐습니다</p>
            <p className="text-sm text-stone-500">PC 편집 화면에서 QR 코드를 다시 생성해 주세요<br />(유효시간 15분)</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <XCircle size={44} className="text-red-400" />
            <p className="font-bold text-stone-700">오류가 발생했습니다</p>
            <p className="text-sm text-stone-500">{message}</p>
          </div>
        )}

      </div>
    </div>
  );
}
