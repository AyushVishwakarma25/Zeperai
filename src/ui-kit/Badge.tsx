import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'brand' | 'neutral' | 'dark' | 'success' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-wider',
  };

  const variantClasses = {
    brand: 'bg-blue-50 text-[#3155FF] border border-blue-100',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    dark: 'bg-[#070B20] text-slate-200 border border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    outline: 'bg-transparent text-[#5F6673] border border-[#E5E7EB]',
  };

  return (
    <span
      className={`font-satoshi font-medium uppercase inline-flex items-center gap-1 rounded-md ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
