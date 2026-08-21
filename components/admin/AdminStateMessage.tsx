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

/**
 * Guarantees a safe, renderable string regardless of what's actually passed at
 * runtime. Callers type `message` as `string`, but values sourced from `catch (err: any)`
 * blocks or API responses aren't type-checked, so an object (e.g. { code, message })
 * can slip through and crash React with "Objects are not valid as a React child"
 * (minified error #31) if rendered directly.
 */
function toSafeMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return 'An unexpected error occurred.';
  if (value instanceof Error) return value.message || 'An unexpected error occurred.';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    try {
      return JSON.stringify(obj);
    } catch {
      return 'An unexpected error occurred.';
    }
  }
  return String(value);
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
  const safeMessage = toSafeMessage(message);
  if (type === 'loading') {
    return (
      <div className={`py-16 flex flex-col items-center justify-center space-y-3 font-sans text-center ${className}`}>
        <Spinner className="w-8 h-8 text-[#4452FB]" />
        {title && <h4 className="text-sm font-bold text-slate-900">{title}</h4>}
        <p className="text-xs text-slate-500 max-w-md">{safeMessage}</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <Card className={`p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center font-sans ${className}`}>
        <div className="max-w-md mx-auto flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            {icon || <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">{title || 'Failed to Load Data'}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{safeMessage}</p>
          </div>
          {onRetry && (
            <Button
              variant="secondary"
              onClick={onRetry}
              className="mt-2 text-xs px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
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
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200/80 flex items-center justify-center">
        {icon || <FolderOpen className="w-6 h-6 opacity-60" />}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-900">{title || 'No Records Found'}</h4>
        <p className="text-xs text-slate-500 max-w-sm">{safeMessage}</p>
      </div>
      {onClearFilters && (
        <Button
          variant="secondary"
          onClick={onClearFilters}
          className="text-xs px-3.5 py-1.5 bg-[#4452FB]/10 hover:bg-[#4452FB]/20 text-[#4452FB] border border-[#4452FB]/20 rounded-xl mt-1 font-bold shadow-2xs transition-all"
        >
          {clearFiltersText}
        </Button>
      )}
    </div>
  );
};
