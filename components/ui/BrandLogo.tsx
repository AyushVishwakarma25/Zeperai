
import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'icon';
  color?: 'primary' | 'white' | 'black';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'full', color = 'primary', className = '' }) => {
  const textColor = color === 'white' ? '#FFFFFF' : color === 'black' ? '#111827' : '#6A5AE0';
  const dotColor = color === 'white' ? '#FFFFFF' : '#10B981'; // Accent green for the dot if colored

  if (variant === 'icon') {
    return (
      <svg 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        <path d="M20 5L5 35H15L20 25L25 35H35L20 5Z" fill={textColor} stroke={textColor} strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="20" cy="20" r="4" fill={dotColor} />
      </svg>
    );
  }

  return (
    <svg 
      viewBox="0 0 160 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="ZeperAi Logo"
    >
      <text 
        x="0" 
        y="30" 
        fontFamily="'Poppins', sans-serif" 
        fontWeight="700" 
        fontSize="32" 
        fill={color === 'white' ? '#FFFFFF' : '#000000'}
        letterSpacing="-0.02em"
      >
        Zeper<tspan fill={color === 'white' ? '#FFFFFF' : '#6A5AE0'}>Ai</tspan>
      </text>
      {/* Decorative node/sparkle implied in animation */}
      <circle cx="145" cy="15" r="3" fill={color === 'white' ? '#FFFFFF' : '#6A5AE0'} opacity="0.5" />
      <circle cx="152" cy="10" r="2" fill={color === 'white' ? '#FFFFFF' : '#6A5AE0'} opacity="0.3" />
    </svg>
  );
};
