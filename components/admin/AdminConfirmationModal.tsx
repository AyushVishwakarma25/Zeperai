import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string | React.ReactNode;
  impactItems?: string[];
  confirmKeyword?: string; // If provided, user must type this exact string to enable confirm button
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const AdminConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  impactItems = [],
  confirmKeyword,
  confirmButtonText = 'Confirm & Proceed',
  cancelButtonText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose
}) => {
  const [typedKeyword, setTypedKeyword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedKeyword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isKeywordMatching = !confirmKeyword || typedKeyword.trim().toLowerCase() === confirmKeyword.trim().toLowerCase();

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
          boxBg: 'bg-rose-50/60 border-rose-200 text-rose-900',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500',
          icon: <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
          boxBg: 'bg-amber-50/60 border-amber-200 text-amber-900',
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500',
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
        };
      default:
        return {
          iconBg: 'bg-primary/10 text-primary border border-primary/20',
          boxBg: 'bg-primary/5 border-primary/20 text-slate-900',
          btnClass: 'bg-primary hover:bg-primary-hover text-white shadow-xs focus:ring-primary',
          icon: <AlertTriangle className="w-6 h-6 text-primary shrink-0" />
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-border-light rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-text-primary animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border-light flex items-start justify-between bg-slate-50/60">
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3 className="text-base font-bold font-batangas text-text-primary leading-tight">{title}</h3>
              <p className="text-xs text-text-secondary mt-1">Operational confirmation required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-text-secondary leading-relaxed">
            {description}
          </div>

          {impactItems && impactItems.length > 0 && (
            <div className={`p-4 rounded-xl border ${styles.boxBg} space-y-2`}>
              <div className="flex items-center space-x-2 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>What will happen:</span>
              </div>
              <ul className="text-xs space-y-1.5 list-disc list-inside opacity-90 pl-1">
                {impactItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {confirmKeyword && (
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-text-primary">
                To confirm, type <span className="font-mono font-bold text-rose-600 select-all px-1.5 py-0.5 bg-slate-100 rounded border border-border-light">{confirmKeyword}</span> below:
              </label>
              <input
                type="text"
                value={typedKeyword}
                onChange={(e) => setTypedKeyword(e.target.value)}
                placeholder={`Type ${confirmKeyword} here`}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-border-light rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border-light bg-slate-50/50 flex items-center justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text-primary border border-border-light shadow-xs"
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={!isKeywordMatching || loading}
            className={`text-xs px-4 py-2 font-semibold flex items-center space-x-2 ${styles.btnClass}`}
          >
            {loading && <Spinner className="w-3.5 h-3.5 mr-1 text-white" />}
            <span>{confirmButtonText}</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
