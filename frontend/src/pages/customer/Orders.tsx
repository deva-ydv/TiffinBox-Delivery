import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api';
import { Badge, EmptyState, ErrorState, FilterTabs, LoadingBlock, PageHeader, buttonClass } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';
import { STATUS_LABEL, formatDate, formatPrice } from '../../lib/format';
import type { OrderStatus } from '../../lib/types';

type Filter = OrderStatus | 'ALL';
const OPTIONS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Orders() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const orders = useQuery({
    queryKey: ['orders', 'mine', filter],
    queryFn: () => ordersApi.mine(filter === 'ALL' ? undefined : filter),
  });

  return (
    <>
      <PageHeader title="Orders" description="Every tiffin delivered (or on its way) to you." />
      <FilterTabs label="Filter orders by status" options={OPTIONS} value={filter} onChange={setFilter} />

      <div className="mt-4">
        {orders.isLoading && <LoadingBlock />}
        {orders.isError && <ErrorState message={getErrorMessage(orders.error)} onRetry={() => void orders.refetch()} />}
        {orders.data?.length === 0 && (
          <EmptyState
            title={filter === 'ALL' ? 'No orders yet' : `No ${STATUS_LABEL[filter].toLowerCase()} orders`}
            description={filter === 'ALL' ? 'Orders are created each morning for your active subscriptions.' : 'Try a different filter.'}
            action={filter === 'ALL' ? <Link to="/plans" className={buttonClass('primary', 'sm')}>Browse plans</Link> : undefined}
          />
        )}
        {orders.data && orders.data.length > 0 && (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {orders.data.map((o) => (
              <li key={o.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
                <div>
                  <p className="font-medium">{o.mealPlan?.name ?? 'Tiffin'}</p>
                  <p className="text-sm text-muted">{formatDate(o.deliveryDate)} · {o.deliveryAddress}</p>
                  {o.notes && <p className="mt-1 text-sm text-muted">Note: {o.notes}</p>}
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                  <Badge tone={o.status}>{STATUS_LABEL[o.status]}</Badge>
                  <span className="text-sm font-medium">{formatPrice(o.price)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
