import { OrderStatus } from '@/types/order';
import { clsx } from 'clsx';

const CONFIG: Record<OrderStatus, { label: string; class: string }> = {
  pending:             { label: '대기',    class: 'bg-yellow-100 text-yellow-700 border-yellow-200'  },
  confirmed:           { label: '접수',    class: 'bg-blue-100   text-blue-700   border-blue-200'    },
  preparing:           { label: '조리 중', class: 'bg-orange-100 text-orange-700 border-orange-200'  },
  ready:               { label: '완료',    class: 'bg-green-100  text-green-700  border-green-200'   },
  delivered:           { label: '서빙',    class: 'bg-stone-100  text-stone-600  border-stone-200'   },
  cancelled:           { label: '취소',    class: 'bg-red-100    text-red-600    border-red-200'     },
  refunded:            { label: '환불완료', class: 'bg-red-200    text-red-800    border-red-300'    },
  partially_refunded:  { label: '부분환불', class: 'bg-orange-100 text-orange-800 border-orange-300' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, class: cls } = CONFIG[status];
  return (
    <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border', cls)}>
      {label}
    </span>
  );
}
