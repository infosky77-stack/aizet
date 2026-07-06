'use client';

// AIZET Object Model — 도록 2분할 편집 페이지.
// /admin/super-editor/om-edit?siteId=...&documentId=...
// useSearchParams를 쓰므로 Suspense 경계로 감싼다(슈퍼에디터 다른 페이지와 동일 관례).

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { DocumentEditor } from '@/components/super-editor/DocumentEditor';

function OmEditContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');
  const documentId = searchParams.get('documentId');

  if (!siteId || !documentId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400">
        <AlertCircle size={28} />
        <p className="text-sm">siteId와 documentId가 필요합니다.</p>
        <p className="text-xs text-stone-300">예: /admin/super-editor/om-edit?siteId=site-xxxx&amp;documentId=doc_xxxx</p>
      </div>
    );
  }

  return <DocumentEditor siteId={siteId} documentId={documentId} />;
}

export default function OmEditPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <Suspense fallback={<div className="h-full" />}>
        <OmEditContent />
      </Suspense>
    </div>
  );
}
