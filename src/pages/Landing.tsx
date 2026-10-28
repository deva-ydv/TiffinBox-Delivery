import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { mealsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { PlanCard } from '../components/PlanCard';
import { TiffinStack } from '../components/TiffinStack';
import { buttonClass } from '../components/ui';
import { formatPrice, homeFor } from '../lib/format';

const STEPS = [
  { title: 'Choose a plan', body: 'Home-style thalis, from classic veg to protein-rich non-veg and light diet tiffins.' },
  { title: 'Pick your days', body: 'Select the weekdays you want lunch, set a start date, and change it later.' },
  { title: 'Lunch arrives', body: 'Your order is created each morning and tracked until it reaches your door.' },
];

export default function Landing() {
  const { user } = useAuth();
  const plans = useQuery({ queryKey: ['meals'], queryFn: mealsApi.list });
  const cheapest = plans.data?.length ? Math.min(...plans.data.map((p) => p.pricePerDay)) : null;

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 py-6 md:grid-cols-2 md:py-12">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Your daily <span className="tiffin-shimmer">Tiffin</span> delivered to your office or doorstep.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Pick a plan, set your delivery days and lunch shows up at your door.
            Pause or cancel whenever your week changes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/plans" className={buttonClass('primary')}>Browse plans</Link>
            {user ? (
              <Link to={homeFor(user.role)} className={buttonClass('secondary')}>Open dashboard</Link>
            ) : (
              <Link to="/register" className={buttonClass('secondary')}>Create account</Link>
            )}
          </div>
          {cheapest !== null && (
            <p className="mt-5 text-sm text-muted">Plans start at {formatPrice(cheapest)} a day.</p>
          )}
        </div>
        <TiffinStack className="mx-auto w-52 md:w-72" />
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="border-t-2 border-brand pt-4">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="plans-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="plans-heading" className="text-2xl font-semibold tracking-tight">Plans</h2>
          <Link to="/plans" className="text-sm font-medium text-brand hover:underline">See all plans</Link>
        </div>
        {plans.isLoading && <p className="mt-6 text-sm text-muted">Loading plans…</p>}
        {plans.isError && <p className="mt-6 text-sm text-muted">Plans are unavailable right now. Please try again shortly.</p>}
        {plans.data && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.data.slice(0, 3).map((plan) => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        )}
      </section>
    </div>
  );
}
