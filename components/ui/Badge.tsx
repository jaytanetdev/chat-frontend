'use client';

import { cn } from '@/lib/cn';

interface BadgeProps {
  count: number;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
  danger: 'bg-red-500 text-white',
};

export default function Badge({ count, variant = 'danger', className }: BadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? '99+' : String(count);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold leading-none',
        display.length === 1 ? 'h-5 w-5 text-[11px]' : 'h-5 min-w-5 px-1.5 text-[10px]',
        variantClasses[variant],
        className,
      )}
    >
      {display}
    </span>
  );
}
