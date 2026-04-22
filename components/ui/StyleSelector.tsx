
import React from 'react';
import { Icon } from './Icon';

export interface StyleOption {
    label: string;
    value: string;
    thumbnail?: string;
}

interface StyleSelectorProps {
    options: StyleOption[];
    value: string | string[];
    onChange: (value: any) => void;
    className?: string;
    disabled?: boolean;
    multiple?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ options, value, onChange, className, disabled, multiple = false }) => {
    
    const isSelected = (optionValue: string) => {
        if (Array.isArray(value)) {
            return value.includes(optionValue);
        }
        return value === optionValue;
    };

    const handleClick = (optionValue: string) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
            let newValues;
            if (currentValues.includes(optionValue)) {
                newValues = currentValues.filter(v => v !== optionValue);
            } else {
                newValues = [...currentValues, optionValue];
            }
            onChange(newValues);
        } else {
            onChange(optionValue);
        }
    };

    return (
        <div className={`grid grid-cols-3 sm:grid-cols-4 gap-4 ${className} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            {options.map((option) => {
                const selected = isSelected(option.value);
                return (
                    <button
                        key={option.value}
                        onClick={() => handleClick(option.value)}
                        className={`group relative flex flex-col items-center text-left transition-all duration-200 outline-none`}
                        title={option.label}
                        type="button"
                    >
                        <div className={`relative w-full aspect-square rounded-2xl overflow-hidden mb-2 transition-all duration-200 ${
                            selected 
                            ? 'ring-2 ring-primary ring-offset-2' 
                            : 'ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md'
                        }`}>
                            {option.thumbnail ? (
                                <img 
                                    src={option.thumbnail} 
                                    alt={option.label} 
                                    className={`w-full h-full object-cover transition-transform duration-500 ${selected ? 'scale-105' : 'group-hover:scale-110'}`} 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-1 p-2">
                                    <Icon name="image" className="w-6 h-6" />
                                </div>
                            )}
                            
                            {/* Selected Indicator - Cleaner Badge */}
                            {selected && (
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5 shadow-md transform scale-100 transition-transform">
                                    <Icon name="check-circle" className="w-4 h-4" />
                                </div>
                            )}
                            
                            {/* Hover Overlay */}
                            {!selected && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                            )}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 px-1 ${selected ? 'text-primary' : 'text-slate-600 group-hover:text-slate-900'}`}>
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
