import type { OrderStatus } from '../lib/types';
import { STATUS_LABEL } from '../lib/format';

const STEPS: OrderStatus[] = ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

/** A real sequence, so a stepper is the right device: shows how far today's order has come. */
export function OrderTracker({ status }: { status: OrderStatus }) {
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex w-full items-start" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center text-center" aria-current={i === current ? 'step' : undefined}>
            {i > 0 && (
              <span aria-hidden="true" className={`absolute right-1/2 top-[7px] h-0.5 w-full ${i <= current ? 'bg-brand' : 'bg-line'}`} />
            )}
            <span aria-hidden="true" className={`relative z-10 size-4 rounded-full border-2 ${done ? 'border-brand bg-brand' : 'border-line bg-surface'}`} />
            <span className={`mt-2 text-xs ${done ? 'font-medium text-ink' : 'text-muted'}`}>{STATUS_LABEL[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}
