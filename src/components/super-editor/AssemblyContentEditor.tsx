'use client';

// 조립 회차(3·4·5편) 편집 화면 — EducationContentTabs가 isAssemblySnapshot일 때 렌더.
// 화면 2조각: 여러 조립 유닛을 목록으로 쌓고(추가/삭제), 회차 번호·제목을 편집하며,
// 모든 변경을 snapshot.assembly.units에 반영해 기존 디바운스 저장(onChange=patchSnapshot)에
// 흘려보낸다. 상태 조작은 전부 assemblyDocStore/assemblyEditorStore(목록·필드)와
// assemblyCompose(입력 분해)를 재사용한다 — 이 컴포넌트에 분해·편집·목록 로직은 없다.
// 뜻 이미지 부착은 "원장에서 선택 + 고정 템플릿 프롬프트 안내"(직접 생성·업로드) 방식.
// 자동 생성 배선(회원 키·게이트)은 건드리지 않는다. 미리보기는 다음 조각.

import { useEffect, useState } from 'react';
import { buildAssemblyUnit } from '@/lib/super-editor/education/assemblyCompose';
import {
  getUnits, addUnit, removeUnit, replaceUnit, setEpisodeNo, setTitle,
} from '@/lib/super-editor/education/assemblyDocStore';
import { setResult, setKind, updatePart, setMeaning, setImageRef } from '@/lib/super-editor/education/assemblyEditorStore';
import { buildImagePrompt } from '@/lib/super-editor/education/imagePromptTemplate';
import { renderAssemblyPreviewMp4 } from '@/lib/super-editor/education/assemblyPreviewBrowser';
import { useOrderedFileEntries, useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { resolveDisplayUrl } from '@/lib/super-editor/ledger/selectors';
import type { FileEntry } from '@/lib/super-editor/ledger/types';
import { LOCALE_NATIVE_LABELS, SUPPORTED_LOCALES } from '@/lib/i18n/types';
import type {
  AssemblyKind, AssemblyUnit, EducationSnapshot, StudyLang,
} from '@/lib/super-editor/education/types';

// 학습자 모국어 목록(ko 제외) — 뜻 입력 언어(EducationContentTabs와 같은 관례)
const STUDY_LANGS = SUPPORTED_LOCALES.filter((l): l is StudyLang => l !== 'ko');

interface AssemblyContentEditorProps {
  snapshot: EducationSnapshot;
  /** 기존 디바운스 저장에 물릴 콜백 — docStore/editorStore가 만든 새 스냅샷을 그대로 넘긴다 */
  onChange: (next: EducationSnapshot) => void;
  isPaid?: boolean;
  /** 파일 원장 구독용(뜻 이미지 선택) — EducationContentTabs와 같은 훅을 쓴다 */
  orderId: string;
}

const inputCls = 'text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50';

const KIND_OPTIONS: { value: AssemblyKind; label: string; hint: string; placeholder: string }[] = [
  { value: 'syllable', label: '자모 → 글자', hint: '한 글자를 자모로 분해 (가 → ㄱ ㅏ)', placeholder: '가' },
  { value: 'word', label: '글자 → 단어', hint: '단어를 음절로 분해 (가방 → 가 방)', placeholder: '가방' },
  { value: 'sentence', label: '단어 → 문장', hint: '문장을 어절로 분해 (가방을 메요 → 가방을 · 메요)', placeholder: '가방을 메요' },
];

export function AssemblyContentEditor({ snapshot, onChange, isPaid = false, orderId }: AssemblyContentEditorProps) {
  const units = getUnits(snapshot);
  // 원장 이미지 구독(읽기 전용) — 업로드는 "파일 관리" 몫, 여기선 선택만(EducationContentTabs와 동일)
  const imageEntries = useOrderedFileEntries(orderId).filter((e) => e.kind === 'image');

  // ── 조립 영상 미리보기(로컬 WebCodecs 렌더, 저장 안 함) ──────────────────────
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  // blob URL 정리 — url이 바뀌거나 언마운트되면 이전 URL 해제(메모리 누수 방지)
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function handlePreview() {
    setPreviewBusy(true);
    setPreviewProgress(0);
    setPreviewError(null);
    try {
      // 원장 엔트리 record — 카드/영상 버튼과 동일하게 스토어에서 명령형으로 읽는다
      const entries = useFileLedgerStore.getState().entries;
      const result = await renderAssemblyPreviewMp4(snapshot, entries, {
        // 배경 이미지가 연결됐을 때만 배경 합성(없으면 팔레트 배경으로 조립 자체는 렌더됨)
        hasBackground: !!snapshot.backgroundRef,
        onProgress: setPreviewProgress,
      });
      const url = URL.createObjectURL(new Blob([result.bytes as BlobPart], { type: 'video/mp4' }));
      setPreviewUrl(url); // 이전 url은 위 effect cleanup이 해제
    } catch (err) {
      console.error('[조립 미리보기] 렌더 실패:', err);
      setPreviewError(err instanceof Error ? err.message : '미리보기 생성에 실패했습니다');
    } finally {
      setPreviewBusy(false);
    }
  }

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
          imageEntries={imageEntries}
          onResult={(v) => onChange(replaceUnit(snapshot, setResult(unit, v)))}
          onKind={(k) => onChange(replaceUnit(snapshot, setKind(unit, k)))}
          onPart={(pi, pron) => onChange(replaceUnit(snapshot, updatePart(unit, pi, { pronunciation: pron })))}
          onRomanization={(v) => onChange(replaceUnit(snapshot, { ...unit, romanization: v }))}
          onMeaning={(lang, v) => onChange(replaceUnit(snapshot, setMeaning(unit, lang, v)))}
          onImage={(ref) => onChange(replaceUnit(snapshot, setImageRef(unit, ref)))}
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

      {/* 조립 영상 미리보기 — 로컬 WebCodecs 렌더(서버 부담 0, 저장 안 함, 순수 확인용) */}
      <div className="flex flex-col gap-2 bg-white border border-stone-200 rounded-2xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePreview}
            disabled={previewBusy || units.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-violet-300 text-violet-700 bg-violet-50 hover:border-violet-400 transition-colors disabled:opacity-50"
          >
            {previewBusy ? `생성 중… ${Math.round(previewProgress * 100)}%` : '조립 영상 미리보기'}
          </button>
          <span className="text-[11px] text-stone-400">브라우저에서 바로 렌더합니다(저장 안 함)</span>
        </div>
        {previewError && (
          <p className="text-[11px] text-red-500">{previewError}</p>
        )}
        {previewUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={previewUrl} controls loop className="w-full max-w-2xl rounded-xl border border-stone-200 bg-black" />
        )}
      </div>
    </div>
  );
}

