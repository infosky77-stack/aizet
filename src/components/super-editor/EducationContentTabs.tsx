'use client';

// 한국어교육 콘텐츠 하나를 열었을 때의 메인 화면 — 유닛(글자) 목록 편집.
// VideoContentTabs와 대칭 구조: 스냅샷의 소유자는 이 컴포넌트(1.5초 디바운스 저장),
// 파일 관리는 z-[120] 전체화면 오버레이, 열림 여부는 부모(URL ?view=files)가 소유.
// product처럼 "전체 편집기에서 열기"는 없다 — 전체 편집기는 catalog/video 캔버스 전제.
//
// 산출물 버튼 자리: 카드 이미지(2단계)·이북(3단계)·영상(4단계)이 헤더에 순서대로 붙는다.
// 삽화/음성은 파일 관리에서 올린 뒤 유닛에 연결하는 방식(2단계에서 연결 UI 추가).

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Files, GripHorizontal, Loader2, Plus, Trash2, X } from 'lucide-react';
import { ContentFileViewer } from '@/components/super-editor/ContentFileViewer';
import { EducationCardButton } from '@/components/super-editor/EducationCardButton';
import {
  type EducationSnapshot, type EducationUnit, type StudyLang, newEducationUnit,
} from '@/lib/super-editor/education/types';
import { resolveEducationSnapshot } from '@/lib/super-editor/education/preset';
import { LOCALE_NATIVE_LABELS, SUPPORTED_LOCALES } from '@/lib/i18n/types';

