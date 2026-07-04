'use client';

// 상품 등록/수정 폼 — 셀러센터 스타일 단일 화면(기본정보 → 사진 → 상세페이지 → 상태).
//
// 사진은 새 업로드 UI를 만들지 않는다: 상품 생성 시 연결된 슈퍼에디터 product
// 콘텐츠(detail_order_id)의 파일 원장을 그대로 쓰고, 업로드는 기존 파일 관리
// 오버레이(z-[120] + ContentFileViewer)를 띄운다 — ProductContentTabs와 같은 관례.
// 썸네일은 원장 이미지 중에서 지정(thumbnail_ref) — 공개 사본 복사는 발행(3단계) 몫.
//
// AI 어시스트(지점 ① 초안 / ② 카피 다듬기)는 자리만: shopAiAssist.available이
// false인 동안 비활성이고, 연동돼도 제안은 입력칸에 채워질 뿐 저장은 회원이 한다.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Files, Loader2, Sparkles, Trash2, X, ImageIcon, ExternalLink, FileImage, Wand2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ContentFileViewer } from '@/components/super-editor/ContentFileViewer';
import { useFileLedgerStore, useOrderedFileEntries } from '@/lib/super-editor/ledger/store';
import { resolveDisplayUrl } from '@/lib/super-editor/ledger/selectors';
import { shopAiAssist } from '@/lib/shop/aiAssist';
import {
  PRODUCT_STATUS_LABELS, type ProductRow, type ProductStatus,
} from '@/lib/shop/types';

interface Props { productId: string }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const inputCls = 'w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300';
const cardCls  = 'bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3';

