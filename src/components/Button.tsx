import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent-primary)',
      color: 'var(--text-inverse)',
    },
    secondary: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-primary)',
    },
    danger: {
      background: 'var(--accent-danger)',
      color: 'var(--text-inverse)',
    },
    success: {
      background: 'var(--accent-success)',
      color: 'var(--text-inverse)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent-secondary)' },
    secondary: { background: 'var(--bg-secondary)', borderColor: 'var(--border-highlight)' },
    danger: { opacity: 0.9 },
    success: { opacity: 0.9 },
    ghost: { background: 'var(--bg-tertiary)' },
  };

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      style={{
        ...variantStyles[variant],
        ...(props.disabled ? {} : { ':hover': hoverStyles[variant] }),
      }}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          Object.assign(e.currentTarget.style, hoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        if (!props.disabled) {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
        }
      }}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};
