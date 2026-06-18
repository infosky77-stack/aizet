import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color?: 'amber' | 'blue' | 'green' | 'rose';
}

const colorMap = {
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  blue:  'bg-blue-50  text-blue-600  border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  rose:  'bg-rose-50  text-rose-600  border-rose-100',
};

export function StatCard({ label, value, sub, icon: Icon, color = 'amber' }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <p className="text-2xl font-bold text-stone-800">{value}</p>
        {sub && <p className="text-xs text-stone-400">{sub}</p>}
      </div>
      <div className={clsx('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', colorMap[color])}>
        <Icon size={18} />
      </div>
    </div>
  );
}