interface AssemblyUnitCardProps {
  index: number;
  unit: AssemblyUnit;
  isPaid: boolean;
  imageEntries: FileEntry[];
  onResult: (value: string) => void;
  onKind: (kind: AssemblyKind) => void;
  onPart: (partIndex: number, pronunciation: string) => void;
  onRomanization: (value: string) => void;
  onMeaning: (lang: StudyLang, value: string) => void;
  onImage: (ref: string | null) => void;
  onRemove: () => void;
}

function AssemblyUnitCard({
  index, unit, isPaid, imageEntries, onResult, onKind, onPart, onRomanization, onMeaning, onImage, onRemove,
}: AssemblyUnitCardProps) {
  const active = KIND_OPTIONS.find((o) => o.value === unit.kind) ?? KIND_OPTIONS[0];
  const typed = unit.resultKo.trim().length > 0;
  const parts = unit.parts;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [meaningOpen, setMeaningOpen] = useState(false);
  // 뜻이 하나라도 입력돼 있으면 몇 개 채워졌는지 배지에 표시(접힌 상태 힌트)
  const filledMeanings = STUDY_LANGS.filter((l) => unit.meaning[l].trim()).length;
  const linked = unit.imageRef ? imageEntries.find((e) => e.id === unit.imageRef) ?? null : null;
  const prompt = buildImagePrompt(unit);

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

      {/* 결과 입력 + 로마자 + 뜻(en) */}
      <input
        value={unit.resultKo} disabled={isPaid}
        onChange={(e) => onResult(e.target.value)}
        placeholder={`결과 (예: ${active.placeholder})`}
        className={`${inputCls} w-full text-lg font-semibold`}
        aria-label="조립 결과 문자열"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={unit.romanization} disabled={isPaid}
          onChange={(e) => onRomanization(e.target.value)}
          placeholder="로마자 (예: ga)"
          className={`${inputCls} w-36`}
          aria-label="로마자"
        />
        {/* 5개국어 뜻은 기본 접힘 — 카드 밀도를 낮춘다. 토글은 로컬 UI 상태(저장 안 함) */}
        <button
          onClick={() => setMeaningOpen((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-violet-700 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:border-violet-300 transition-colors"
        >
          뜻 입력{filledMeanings > 0 ? ` (${filledMeanings})` : ''} {meaningOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* 펼침 시에만 언어별 뜻 입력칸 — 동작은 기존과 동일(setMeaning → replaceUnit → onChange) */}
      {meaningOpen && (
        <div className="flex flex-col gap-1.5 pl-1">
          {STUDY_LANGS.map((lang) => (
            <label key={lang} className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-stone-400 w-10 shrink-0 text-right">
                {LOCALE_NATIVE_LABELS[lang]}
              </span>
              <input
                value={unit.meaning[lang]} disabled={isPaid}
                onChange={(e) => onMeaning(lang, e.target.value)}
                placeholder={`뜻 (${LOCALE_NATIVE_LABELS[lang]})`}
                className={`${inputCls} flex-1 min-w-0`}
                aria-label={`뜻 (${LOCALE_NATIVE_LABELS[lang]})`}
              />
            </label>
          ))}
        </div>
      )}

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
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-end gap-2">
            {parts.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-16 px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="text-3xl font-bold text-stone-800 leading-none">{p.glyph}</span>
                {/* 부품 발음 편집 — 자동분해 초안을 제작자가 다듬는다 */}
                <input
                  value={p.pronunciation} disabled={isPaid}
                  onChange={(e) => onPart(i, e.target.value)}
                  placeholder="발음"
                  className="w-14 text-center text-[11px] border border-stone-200 rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50"
                  aria-label={`${p.glyph} 발음`}
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-stone-400">부품 아래 칸에서 발음 표기를 다듬을 수 있습니다</p>
        </div>
      )}

      {/* 뜻 이미지 부착 — 원장에서 선택 + 고정 템플릿 프롬프트 안내(직접 생성·업로드) */}
      <div className="flex flex-col gap-2 pt-1 border-t border-stone-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-stone-500">뜻 이미지</span>
          {linked ? (
            <>
              {/* 원장 blob URL이라 next/image 최적화 대상이 아님 — 일반 img 사용 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveDisplayUrl(linked)} alt={linked.origName} className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
              <span className="text-[11px] text-stone-400 truncate max-w-40">{linked.origName}</span>
              {!isPaid && (
                <button
                  onClick={() => onImage(null)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  해제
                </button>
              )}
            </>
          ) : unit.imageRef ? (
            <span className="text-[11px] text-amber-600">연결된 이미지를 원장에서 찾지 못했습니다(파일 관리 확인)</span>
          ) : (
            <span className="text-[11px] text-stone-400">아직 연결 안 됨</span>
          )}
          {!isPaid && (
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
            >
              {pickerOpen ? '닫기' : linked ? '변경' : '뜻 이미지 연결'}
            </button>
          )}
        </div>

        {pickerOpen && !isPaid && (
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-violet-200 bg-violet-50/50">
            {imageEntries.length === 0 ? (
              <p className="text-[11px] text-stone-400 py-2 text-center">올려둔 이미지가 없습니다 — &ldquo;파일 관리&rdquo;에서 먼저 업로드하세요</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {imageEntries.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { onImage(e.id); setPickerOpen(false); }}
                    className={`group bg-white border rounded-xl overflow-hidden text-left transition-colors ${
                      unit.imageRef === e.id ? 'border-emerald-400' : 'border-stone-200 hover:border-violet-300'
                    }`}
                  >
                    <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resolveDisplayUrl(e)} alt={e.origName} className="w-full h-full object-cover" />
                    </div>
                    <p className="px-2 py-1 text-[10px] font-medium text-stone-600 truncate group-hover:text-violet-700">{e.origName}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 생성 안내 — 이 프롬프트로 만들어 업로드 후 위에서 선택(자동 생성 아님) */}
        {prompt && !isPaid && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-stone-200 bg-stone-50">
            <p className="text-[11px] text-stone-700 leading-relaxed break-words">{prompt}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { void navigator.clipboard?.writeText(prompt); }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
              >
                프롬프트 복사
              </button>
              <a
                href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
              >
                Google AI Studio 열기 ↗
              </a>
            </div>
            <p className="text-[11px] text-stone-400">
              이 프롬프트로 이미지를 만든 뒤, 파일 관리에 업로드하고 위에서 선택하세요. (직접 생성·업로드 방식)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
