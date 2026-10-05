import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
}

export const DepthsLayersLengthModal: React.FC<DepthsLayersLengthModalProps> = ({
  open,
  drillingBpaId,
  item,
  onClose,
  onSubmit,
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

    if (!layer) {
      setError('Chuqurlik qatlamini tanlang');
      return;
    }

    setError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: drillingBpaId,
      layer: Number(layer),
      length: length ? parseFloat(length) : null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Qatlam kesimini tahrirlash' : 'Chuqurlik qatlami kesimi qo‘shish'}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </button>
          <button type="submit" form="depth-layer-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Saqlash' : 'Qo‘shish'}
          </button>
        </>
      }
    >
      <form id="depth-layer-form" onSubmit={handleSubmit} className="form-grid">
        {error && <div className="field-error-alert">{error}</div>}

        <label className="field">
          <span className="field__label">
            Geologik chuqurlik qatlami <span className="field__required">*</span>
          </span>
          <RelationSelect
            reference="depths-layers"
            placeholder="Qatlamni tanlang"
            value={layer}
            onChange={setLayer}
          />
        </label>

        <label className="field">
          <span className="field__label">Qatlam qalinligi / O'tish uzunligi (m)</span>
          <input
            type="number"
            step="0.1"
            className="input"
            placeholder="Masalan: 320.5"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
        </label>
      </form>
    </Modal>
  );
};
