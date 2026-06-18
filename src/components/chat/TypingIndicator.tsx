import { UtensilsCrossed } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
        <UtensilsCrossed size={14} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-stone-100 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-stone-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
