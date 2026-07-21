import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ open, onOpenChange, title, children, footer }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in motion-reduce:animate-none" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(560px,92vw)] max-h-[88vh] overflow-auto -translate-x-1/2 -translate-y-1/2 rounded bg-surface border border-border shadow p-5 focus:outline-none">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
            <Dialog.Close className="text-muted hover:text-text"><X size={18} /></Dialog.Close>
          </div>
          {children}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
