import React from 'react';
import { Loader2, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  warning?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** R-5 O'chirish: "…ni o'chirmoqchimisiz?" */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, warning, loading, onConfirm, onClose }) => (
  <Modal
    open={open}
    onClose={loading ? () => undefined : onClose}
    size="sm"
    divided
    title={title}
    footer={
      <>
        <button type="button" className="btn btn--outline" onClick={onClose} disabled={loading}>
          <X size={14} />
          Bekor qilish
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          O'chirish
        </button>
      </>
    }
  >
    {warning && <p className="confirm__warning">{warning}</p>}
  </Modal>
);