interface Props {
  orderId: string;
  title:   string;
  isPaid:  boolean;
  /** 파일 관리 오버레이 열림 여부 — 출처는 부모(URL) */
  filesOpen: boolean;
  onFilesOpenChange: (open: boolean) => void;
  onBack: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const STUDY_LANGS = SUPPORTED_LOCALES.filter((l): l is StudyLang => l !== 'ko');

const inputCls = 'text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50';

export function EducationContentTabs({
  orderId, title, isPaid, filesOpen, onFilesOpenChange, onBack,
}: Props) {
  // 스냅샷을 orderId와 묶어 저장 — 다른 콘텐츠로 바뀌면 파생값이 자연히 null(로딩)이
  // 되므로 effect에서 동기 setState로 초기화할 필요가 없다(VideoContentTabs와 동일)
  const [loaded, setLoaded] = useState<{ orderId: string; snapshot: EducationSnapshot } | null>(null);
  const snapshot = loaded?.orderId === orderId ? loaded.snapshot : null;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/super-editor?orderId=${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.order) return;
        let raw: unknown = {};
        try { raw = JSON.parse(data.order.snapshot || '{}'); } catch { /* 프리셋으로 */ }
        setLoaded({ orderId, snapshot: resolveEducationSnapshot(raw, data.order.title || title) });
      });
    return () => { cancelled = true; };
  }, [orderId, title]);

  const persist = useCallback(async (next: EducationSnapshot) => {
    setSaveStatus('saving');
    const res = await fetch('/api/admin/super-editor', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId, snapshot: next, title: next.title }),
    }).catch(() => null);
    setSaveStatus(res?.ok ? 'saved' : 'error');
    if (res?.ok) setTimeout(() => setSaveStatus('idle'), 2000);
  }, [orderId]);

  function patchSnapshot(patch: Partial<EducationSnapshot>) {
    if (!snapshot) return;
    const next = { ...snapshot, ...patch };
    setLoaded({ orderId, snapshot: next });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void persist(next); }, 1500);
  }

  function updateUnit(i: number, patch: Partial<EducationUnit>) {
    if (!snapshot) return;
    patchSnapshot({ units: snapshot.units.map((u, j) => (j === i ? { ...u, ...patch } : u)) });
  }

  // 언마운트 시 대기 중인 저장 타이머 정리(마지막 변경은 다음 열람 때 저장됨)
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> 폴더로
          </button>
          <p className="font-bold text-stone-800 text-sm flex-1 truncate">
            {title || '제목 없음'}
            {saveStatus === 'saving' && <span className="ml-2 text-[11px] font-medium text-stone-400">저장 중…</span>}
            {saveStatus === 'saved'  && <span className="ml-2 text-[11px] font-medium text-emerald-600">저장됨</span>}
            {saveStatus === 'error'  && <span className="ml-2 text-[11px] font-medium text-red-500">저장 실패 — 변경 시 재시도</span>}
          </p>
          <button
            onClick={() => onFilesOpenChange(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <Files size={14} /> 파일 관리
          </button>
          {/* 산출물 버튼 — 카드(2단계) 완료, 이북(3단계)·영상(4단계)이 이어서 붙는다 */}
          <EducationCardButton orderId={orderId} snapshot={snapshot} />
        </div>

        {snapshot === null ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-stone-300" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {snapshot.units.map((unit, i) => (
              <div key={unit.id} className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-xs text-stone-300 font-bold text-right">{i + 1}</span>
                  <input
                    value={unit.char} disabled={isPaid} placeholder="글자"
                    onChange={(e) => updateUnit(i, { char: e.target.value })}
                    className={`${inputCls} w-16 text-center text-2xl font-bold`}
                    aria-label="학습 글자"
                  />
                  <input
                    value={unit.romanization} disabled={isPaid} placeholder="로마자 (예: a)"
                    onChange={(e) => updateUnit(i, { romanization: e.target.value })}
                    className={`${inputCls} w-28`}
                    aria-label="로마자"
                  />
                  <input
                    value={unit.exampleKo} disabled={isPaid} placeholder="예시 단어 (한국어)"
                    onChange={(e) => updateUnit(i, { exampleKo: e.target.value })}
                    className={`${inputCls} flex-1 min-w-0 font-semibold`}
                    aria-label="예시 단어(원문)"
                  />
                  {/* 삽화/음성 연결 상태 — 연결 UI는 2단계(카드)에서 파일 선택기와 함께 */}
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${unit.illustrationRef ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                    삽화 {unit.illustrationRef ? '연결됨' : '없음'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${unit.voiceRef ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                    음성 {unit.voiceRef ? '연결됨' : '없음'}
                  </span>
                  {!isPaid && (
                    <button
                      onClick={() => patchSnapshot({ units: snapshot.units.filter((_, j) => j !== i) })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 shrink-0"
                      aria-label="유닛 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {/* 예시 단어 번역 — ko가 원문, 빈 번역은 표시 단계에서 ko 폴백 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-9">
                  {STUDY_LANGS.map((lang) => (
                    <label key={lang} className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-semibold text-stone-400 w-14 shrink-0 text-right">
                        {LOCALE_NATIVE_LABELS[lang]}
                      </span>
                      <input
                        value={unit.example[lang]} disabled={isPaid}
                        onChange={(e) => updateUnit(i, { example: { ...unit.example, [lang]: e.target.value } })}
                        className={`${inputCls} flex-1 min-w-0`}
                        aria-label={`예시 단어 번역 (${LOCALE_NATIVE_LABELS[lang]})`}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {!isPaid && (
              <button
                onClick={() => patchSnapshot({ units: [...snapshot.units, newEducationUnit()] })}
                className="self-start flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-violet-700 px-3 py-2 rounded-xl hover:bg-violet-50 transition-colors"
              >
                <Plus size={13} /> 유닛 추가
              </button>
            )}

            <p className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <GripHorizontal size={12} className="shrink-0" />
              이 유닛들에서 영상·이북·카드 이미지 세 산출물이 만들어집니다 — 삽화·음성은 파일 관리에 올린 뒤 연결합니다
            </p>
          </div>
        )}
      </div>

      {/* 파일 관리 — 폴더 팝업과 같은 전체화면 오버레이, 한 겹 위(z-120) */}
      {filesOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-stone-800">파일 관리</h2>
                <p className="text-sm text-stone-400 mt-0.5 truncate">{title || '제목 없음'}</p>
              </div>
              <button
                onClick={() => onFilesOpenChange(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ContentFileViewer
                orderId={orderId}
                title={title}
                isPaid={isPaid}
                onBack={() => onFilesOpenChange(false)}
                onOpenFullEditor={() => { /* education은 전체 편집기 미지원 — hideHeader라 노출 안 됨 */ }}
                hideHeader
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
