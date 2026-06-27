'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Users, Building2, Globe, Calendar, ArrowRight, Shield } from 'lucide-react';

const INDUSTRY_LABEL: Record<string, string> = {
  restaurant:    '음식점',
  cafe:          '카페',
  beauty:        '미용실',
  fitness:       '헬스/피트니스',
  retail:        '소매점',
  consulting:    '컨설팅',
  tax:           '세무사',
  clinic:        '클리닉/의원',
  fashion:       '패션/의류',
  pension:       '펜션/숙박',
  print:         '인쇄/출력',
  accommodation: '숙박업',
  education:     '교육',
  shopping:      '쇼핑/유통',
};

interface MemberRow {
  id: string;
  email: string;
  name: string;
  picture: string;
  shop_name: string;
  industry: string;
  slug: string;
  plan: string;
  created_at: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { session, status } = useSession();
  const [members, setMembers]   = useState<MemberRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [entering, setEntering] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.isSuperAdmin) {
      router.replace('/admin');
      return;
    }
    fetch('/api/admin/superadmin/users')
      .then(r => r.json())
      .then(d => setMembers(d.users ?? []))
      .finally(() => setLoading(false));
  }, [session, status, router]);

  async function handleEnter(userId: string) {
    setEntering(userId);
    await fetch('/api/admin/superadmin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId }),
    });
    router.push('/admin');
    router.refresh();
  }

  if (status === 'loading' || loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-stone-400">
        <div className="w-5 h-5 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
        로딩 중...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">통합 관리자</h1>
          <p className="text-sm text-stone-500">실제 가입 회원 사이트 목록</p>
        </div>
        <span className="ml-auto text-sm text-stone-400">{members.length}개 사이트</span>
      </div>

      {/* 회원 카드 목록 */}
      {members.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>아직 사이트를 생성한 회원이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div
              key={m.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              {/* 프로필 */}
              <div className="flex items-center gap-3">
                {m.picture ? (
                  <img src={m.picture} alt={m.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-100" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
                    {m.name?.[0] ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 text-sm truncate">{m.name}</p>
                  <p className="text-xs text-stone-400 truncate">{m.email}</p>
                </div>
                <span className={`ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  m.plan === 'pro' ? 'bg-amber-100 text-amber-700' :
                  m.plan === 'business' ? 'bg-violet-100 text-violet-700' :
                  'bg-stone-100 text-stone-500'
                }`}>
                  {m.plan.toUpperCase()}
                </span>
              </div>

              {/* 사이트 정보 */}
              <div className="flex flex-col gap-1.5 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Building2 size={12} className="text-stone-400 shrink-0" />
                  <span className="truncate">{m.shop_name || '(가게명 없음)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-stone-400 shrink-0" />
                  <span className="text-stone-400">/site/</span>
                  <span className="font-mono truncate">{m.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-stone-400 shrink-0" />
                  <span className="text-stone-400">
                    {new Date(m.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  <span className="ml-auto px-1.5 py-0.5 bg-stone-100 rounded text-stone-500">
                    {INDUSTRY_LABEL[m.industry] ?? (m.industry || '미설정')}
                  </span>
                </div>
              </div>

              {/* 버튼 */}
              <button
                onClick={() => handleEnter(m.id)}
                disabled={entering === m.id}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {entering === m.id ? (
                  <div className="w-4 h-4 border-2 border-stone-600 border-t-white rounded-full animate-spin" />
                ) : (
                  <>이 사이트로 들어가보기 <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
