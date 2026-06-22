'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import { INCOME_TAX_BRACKETS, calcIncomeTax } from '@/lib/tax/data';

type Mode = 'income' | 'vat';

function formatKRW(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.floor(n / 10000).toLocaleString()}만`;
  return n.toLocaleString();
}

export default function TaxCalculatorPage() {
  const [mode, setMode] = useState<Mode>('income');

  // 소득세 계산기
  const [grossIncome, setGrossIncome] = useState('');
  const [deduction, setDeduction] = useState('');
  const [incomeResult, setIncomeResult] = useState<ReturnType<typeof calcIncomeTax> & { taxableIncome: number } | null>(null);

  // 부가세 계산기
  const [salesAmount, setSalesAmount] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [vatIncluded, setVatIncluded] = useState(true);
  const [vatResult, setVatResult] = useState<{ salesVat: number; purchaseVat: number; payable: number } | null>(null);

  function calcIncome() {
    const gross = parseInt(grossIncome.replace(/,/g, '')) || 0;
    const ded = parseInt(deduction.replace(/,/g, '')) || 0;
    const taxableIncome = Math.max(0, gross - ded);
    const result = calcIncomeTax(taxableIncome);
    setIncomeResult({ ...result, taxableIncome });
  }

  function calcVat() {
    const sales = parseFloat(salesAmount.replace(/,/g, '')) || 0;
    const purchase = parseFloat(purchaseAmount.replace(/,/g, '')) || 0;
    const salesBase = vatIncluded ? sales / 1.1 : sales;
    const purchaseBase = vatIncluded ? purchase / 1.1 : purchase;
    const salesVat = Math.floor(salesBase * 0.1);
    const purchaseVat = Math.floor(purchaseBase * 0.1);
    setVatResult({ salesVat, purchaseVat, payable: salesVat - purchaseVat });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={20} className="text-emerald-600" />
          <h1 className="text-2xl font-black text-slate-900">세금 계산기</h1>
        </div>
        <p className="text-slate-700 text-base">실제 세율 구간 적용 · 참고용 계산 결과이며 실제 납부세액과 다를 수 있습니다</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl w-fit">
        {[{ key: 'income', label: '📊 소득세' }, { key: 'vat', label: '🧾 부가세' }].map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key as Mode)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${mode === m.key ? 'bg-white shadow text-slate-900' : 'text-slate-700 hover:text-slate-900'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'income' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">종합소득세 계산</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-slate-800 mb-1.5">총 수입금액 (연간)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="예) 60,000,000"
                    value={grossIncome}
                    onChange={e => setGrossIncome(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-base pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-base">원</span>
                </div>
              </div>
              <div>
                <label className="block text-base font-semibold text-slate-800 mb-1.5">
                  소득공제 합계
                  <span className="ml-2 text-sm font-normal text-slate-600">(인적공제·보험료·의료비 등)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="예) 5,000,000"
                    value={deduction}
                    onChange={e => setDeduction(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-base pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-base">원</span>
                </div>
              </div>
              <button
                onClick={calcIncome}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors"
              >
                소득세 계산하기
              </button>
            </div>
          </div>

          {incomeResult && (
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-4 text-white/90 text-base">계산 결과</h3>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-white/90 mb-1">과세표준</div>
                  <div className="text-2xl font-black">{formatKRW(incomeResult.taxableIncome)}원</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-white/90 mb-1">적용 세율</div>
                  <div className="text-2xl font-black">{(incomeResult.rate * 100).toFixed(0)}%</div>
                  <div className="text-sm text-white/75">+ 지방소득세 10%</div>
                </div>
                <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-400/30">
                  <div className="text-sm text-white/90 mb-1">산출 세액 (국세+지방세)</div>
                  <div className="text-3xl font-black">{incomeResult.tax.toLocaleString()}원</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-white/90 mb-1">실효세율</div>
                  <div className="text-2xl font-black">{(incomeResult.effectiveRate * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-sm text-white/80 flex items-start gap-2">
                <Info size={13} className="shrink-0 mt-0.5" />
                세액공제(근로·자녀·교육비 등)를 적용하면 실제 납부세액은 더 낮아질 수 있습니다.
              </div>
            </div>
          )}

          {/* 세율 구간 표 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 text-base flex items-center gap-2">
              <span>📋</span> 2024년 소득세 세율 구간
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-slate-700 font-semibold">과세표준</th>
                    <th className="text-right py-2 text-slate-700 font-semibold">세율</th>
                    <th className="text-right py-2 text-slate-700 font-semibold">누진공제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {INCOME_TAX_BRACKETS.map((b, i) => {
                    const isActive = incomeResult && incomeResult.bracket.min === b.min;
                    return (
                      <tr key={i} className={isActive ? 'bg-blue-50' : ''}>
                        <td className={`py-2 font-medium ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                          {b.min === 0 ? '1,400만원 이하' : b.max ? `${formatKRW(b.min)} 초과 ~ ${formatKRW(b.max)} 이하` : `${formatKRW(b.min)} 초과`}
                          {isActive && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">적용</span>}
                        </td>
                        <td className={`py-2 text-right font-bold ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>{(b.rate * 100).toFixed(0)}%</td>
                        <td className="py-2 text-right text-slate-700">{b.deduction.toLocaleString()}원</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mode === 'vat' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">부가가치세 계산</h2>

            <div className="flex gap-3 mb-5">
              {[{ v: true, label: '부가세 포함 금액으로 입력' }, { v: false, label: '부가세 별도 (공급가액)' }].map(opt => (
                <button
                  key={String(opt.v)}
                  onClick={() => setVatIncluded(opt.v)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${vatIncluded === opt.v ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 text-slate-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-slate-800 mb-1.5">매출 금액</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" placeholder="예) 11,000,000" value={salesAmount}
                    onChange={e => setSalesAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-base pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-base">원</span>
                </div>
              </div>
              <div>
                <label className="block text-base font-semibold text-slate-800 mb-1.5">매입 금액 (매입세액공제)</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" placeholder="예) 5,500,000" value={purchaseAmount}
                    onChange={e => setPurchaseAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-base pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-base">원</span>
                </div>
              </div>
              <button onClick={calcVat} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors">
                부가세 계산하기
              </button>
            </div>
          </div>

          {vatResult && (
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-4 text-white/90 text-base">계산 결과</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-sm text-white/90 mb-1">매출세액</div>
                  <div className="text-xl font-black">{vatResult.salesVat.toLocaleString()}</div>
                  <div className="text-sm text-white/75">원</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-sm text-white/90 mb-1">매입세액공제</div>
                  <div className="text-xl font-black">-{vatResult.purchaseVat.toLocaleString()}</div>
                  <div className="text-sm text-white/75">원</div>
                </div>
                <div className={`rounded-xl p-4 text-center border ${vatResult.payable >= 0 ? 'bg-amber-500/20 border-amber-400/30' : 'bg-emerald-500/20 border-emerald-400/30'}`}>
                  <div className="text-sm text-white/90 mb-1">{vatResult.payable >= 0 ? '납부세액' : '환급세액'}</div>
                  <div className="text-2xl font-black">{Math.abs(vatResult.payable).toLocaleString()}</div>
                  <div className="text-sm text-white/75">원</div>
                </div>
              </div>
              {vatResult.payable < 0 && (
                <div className="bg-emerald-500/20 rounded-xl p-3 text-sm flex items-center gap-2 border border-emerald-400/30">
                  <span>💡</span>
                  매입세액이 매출세액보다 많아 <strong>환급</strong> 대상입니다. 환급 신청 방법은 AI 상담을 이용해보세요.
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-base text-blue-800">
            <strong>💡 부가세 절세 포인트</strong>
            <ul className="mt-2 text-sm space-y-1 text-blue-800">
              <li>• 사업 관련 매입 세금계산서를 빠짐없이 수취하세요</li>
              <li>• 간이과세자 전환 시 세율이 최저 1.5%~4%로 낮아집니다</li>
              <li>• 신용카드 매출세액공제(연 500만원 한도) 활용하세요</li>
            </ul>
          </div>
        </div>
      )}

      <div className="mt-8 bg-slate-50 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-bold text-slate-800 text-base mb-0.5">더 정확한 세금 계산이 필요하신가요?</p>
          <p className="text-sm text-slate-700">세무사와 1:1 상담으로 맞춤 절세 전략을 받아보세요.</p>
        </div>
        <Link href="/tax/reservation" className="shrink-0 flex items-center gap-1.5 bg-slate-800 text-white text-base font-bold px-5 py-2.5 rounded-xl hover:bg-slate-900 transition-colors">
          상담 예약 <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
