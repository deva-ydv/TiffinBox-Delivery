import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingBlock } from '../components/ui';
import { homeFor } from '../lib/format';
import type { Role } from '../lib/types';
import { useAuth } from './AuthContext';

/** Requires a signed-in user, optionally with a specific role. */
export function RequireAuth({ role }: { role?: Role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingBlock label="Signing you in" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}

/** Login/register pages: bounce signed-in users to their home. */
export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
