import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, X, Compass, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { WellDesign, WellDesignType } from '../../api/types';

interface WellDesignModalProps {
  open: boolean;
  drillingBpaId: number;
  item: WellDesign | null;
  defaultType?: WellDesignType;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: (item: WellDesign) => void;
}

export const WellDesignModal: React.FC<WellDesignModalProps> = ({
  open,
  drillingBpaId,
  item,
  defaultType = 'plan',
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isEdit = !!item;
  const [type, setType] = useState<WellDesignType>(defaultType);
  const [pipeDiameter, setPipeDiameter] = useState('');
  const [length, setLength] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setType(item.type || defaultType || 'plan');
        setPipeDiameter(item.pipe_diameter != null ? String(item.pipe_diameter) : '');
        setLength(item.length != null ? String(item.length) : '');
        setStartDate(item.start_date ? item.start_date.slice(0, 16) : '');
      } else {
        setType(defaultType || 'plan');
        setPipeDiameter('');
        setLength('');
        setStartDate('');
      }
      setError('');
      setSubmitting(false);
    }
  }, [open, item, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');

    const parsedDiameter = pipeDiameter.trim() ? parseFloat(pipeDiameter) : null;
    const parsedLength = length.trim() ? parseFloat(length) : null;

    if (parsedDiameter == null || isNaN(parsedDiameter)) {
      setError("Quvur diametrini kiriting");
      return;
    }

    if (parsedDiameter <= 0) {
      setError("Quvur diametri 0 dan katta (musbat son) bo‘lishi kerak");
      return;
    }

    if (parsedLength == null || isNaN(parsedLength)) {
      setError("Tushirish chuqurligi / Uzunligini kiriting");
      return;
    }

    if (parsedLength <= 0) {
      setError("Tushirish chuqurligi / Uzunligi 0 dan katta (musbat son) bo‘lishi kerak");
      return;
    }

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: drillingBpaId,
      type,
      pipe_diameter: parsedDiameter,
      length: parsedLength,
      start_date: startDate ? new Date(startDate).toISOString() : null,
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
    ? `Konstruksiya ma‘lumotlari (${type === 'fact' ? 'Fakt' : 'Reja'})`
    : type === 'fact'
      ? 'Fakt bo‘yicha konstruksiya qo‘shish'
      : 'Reja (Plan) bo‘yicha konstruksiya qo‘shish';

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
              title="Konstruksiyani o‘chirish"
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
          <button
            type="submit"
            form="well-design-form"
            className={`btn ${type === 'fact' ? 'btn--success' : 'btn--primary'}`}
            disabled={submitting}
          >
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
      <form id="well-design-form" onSubmit={handleSubmit} className="well-design-form" noValidate>
        {error && <div className="field-error-alert">{error}</div>}

        <div className="field">
          <span className="field__label">Konstruksiya turi</span>
          <div className="design-type-segmented">
            <button
              type="button"
              className={`design-type-btn ${type === 'plan' ? 'is-active is-plan' : ''}`}
              onClick={() => setType('plan')}
            >
              <Compass size={14} />
              Reja (Plan)
            </button>
            <button
              type="button"
              className={`design-type-btn ${type === 'fact' ? 'is-active is-fact' : ''}`}
              onClick={() => setType('fact')}
            >
              <CheckCircle2 size={14} />
              Fakt (Amaldagi)
            </button>
          </div>
        </div>

        <label className="field">
          <span className="field__label">Quvur diametri (mm)</span>
          <div className="input-with-unit">
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              placeholder="Masalan: 244.5"
              value={pipeDiameter}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) {
                  setPipeDiameter(val);
                }
              }}
              required
            />
            <span className="input-unit">mm</span>
          </div>
        </label>

        <label className="field">
          <span className="field__label">Tushirish chuqurligi / Uzunligi (m)</span>
          <div className="input-with-unit">
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              placeholder="Masalan: 1250"
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
              required
            />
            <span className="input-unit">m</span>
          </div>
        </label>

        <label className="field">
          <span className="field__label">Boshlanish sanasi</span>
          <input
            type="datetime-local"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
      </form>
    </Modal>
  );
};
