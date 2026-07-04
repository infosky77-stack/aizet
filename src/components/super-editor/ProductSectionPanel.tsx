'use client';

// 제품 상세페이지 섹션 목록 편집 패널 — 표시/조작 전용 컴포넌트(SceneListPanel과 대칭).
// 섹션 배열은 소유하지 않고 sections/onChange로 부모(ProductContentTabs)에 위임한다.
// 원장은 읽기 전용으로만 구독한다(이미지 선택 목록과 썸네일) — 파일 업로드는 "파일 관리" 몫.

import { useState } from 'react';
import {
  Heading1, Image as ImageIcon, AlignLeft, ListChecks, Trash2, ChevronUp, ChevronDown, Plus,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { FileEntry } from '@/lib/super-editor/ledger/types';
import { useOrderedFileEntries } from '@/lib/super-editor/ledger/store';
import { resolveDisplayUrl } from '@/lib/super-editor/ledger/selectors';
import {
  ProductSection, ProductSectionKind, ProductFeatureItem, newProductSection,
} from '@/lib/super-editor/product/types';
import { SECTION_KIND_LABELS } from '@/lib/super-editor/product/layout';

interface Props {
  orderId:  string;
  sections: ProductSection[];
  onChange: (sections: ProductSection[]) => void;
  locked?:  boolean;
}

const KIND_ICONS: Record<ProductSectionKind, typeof Heading1> = {
  headline: Heading1,
  image:    ImageIcon,
  text:     AlignLeft,
  features: ListChecks,
};

const inputCls = 'w-full text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-stone-50';

export function ProductSectionPanel({ orderId, sections, onChange, locked = false }: Props) {
  const entries = useOrderedFileEntries(orderId);
  // 이미지 선택기의 대상 — 'new'(새 이미지 섹션 추가) 또는 기존 image 섹션 id(이미지 교체)
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const imageEntries = entries.filter((e) => e.kind === 'image');

  function updateSection(id: string, patch: Partial<ProductSection>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSection(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  function moveSection(id: string, dir: 'up' | 'down') {
    const idx = sections.findIndex((s) => s.id === id);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= sections.length) return;
    const next = [...sections];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  }

  function addSection(kind: ProductSectionKind) {
    onChange([...sections, newProductSection(kind)]);
  }

  function pickImage(entry: FileEntry) {
    if (pickerTarget === 'new') {
      onChange([...sections, newProductSection('image', { ledgerRef: entry.id })]);
    } else if (pickerTarget) {
      updateSection(pickerTarget, { ledgerRef: entry.id });
    }
    setPickerTarget(null);
  }

  function updateFeatureItem(section: ProductSection, i: number, patch: Partial<ProductFeatureItem>) {
    const items = section.items.map((it, j) => (j === i ? { ...it, ...patch } : it));
    updateSection(section.id, { items });
  }

  const addBtnCls = (active: boolean) => clsx(
    'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
    active
      ? 'border-amber-400 text-amber-700 bg-amber-50'
      : 'border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700',
  );

  return (
    <div className="flex flex-col gap-3">
      {/* 섹션 추가 툴바 */}
      {!locked && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => addSection('headline')} className={addBtnCls(false)}>
            <Heading1 size={14} /> 헤드라인 추가
          </button>
          <button
            onClick={() => setPickerTarget((t) => (t === 'new' ? null : 'new'))}
            className={addBtnCls(pickerTarget === 'new')}
          >
            <ImageIcon size={14} /> 이미지 추가
          </button>
          <button onClick={() => addSection('text')} className={addBtnCls(false)}>
            <AlignLeft size={14} /> 설명 추가
          </button>
          <button onClick={() => addSection('features')} className={addBtnCls(false)}>
            <ListChecks size={14} /> 특징 추가
          </button>
        </div>
      )}

      {/* 이미지 선택기 — 원장의 이미지 목록에서 클릭해 섹션에 연결 */}
      {pickerTarget && !locked && (
        <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col gap-2">
          <p className="text-xs font-semibold text-stone-500">
            {pickerTarget === 'new' ? '원장의 이미지에서 선택해 섹션 추가' : '섹션에 넣을 이미지 선택'}
            <span className="font-normal text-stone-400"> — 파일이 없으면 먼저 "파일 관리"에서 올려주세요</span>
          </p>
          {imageEntries.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">올려둔 이미지가 없습니다</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {imageEntries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => pickImage(e)}
                  className="group bg-white border border-stone-200 hover:border-amber-300 rounded-xl overflow-hidden text-left transition-colors"
                >
                  <div className="aspect-video bg-stone-100 flex items-center justify-center overflow-hidden">
                    {/* 원장 blob URL이라 next/image 최적화 대상이 아님 — 일반 img 사용 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveDisplayUrl(e)} alt={e.origName} className="w-full h-full object-cover" />
                  </div>
                  <p className="px-2 py-1 text-[10px] font-medium text-stone-600 truncate group-hover:text-amber-700">{e.origName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 섹션 목록 */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-stone-400">
          <ListChecks size={30} className="opacity-30" />
          <p className="text-sm">섹션이 없습니다. 헤드라인·이미지·설명·특징을 추가해 상세페이지를 구성하세요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map((section, idx) => {
            const Icon = KIND_ICONS[section.kind];
            const linkedEntry = section.ledgerRef ? entries.find((e) => e.id === section.ledgerRef) : undefined;
            return (
              <div key={section.id} className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 flex flex-col gap-2">
                {/* 카드 헤더 — 번호/종류/이동/삭제 */}
                <div className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-stone-300 font-semibold text-right">{idx + 1}</span>
                  <Icon size={14} className="text-stone-400 shrink-0" />
                  <span className="text-xs font-semibold text-stone-500 flex-1">{SECTION_KIND_LABELS[section.kind]}</span>
                  {!locked && (
                    <span className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => moveSection(section.id, 'up')} disabled={idx === 0}
                        className="p-1 rounded hover:bg-stone-100 text-stone-400 disabled:opacity-30"><ChevronUp size={13} /></button>
                      <button onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1}
                        className="p-1 rounded hover:bg-stone-100 text-stone-400 disabled:opacity-30"><ChevronDown size={13} /></button>
                      <button onClick={() => removeSection(section.id)}
                        className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </span>
                  )}
                </div>

                {/* 종류별 편집 영역 */}
                {section.kind === 'headline' && (
                  <div className="flex flex-col gap-1.5 pl-7">
                    <input
                      value={section.text} disabled={locked} className={inputCls}
                      placeholder="제품명 (예: 수제 딸기잼 500g)"
                      onChange={(e) => updateSection(section.id, { text: e.target.value })}
                    />
                    <input
                      value={section.subText} disabled={locked} className={inputCls}
                      placeholder="캐치프레이즈 (예: 설탕은 줄이고 과육은 그대로)"
                      onChange={(e) => updateSection(section.id, { subText: e.target.value })}
                    />
                  </div>
                )}

                {section.kind === 'image' && (
                  <div className="flex items-center gap-3 pl-7">
                    <div className="w-20 h-14 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
                      {linkedEntry ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveDisplayUrl(linkedEntry)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 min-w-0 text-xs text-stone-500 truncate">
                          {linkedEntry?.origName
                            ?? (section.ledgerRef ? '(연결된 파일 — 이 기기에 없음)' : '이미지가 지정되지 않았습니다')}
                        </span>
                        {!locked && (
                          <button
                            onClick={() => setPickerTarget((t) => (t === section.id ? null : section.id))}
                            className="shrink-0 text-[11px] font-semibold text-amber-700 hover:text-amber-800 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
                          >
                            {section.ledgerRef ? '이미지 변경' : '이미지 선택'}
                          </button>
                        )}
                      </div>
                      <input
                        value={section.text} disabled={locked} className={inputCls}
                        placeholder="캡션 (선택)"
                        onChange={(e) => updateSection(section.id, { text: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {section.kind === 'text' && (
                  <div className="pl-7">
                    <textarea
                      value={section.text} disabled={locked} rows={3}
                      placeholder="제품 설명 — 빈 줄로 문단을 나눌 수 있습니다"
                      onChange={(e) => updateSection(section.id, { text: e.target.value })}
                      className={clsx(inputCls, 'resize-y leading-relaxed')}
                    />
                  </div>
                )}

                {section.kind === 'features' && (
                  <div className="flex flex-col gap-1.5 pl-7">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="mt-2 w-4 shrink-0 text-[11px] text-stone-300 font-bold text-right">{i + 1}</span>
                        <input
                          value={item.title} disabled={locked} className={clsx(inputCls, 'w-40 shrink-0')}
                          placeholder="특징 제목"
                          onChange={(e) => updateFeatureItem(section, i, { title: e.target.value })}
                        />
                        <input
                          value={item.body} disabled={locked} className={inputCls}
                          placeholder="설명 (선택)"
                          onChange={(e) => updateFeatureItem(section, i, { body: e.target.value })}
                        />
                        {!locked && (
                          <button
                            onClick={() => updateSection(section.id, { items: section.items.filter((_, j) => j !== i) })}
                            disabled={section.items.length <= 1}
                            className="mt-1.5 p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 disabled:opacity-30"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {!locked && (
                      <button
                        onClick={() => updateSection(section.id, { items: [...section.items, { title: '', body: '' }] })}
                        className="self-start flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        <Plus size={12} /> 특징 항목 추가
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 요약 */}
      {sections.length > 0 && (
        <p className="text-xs text-stone-400">
          섹션 {sections.length}개 · 위에서 아래 순서대로 세로형 상세페이지에 배치됩니다
        </p>
      )}
    </div>
  );
}
