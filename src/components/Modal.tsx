import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, closable]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />
      <div
        className={cn(
          'relative w-full glass-card p-6 animate-fade-in',
          sizeClasses[size]
        )}
        style={{
          background: 'var(--bg-secondary)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {title && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            {closable && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg transition-colors hover:bg-gray-700/30"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="scrollbar-thin">{children}</div>
      </div>
    </div>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('flex justify-end gap-3 mt-6 pt-4 border-t', className)}
      style={{ borderColor: 'var(--border-primary)' }}>
      {children}
    </div>
  );
};
