import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button.jsx';

export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  hideCloseButton = false,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape' && closeOnEsc && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const portalRoot =
    typeof document !== 'undefined' ? document.body : null;
  if (!portalRoot) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const sizeCls = `modal-${size}`;

  return createPortal(
    <div
      className={`modal-backdrop ${className}`.trim()}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={`modal ${sizeCls}`} role="document">
        <header className="modal-header">
          {title && (
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
          )}
          {!hideCloseButton && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="modal-close"
            >
              ×
            </Button>
          )}
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    portalRoot
  );
};

export default Modal;
