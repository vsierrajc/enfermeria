import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Icon className="text-faint" size={32} />
      <p className="text-text font-semibold">{title}</p>
      {description && <p className="text-muted text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
