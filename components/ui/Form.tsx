
import React from 'react';

export const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, className, ...props }) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-semibold text-black mb-1">{label}</label>
      <input
        id={id}
        className={`w-full px-3 py-2 bg-white border border-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-primary shadow-sm ${className || ''}`}
        {...props}
      />
    </div>
);

export const FormTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, className, ...props }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-semibold text-black mb-1">{label}</label>
        <textarea
            id={id}
            className={`w-full px-3 py-2 bg-white border border-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-primary resize-none shadow-sm ${className || ''}`}
            {...props}
        />
    </div>
);
