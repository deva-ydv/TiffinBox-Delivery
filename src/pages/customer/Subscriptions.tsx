import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { subscriptionsApi } from '../../api';
import { useToast } from '../../components/toast';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingBlock, Modal, PageHeader, buttonClass } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';
import { DAY_SHORT, STATUS_LABEL, formatDate, formatPrice, formatShortDate, nextDeliveryDate } from '../../lib/format';
import type { Subscription } from '../../lib/types';

type Action = 'pause' | 'resume' | 'cancel';
const DONE: Record<Action, string> = { pause: 'Subscription paused.', resume: 'Subscription resumed.', cancel: 'Subscription cancelled.' };

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const subs = useQuery({ queryKey: ['subscriptions', 'mine'], queryFn: subscriptionsApi.mine });
  const [confirming, setConfirming] = useState<Subscription | null>(null);

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: Action }) => subscriptionsApi[action](id),
    onSuccess: (_data, vars) => {
      toast(DONE[vars.action]);
      setConfirming(null);
      void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (err) => { toast(getErrorMessage(err), 'error'); setConfirming(null); },
  });

  const busyId = act.isPending ? act.variables?.id : undefined;

  return (
    <>
      <PageHeader title="Subscriptions" description="Pause when you're away, resume when you're back."
        action={<Link to="/plans" className={buttonClass('primary', 'sm')}>Add a plan</Link>} />

      {subs.isLoading && <LoadingBlock />}
      {subs.isError && <ErrorState message={getErrorMessage(subs.error)} onRetry={() => void subs.refetch()} />}
      {subs.data?.length === 0 && (
        <EmptyState title="No subscriptions yet" description="Pick a plan and choose the days you want lunch delivered."
          action={<Link to="/plans" className={buttonClass('primary', 'sm')}>Browse plans</Link>} />
      )}

      <div className="space-y-4">
        {subs.data?.map((s) => {
          const next = s.status === 'ACTIVE' ? nextDeliveryDate(s.deliveryDays, s.startDate, s.endDate) : null;
          return (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{s.mealPlan.name}</h2>
                  <p className="text-sm text-muted">{formatPrice(s.mealPlan.pricePerDay)} per delivery day</p>
                </div>
                <Badge tone={s.status}>{STATUS_LABEL[s.status]}</Badge>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-muted">Delivery days</dt><dd className="mt-0.5 font-medium">{s.deliveryDays.map((d) => DAY_SHORT[d]).join(', ')}</dd></div>
                <div><dt className="text-muted">Starts</dt><dd className="mt-0.5 font-medium">{formatDate(s.startDate)}</dd></div>
                <div><dt className="text-muted">Ends</dt><dd className="mt-0.5 font-medium">{s.endDate ? formatDate(s.endDate) : 'Until cancelled'}</dd></div>
              </dl>
              {next && <p className="mt-3 text-sm text-muted">Next delivery: {formatShortDate(next.toISOString())}</p>}

              {s.status !== 'CANCELLED' && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  {s.status === 'ACTIVE' && (
                    <Button variant="secondary" size="sm" loading={busyId === s.id && act.variables?.action === 'pause'}
                      onClick={() => act.mutate({ id: s.id, action: 'pause' })}>Pause</Button>
                  )}
                  {s.status === 'PAUSED' && (
                    <Button variant="secondary" size="sm" loading={busyId === s.id && act.variables?.action === 'resume'}
                      onClick={() => act.mutate({ id: s.id, action: 'resume' })}>Resume</Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-chilli hover:bg-chilli-soft" onClick={() => setConfirming(s)}>Cancel subscription</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title="Cancel this subscription?">
        <p className="text-sm text-muted">
          {confirming?.mealPlan.name} deliveries will stop. A cancelled subscription can't be resumed, but you can subscribe again anytime.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirming(null)}>Keep it</Button>
          <Button variant="danger" loading={act.isPending}
            onClick={() => confirming && act.mutate({ id: confirming.id, action: 'cancel' })}>Cancel subscription</Button>
        </div>
      </Modal>
    </>
  );
}
