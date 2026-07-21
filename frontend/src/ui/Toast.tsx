import { Toaster, toast } from 'react-hot-toast';

export { toast };

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'rounded border border-border bg-surface text-text shadow text-sm motion-reduce:animate-none',
        success: {
          iconTheme: { primary: 'var(--ok)', secondary: 'var(--surface)' },
        },
        error: {
          iconTheme: { primary: 'var(--crit)', secondary: 'var(--surface)' },
        },
      }}
    />
  );
}
