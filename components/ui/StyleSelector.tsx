
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
        <div className={`grid grid-cols-3 sm:grid-cols-4 gap-3 ${className} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            {options.map((option) => {
                const selected = isSelected(option.value);
                return (
                    <button
                        key={option.value}
                        onClick={() => handleClick(option.value)}
                        className={`group relative flex flex-col items-center text-left transition-all duration-200 ${selected ? 'scale-105' : 'hover:scale-105'}`}
                        title={option.label}
                        type="button"
                    >
                        <div className={`relative w-full aspect-square rounded-xl overflow-hidden mb-2 border-2 shadow-sm transition-all ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 group-hover:border-slate-300'}`}>
                            {option.thumbnail ? (
                                <img 
                                    src={option.thumbnail} 
                                    alt={option.label} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    loading="lazy" 
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-1 p-2">
                                    <Icon name="image" className="w-6 h-6" />
                                </div>
                            )}
                            
                            {/* Selected Overlay */}
                            {selected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                                    <div className="bg-white text-primary rounded-full p-1 shadow-lg transform scale-110">
                                        <Icon name="check-circle" className="w-5 h-5" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 px-1 ${selected ? 'text-primary' : 'text-slate-600'}`}>
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
