
import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger entry animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-slate-800' : 'bg-red-500';

  return (
    <div 
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[90] flex items-center px-4 py-3 rounded-xl shadow-2xl text-white ${bgColor} transition-all duration-300 ease-spring ${
            isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
        }`}
    >
      <Icon name={type === 'success' ? 'check-circle' : 'close'} className="w-5 h-5 mr-3 text-white" />
      <span className="font-medium text-sm">{message}</span>
      <button onClick={() => setIsVisible(false)} className="ml-4 opacity-70 hover:opacity-100">
        <Icon name="close" className="w-4 h-4" />
      </button>
    </div>
  );
};
