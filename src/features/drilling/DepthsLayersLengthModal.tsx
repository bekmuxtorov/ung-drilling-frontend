import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { DepthsLayersLength } from '../../api/types';
import { RelationSelect } from '../references/RelationSelect';

interface DepthsLayersLengthModalProps {
  open: boolean;
  drillingBpaId: number;
  item: DepthsLayersLength | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: (item: DepthsLayersLength) => void;
}

export const DepthsLayersLengthModal: React.FC<DepthsLayersLengthModalProps> = ({
  open,
  drillingBpaId,
  item,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isEdit = !!item;
  const [layer, setLayer] = useState('');
  const [length, setLength] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setLayer(item.layer?.id ? String(item.layer.id) : '');
        setLength(item.length != null ? String(item.length) : '');
      } else {
        setLayer('');
        setLength('');
      }
      setError('');
      setSubmitting(false);
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');

    if (!layer) {
      setError('Geologik chuqurlik qatlamini tanlang');
      return;
    }

    const parsedLength = length.trim() ? parseFloat(length) : null;

    if (parsedLength != null && (isNaN(parsedLength) || parsedLength <= 0)) {
      setError("Qatlam qalinligi 0 dan katta (musbat son) bo‘lishi kerak");
      return;
    }

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: drillingBpaId,
      layer: Number(layer),
      length: parsedLength,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isEdit
    ? 'Qatlam kesimi ma‘lumotlari'
    : 'Yangi qatlam kesimi qo‘shish';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      footer={
        <>
          {isEdit && onDelete && (
            <button
              type="button"
              className="btn btn--outline btn--danger"
              onClick={() => onDelete(item)}
              disabled={submitting}
              title="Qatlam kesimini o‘chirish"
            >
              <Trash2 size={14} />
              O‘chirish
            </button>
          )}
          <div className="modal__footer-spacer" />
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            <X size={14} />
            Bekor qilish
          </button>
          <button type="submit" form="depth-layer-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isEdit ? (
              <Save size={14} />
            ) : (
              <Plus size={14} />
            )}
            {isEdit ? 'Saqlash' : 'Qo‘shish'}
          </button>
        </>
      }
    >
      <form id="depth-layer-form" onSubmit={handleSubmit} className="well-design-form" noValidate>
        {error && <div className="field-error-alert">{error}</div>}

        <label className="field">
          <span className="field__label">
            Geologik chuqurlik qatlami <span className="field__required">*</span>
          </span>
          <RelationSelect
            reference="depths-layers"
            placeholder="Qatlamni tanlang yoki qidiring..."
            value={layer}
            onChange={setLayer}
          />
        </label>

        <label className="field">
          <span className="field__label">Qatlam qalinligi / Oralig'i (m)</span>
          <div className="input-with-unit">
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              placeholder="Masalan: 320.5"
              value={length}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) {
                  setLength(val);
                }
              }}
            />
            <span className="input-unit">m</span>
          </div>
        </label>
      </form>
    </Modal>
  );
};
