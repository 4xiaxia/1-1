/**
 * Toast Notification Component
 * 
 * Displays temporary messages with different types:
 * - info: General information (blue)
 * - success: Success messages (green)
 * - warning: Warning messages (yellow)
 * - error: Error messages (red)
 */

import React, { useEffect, useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number; // milliseconds
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors: Record<ToastType, string> = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const icons: Record<ToastType, string> = {
    info: 'fa-info-circle',
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle',
  };

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className={`${bgColors[type]} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[200px] max-w-[90vw]`}>
        <i className={`fas ${icons[type]} text-lg`} aria-hidden="true"></i>
        <span className="font-medium text-sm">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 text-white/80 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;
