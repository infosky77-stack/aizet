'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Upload, Image, Film, Music, Trash2, Loader2,
  HardDrive, X, Download, FileQuestion, RotateCcw,
} from 'lucide-react';
import { clsx } from 'clsx';

type FileType = 'image' | 'video' | 'audio';

interface SEFile {
  id:         string;
  user_id:    string;
  filename:   string;
  orig_name:  string;
  file_type:  FileType;
  mime_type:  string;
  size_bytes: number;
  created_at: number;
}

interface DriveFile {
  id:       string;
  name:     string;
  mimeType: string;
  size:     string;
}

const TYPE_TABS: { key: FileType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all',   label: '전체',  icon: <FileQuestion size={13} /> },
  { key: 'image', label: '이미지', icon: <Image size={13} /> },
  { key: 'video', label: '영상',  icon: <Film size={13} /> },
  { key: 'audio', label: '오디오', icon: <Music size={13} /> },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type, className }: { type: FileType; className?: string }) {
  if (type === 'image') return <Image size={32} className={className} />;
  if (type === 'video') return <Film  size={32} className={className} />;
  return <Music size={32} className={className} />;
}

function SuperEditorFilesContent() {
  const router = useRouter();
  // 파일관리자는 ?siteId= 로 진입한다(없으면 옛 방식). 서빙 URL에 이 siteId를 실어 보내면
  // 서빙 라우트가 new(sites/<siteId>/) 우선·old 폴백으로 처리한다. siteId 없으면 안 붙임(하위호환).
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');
  const [files,       setFiles]       = useState<SEFile[]>([]);
  const [activeTab,   setActiveTab]   = useState<FileType | 'all'>('all');
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [showDrive,   setShowDrive]   = useState(false);
  const [driveFiles,  setDriveFiles]  = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [importing,   setImporting]   = useState<string | null>(null);
  const [showTrash,   setShowTrash]   = useState(false); // 휴지통(소프트 삭제된 것) 보기 토글
  const [restoring,   setRestoring]   = useState<string | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // siteId·trash 쿼리를 안전하게 조합(URLSearchParams가 인코딩 처리). 둘 다 없으면 빈 쿼리.
  function filesUrl(extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (siteId) params.set('siteId', siteId);
    if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
    const qs = params.toString();
    return `/api/admin/super-editor/files${qs ? `?${qs}` : ''}`;
  }

  async function fetchFiles() {
    setLoading(true);
    // showTrash면 휴지통 목록(?trash=1), 아니면 활성 목록. siteId 보유 시 그 사업장 siteDb에서.
    const res = await fetch(filesUrl(showTrash ? { trash: '1' } : undefined));
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchFiles(); }, [showTrash]);

  const displayed = activeTab === 'all'
    ? files
    : files.filter(f => f.file_type === activeTab);

  async function uploadFiles(fileList: FileList) {
    setUploading(true);
    const uploaded: SEFile[] = [];
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      // siteId 보유 시 업로드도 그 사업장 new 경로에 저장(서버가 소비). 없으면 기존 old 저장.
      const res = await fetch(`/api/admin/super-editor/files${siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''}`, { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        uploaded.push(data.file);
      }
    }
    setFiles(prev => [...uploaded, ...prev]);
    setUploading(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  async function handleDelete(id: string) {
    if (!confirm('파일을 삭제하시겠습니까?')) return;
    setDeleting(id);
    // siteId 보유 시 그 사업장 siteDb 레코드를 소프트 삭제(휴지통). 없으면 싱글턴. 실물은 안 지움.
    await fetch(`/api/admin/super-editor/files?fileId=${id}${siteId ? `&siteId=${encodeURIComponent(siteId)}` : ''}`, { method: 'DELETE' });
    setFiles(prev => prev.filter(f => f.id !== id));
    setDeleting(null);
  }

  // 휴지통에서 복구 — deleted_at을 NULL로(서버). 성공 시 휴지통 목록에서 제거(활성으로 되살아남). 실물 무접촉.
  async function handleRestore(id: string) {
    setRestoring(id);
    const res = await fetch(filesUrl(), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: id }),
    });
    if (res.ok) setFiles(prev => prev.filter(f => f.id !== id));
    setRestoring(null);
  }

  async function openDrive() {
    setShowDrive(true);
    setDriveLoading(true);
    const res = await fetch('/api/admin/super-editor/files?source=drive');
    if (res.ok) {
      const data = await res.json();
      setDriveFiles(data.files ?? []);
    }
    setDriveLoading(false);
  }

  async function importFromDrive(df: DriveFile) {
    setImporting(df.id);
    // siteId 보유 시 Drive 가져오기도 그 사업장 new 경로에 저장(서버가 소비). 없으면 기존 old 저장.
    const res = await fetch(`/api/admin/super-editor/files${siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driveFileId: df.id,
        driveName:   df.name,
        driveMime:   df.mimeType,
        driveSize:   df.size,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setFiles(prev => [data.file, ...prev]);
    }
    setImporting(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/super-editor')}
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stone-800">파일 관리자</h1>
          <p className="text-sm text-stone-400 mt-0.5">업로드한 소재를 관리하고 편집에 활용하세요</p>
        </div>
        <button
          onClick={() => setShowTrash(v => !v)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 border text-sm font-semibold rounded-xl transition-colors',
            showTrash ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-stone-200 hover:bg-stone-50 text-stone-600',
          )}
        >
          <Trash2 size={14} />
          {showTrash ? '파일 보기' : '휴지통'}
        </button>
        <button
          onClick={openDrive}
          className="flex items-center gap-2 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 text-sm font-semibold rounded-xl transition-colors"
        >
          <HardDrive size={14} />
          구글 드라이브
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-colors',
            uploading ? 'bg-stone-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700',
          )}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? '업로드 중...' : '파일 업로드'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* 드래그앤드롭 존 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-2xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors',
          dragging
            ? 'border-violet-400 bg-violet-50'
            : 'border-stone-200 hover:border-violet-300 hover:bg-stone-50',
        )}
      >
        <Upload size={24} className={dragging ? 'text-violet-500' : 'text-stone-300'} />
        <p className="text-sm text-stone-400">
          {dragging ? '여기에 놓으세요' : '클릭하거나 파일을 끌어다 놓으세요'}
        </p>
        <p className="text-xs text-stone-300">이미지 · 영상 · 오디오 · 최대 200 MB</p>
      </div>

      {/* 타입 필터 탭 */}
      <div className="flex items-center gap-1 border border-stone-200 rounded-xl p-1 bg-stone-50 w-fit">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              activeTab === tab.key
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-stone-500 hover:text-stone-700',
            )}
          >
            {tab.icon}
            {tab.label}
            <span className={clsx(
              'ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full',
              activeTab === tab.key ? 'bg-violet-100 text-violet-600' : 'bg-stone-200 text-stone-400',
            )}>
              {tab.key === 'all' ? files.length : files.filter(f => f.file_type === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* 파일 그리드 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-stone-300" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
          <Upload size={36} className="opacity-20" />
          <p className="text-sm">파일이 없습니다. 업로드해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayed.map(file => (
            <div key={file.id} className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-violet-300 transition-colors">
              {/* 썸네일 */}
              <div className="aspect-video bg-stone-100 flex items-center justify-center relative overflow-hidden">
                {file.file_type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={siteId
                      ? `/api/super-editor-files/${file.user_id}/${file.filename}?siteId=${encodeURIComponent(siteId)}`
                      : `/api/super-editor-files/${file.user_id}/${file.filename}`}
                    alt={file.orig_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon type={file.file_type} className="text-stone-300" />
                )}
                {/* 오버레이: 휴지통 모드면 복구 버튼, 아니면 삭제 버튼 */}
                {showTrash ? (
                  <button
                    onClick={() => handleRestore(file.id)}
                    disabled={restoring === file.id}
                    className="absolute top-1 right-1 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-violet-50 hover:text-violet-600 text-stone-500 text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {restoring === file.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <RotateCcw size={12} />}
                    복구
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={deleting === file.id}
                    className="absolute top-1 right-1 p-1.5 bg-white/80 hover:bg-red-50 hover:text-red-500 text-stone-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {deleting === file.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />}
                  </button>
                )}
              </div>
              {/* 파일 정보 */}
              <div className="px-2.5 py-2">
                <p className="text-xs font-medium text-stone-700 truncate" title={file.orig_name}>
                  {file.orig_name}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">{formatBytes(file.size_bytes)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 구글 드라이브 모달 */}
      {showDrive && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-violet-600" />
                <h2 className="font-bold text-stone-800">구글 드라이브에서 가져오기</h2>
              </div>
              <button onClick={() => setShowDrive(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
                <X size={16} />
              </button>
            </div>
            <p className="px-5 py-2 text-xs text-stone-400 border-b border-stone-100">
              드라이브 AIZET 폴더의 이미지/영상/오디오 파일
            </p>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {driveLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-stone-300" />
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-stone-400">
                  <HardDrive size={32} className="opacity-20" />
                  <p className="text-sm">드라이브 AIZET 폴더에 미디어 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {driveFiles.map(df => {
                    const already = files.some(f => f.orig_name === df.name);
                    return (
                      <div key={df.id} className="flex items-center gap-3 p-3 border border-stone-100 rounded-xl hover:bg-stone-50">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                          {df.mimeType.startsWith('image/') && <Image size={16} className="text-stone-400" />}
                          {df.mimeType.startsWith('video/') && <Film  size={16} className="text-stone-400" />}
                          {df.mimeType.startsWith('audio/') && <Music size={16} className="text-stone-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-stone-700 truncate">{df.name}</p>
                          <p className="text-[10px] text-stone-400">{formatBytes(parseInt(df.size || '0', 10))}</p>
                        </div>
                        <button
                          onClick={() => importFromDrive(df)}
                          disabled={importing === df.id || already}
                          className={clsx(
                            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors',
                            already
                              ? 'bg-stone-100 text-stone-400 cursor-default'
                              : importing === df.id
                              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                              : 'bg-violet-100 hover:bg-violet-200 text-violet-700',
                          )}
                        >
                          {importing === df.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Download size={11} />}
                          {already ? '가져옴' : importing === df.id ? '가져오는 중' : '가져오기'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// useSearchParams(?siteId=)를 쓰므로 Suspense 경계로 감싼다(슈퍼에디터 index page와 동일 패턴).
export default function SuperEditorFilesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-stone-400">불러오는 중…</div>}>
      <SuperEditorFilesContent />
    </Suspense>
  );
}
