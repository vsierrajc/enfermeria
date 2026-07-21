import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { Badge } from './Badge';
import { cn } from '../lib/cn';

type Tab = { value: string; label: string; count?: number };

export function Tabs({ tabs, value, onValueChange, children }: {
  tabs: Tab[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List className="flex gap-4 border-b border-border">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'flex items-center gap-2 px-1 py-2.5 text-sm font-semibold text-muted border-b-2 border-transparent',
              'hover:text-text',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'data-[state=active]:text-accent-strong data-[state=active]:border-accent',
            )}
          >
            {tab.label}
            {tab.count !== undefined && <Badge tone="neutral">{tab.count}</Badge>}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  return (
    <TabsPrimitive.Content value={value} className="pt-4 focus-visible:outline-none">
      {children}
    </TabsPrimitive.Content>
  );
}
