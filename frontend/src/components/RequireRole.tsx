import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { role } = useAuth();
  return role && roles.includes(role) ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
