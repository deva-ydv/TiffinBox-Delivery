import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../api';
import { useToast } from '../../components/toast';
import { Badge, Button, EmptyState, ErrorState, FilterTabs, LoadingBlock, PageHeader, TextField } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';
import { STATUS_LABEL, formatDate, formatPrice, toDateInput } from '../../lib/format';
import type { OrderStatus } from '../../lib/types';

type Filter = OrderStatus | 'ALL';
const STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const OPTIONS: { value: Filter; label: string }[] = [{ value: 'ALL', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [date, setDate] = useState(toDateInput(new Date()));
  const [filter, setFilter] = useState<Filter>('ALL');

  const orders = useQuery({
    queryKey: ['admin', 'orders', date, filter],
    queryFn: () => ordersApi.all({ ...(date && { date }), ...(filter !== 'ALL' && { status: filter }) }),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      toast('Order status updated.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const counts = useMemo(() => {
    const c: Partial<Record<OrderStatus, number>> = {};
    for (const o of orders.data ?? []) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders.data]);

  const updatingId = update.isPending ? update.variables?.id : undefined;

  return (
    <>
      <PageHeader title="Orders" description="Move each order through preparation and delivery." />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44"><TextField label="Delivery date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <Button variant="secondary" onClick={() => setDate(toDateInput(new Date()))}>Today</Button>
        <Button variant="ghost" onClick={() => setDate('')} disabled={!date}>All dates</Button>
      </div>

      <div className="mt-4"><FilterTabs label="Filter orders by status" options={OPTIONS} value={filter} onChange={setFilter} /></div>

      {orders.data && orders.data.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          {orders.data.length} {orders.data.length === 1 ? 'order' : 'orders'}
          {STATUSES.filter((s) => counts[s]).map((s) => ` · ${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`).join('')}
        </p>
      )}

      <div className="mt-4">
        {orders.isLoading && <LoadingBlock />}
        {orders.isError && <ErrorState message={getErrorMessage(orders.error)} onRetry={() => void orders.refetch()} />}
        {orders.data?.length === 0 && (
          <EmptyState title="No orders found"
            description={date ? 'Nothing for this date and filter. Orders are created each morning at 6 AM.' : 'Nothing matches this filter.'} />
        )}
        {orders.data && orders.data.length > 0 && (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {orders.data.map((o) => (
              <li key={o.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.1fr_1.6fr_15rem] md:items-center">
                <div>
                  <p className="font-medium">{o.user?.name ?? 'Customer'}</p>
                  <p className="text-sm text-muted">{o.user?.phone ?? o.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{o.mealPlan?.name ?? 'Tiffin'} · {formatPrice(o.price)}</p>
                  <p className="text-sm text-muted">{formatDate(o.deliveryDate)} · {o.deliveryAddress}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={o.status}>{STATUS_LABEL[o.status]}</Badge>
                  <select aria-label={`Change status for ${o.user?.name ?? 'order'}`} value={o.status} disabled={updatingId === o.id}
                    onChange={(e) => update.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                    className="h-9 rounded-lg border border-line bg-surface px-2 text-sm disabled:opacity-50">
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
