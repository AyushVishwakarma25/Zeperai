
import React from 'react';

interface SegmentedControlOption {
    label: string;
    value: string;
}

interface SegmentedControlProps {
    label: string;
    options: SegmentedControlOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
    label,
    options,
    value,
    onChange,
    className
}) => {
    return (
        <div className={className}>
            <label className="block text-sm font-semibold text-black mb-2">{label}</label>
            <div className="flex space-x-1 bg-gray-200/80 p-1 rounded-xl">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={`flex-1 p-1 rounded-lg text-xs transition-all duration-300 transform flex items-center justify-center text-center h-14 whitespace-pre-wrap ${
                                isSelected
                                    ? `font-semibold shadow-md bg-primary text-white shadow-glow-primary`
                                    : 'text-text-primary hover:bg-gray-300/60'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    )
}
