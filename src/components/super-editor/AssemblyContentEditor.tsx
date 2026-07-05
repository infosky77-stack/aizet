'use client';

// 조립 회차(3·4·5편) 편집 화면 — EducationContentTabs가 isAssemblySnapshot일 때 렌더.
// 이번 조각은 "입력 → 자동분해 → 부품 표시"까지만: 결과 문자열을 넣으면 buildAssemblyUnit
// (C단계 assemblyCompose)로 즉시 분해해 부품을 미리 보여준다. 유닛 목록·추가·저장·발음
// 편집·이미지·미리보기는 다음 조각. 분해 로직은 재구현하지 않고 assemblyCompose만 쓴다.

import { useMemo, useState } from 'react';
import { buildAssemblyUnit } from '@/lib/super-editor/education/assemblyCompose';
import type { AssemblyKind, EducationSnapshot } from '@/lib/super-editor/education/types';

interface AssemblyContentEditorProps {
  snapshot: EducationSnapshot;
  /** 기존 디바운스 저장에 물릴 콜백 — 이번 조각은 배선만(로컬 미리보기라 아직 호출 안 함) */
  onChange: (next: EducationSnapshot) => void;
}

const inputCls = 'text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300';

const KIND_OPTIONS: { value: AssemblyKind; label: string; hint: string; placeholder: string }[] = [
  { value: 'syllable', label: '자모 → 글자', hint: '한 글자를 자모로 분해 (가 → ㄱ ㅏ)', placeholder: '가' },
  { value: 'word', label: '글자 → 단어', hint: '단어를 음절로 분해 (가방 → 가 방)', placeholder: '가방' },
  { value: 'sentence', label: '단어 → 문장', hint: '문장을 어절로 분해 (가방을 메요 → 가방을 · 메요)', placeholder: '가방을 메요' },
];

export function AssemblyContentEditor({ snapshot }: AssemblyContentEditorProps) {
  const [kind, setKind] = useState<AssemblyKind>('syllable');
  const [resultKo, setResultKo] = useState('');

  // 입력이 바뀔 때마다 즉시 자동분해(assemblyCompose) — 미리보기용 임시 유닛 1개
  const preview = useMemo(() => buildAssemblyUnit(kind, resultKo), [kind, resultKo]);
  const parts = preview.parts;
  const active = KIND_OPTIONS.find((o) => o.value === kind)!;
  const typed = resultKo.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 bg-white border border-stone-200 rounded-2xl p-5">
      <div>
        <h3 className="text-base font-bold text-stone-800">조립 회차 편집 (조립 학습)</h3>
        <p className="text-xs text-stone-400 mt-0.5 truncate">
          {snapshot.title || '제목 없음'} · 부품이 모여 글자·단어·문장이 되는 과정을 만듭니다
        </p>
      </div>

      {/* 입력 단위(kind) 선택 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-stone-500">입력 단위</span>
        <div className="flex flex-wrap gap-1.5">
          {KIND_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setKind(o.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                kind === o.value
                  ? 'border-violet-400 text-violet-700 bg-violet-50'
                  : 'border-stone-200 text-stone-500 hover:border-violet-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-400">{active.hint}</p>
      </div>

      {/* 결과 입력 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-stone-500">결과</span>
        <input
          value={resultKo}
          onChange={(e) => setResultKo(e.target.value)}
          placeholder={`예: ${active.placeholder}`}
          className={`${inputCls} w-full text-lg font-semibold`}
          aria-label="조립 결과 문자열"
        />
      </div>

      {/* 자동분해 결과(부품) 표시 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-stone-500">분해된 부품</span>
        {!typed ? (
          <p className="text-xs text-stone-400 py-4 text-center border border-dashed border-stone-200 rounded-xl">
            위에 결과를 입력하면 부품으로 자동 분해됩니다
          </p>
        ) : parts.length === 0 ? (
          <p className="text-xs text-amber-600 py-4 text-center border border-dashed border-amber-200 rounded-xl bg-amber-50/50">
            분해할 수 없는 입력입니다 — 입력 단위를 확인해 주세요
            {kind === 'syllable' && ' (자모는 완성된 한 글자를 넣어주세요)'}
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            {parts.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-16 px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="text-3xl font-bold text-stone-800 leading-none">{p.glyph}</span>
                <span className="text-[11px] text-stone-400">{p.pronunciation}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
