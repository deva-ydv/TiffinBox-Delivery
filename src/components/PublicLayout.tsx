import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { homeFor } from '../lib/format';
import { Logo } from './Logo';
import { buttonClass } from './ui';

export function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper/90">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
  <NavLink
    to="/plans"
    className={({ isActive }) =>
      `hidden rounded-lg px-3 py-2 font-medium sm:block ${isActive ? 'text-brand' : 'text-muted hover:text-ink'}`
    }
  >
    Plans
  </NavLink>
  {user ? (
    <Link to={homeFor(user.role)} className={buttonClass('primary', 'sm')}>Open dashboard</Link>
  ) : (
    <>
      <Link to="/login" className={buttonClass('ghost', 'sm', 'max-sm:px-2')}>Sign in</Link>
      <Link to="/register" className={buttonClass('primary', 'sm')}>Get started</Link>
    </>
  )}
</nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 px-4 py-6 text-sm text-muted">
          <span>TiffinBox, home-style tiffin in Mumbai.</span>
        </div>
      </footer>
    </div>
  );
}
