import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { AvailableResourcesBPA } from '../../api/types';
import { RelationSelect } from '../references/RelationSelect';
import { tr } from '../../i18n';

interface AvailableResourceBPAModalProps {
  open: boolean;
  drillingBpaId: number;
  item: AvailableResourcesBPA | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: (item: AvailableResourcesBPA) => void;
}

export const AvailableResourceBPAModal: React.FC<AvailableResourceBPAModalProps> = ({
  open,
  drillingBpaId,
  item,
  onClose,
  onSubmit,
  onDelete,
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
      setError(tr('Resurs (moddiy-texnik vosita) turini tanlang'));
      return;
    }
    if (!unitId) {
      setError(tr('O‘lchov birligini tanlang'));
      return;
    }

    if (value && parseFloat(value) < 0) {
      setError(tr('Miqdor manfiy bo‘lishi mumkin emas'));
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
      setError(err instanceof ApiError ? err.message : tr('Saqlashda xatolik yuz berdi'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isEdit ? tr('Resurs ma’lumotini tahrirlash') : tr('Resurs / Material biriktirish')}
      footer={
        <>
          {isEdit && onDelete && (
            <button
              type="button"
              className="btn btn--outline btn--danger"
              onClick={() => onDelete(item)}
              disabled={submitting}
              title={tr('Resursni o‘chirish')}
            >
              <Trash2 size={14} />
              {tr('O‘chirish')}</button>
          )}
          <div className="modal__footer-spacer" />
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            <X size={14} />
            {tr('Bekor qilish')}</button>
          <button type="submit" form="avail-res-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isEdit ? (
              <>
                <Save size={14} />
                {tr('Saqlash')}</>
            ) : (
              <>
                <Plus size={14} />
                {tr('Qo‘shish')}</>
            )}
          </button>
        </>
      }
    >
      <form id="avail-res-form" onSubmit={handleSubmit} className="bpa-form" noValidate>
        {error && <div className="field-error-alert">{error}</div>}

        <div className="field">
          <span className="field__label">
            {tr('Resurs (Moddiy-texnik vosita)')}{' '}<span className="field__required">*</span>
          </span>
          <RelationSelect
            reference="resources"
            placeholder={tr('Resursni tanlang yoki qidiring...')}
            value={resourceId}
            onChange={setResourceId}
            allowCreate
          />
        </div>

        <div className="bpa-form-row">
          <label className="field">
            <span className="field__label">{tr('Miqdori')}</span>
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              placeholder={tr('Masalan: 45.5')}
              value={value}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) {
                  setValue(val);
                }
              }}
            />
          </label>

          <div className="field">
            <span className="field__label">
              {tr('O‘lchov birligi')}{' '}<span className="field__required">*</span>
            </span>
            <RelationSelect
              reference="units"
              placeholder={tr('Birlikni tanlang...')}
              value={unitId}
              onChange={setUnitId}
              allowCreate
            />
          </div>
        </div>

        <label className="field">
          <span className="field__label">{tr('Izoh / Holat tavsifi')}</span>
          <textarea
            className="input textarea"
            rows={3}
            placeholder={tr("Ombordagi qoldiq, sarflangan joyi yoki yetkazib berish holati haqida qisqacha ma'lumot...")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </form>
    </Modal>
  );
};

