'use client';
import { createContext, useState, useCallback, useMemo, useEffect } from 'react';

export const ToastContext = createContext(null);

let toastIdCounter = 0;
const nextId = () => `toast_${Date.now()}_${++toastIdCounter}`;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback((content, options = {}) => {
    const id = options.id || nextId();
    const toast = {
      id,
      type: options.type || 'info',
      title: options.title || null,
      content,
      duration: options.duration != null ? options.duration : 4000,
      dismissible: options.dismissible !== false,
    };
    setToasts(prev => [...prev, toast].slice(-5));
    if (toast.duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), toast.duration);
    }
    return id;
  }, []);

  const factory = (type) => (content, opts = {}) => pushToast(content, { ...opts, type });

  const value = useMemo(() => ({
    toasts,
    show: pushToast,
    info: factory('info'),
    success: factory('success'),
    warning: factory('warning'),
    error: factory('error'),
    dismiss,
    dismissAll: () => setToasts([]),
  }), [toasts, pushToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="toast-container toast-top-right" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            {t.title && <p className="toast-title">{t.title}</p>}
            <p className="toast-message">{t.content}</p>
            {t.dismissible && (
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Cerrar">✕</button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
