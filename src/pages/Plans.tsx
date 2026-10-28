import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { mealsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { PlanCard } from '../components/PlanCard';
import { EmptyState, ErrorState, LoadingBlock, PageHeader, buttonClass } from '../components/ui';
import { getErrorMessage } from '../lib/api';

export default function Plans() {
  const { user } = useAuth();
  const plans = useQuery({ queryKey: ['meals'], queryFn: mealsApi.list });

  return (
    <>
      <PageHeader title="Meal plans" description="Every plan is priced per delivery day. You choose which days you want." />
      {plans.isLoading && <LoadingBlock label="Loading plans" />}
      {plans.isError && <ErrorState message={getErrorMessage(plans.error)} onRetry={() => void plans.refetch()} />}
      {plans.data?.length === 0 && <EmptyState title="No plans available yet" description="Check back soon." />}
      {plans.data && plans.data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.data.map((plan) => (
            <PlanCard key={plan.id} plan={plan}>
              {user?.role !== 'ADMIN' && (
                <Link to={`/app/subscribe/${plan.id}`} className={buttonClass('primary', 'sm', 'w-full')}>
                  Subscribe
                </Link>
              )}
            </PlanCard>
          ))}
        </div>
      )}
    </>
  );
}
