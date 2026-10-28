import type { DeliveryDay } from '../lib/types';
import { ALL_DAYS, DAY_SHORT, WEEKDAYS } from '../lib/format';
import { Chip } from './ui';

export function DayPicker({ value, onChange }: { value: DeliveryDay[]; onChange: (days: DeliveryDay[]) => void }) {
  const toggle = (day: DeliveryDay) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : ALL_DAYS.filter((d) => d === day || value.includes(d)));

  const sameAs = (days: DeliveryDay[]) => days.length === value.length && days.every((d) => value.includes(d));

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Delivery days">
        {ALL_DAYS.map((day) => (
          <Chip key={day} selected={value.includes(day)} onClick={() => toggle(day)}>{DAY_SHORT[day]}</Chip>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-sm">
        <button type="button" className="text-brand underline-offset-2 hover:underline" onClick={() => onChange(WEEKDAYS)}
          aria-pressed={sameAs(WEEKDAYS)}>Weekdays</button>
        <button type="button" className="text-brand underline-offset-2 hover:underline" onClick={() => onChange(ALL_DAYS)}
          aria-pressed={sameAs(ALL_DAYS)}>Every day</button>
      </div>
    </div>
  );
}
