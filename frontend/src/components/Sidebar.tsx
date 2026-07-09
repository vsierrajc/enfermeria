import {
  Activity,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Pill,
  Send,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const clinico: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/controles', label: 'Controles', icon: Activity },
  { to: '/recetas', label: 'Recetas', icon: Stethoscope },
  { to: '/remisiones', label: 'Remisiones', icon: Send },
];

const gestion: NavItem[] = [
  { to: '/enfermeras', label: 'Personal', icon: UserCog },
  { to: '/medicamentos', label: 'Medicamentos', icon: Pill },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
];

type Props = {
  onNavigate?: () => void;
};

function initials(nombre?: string, apellido?: string) {
  return `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();
}

export function Sidebar({ onNavigate }: Props) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-muted transition-colors',
          'hover:bg-surface-2 hover:text-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isActive && 'bg-accent-soft text-accent-strong font-semibold hover:bg-accent-soft hover:text-accent-strong',
        )
      }
    >
      <item.icon size={17} className="shrink-0" />
      {item.label}
    </NavLink>
  );

  return (
    <div className="flex h-full w-64 flex-col gap-1 border-r border-border bg-surface p-3.5">
      <div className="flex items-center gap-2.5 px-2 pb-4 pt-1">
        <div className="grid size-8 shrink-0 place-items-center rounded-sm bg-accent text-white">
          <Stethoscope size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight tracking-tight text-text">Vitalis</div>
          <div className="text-[11px] text-faint">Salud Ocupacional</div>
        </div>
      </div>

      <div className="px-2 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-faint">
        Clínico
      </div>
      <nav className="flex flex-col gap-1">{clinico.map(renderItem)}</nav>

      <div className="px-2 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-faint">
        Gestión
      </div>
      <nav className="flex flex-col gap-1">
        {gestion.filter((item) => isAdmin || item.to !== '/enfermeras').map(renderItem)}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 rounded px-2 py-2.5 bg-surface-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
          {initials(user?.nombre, user?.apellido)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold leading-tight text-text">
            {user?.nombre} {user?.apellido}
          </div>
          <div className="truncate text-[11px] text-faint">{user?.role}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-crit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
