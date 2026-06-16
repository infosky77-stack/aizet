import { UtensilsCrossed } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

// Strips ORDER_CONFIRMED block from visible text
function cleanText(text: string) {
  return text.replace(/<<<ORDER_CONFIRMED>>>[\s\S]*?<<<END_ORDER>>>/g, '').trim();
}

export function ChatBubble({ role, content, streaming }: Props) {
  const isUser = role === 'user';
  const visibleText = cleanText(content);

  return (
    <div className={clsx('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center mt-1">
          <UtensilsCrossed size={14} className="text-white" />
        </div>
      )}

      <div
        className={clsx(
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-amber-600 text-white rounded-tr-sm'
            : 'bg-white text-stone-800 rounded-tl-sm shadow-sm border border-stone-100'
        )}
      >
        {visibleText}
        {streaming && (
          <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
