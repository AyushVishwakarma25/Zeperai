import React from 'react';

// Extend ButtonHTMLAttributes to allow standard props like key to be passed.
// Omit the original `onClick` to avoid type conflicts and define a custom one.
interface OptionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  value: any;
  currentValue?: any;
  onClick?: (value: any) => void;
}

export const OptionButton = ({
  value,
  currentValue,
  onClick,
  children,
  ...rest
}: React.PropsWithChildren<OptionButtonProps>): React.ReactElement => {
  const isSelected = value === currentValue;

  return (
    <button
      type="button"
      onClick={() => onClick?.(value)}
      className={`flex-1 p-2 rounded-2xl text-sm transition-all duration-300 flex flex-col items-center justify-center gap-0.5 h-16 transform hover:-translate-y-1 ${
        isSelected
          ? `shadow-lg bg-primary text-white shadow-glow-primary`
          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
};

interface OptionGroupProps<T> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function OptionGroup<T>({
  label,
  value,
  onChange,
  children,
  className,
}: React.PropsWithChildren<OptionGroupProps<T>>): React.ReactElement {
  // Clone children to inject props
  const buttons = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        currentValue: value,
        onClick: onChange,
      });
    }
    return child;
  });

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
      <div className="flex space-x-2">
        {buttons}
      </div>
    </div>
  );
};