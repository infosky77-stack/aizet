'use client';

// 조립 회차(3·4·5편) 편집 화면 — EducationContentTabs가 isAssemblySnapshot일 때 렌더.
// 화면 2조각: 여러 조립 유닛을 목록으로 쌓고(추가/삭제), 회차 번호·제목을 편집하며,
// 모든 변경을 snapshot.assembly.units에 반영해 기존 디바운스 저장(onChange=patchSnapshot)에
// 흘려보낸다. 상태 조작은 전부 assemblyDocStore/assemblyEditorStore(목록·필드)와
// assemblyCompose(입력 분해)를 재사용한다 — 이 컴포넌트에 분해·편집·목록 로직은 없다.
// 발음 편집·이미지 부착·미리보기는 다음 조각.

import { buildAssemblyUnit } from '@/lib/super-editor/education/assemblyCompose';
import {
  getUnits, addUnit, removeUnit, replaceUnit, setEpisodeNo, setTitle,
} from '@/lib/super-editor/education/assemblyDocStore';
import { setResult, setKind } from '@/lib/super-editor/education/assemblyEditorStore';
import type {
  AssemblyKind, AssemblyUnit, EducationSnapshot,
} from '@/lib/super-editor/education/types';

interface AssemblyContentEditorProps {
  snapshot: EducationSnapshot;
  /** 기존 디바운스 저장에 물릴 콜백 — docStore/editorStore가 만든 새 스냅샷을 그대로 넘긴다 */
  onChange: (next: EducationSnapshot) => void;
  isPaid?: boolean;
}

const inputCls = 'text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50';

const KIND_OPTIONS: { value: AssemblyKind; label: string; hint: string; placeholder: string }[] = [
  { value: 'syllable', label: '자모 → 글자', hint: '한 글자를 자모로 분해 (가 → ㄱ ㅏ)', placeholder: '가' },
  { value: 'word', label: '글자 → 단어', hint: '단어를 음절로 분해 (가방 → 가 방)', placeholder: '가방' },
  { value: 'sentence', label: '단어 → 문장', hint: '문장을 어절로 분해 (가방을 메요 → 가방을 · 메요)', placeholder: '가방을 메요' },
];

export function AssemblyContentEditor({ snapshot, onChange, isPaid = false }: AssemblyContentEditorProps) {
  const units = getUnits(snapshot);

  return (
    <div className="flex flex-col gap-4">
      {/* 회차 메타 — 번호·제목 */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-800">조립 회차 편집 (조립 학습)</h3>
          <p className="text-[11px] text-stone-400 mt-0.5">
            부품이 모여 글자·단어·문장이 되는 과정을 만듭니다 — 유닛을 순서대로 쌓으세요
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            회차 번호
            <input
              type="number" min={1} value={snapshot.episodeNo} disabled={isPaid}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) onChange(setEpisodeNo(snapshot, n));
              }}
              className={`${inputCls} w-20`}
              aria-label="회차 번호"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 flex-1 min-w-48">
            제목
            <input
              value={snapshot.title} disabled={isPaid} placeholder="회차 제목"
              onChange={(e) => onChange(setTitle(snapshot, e.target.value))}
              className={`${inputCls} flex-1 min-w-0 font-semibold`}
              aria-label="회차 제목"
            />
          </label>
        </div>
      </div>

      {/* 유닛 목록 */}
      {units.map((unit, i) => (
        <AssemblyUnitCard
          key={unit.id}
          index={i}
          unit={unit}
          isPaid={isPaid}
          onResult={(v) => onChange(replaceUnit(snapshot, setResult(unit, v)))}
          onKind={(k) => onChange(replaceUnit(snapshot, setKind(unit, k)))}
          onRemove={() => onChange(removeUnit(snapshot, unit.id))}
        />
      ))}

      {!isPaid && (
        <button
          onClick={() => onChange(addUnit(snapshot, buildAssemblyUnit('syllable', '')))}
          className="self-start flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-violet-700 px-3 py-2 rounded-xl hover:bg-violet-50 transition-colors"
        >
          + 조립 유닛 추가
        </button>
      )}

      <p className="text-[11px] text-stone-400">
        이 유닛들에서 조립 영상·카드·이북이 만들어집니다 — 뜻 그림·발음은 다음 단계에서 연결합니다
      </p>
    </div>
  );
}

interface AssemblyUnitCardProps {
  index: number;
  unit: AssemblyUnit;
  isPaid: boolean;
  onResult: (value: string) => void;
  onKind: (kind: AssemblyKind) => void;
  onRemove: () => void;
}

function AssemblyUnitCard({ index, unit, isPaid, onResult, onKind, onRemove }: AssemblyUnitCardProps) {
  const active = KIND_OPTIONS.find((o) => o.value === unit.kind) ?? KIND_OPTIONS[0];
  const typed = unit.resultKo.trim().length > 0;
  const parts = unit.parts;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-6 shrink-0 text-xs text-stone-300 font-bold text-right">{index + 1}</span>
        {/* 입력 단위(kind) */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {KIND_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => onKind(o.value)}
              disabled={isPaid}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors disabled:opacity-50 ${
                unit.kind === o.value
                  ? 'border-violet-400 text-violet-700 bg-violet-50'
                  : 'border-stone-200 text-stone-500 hover:border-violet-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {!isPaid && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-stone-300 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
            aria-label="유닛 삭제"
          >
            ✕
          </button>
        )}
      </div>

      {/* 결과 입력 */}
      <input
        value={unit.resultKo} disabled={isPaid}
        onChange={(e) => onResult(e.target.value)}
        placeholder={`결과 (예: ${active.placeholder})`}
        className={`${inputCls} w-full text-lg font-semibold`}
        aria-label="조립 결과 문자열"
      />

      {/* 자동분해 부품 표시 */}
      {!typed ? (
        <p className="text-xs text-stone-400 py-3 text-center border border-dashed border-stone-200 rounded-xl">
          결과를 입력하면 부품으로 자동 분해됩니다 · {active.hint}
        </p>
      ) : parts.length === 0 ? (
        <p className="text-xs text-amber-600 py-3 text-center border border-dashed border-amber-200 rounded-xl bg-amber-50/50">
          분해할 수 없는 입력입니다 — 입력 단위를 확인해 주세요
          {unit.kind === 'syllable' && ' (자모는 완성된 한 글자를 넣어주세요)'}
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
  );
}
