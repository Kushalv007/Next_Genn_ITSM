import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

const loaderVariants = cva('animate-spin text-muted-foreground', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      default: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  label?: string;
}

function Loader({ size, className, label, ...props }: LoaderProps): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2',
        className
      )}
      {...props}
    >
      <Loader2 className={cn(loaderVariants({ size }))} aria-hidden="true" />
      {label ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : null}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Loader, loaderVariants };
