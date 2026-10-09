import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'surface' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8 sm:p-10',
  };

  const variantClasses = {
    default: 'bg-white border border-[#E5E7EB] rounded-2xl shadow-xs',
    surface: 'bg-[#F8F9FB] border border-[#E5E7EB] rounded-2xl shadow-xs',
    glass: 'bg-white/90 backdrop-blur-md border border-[#E5E7EB] rounded-2xl shadow-sm',
    interactive:
      'bg-white border border-[#E5E7EB] rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
