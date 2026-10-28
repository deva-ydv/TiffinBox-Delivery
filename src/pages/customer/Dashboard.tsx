import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { aiApi, ordersApi, subscriptionsApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { OrderTracker } from '../../components/OrderTracker';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingBlock, Notice, PageHeader, buttonClass } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';
import { STATUS_LABEL, formatDate, formatPrice, isSameLocalDay, nextDeliveryDate } from '../../lib/format';

export default function Dashboard() {
  const { user } = useAuth();
  const orders = useQuery({ queryKey: ['orders', 'mine', 'all'], queryFn: () => ordersApi.mine() });
  const subs = useQuery({ queryKey: ['subscriptions', 'mine'], queryFn: subscriptionsApi.mine });
  const recs = useMutation({ mutationFn: aiApi.recommendations });

  const today = useMemo(() => orders.data?.find((o) => isSameLocalDay(new Date(o.deliveryDate), new Date())), [orders.data]);

  const next = useMemo(() => {
    const active = (subs.data ?? []).filter((s) => s.status === 'ACTIVE');
    const candidates = active
      .map((s) => ({ sub: s, date: nextDeliveryDate(s.deliveryDays, s.startDate, s.endDate) }))
      .filter((c): c is { sub: typeof c.sub; date: Date } => c.date !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return candidates[0];
  }, [subs.data]);

  if (orders.isLoading || subs.isLoading) return <LoadingBlock />;
  if (orders.isError || subs.isError) {
    return <ErrorState message={getErrorMessage(orders.error ?? subs.error)}
      onRetry={() => { void orders.refetch(); void subs.refetch(); }} />;
  }

  const activeCount = (subs.data ?? []).filter((s) => s.status === 'ACTIVE').length;
  const recent = (orders.data ?? []).slice(0, 5);

  return (
    <>
      <PageHeader title={`Hello, ${user?.name.split(' ')[0] ?? 'there'}`} description="Here's what's happening with your tiffin." />

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="font-semibold">Today</h2>
          {today ? (
            <div className="mt-4 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">{today.mealPlan?.name ?? 'Tiffin'} · {formatPrice(today.price)}</p>
                <Badge tone={today.status}>{STATUS_LABEL[today.status]}</Badge>
              </div>
              {today.status === 'CANCELLED'
                ? <Notice tone="error">Today's order was cancelled.</Notice>
                : <OrderTracker status={today.status} />}
              <p className="text-sm text-muted">Delivering to {today.deliveryAddress}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              No tiffin scheduled for today.{' '}
              {next
                ? <>Your next delivery is {formatDate(next.date.toISOString())} ({next.sub.mealPlan.name}).</>
                : <>Subscribe to a plan to start receiving lunch.</>}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">Subscriptions</h2>
          <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
          <p className="text-sm text-muted">active {activeCount === 1 ? 'plan' : 'plans'}</p>
          <Link to="/app/subscriptions" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">Manage subscriptions</Link>
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="recs-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recs-heading" className="text-lg font-semibold">Picked for you</h2>
          <Button variant="secondary" size="sm" loading={recs.isPending} onClick={() => recs.mutate()}>
            {recs.data ? 'Refresh suggestions' : 'Suggest plans for me'}
          </Button>
        </div>
        {recs.isError && <div className="mt-3"><Notice tone="error">{getErrorMessage(recs.error)}</Notice></div>}
        {recs.data && recs.data.length === 0 && <p className="mt-3 text-sm text-muted">No suggestions right now.</p>}
        {recs.data && recs.data.length > 0 && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {recs.data.map((r) => (
              <Card key={r.mealPlanId}>
                <p className="font-medium">{r.mealPlanName}</p>
                <p className="mt-1 text-sm text-muted">{r.reason}</p>
                <Link to={`/app/subscribe/${r.mealPlanId}`} className={buttonClass('secondary', 'sm', 'mt-4')}>View and subscribe</Link>
              </Card>
            ))}
          </div>
        )}
        {!recs.data && !recs.isError && !recs.isPending && (
          <p className="mt-3 text-sm text-muted">Get plan suggestions based on what you've ordered before.</p>
        )}
      </section>

      <section className="mt-8" aria-labelledby="recent-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-heading" className="text-lg font-semibold">Recent orders</h2>
          {recent.length > 0 && <Link to="/app/orders" className="text-sm font-medium text-brand hover:underline">All orders</Link>}
        </div>
        {recent.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No orders yet"
              description="Orders are created each morning at 6 AM for your delivery days, so your first one will appear on the first day of your plan."
              action={<Link to="/plans" className={buttonClass('primary', 'sm')}>Browse plans</Link>} />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{o.mealPlan?.name ?? 'Tiffin'}</p>
                  <p className="text-xs text-muted">{formatDate(o.deliveryDate)}</p>
                </div>
                <Badge tone={o.status}>{STATUS_LABEL[o.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
