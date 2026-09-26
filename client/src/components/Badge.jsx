import cn from '../utils/cn.js';

/**
 * Small reusable status badge component.
 */
export default function Badge({ children, tone = 'default', className }) {
  const tones = {
    default: 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    danger:  'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    brand:   'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone] ?? tones.default,
        className
      )}
    >
      {children}
    </span>
  );
}
