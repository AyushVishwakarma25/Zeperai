import React from 'react';
import { typography, colors, radii } from './tokens.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  arrow?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  arrow = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  /* Buttons strictly use Satoshi Medium per the typography specification */
  const baseClasses =
    'font-satoshi font-medium inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none';

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5 shadow-sm hover:shadow',
  };

  const variantClasses = {
    primary:
      'bg-[#3155FF] hover:bg-[#2643E0] text-white focus:ring-[#3155FF]/40 disabled:bg-[#3155FF]/50 disabled:cursor-not-allowed',
    secondary:
      'bg-white hover:bg-slate-50 text-[#080B12] border border-[#E5E7EB] focus:ring-slate-300 disabled:bg-slate-100 disabled:text-slate-400',
    dark:
      'bg-[#070B20] hover:bg-slate-900 text-white border border-slate-800 focus:ring-slate-600 disabled:bg-slate-800 disabled:text-slate-500',
    outline:
      'bg-transparent hover:bg-slate-100/60 text-[#080B12] border border-[#E5E7EB] focus:ring-slate-300',
    ghost:
      'bg-transparent hover:bg-slate-100/80 text-[#5F6673] hover:text-[#080B12] focus:ring-slate-200',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {arrow && <span aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-0.5">→</span>}
        </>
      )}
    </button>
  );
};
