import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = true, glass = true }) => {
  return (
    <div
      className={cn(
        glass ? 'glass-card' : 'rounded-xl border p-4',
        hoverable && 'hover:shadow-lg',
        className
      )}
      style={{
        background: glass ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center justify-between mb-4 pb-3 border-b', className)}
      style={{ borderColor: 'var(--border-primary)' }}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className, icon }) => {
  return (
    <h3 className={cn('text-lg font-semibold flex items-center gap-2', className)}
      style={{ color: 'var(--text-primary)' }}>
      {icon && <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>}
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return <div className={cn('', className)}>{children}</div>;
};
