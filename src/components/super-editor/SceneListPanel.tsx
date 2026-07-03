'use client';

// 장면(scene) 목록 편집 패널 — 표시/조작 전용 컴포넌트.
// 장면 배열은 소유하지 않고 scenes/onChange로 부모(VideoContentTabs)에 위임한다.
// 원장은 읽기 전용으로만 구독한다(클립/이미지 선택 목록과 썸네일) — 파일 업로드는 "파일 관리" 몫.

import { useState } from 'react';
import {
  Film, Image as ImageIcon, Type, Trash2, ChevronUp, ChevronDown, Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { FileEntry } from '@/lib/super-editor/ledger/types';
import { useOrderedFileEntries } from '@/lib/super-editor/ledger/store';
import { resolveDisplayUrl } from '@/lib/super-editor/ledger/selectors';
import {
  VideoScene, SceneKind, SceneTransition, newScene,
} from '@/lib/super-editor/video/types';

interface Props {
  orderId: string;
  scenes:  VideoScene[];
  onChange: (scenes: VideoScene[]) => void;
  locked?: boolean;
}

const KIND_META: Record<SceneKind, { label: string; icon: typeof Film }> = {
  clip:  { label: '클립',   icon: Film },
  image: { label: '이미지', icon: ImageIcon },
  text:  { label: '텍스트', icon: Type },
};

const TRANSITION_LABELS: Record<SceneTransition, string> = { cut: '컷', fade: '페이드' };

/** 장면이 가리키는 미리보기 URL — 원장 우선, 없으면 srcUrl(구형 마이그레이션분) */
function sceneDisplayUrl(scene: VideoScene, entries: FileEntry[]): string | null {
  if (scene.ledgerRef) {
    const entry = entries.find((e) => e.id === scene.ledgerRef);
    if (entry) return resolveDisplayUrl(entry) || null;
  }
  return scene.srcUrl;
}

function SceneThumb({ scene, entries }: { scene: VideoScene; entries: FileEntry[] }) {
  const Icon = KIND_META[scene.kind].icon;
  const url = scene.kind === 'text' ? null : sceneDisplayUrl(scene, entries);
  return (
    <div className="w-14 h-9 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
      {url ? (
        scene.kind === 'clip'
          ? <video src={url} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
          // 원장 blob URL이라 next/image 최적화 대상이 아님 — 일반 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <Icon size={14} className="text-stone-300" />
      )}
    </div>
  );
}

export function SceneListPanel({ orderId, scenes, onChange, locked = false }: Props) {
  const entries = useOrderedFileEntries(orderId);
  // 열려 있는 미디어 선택기 — 'clip' | 'image' | null
  const [pickerKind, setPickerKind] = useState<'clip' | 'image' | null>(null);

  const pickerEntries = pickerKind === 'clip'
    ? entries.filter((e) => e.kind === 'video')
    : entries.filter((e) => e.kind === 'image');

  function updateScene(id: string, patch: Partial<VideoScene>) {
    onChange(scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeScene(id: string) {
    onChange(scenes.filter((s) => s.id !== id));
  }

  function moveScene(id: string, dir: 'up' | 'down') {
    const idx = scenes.findIndex((s) => s.id === id);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= scenes.length) return;
    const next = [...scenes];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  }

  function addMediaScene(entry: FileEntry) {
    const kind: SceneKind = pickerKind === 'clip' ? 'clip' : 'image';
    onChange([...scenes, newScene(kind, { ledgerRef: entry.id })]);
    setPickerKind(null);
  }

  function addTextScene() {
    onChange([...scenes, newScene('text', { text: '' })]);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 장면 추가 툴바 */}
      {!locked && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPickerKind((k) => (k === 'clip' ? null : 'clip'))}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
              pickerKind === 'clip'
                ? 'border-violet-400 text-violet-700 bg-violet-50'
                : 'border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700',
            )}
          >
            <Film size={14} /> 클립 추가
          </button>
          <button
            onClick={() => setPickerKind((k) => (k === 'image' ? null : 'image'))}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
              pickerKind === 'image'
                ? 'border-violet-400 text-violet-700 bg-violet-50'
                : 'border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700',
            )}
          >
            <ImageIcon size={14} /> 이미지 추가
          </button>
          <button
            onClick={addTextScene}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <Type size={14} /> 텍스트 추가
          </button>
        </div>
      )}

      {/* 미디어 선택기 — 원장의 클립/이미지 목록에서 클릭해 장면으로 추가 */}
      {pickerKind && !locked && (
        <div className="p-3 rounded-2xl border border-violet-200 bg-violet-50/50 flex flex-col gap-2">
          <p className="text-xs font-semibold text-stone-500">
            {pickerKind === 'clip' ? '원장의 영상 클립에서 선택' : '원장의 이미지에서 선택'}
            <span className="font-normal text-stone-400"> — 파일이 없으면 먼저 "파일 관리"에서 올려주세요</span>
          </p>
          {pickerEntries.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">
              {pickerKind === 'clip' ? '올려둔 영상 클립이 없습니다' : '올려둔 이미지가 없습니다'}
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {pickerEntries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => addMediaScene(e)}
                  className="group bg-white border border-stone-200 hover:border-violet-300 rounded-xl overflow-hidden text-left transition-colors"
                >
                  <div className="aspect-video bg-stone-100 flex items-center justify-center overflow-hidden">
                    {e.kind === 'video' ? (
                      <video src={resolveDisplayUrl(e)} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveDisplayUrl(e)} alt={e.origName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="px-2 py-1 text-[10px] font-medium text-stone-600 truncate group-hover:text-violet-700">{e.origName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 장면 목록 */}
      {scenes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-stone-400">
          <Film size={30} className="opacity-30" />
          <p className="text-sm">장면이 없습니다. 클립·이미지·텍스트를 추가해 영상을 구성하세요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {scenes.map((scene, idx) => {
            const meta = KIND_META[scene.kind];
            const Icon = meta.icon;
            return (
              <div key={scene.id} className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-3 py-2">
                <span className="w-5 shrink-0 text-xs text-stone-300 font-semibold text-right">{idx + 1}</span>
                <SceneThumb scene={scene} entries={entries} />
                <Icon size={14} className="text-stone-400 shrink-0" aria-label={meta.label} />

                {/* 내용 — 텍스트 장면은 인라인 편집, 미디어 장면은 파일명 표시 */}
                {scene.kind === 'text' ? (
                  <input
                    value={scene.text}
                    disabled={locked}
                    onChange={(e) => updateScene(scene.id, { text: e.target.value })}
                    placeholder="장면에 표시할 문구"
                    className="flex-1 min-w-0 text-sm border border-transparent hover:border-stone-200 focus:border-violet-300 rounded-lg px-2 py-1 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 min-w-0 text-sm text-stone-600 truncate">
                    {scene.ledgerRef
                      ? (entries.find((e) => e.id === scene.ledgerRef)?.origName
                          ?? '(연결된 파일 — 이 기기에 없음)')
                      : (scene.srcUrl ? scene.srcUrl.split('/').pop() : '(소스 없음)')}
                  </span>
                )}

                {/* 길이(초) — 클립은 비우면 원본 길이 */}
                <span className="flex items-center gap-1 shrink-0">
                  <Clock size={12} className="text-stone-300" />
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    disabled={locked}
                    value={scene.durationSec ?? ''}
                    placeholder={scene.kind === 'clip' ? '원본' : '3'}
                    onChange={(e) => updateScene(scene.id, {
                      durationSec: e.target.value === '' ? null : Math.max(0.5, Number(e.target.value)),
                    })}
                    className="w-16 text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  <span className="text-[10px] text-stone-400">초</span>
                </span>

                {/* 전환 — 이 장면으로 들어올 때. 첫 장면은 의미 없어 비활성 */}
                <select
                  value={scene.transition}
                  disabled={locked || idx === 0}
                  onChange={(e) => updateScene(scene.id, { transition: e.target.value as SceneTransition })}
                  className="shrink-0 text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
                  title="이 장면으로 들어올 때의 전환"
                >
                  {(Object.keys(TRANSITION_LABELS) as SceneTransition[]).map((t) => (
                    <option key={t} value={t}>{TRANSITION_LABELS[t]}</option>
                  ))}
                </select>

                {!locked && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => moveScene(scene.id, 'up')} disabled={idx === 0}
                      className="p-1 rounded hover:bg-stone-100 text-stone-400 disabled:opacity-30"><ChevronUp size={13} /></button>
                    <button onClick={() => moveScene(scene.id, 'down')} disabled={idx === scenes.length - 1}
                      className="p-1 rounded hover:bg-stone-100 text-stone-400 disabled:opacity-30"><ChevronDown size={13} /></button>
                    <button onClick={() => removeScene(scene.id)}
                      className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 요약 */}
      {scenes.length > 0 && (() => {
        const fixedSec = scenes.reduce((sum, s) => sum + (s.durationSec ?? 0), 0);
        const openClips = scenes.filter((s) => s.kind === 'clip' && s.durationSec === null).length;
        return (
          <p className="text-xs text-stone-400">
            장면 {scenes.length}개 · 지정 길이 합계 {Math.round(fixedSec * 10) / 10}초
            {openClips > 0 && ` (+ 원본 길이 클립 ${openClips}개)`}
          </p>
        );
      })()}
    </div>
  );
}
