import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, X, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { WellDesignInLength, WellDesignPeriodType } from '../../api/types';
import { tr } from '../../i18n';

interface WellDesignInLengthModalProps {
  open: boolean;
  drillingBpaId: number;
  item: WellDesignInLength | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: (item: WellDesignInLength) => void;
}

export const WellDesignInLengthModal: React.FC<WellDesignInLengthModalProps> = ({
  open,
  drillingBpaId,
  item,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isEdit = !!item;
  const [type, setType] = useState<WellDesignPeriodType>('day');
  const [lengthPlan, setLengthPlan] = useState('');
  const [lengthFact, setLengthFact] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setType(item.type || 'day');
        setLengthPlan(item.length_plan != null ? String(item.length_plan) : '');
        setLengthFact(item.length_fact != null ? String(item.length_fact) : '');
        setStartDate(item.start_date ? item.start_date.slice(0, 16) : '');
      } else {
        setType('day');
        setLengthPlan('');
        setLengthFact('');
        setStartDate('');
      }
      setError('');
      setSubmitting(false);
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');

    const parsedPlan = lengthPlan.trim() ? parseFloat(lengthPlan) : null;
    const parsedFact = lengthFact.trim() ? parseFloat(lengthFact) : null;

    if (parsedPlan != null && (isNaN(parsedPlan) || parsedPlan < 0)) {
      setError(tr('Reja o‘tish musbat son bo‘lishi kerak'));
      return;
    }

    if (parsedFact != null && (isNaN(parsedFact) || parsedFact < 0)) {
      setError(tr('Fakt o‘tish musbat son bo‘lishi kerak'));
      return;
    }

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: drillingBpaId,
      type,
      length_plan: parsedPlan,
      length_fact: parsedFact,
      start_date: startDate ? new Date(startDate).toISOString() : null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tr('Saqlashda xatolik yuz berdi'));
    } finally {
      setSubmitting(false);
    }
  };

  const periodName = type === 'day' ? tr('Kunlik') : type === 'month' ? tr('Oylik') : tr('Yillik');
  const modalTitle = isEdit
    ? tr('O‘tish dinamikasi ma‘lumotlari ({0})', periodName)
    : tr('O‘tish dinamikasi qo‘shish');

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
              title={tr('Dinamika yozuvini o‘chirish')}
            >
              <Trash2 size={14} />
              {tr('O‘chirish')}</button>
          )}
          <div className="modal__footer-spacer" />
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            <X size={14} />
            {tr('Bekor qilish')}</button>
          <button type="submit" form="dinamika-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isEdit ? (
              <Save size={14} />
            ) : (
              <Plus size={14} />
            )}
            {isEdit ? tr('Saqlash') : tr('Qo‘shish')}
          </button>
        </>
      }
    >
      <form id="dinamika-form" onSubmit={handleSubmit} className="well-design-form" noValidate>
        {error && <div className="field-error-alert">{error}</div>}

        <div className="field">
          <span className="field__label">{tr('Hisobot davri')}</span>
          <div className="design-type-segmented">
            <button
              type="button"
              className={`design-type-btn ${type === 'day' ? 'is-active is-plan' : ''}`}
              onClick={() => setType('day')}
            >
              <Calendar size={14} />
              {tr('Kunlik')}</button>
            <button
              type="button"
              className={`design-type-btn ${type === 'month' ? 'is-active is-plan' : ''}`}
              onClick={() => setType('month')}
            >
              <CalendarDays size={14} />
              {tr('Oylik')}</button>
            <button
              type="button"
              className={`design-type-btn ${type === 'year' ? 'is-active is-plan' : ''}`}
              onClick={() => setType('year')}
            >
              <CalendarRange size={14} />
              {tr('Yillik')}</button>
          </div>
        </div>

        <div className="bpa-form-row">
          <label className="field">
            <span className="field__label">{tr("Reja o'tish (m)")}</span>
            <div className="input-with-unit">
              <input
                type="number"
                step="any"
                min="0"
                className="input"
                placeholder={tr('Masalan: 45.0')}
                value={lengthPlan}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setLengthPlan(val);
                  }
                }}
              />
              <span className="input-unit">{tr('m')}</span>
            </div>
          </label>

          <label className="field">
            <span className="field__label">{tr("Fakt o'tish (m)")}</span>
            <div className="input-with-unit">
              <input
                type="number"
                step="any"
                min="0"
                className="input"
                placeholder={tr('Masalan: 48.2')}
                value={lengthFact}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setLengthFact(val);
                  }
                }}
              />
              <span className="input-unit">{tr('m')}</span>
            </div>
          </label>
        </div>

        <label className="field">
          <span className="field__label">{tr('Boshlanish sanasi')}</span>
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
