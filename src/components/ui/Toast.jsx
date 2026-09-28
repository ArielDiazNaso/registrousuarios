import { createPortal } from 'react-dom';
import { useToast } from '../../hooks/useToast.js';

const TYPE_ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

const ToastItem = ({ toast, onDismiss }) => {
  const typeIcon = TYPE_ICONS[toast.type] || TYPE_ICONS.info;
  return (
    <div
      className={`toast toast-${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      data-toast-id={toast.id}
    >
      <span className="toast-icon" aria-hidden="true">
        {typeIcon}
      </span>
      <div className="toast-body">
        {toast.title && <p className="toast-title">{toast.title}</p>}
        <div className="toast-content">{toast.content}</div>
      </div>
      {toast.dismissible && (
        <button
          type="button"
          className="toast-dismiss"
          onClick={() => onDismiss(toast.id)}
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      )}
    </div>
  );
};

const POSITION_CLASSES = {
  'top-left': 'toast-container-top-left',
  'top-center': 'toast-container-top-center',
  'top-right': 'toast-container-top-right',
  'bottom-left': 'toast-container-bottom-left',
  'bottom-center': 'toast-container-bottom-center',
  'bottom-right': 'toast-container-bottom-right',
};

export const ToastContainer = () => {
  const { toasts, dismiss } = useToast();

  if (typeof document === 'undefined') return null;

  const byPosition = toasts.reduce((acc, t) => {
    const pos = t.position || 'top-right';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(t);
    return acc;
  }, {});

  const portals = Object.entries(byPosition).map(([pos, items]) => (
    <div
      key={pos}
      className={`toast-container ${POSITION_CLASSES[pos] || ''}`.trim()}
    >
      {items.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  ));

  return createPortal(<>{portals}</>, document.body);
};

export default ToastContainer;
