import { createContext, useState, useCallback, useMemo, useEffect } from 'react';

export const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;
const MAX_VISIBLE = 5;

let toastIdCounter = 0;
const nextId = () => {
  toastIdCounter += 1;
  return `toast_${Date.now()}_${toastIdCounter}`;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const pushToast = useCallback(
    (content, options = {}) => {
      const id = options.id || nextId();
      const toast = {
        id,
        type: options.type || 'info',
        title: options.title || null,
        content,
        duration: options.duration != null ? options.duration : DEFAULT_DURATION,
        dismissible: options.dismissible !== false,
        position: options.position || 'top-right',
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        const next = [...prev, toast];
        if (next.length > MAX_VISIBLE) {
          return next.slice(next.length - MAX_VISIBLE);
        }
        return next;
      });

      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, toast.duration);
      }

      return id;
    },
    []
  );

  const toastApi = useMemo(() => {
    const factory = (type) => (content, opts = {}) =>
      pushToast(content, { ...opts, type });
    return {
      show: pushToast,
      info: factory('info'),
      success: factory('success'),
      warning: factory('warning'),
      error: factory('error'),
      dismiss,
      dismissAll,
    };
  }, [pushToast, dismiss, dismissAll]);

  useEffect(() => {
    return () => setToasts([]);
  }, []);

  const value = useMemo(
    () => ({ ...toastApi, toasts }),
    [toastApi, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
