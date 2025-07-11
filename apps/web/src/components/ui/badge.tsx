import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-500 text-white shadow hover:bg-primary-600',
        secondary:
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700',
        destructive:
          'border-transparent bg-red-500 text-white shadow hover:bg-red-600',
        outline: 'text-gray-700 dark:text-gray-300',
        success:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        warning:
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        info:
          'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-1.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

// Badges especializados para agricultura
interface ActivityBadgeProps {
  tipo: string;
  className?: string;
}

export function ActivityBadge({ tipo, className }: ActivityBadgeProps) {
  const getVariant = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'siembra':
        return 'success';
      case 'fertilizacion':
        return 'info';
      case 'tratamiento':
        return 'warning';
      case 'cosecha':
        return 'destructive';
      case 'riego':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(tipo)} className={className}>
      {tipo}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completada':
        return 'success';
      case 'en_curso':
        return 'info';
      case 'planificada':
        return 'warning';
      case 'cancelada':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export { Badge, badgeVariants };