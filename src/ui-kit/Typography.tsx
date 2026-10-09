import React from 'react';
import { typography } from './tokens.js';

/* ==========================================================================
   PRIMARY HEADINGS (H1, H2, H3)
   Font: Satoshi
   Weight: Bold / Black (700 / 900)
   Letter-spacing: -0.02em (tight)
   ========================================================================== */

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  weight?: 'bold' | 'black';
  tight?: boolean;
}

export const H1: React.FC<HeadingProps> = ({
  children,
  className = '',
  weight = 'bold',
  tight = true,
  ...props
}) => {
  const weightClass = weight === 'black' ? 'font-black' : 'font-bold md:font-black';
  const trackingClass = tight ? 'tracking-[-0.02em]' : 'tracking-normal';
  return (
    <h1
      className={`font-satoshi ${weightClass} ${trackingClass} leading-[1.08] text-[#080B12] ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
};

export const H2: React.FC<HeadingProps> = ({
  children,
  className = '',
  weight = 'bold',
  tight = true,
  ...props
}) => {
  const weightClass = weight === 'black' ? 'font-black' : 'font-bold';
  const trackingClass = tight ? 'tracking-[-0.02em]' : 'tracking-normal';
  return (
    <h2
      className={`font-satoshi ${weightClass} ${trackingClass} leading-[1.15] text-[#080B12] ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
};

export const H3: React.FC<HeadingProps> = ({
  children,
  className = '',
  weight = 'bold',
  tight = true,
  ...props
}) => {
  const weightClass = weight === 'black' ? 'font-black' : 'font-bold';
  const trackingClass = tight ? 'tracking-[-0.02em]' : 'tracking-normal';
  return (
    <h3
      className={`font-satoshi ${weightClass} ${trackingClass} leading-snug text-[#080B12] ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

/* ==========================================================================
   SUBHEADINGS & BUTTONS / ACTIONS
   Font: Satoshi
   Weight: Medium (500) / Medium Italic
   ========================================================================== */

export interface SubheadingProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  italic?: boolean;
}

export const Subheading: React.FC<SubheadingProps> = ({
  children,
  className = '',
  italic = false,
  ...props
}) => {
  const italicClass = italic ? 'italic' : '';
  return (
    <p
      className={`font-satoshi font-medium ${italicClass} text-[#5F6673] leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export interface ActionTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  italic?: boolean;
}

export const ActionText: React.FC<ActionTextProps> = ({
  children,
  className = '',
  italic = false,
  ...props
}) => {
  const italicClass = italic ? 'italic' : '';
  return (
    <span
      className={`font-satoshi font-medium ${italicClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

/* ==========================================================================
   LONG-FORM BODY TEXT
   Font: DM Sans
   Weight: Regular (400)
   Line-height: standard (1.5 - 1.6)
   ========================================================================== */

export interface BodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  size?: 'sm' | 'base' | 'lg';
}

export const BodyText: React.FC<BodyTextProps> = ({
  children,
  className = '',
  size = 'base',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-sm leading-[1.55]',
    base: 'text-base leading-[1.55]',
    lg: 'text-lg md:text-[19px] leading-[1.6]',
  };

  return (
    <p
      className={`font-dmsans font-normal text-[#5F6673] ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

/* ==========================================================================
   APP UI & DATA TABLES
   Font: DM Sans
   Weight: Regular / Medium (400 / 500)
   Ensures dense numbers, metrics, and prompt inputs remain perfectly readable.
   ========================================================================== */

export interface UITextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  weight?: 'normal' | 'medium';
}

export const UIText: React.FC<UITextProps> = ({
  children,
  className = '',
  weight = 'normal',
  ...props
}) => {
  const weightClass = weight === 'medium' ? 'font-medium' : 'font-normal';
  return (
    <span
      className={`font-dmsans ${weightClass} text-[#080B12] ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export interface DataTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  weight?: 'normal' | 'medium' | 'semibold';
}

export const DataText: React.FC<DataTextProps> = ({
  children,
  className = '',
  weight = 'medium',
  ...props
}) => {
  const weightClass = weight === 'normal' ? 'font-normal' : weight === 'semibold' ? 'font-semibold' : 'font-medium';
  return (
    <span
      className={`font-dmsans ${weightClass} tabular-nums text-[#080B12] tracking-tight ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
