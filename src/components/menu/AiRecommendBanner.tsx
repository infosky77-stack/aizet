'use client';

import { useState } from 'react';
import { Sparkles, ChevronRight, X } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { useCartStore } from '@/store/cart';

export function AiRecommendBanner() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MenuItem[]>([]);
  const [prefs, setPrefs] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  async function handleRecommend() {
    setLoading(true);
    setResults([]);
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefs ? [prefs] : [] }),
    });
    const data = await res.json();
    setResults(data.items ?? []);
    setLoading(false);
  }

  return (
    <>
      {/* Banner button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles size={20} />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm">AI 메뉴 추천</p>
          <p className="text-xs text-amber-100">취향에 맞는 메뉴를 골라드려요</p>
        </div>
        <ChevronRight size={18} className="text-amber-200" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-600" />
                <h3 className="font-bold">AI 메뉴 추천</h3>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1.5">
                  오늘 어떤 게 끌리세요?
                </label>
                <input
                  type="text"
                  placeholder="예) 매운 거, 가볍게, 달달한 거..."
                  value={prefs}
                  onChange={(e) => setPrefs(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <button
                onClick={handleRecommend}
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? '추천 중...' : '추천받기'}
              </button>

              {results.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-stone-500">AI 추천 메뉴</p>
                  {results.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{item.nameKo}</p>
                        <p className="text-xs text-stone-500 truncate">{item.description}</p>
                        <p className="text-xs font-bold text-amber-700 mt-0.5">{item.price.toLocaleString()}원</p>
                      </div>
                      <button
                        onClick={() => { addItem(item); setOpen(false); }}
                        className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        담기
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!loading && results.length === 0 && prefs && (
                <p className="text-sm text-stone-400 text-center">조건에 맞는 메뉴를 찾지 못했어요</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
