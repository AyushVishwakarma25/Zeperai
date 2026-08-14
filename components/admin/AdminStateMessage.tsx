import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { AlertTriangle, FolderOpen, RefreshCw, Layers } from 'lucide-react';

export interface AdminStateMessageProps {
  type: 'loading' | 'empty' | 'error';
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  onClearFilters?: () => void;
  clearFiltersText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const AdminStateMessage: React.FC<AdminStateMessageProps> = ({
  type,
  title,
  message,
  onRetry,
  retryText = 'Retry',
  onClearFilters,
  clearFiltersText = 'Reset Filters',
  icon,
  className = ''
}) => {
  if (type === 'loading') {
    return (
      <div className={`py-16 flex flex-col items-center justify-center space-y-3 font-sans text-center ${className}`}>
        <Spinner className="w-8 h-8 text-primary" />
        {title && <h4 className="text-sm font-semibold text-text-primary font-batangas">{title}</h4>}
        <p className="text-xs text-text-secondary max-w-md">{message}</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <Card className={`p-8 bg-surface border border-rose-200 shadow-sm text-center font-sans ${className}`}>
        <div className="max-w-md mx-auto flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            {icon || <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-batangas text-text-primary">{title || 'Failed to Load Data'}</h4>
            <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
          </div>
          {onRetry && (
            <Button
              variant="secondary"
              onClick={onRetry}
              className="mt-2 text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text-primary border border-border-light flex items-center space-x-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>{retryText}</span>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // type === 'empty'
  return (
    <div className={`py-14 flex flex-col items-center justify-center space-y-3 font-sans text-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-text-secondary border border-border-light flex items-center justify-center">
        {icon || <FolderOpen className="w-6 h-6 opacity-60" />}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-text-primary font-batangas">{title || 'No Records Found'}</h4>
        <p className="text-xs text-text-secondary max-w-sm">{message}</p>
      </div>
      {onClearFilters && (
        <Button
          variant="secondary"
          onClick={onClearFilters}
          className="text-xs px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-text-primary border border-border-light mt-1 shadow-xs"
        >
          {clearFiltersText}
        </Button>
      )}
    </div>
  );
};
