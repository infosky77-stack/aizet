'use client';

// 영상 자막 편집 패널 — 언어 탭 + 큐 목록 편집 + 장면 기반 초안 생성 + SRT/VTT 다운로드.
// 자막 데이터는 소유하지 않고 subtitles/onChange로 부모(VideoContentTabs)에 위임한다
// (SceneListPanel과 같은 위상). 파일 생성은 전부 브라우저(buildSubtitleFile, 서버 왕복 0).
// 자막은 영상에 번인되지 않는다 — 언어별 .srt/.vtt를 받아 유튜브에 언어별 자막으로 업로드.

import { useState } from 'react';
import { Captions, Download, Plus, Trash2, WandSparkles, TriangleAlert } from 'lucide-react';
import { clsx } from 'clsx';
import type {
  SubtitleCue, VideoProjectSnapshot, VideoSubtitles,
} from '@/lib/super-editor/video/types';
import {
  buildSubtitleFile, draftCuesFromScenes, type SubtitleFormat,
} from '@/lib/super-editor/video/buildSubtitleFile';
import type { OutputNotice } from '@/lib/super-editor/output/types';
import { SUPPORTED_LOCALES, LOCALE_NATIVE_LABELS, type Locale } from '@/lib/i18n/types';

interface Props {
  title:     string;
  project:   VideoProjectSnapshot;
  onChange:  (subtitles: VideoSubtitles) => void;
  locked?:   boolean;
}

const numCls = 'w-[4.5rem] text-sm border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50';
const textCls = 'flex-1 min-w-0 text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50';

export function SubtitlePanel({ title, project, onChange, locked = false }: Props) {
  const [lang, setLang] = useState<Locale>('ko');
  const [notices, setNotices] = useState<OutputNotice[]>([]);
  const cues = project.subtitles?.[lang] ?? [];

  function setCues(next: SubtitleCue[]) {
    onChange({ ...project.subtitles, [lang]: next });
  }

  function updateCue(i: number, patch: Partial<SubtitleCue>) {
    setCues(cues.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  function addCue() {
    const last = cues[cues.length - 1];
    const start = last ? last.endSec : 0;
    setCues([...cues, { startSec: start, endSec: start + 3, text: '' }]);
  }

  // 장면 타이밍에서 초안 생성 — 기존 큐가 있으면 덮어쓰기 확인(초안은 출발점일 뿐)
  function generateDraft() {
    if (cues.length > 0 && !confirm(`${LOCALE_NATIVE_LABELS[lang]} 자막 ${cues.length}개를 장면 기반 초안으로 덮어쓸까요?`)) return;
    const draft = draftCuesFromScenes(project);
    setNotices(draft.notices);
    setCues(draft.cues);
  }

  function download(format: SubtitleFormat) {
    const result = buildSubtitleFile(cues, format);
    setNotices(result.notices);
    const blob = new Blob([result.bytes as BlobPart], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || '영상'}-자막-${lang}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasText = cues.some((c) => c.text.trim());

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
      {/* 헤더 — 설명 + 초안/다운로드 액션 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Captions size={15} className="text-stone-400 shrink-0" />
        <p className="text-sm font-bold text-stone-700">자막 (다국어)</p>
        <p className="text-[11px] text-stone-400 flex-1">
          영상에 굽지 않고 언어별 파일로 내보냅니다 — 유튜브 자막 업로드용
        </p>
        {!locked && (
          <button
            onClick={generateDraft}
            disabled={project.scenes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-40 transition-colors"
          >
            <WandSparkles size={12} /> 장면에서 초안 생성
          </button>
        )}
        <button
          onClick={() => download('srt')} disabled={!hasText}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white transition-colors"
        >
          <Download size={12} /> SRT
        </button>
        <button
          onClick={() => download('vtt')} disabled={!hasText}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white transition-colors"
        >
          <Download size={12} /> VTT
        </button>
      </div>

      {/* 언어 탭 — 큐가 있는 언어는 개수 표시 */}
      <div className="flex items-center gap-1 flex-wrap">
        {SUPPORTED_LOCALES.map((l) => {
          const count = project.subtitles?.[l]?.length ?? 0;
          return (
            <button
              key={l}
              onClick={() => { setLang(l); setNotices([]); }}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors',
                lang === l ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600',
              )}
            >
              {LOCALE_NATIVE_LABELS[l]}
              {count > 0 && <span className="text-[9px] opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 생성/다운로드 보고 — output 계약의 notices를 그대로 노출 */}
      {notices.length > 0 && (
        <div className="flex flex-col gap-1">
          {notices.map((n, i) => (
            <p key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700">
              <TriangleAlert size={11} className="shrink-0 mt-0.5" />
              <span><span className="font-semibold">{n.label}</span> — {n.reason}</span>
            </p>
          ))}
        </div>
      )}

      {/* 큐 목록 */}
      {cues.length === 0 ? (
        <p className="text-xs text-stone-400 py-4 text-center">
          {LOCALE_NATIVE_LABELS[lang]} 자막이 없습니다 — 초안을 생성하거나 큐를 추가하세요
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {cues.map((cue, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-[11px] text-stone-300 font-bold text-right">{i + 1}</span>
              <input
                type="number" min={0} step={0.1} value={cue.startSec} disabled={locked}
                onChange={(e) => updateCue(i, { startSec: Number(e.target.value) })}
                className={numCls} aria-label="시작(초)"
              />
              <span className="text-stone-300 text-xs shrink-0">→</span>
              <input
                type="number" min={0} step={0.1} value={cue.endSec} disabled={locked}
                onChange={(e) => updateCue(i, { endSec: Number(e.target.value) })}
                className={numCls} aria-label="종료(초)"
              />
              <input
                value={cue.text} disabled={locked} placeholder="자막 문구"
                onChange={(e) => updateCue(i, { text: e.target.value })}
                className={textCls}
              />
              {!locked && (
                <button
                  onClick={() => setCues(cues.filter((_, j) => j !== i))}
                  className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!locked && (
        <button
          onClick={addCue}
          className="self-start flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-violet-700 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
        >
          <Plus size={12} /> 큐 추가
        </button>
      )}
    </div>
  );
}
