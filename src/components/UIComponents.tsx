import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-cyan-500',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = '加載中...',
  fullScreen = false
}) => {
  return (
    <div
      className={`${
        fullScreen ? 'fixed' : 'absolute'
      } inset-0 z-[999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm`}
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-400 font-mono tracking-widest">{message}</p>
    </div>
  );
};

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss
}) => {
  return (
    <div className="p-4 bg-red-900/20 border border-red-900 rounded">
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-sm font-bold text-red-500">錯誤</h3>
      </div>
      <p className="text-sm text-red-300 mb-4">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-xs bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-200 rounded transition-colors"
          >
            重試
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-xs bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-400 rounded transition-colors"
          >
            關閉
          </button>
        )}
      </div>
    </div>
  );
};

// 响应式Modal容器
interface ResponsiveModalProps {
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
  title?: string;
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  width = 'md',
  onClose,
  title,
  className = ''
}) => {
  const widthClasses = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`${widthClasses[width]} bg-black border border-gray-800 shadow-2xl ${className}`}>
        {title && (
          <div className="flex justify-between items-center p-6 border-b border-gray-800">
            <h3 className="text-xl text-gray-300 font-serif tracking-widest">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
