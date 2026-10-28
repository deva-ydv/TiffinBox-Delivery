import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { mealsApi, subscriptionsApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { DayPicker } from '../../components/DayPicker';
import { useToast } from '../../components/toast';
import { Button, Card, ErrorState, LoadingBlock, Notice, PageHeader, TextField } from '../../components/ui';
import { getErrorMessage, getFieldErrors } from '../../lib/api';
import { WEEKDAYS, addDays, dateInputToISO, formatPrice, toDateInput } from '../../lib/format';
import type { DeliveryDay } from '../../lib/types';

export default function Subscribe() {
  const { planId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const plan = useQuery({ queryKey: ['meal', planId], queryFn: () => mealsApi.get(planId), enabled: Boolean(planId) });

  const [start, setStart] = useState(toDateInput(addDays(new Date(), 1)));
  const [end, setEnd] = useState('');
  const [days, setDays] = useState<DeliveryDay[]>(WEEKDAYS);
  const [formError, setFormError] = useState('');

  const subscribe = useMutation({
    mutationFn: () =>
      subscriptionsApi.create({
        mealPlanId: planId,
        startDate: dateInputToISO(start),
        ...(end && { endDate: dateInputToISO(end) }),
        deliveryDays: days,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast('Subscribed. Your first order appears on your first delivery day.');
      navigate('/app/subscriptions');
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (days.length === 0) return setFormError('Select at least one delivery day.');
    if (!start) return setFormError('Choose a start date.');
    if (end && end < start) return setFormError('The end date must be on or after the start date.');
    subscribe.mutate();
  };

  if (plan.isLoading) return <LoadingBlock label="Loading plan" />;
  if (plan.isError || !plan.data) return <ErrorState message={getErrorMessage(plan.error)} onRetry={() => void plan.refetch()} />;

  const weekly = plan.data.pricePerDay * days.length;
  const apiFields = getFieldErrors(subscribe.error);
  const apiError = subscribe.isError ? getErrorMessage(subscribe.error) : '';
  const hasAddress = Boolean(user?.address?.trim());

  return (
    <>
      <PageHeader title={`Subscribe to ${plan.data.name}`} description={plan.data.description} />
      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <Card>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {!hasAddress && (
              <Notice tone="warn">
                Add a delivery address in your <Link to="/app/profile" className="font-medium underline">profile</Link> before subscribing.
              </Notice>
            )}
            {(formError || apiError) && <Notice tone="error">{formError || apiError}</Notice>}

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Start date" type="date" required min={toDateInput(new Date())} value={start}
                onChange={(e) => setStart(e.target.value)} error={apiFields.startDate}
                hint="Orders are created at 6 AM, so starting tomorrow guarantees your first delivery." />
              <TextField label="End date (optional)" type="date" min={start} value={end}
                onChange={(e) => setEnd(e.target.value)} error={apiFields.endDate} hint="Leave empty to continue until you cancel." />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">Delivery days</p>
              <DayPicker value={days} onChange={setDays} />
              {apiFields.deliveryDays && <p role="alert" className="mt-1.5 text-xs text-chilli">{apiFields.deliveryDays}</p>}
            </div>

            <Button type="submit" loading={subscribe.isPending} disabled={!hasAddress}>Start subscription</Button>
          </form>
        </Card>

        <Card className="h-fit">
          <h2 className="font-semibold">Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Price per day</dt><dd className="font-medium">{formatPrice(plan.data.pricePerDay)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Days per week</dt><dd className="font-medium">{days.length}</dd></div>
            <div className="flex justify-between gap-3 border-t border-line pt-3"><dt className="text-muted">Per week</dt><dd className="font-semibold">{formatPrice(weekly)}</dd></div>
          </dl>
          {user?.address && <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Delivering to {user.address}</p>}
        </Card>
      </div>
    </>
  );
}
