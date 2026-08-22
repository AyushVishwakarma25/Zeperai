
import React from 'react';
import type { SkinTone } from '../../types.js';

interface SkinToneOption {
    value: SkinTone;
    color: string;
    label: string;
}

interface SkinToneSelectorProps {
    label: string;
    options: SkinToneOption[];
    value: SkinTone;
    onChange: (value: SkinTone) => void;
    className?: string;
}

export const SkinToneSelector: React.FC<SkinToneSelectorProps> = ({ label, options, value, onChange, className }) => {
    return (
        <div className={className}>
            <label className="block text-sm font-semibold text-black mb-2">{label}</label>
            <div className="flex space-x-3 items-center">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`w-8 h-8 rounded-full transition-all duration-200 border-2 border-transparent ${
                            value === option.value
                                ? 'ring-2 ring-offset-2 ring-offset-sidebar ring-primary shadow-glow-primary'
                                : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: option.color }}
                        aria-label={option.label}
                    />
                ))}
            </div>
        </div>
    );
};