export function ProductEditForm({ productId }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [filesOpen, setFilesOpen] = useState(false);
  const [thumbPickerOpen, setThumbPickerOpen] = useState(false);

  const detailOrderId = product?.detail_order_id ?? '';
  const entries = useOrderedFileEntries(detailOrderId);
  const imageEntries = entries.filter((e) => e.kind === 'image');
  const thumbEntry = product?.thumbnail_ref
    ? entries.find((e) => e.id === product.thumbnail_ref) : undefined;

  useEffect(() => {
    fetch(`/api/admin/shop/products/${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.product) setProduct(data.product);
        else router.replace('/admin/shop');
      });
  }, [productId, router]);

  // 원장 하이드레이션 — 썸네일 그리드가 파일 화면을 안 거쳐도 원장을 읽을 수 있게(멱등)
  useEffect(() => {
    if (!detailOrderId) return;
    const ledger = useFileLedgerStore.getState();
    void ledger.hydrateFromLocalIndex(detailOrderId);
    void ledger.refreshFromServer(detailOrderId);
  }, [detailOrderId]);

  function patch(fields: Partial<ProductRow>) {
    if (product) setProduct({ ...product, ...fields });
  }

  async function handleSave() {
    if (!product || saveStatus === 'saving') return;
    setSaveStatus('saving');
    const res = await fetch(`/api/admin/shop/products/${productId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: product.name, description: product.description,
        price: product.price, original_price: product.original_price,
        category: product.category, status: product.status,
        thumbnail_ref: product.thumbnail_ref,
      }),
    }).catch(() => null);
    setSaveStatus(res?.ok ? 'saved' : 'error');
    if (res?.ok) setTimeout(() => setSaveStatus('idle'), 2000);
  }

  async function handleDelete() {
    if (!confirm('상품을 삭제하시겠습니까? 주문 내역은 보존됩니다.')) return;
    const res = await fetch(`/api/admin/shop/products/${productId}`, { method: 'DELETE' });
    if (res.ok) router.replace('/admin/shop');
  }

  if (!product) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-stone-300" /></div>;
  }

  const aiTitle = shopAiAssist.available ? undefined : shopAiAssist.unavailableReason;
  const aiBtnCls = 'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 disabled:opacity-50 transition-colors shrink-0';

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => router.push('/admin/shop')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> 상품 목록
          </button>
          <p className="font-bold text-stone-800 text-sm flex-1 truncate">
            {product.name || '새 상품'}
            {saveStatus === 'saving' && <span className="ml-2 text-[11px] font-medium text-stone-400">저장 중…</span>}
            {saveStatus === 'saved'  && <span className="ml-2 text-[11px] font-medium text-emerald-600">저장됨</span>}
            {saveStatus === 'error'  && <span className="ml-2 text-[11px] font-medium text-red-500">저장 실패</span>}
          </p>
          <select
            value={product.status}
            onChange={(e) => patch({ status: e.target.value as ProductStatus })}
            className="shrink-0 text-xs border border-stone-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
            title="판매중으로 바꾸면 구매자 화면에 노출됩니다"
          >
            {(Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]).map((s) => (
              <option key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors shrink-0"
          >
            저장
          </button>
        </div>

        {/* 기본정보 */}
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-700">기본 정보</h2>
            <button disabled={!shopAiAssist.available} title={aiTitle} className={aiBtnCls}>
              <Sparkles size={13} /> AI 초안 (사진으로 채우기)
            </button>
          </div>
          <input
            value={product.name} placeholder="상품명"
            onChange={(e) => patch({ name: e.target.value })} className={inputCls}
          />
          <div className="flex gap-2">
            <input
              value={product.category} placeholder="카테고리 (예: 잼/청)"
              onChange={(e) => patch({ category: e.target.value })} className={inputCls}
            />
            <input
              type="number" value={product.price || ''} placeholder="판매가(원)"
              onChange={(e) => patch({ price: Math.max(0, Number(e.target.value) || 0) })} className={inputCls}
            />
            <input
              type="number" value={product.original_price ?? ''} placeholder="정가(할인 표시용, 선택)"
              onChange={(e) => patch({ original_price: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <textarea
              value={product.description} rows={3}
              placeholder="짧은 소개 — 구매자 상세 화면 상단에 표시됩니다"
              onChange={(e) => patch({ description: e.target.value })}
              className={clsx(inputCls, 'resize-y leading-relaxed')}
            />
            <button disabled={!shopAiAssist.available} title={aiTitle} className={clsx(aiBtnCls, 'self-start')}>
              <Wand2 size={13} /> AI 카피 다듬기
            </button>
          </div>
        </div>

        {/* 사진/썸네일 */}
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-700">사진 · 썸네일</h2>
            <button
              onClick={() => setFilesOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
            >
              <Files size={14} /> 파일 관리
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-24 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
              {thumbEntry ? (
                // 원장 blob URL — next/image 최적화 대상 아님
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveDisplayUrl(thumbEntry)} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-stone-300" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-stone-500">
                {thumbEntry
                  ? `썸네일: ${thumbEntry.origName}`
                  : product.thumbnail_ref
                    ? '(지정된 썸네일 — 이 기기에 없음)'
                    : '목록 카드에 쓸 정사각 썸네일을 지정하세요'}
              </p>
              <button
                onClick={() => setThumbPickerOpen((v) => !v)}
                className="self-start text-[11px] font-semibold text-violet-700 hover:text-violet-800 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
              >
                {product.thumbnail_ref ? '썸네일 변경' : '썸네일 선택'}
              </button>
            </div>
          </div>
          {thumbPickerOpen && (
            <div className="p-3 rounded-2xl border border-violet-200 bg-violet-50/50 flex flex-col gap-2">
              <p className="text-xs font-semibold text-stone-500">
                원장의 이미지에서 선택
                <span className="font-normal text-stone-400"> — 파일이 없으면 먼저 &quot;파일 관리&quot;에서 올려주세요</span>
              </p>
              {imageEntries.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">올려둔 이미지가 없습니다</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {imageEntries.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => { patch({ thumbnail_ref: e.id }); setThumbPickerOpen(false); }}
                      className="group bg-white border border-stone-200 hover:border-violet-300 rounded-xl overflow-hidden transition-colors"
                    >
                      <div className="aspect-square bg-stone-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolveDisplayUrl(e)} alt={e.origName} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 상세페이지 (슈퍼에디터 연결) */}
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-700">상세페이지</h2>
            {product.detail_image_path ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <FileImage size={12} /> 게시됨
              </span>
            ) : (
              <span className="text-[11px] text-stone-400">아직 게시 전</span>
            )}
          </div>
          <p className="text-xs text-stone-400">
            슈퍼에디터에서 섹션(헤드라인/이미지/설명/특징)을 편집하고 긴 이미지로 생성한 뒤 게시하면
            구매자 상세 화면에 표시됩니다.
          </p>
          <button
            onClick={() => product.detail_order_id && router.push(
              `/admin/super-editor/folders?domain=product&contentId=${product.detail_order_id}`)}
            disabled={!product.detail_order_id}
            className="self-start flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors"
          >
            <ExternalLink size={14} /> 슈퍼에디터에서 상세페이지 편집
          </button>
        </div>

        {/* 삭제 */}
        <button
          onClick={handleDelete}
          className="self-start flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13} /> 상품 삭제
        </button>
      </div>

      {/* 파일 관리 — 슈퍼에디터와 같은 전체화면 오버레이(z-120), 원장은 detail_order_id 공유 */}
      {filesOpen && product.detail_order_id && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-stone-800">파일 관리</h2>
                <p className="text-sm text-stone-400 mt-0.5 truncate">{product.name || '새 상품'}</p>
              </div>
              <button
                onClick={() => setFilesOpen(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ContentFileViewer
                orderId={product.detail_order_id}
                title={product.name}
                isPaid={false}
                onBack={() => setFilesOpen(false)}
                onOpenFullEditor={() => { /* 상품 화면에선 전체 편집기 미사용 — hideHeader라 노출 안 됨 */ }}
                hideHeader
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
