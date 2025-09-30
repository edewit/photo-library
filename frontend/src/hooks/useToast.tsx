import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertGroup, Alert, AlertActionCloseButton } from '@patternfly/react-core';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
}

interface ToastContextType {
  addToast: (variant: ToastVariant, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, variant, title, message };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const value: ToastContextType = {
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AlertGroup isToast isLiveRegion>
        {toasts.map(toast => (
          <Alert
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            actionClose={
              <AlertActionCloseButton onClose={() => removeToast(toast.id)} />
            }
            timeout={5000}
            onTimeout={() => removeToast(toast.id)}
          >
            {toast.message}
          </Alert>
        ))}
      </AlertGroup>
    </ToastContext.Provider>
  );
};
