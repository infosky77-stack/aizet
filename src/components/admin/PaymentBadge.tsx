import { PaymentStatus, PaymentMethod } from '@/types/order';
import { clsx } from 'clsx';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  card: '카드',
  cash: '현금',
  kakao: '카카오페이',
  naver: '네이버페이',
};

interface Props {
  status: PaymentStatus;
  method?: PaymentMethod;
}

export function PaymentBadge({ status, method }: Props) {
  return (
    <span
      className={clsx(
        'text-[11px] font-semibold px-2 py-0.5 rounded-full',
        status === 'paid' && 'bg-emerald-100 text-emerald-700',
        status === 'pending' && 'bg-blue-100 text-blue-700',
        status === 'unpaid' && 'bg-stone-100 text-stone-500'
      )}
    >
      {status === 'paid' && `결제완료${method ? ` · ${METHOD_LABEL[method]}` : ''}`}
      {status === 'pending' && '결제요청중'}
      {status === 'unpaid' && '미결제'}
    </span>
  );
}
