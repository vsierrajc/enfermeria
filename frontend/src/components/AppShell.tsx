import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-50">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 z-50 grid h-9 w-9 place-items-center rounded-sm bg-surface text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-3.5 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:px-7">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-border text-muted md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Menu size={18} />
            </button>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="ml-auto flex min-w-0 max-w-xs flex-1 items-center gap-2 rounded-sm border border-border bg-surface-2 px-3 py-2 text-left text-sm text-faint transition-colors hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none sm:min-w-[220px]"
            >
              <Search size={15} className="shrink-0" />
              <span className="hidden truncate sm:inline">Buscar paciente o acción</span>
              <span className="ml-auto hidden gap-1 sm:flex">
                <kbd className="rounded-sm border border-border-strong bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                  ⌘
                </kbd>
                <kbd className="rounded-sm border border-border-strong bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                  K
                </kbd>
              </span>
            </button>

            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-border text-muted transition-colors hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </header>

          <main className="flex-1 overflow-auto p-5 md:p-7">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
