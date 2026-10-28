import { Link } from 'react-router-dom';
import { TierMark } from './TiffinStack';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
        <TierMark className="size-7" />
      </span>
      TiffinBox
    </Link>
  );
}
