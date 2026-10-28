import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '../../api';
import { Badge, EmptyState, ErrorState, FilterTabs, LoadingBlock, PageHeader } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';
import { DAY_SHORT, STATUS_LABEL, formatDate, formatPrice } from '../../lib/format';
import type { SubscriptionStatus } from '../../lib/types';

type Filter = SubscriptionStatus | 'ALL';
const OPTIONS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminSubscriptions() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const subs = useQuery({
    queryKey: ['admin', 'subscriptions', filter],
    queryFn: () => subscriptionsApi.all(filter === 'ALL' ? undefined : filter),
  });

  return (
    <>
      <PageHeader title="Subscriptions" description="Everyone currently subscribed, paused or cancelled." />
      <FilterTabs label="Filter subscriptions by status" options={OPTIONS} value={filter} onChange={setFilter} />

      <div className="mt-4">
        {subs.isLoading && <LoadingBlock />}
        {subs.isError && <ErrorState message={getErrorMessage(subs.error)} onRetry={() => void subs.refetch()} />}
        {subs.data?.length === 0 && <EmptyState title="No subscriptions found" description="Nothing matches this filter." />}
        {subs.data && subs.data.length > 0 && (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {subs.data.map((s) => (
              <li key={s.id} className="grid gap-2 px-5 py-4 md:grid-cols-[1.1fr_1.6fr_6rem] md:items-center">
                <div>
                  <p className="font-medium">{s.user?.name ?? 'Customer'}</p>
                  <p className="text-sm text-muted">{s.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{s.mealPlan.name} · {formatPrice(s.mealPlan.pricePerDay)} / day</p>
                  <p className="text-sm text-muted">
                    {s.deliveryDays.map((d) => DAY_SHORT[d]).join(', ')} · from {formatDate(s.startDate)}
                    {s.endDate ? ` to ${formatDate(s.endDate)}` : ''}
                  </p>
                </div>
                <Badge tone={s.status}>{STATUS_LABEL[s.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
