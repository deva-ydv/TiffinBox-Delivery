import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { homeFor } from '../lib/format';
import { Logo } from './Logo';
import { Button } from './ui';

const CUSTOMER_NAV = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/subscriptions', label: 'Subscriptions' },
  { to: '/app/orders', label: 'Orders' },
  { to: '/app/assistant', label: 'Assistant' },
  { to: '/app/profile', label: 'Profile' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Orders', end: true },
  { to: '/admin/meals', label: 'Meal plans' },
  { to: '/admin/subscriptions', label: 'Subscriptions' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const nav = user.role === 'ADMIN' ? ADMIN_NAV : CUSTOMER_NAV;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Logo to={homeFor(user.role)} />
          <div className="flex items-center gap-3">
            <Link to="/plans" className="hidden text-sm font-medium text-muted hover:text-ink sm:block">Browse plans</Link>
            <span className="hidden text-sm text-muted sm:block">{user.name}</span>
            <Button variant="secondary" size="sm" onClick={() => void logout()}>Sign out</Button>
          </div>
        </div>
        <nav aria-label="Main" className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${
                  isActive ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'
                }`
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
