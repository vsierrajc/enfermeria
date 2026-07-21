import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type DropdownItemProps = {
  onSelect?: () => void;
  disabled?: boolean;
  children: ReactNode;
};

export function Dropdown({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="min-w-[180px] rounded border border-border bg-surface p-1 shadow motion-reduce:animate-none focus:outline-none"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DropdownItem({ onSelect, disabled, children }: DropdownItemProps) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 rounded px-2 py-1.5 text-sm text-text cursor-pointer',
        'hover:bg-surface-2 data-[highlighted]:bg-surface-2 data-[highlighted]:outline-none',
        'data-[disabled]:text-muted data-[disabled]:cursor-not-allowed',
      )}
    >
      {children}
    </DropdownMenu.Item>
  );
}

export function DropdownSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-border" />;
}
