import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white p-12 text-center',
        className
      )}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mb-8 max-w-md text-sm text-slate-500">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryAction ? (
            <Button
              type="button"
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
          {action ? (
            <Button type="button" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
