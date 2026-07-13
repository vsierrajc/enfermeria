import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './Button';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive,
}: Props) {
  const confirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={confirm}
            className={cn(destructive && 'border-crit bg-crit-soft text-crit hover:bg-crit-soft hover:text-crit')}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-muted">{description}</p>}
    </Modal>
  );
}
