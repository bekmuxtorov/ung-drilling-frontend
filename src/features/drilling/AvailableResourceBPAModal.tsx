import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { AvailableResourcesBPA } from '../../api/types';
import { RelationSelect } from '../references/RelationSelect';

interface AvailableResourceBPAModalProps {
  open: boolean;
  drillingBpaId: number;
  item: AvailableResourcesBPA | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

export const AvailableResourceBPAModal: React.FC<AvailableResourceBPAModalProps> = ({
  open,
  drillingBpaId,
  item,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!item;
  const [resourceId, setResourceId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setResourceId(item.resources?.id ? String(item.resources.id) : '');
        setUnitId(item.unit?.id ? String(item.unit.id) : '');
        setValue(item.value != null ? String(item.value) : '');
        setDescription(item.description || '');
      } else {
        setResourceId('');
        setUnitId('');
        setValue('');
        setDescription('');
      }
      setError('');
      setSubmitting(false);
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!resourceId) {
      setError('Resurs turini tanlang');
      return;
    }
    if (!unitId) {
      setError('O‘lchov birligini tanlang');
      return;
    }

    setError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: drillingBpaId,
      resources: Number(resourceId),
      unit: Number(unitId),
      value: value ? parseFloat(value) : null,
      description: description.trim(),
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
      title={isEdit ? 'Resurs ma’lumotini tahrirlash' : 'Resurs / Material biriktirish'}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </button>
          <button type="submit" form="avail-res-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Saqlash' : 'Qo‘shish'}
          </button>
        </>
      }
    >
      <form id="avail-res-form" onSubmit={handleSubmit} className="form-grid">
        {error && <div className="field-error-alert">{error}</div>}

        <label className="field">
          <span className="field__label">
            Resurs (Moddiy-texnik vosita) <span className="field__required">*</span>
          </span>
          <RelationSelect
            reference="resources"
            placeholder="Resursni tanlang"
            value={resourceId}
            onChange={setResourceId}
          />
        </label>

        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">
              O‘lchov birligi <span className="field__required">*</span>
            </span>
            <RelationSelect
              reference="units"
              placeholder="Birlikni tanlang"
              value={unitId}
              onChange={setUnitId}
            />
          </label>

          <label className="field">
            <span className="field__label">Miqdori</span>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="Masalan: 45.5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">Izoh / Holat tavsifi</span>
          <textarea
            className="input"
            rows={2}
            placeholder="Ombordagi qoldiq, sarflangan joyi yoki yetkazib berish holati..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </form>
    </Modal>
  );
};
