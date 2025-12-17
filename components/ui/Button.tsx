import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', fullWidth = false, className, isLoading, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed focus:ring-primary focus:ring-offset-main',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-500 focus:ring-offset-main',
    ghost: 'bg-black/50 text-white hover:bg-black/75 focus:ring-white focus:ring-offset-transparent',
    dark: 'bg-slate-900 text-white hover:bg-slate-700 focus:ring-slate-500 focus:ring-offset-main'
  };
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`} {...props} disabled={props.disabled || isLoading}>
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
};