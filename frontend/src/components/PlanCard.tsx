import type { ReactNode } from 'react';
import { formatPrice } from '../lib/format';
import type { MealPlan } from '../lib/types';
import { TierMark } from './TiffinStack';

export function PlanCard({ plan, children }: { plan: MealPlan; children?: ReactNode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      {plan.imageUrl ? (
        <img src={plan.imageUrl} alt="" loading="lazy" className="h-36 w-full object-cover" />
      ) : (
        <div className="grid h-36 place-items-center bg-brand-soft text-brand">
          <TierMark className="size-14" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold">{plan.name}</h3>
          <p className="shrink-0 text-sm font-medium">
            {formatPrice(plan.pricePerDay)}<span className="font-normal text-muted"> / day</span>
          </p>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{plan.description}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </article>
  );
}
