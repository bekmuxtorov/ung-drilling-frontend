import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Sarlavha ostida chiziq (R-5 O'chirish uslubi) */
  divided?: boolean;
  /** Holatni saqlagan holda vaqtincha yashirish */
  hidden?: boolean;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, footer, size = 'md', divided, hidden, children }) => {
  useEffect(() => {
    if (!open || hidden) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hidden, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" hidden={hidden} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal--${size} ${divided ? 'modal--divided' : ''}`} role="dialog" aria-modal="true">
        <h3 className="modal__title">{title}</h3>
        {children && <div className="modal__body">{children}</div>}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};
