'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';

function SuperEditorPaymentFailContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const mediaOrderId  = searchParams.get('mediaOrderId') ?? '';
  const message       = searchParams.get('message')      ?? '결제가 취소되었습니다.';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-red-100 p-8 flex flex-col items-center gap-4">
        <XCircle size={44} className="text-red-400" />
        <p className="font-bold text-red-700 text-lg">결제 실패</p>
        <p className="text-sm text-stone-500 text-center">{message}</p>
        <div className="flex flex-col gap-2 w-full pt-2">
          {mediaOrderId && (
            <button
              onClick={() => router.replace(`/admin/super-editor/${mediaOrderId}`)}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              편집으로 돌아가기
            </button>
          )}
          <button
            onClick={() => router.replace('/admin/super-editor')}
            className="w-full py-3 border border-stone-200 text-stone-500 font-semibold rounded-xl text-sm hover:bg-stone-50 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperEditorPaymentFailPage() {
  return (
    <Suspense>
      <SuperEditorPaymentFailContent />
    </Suspense>
  );
}
