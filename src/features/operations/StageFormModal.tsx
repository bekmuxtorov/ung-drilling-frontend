import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { OperationStage, OperationStageChoice, StageType } from '../../api/types';
import { formatDateTimeShort } from '../references/format';

interface StageFormModalProps {
  open: boolean;
  hidden?: boolean;
  stage: OperationStage | null;
  presetType?: StageType;
  choices: OperationStageChoice[];
  /** Operatsiyada allaqachon mavjud bosqich turlari */
  usedTypes: StageType[];
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: (stage: OperationStage) => void;
}

type Values = Record<string, string>;

const DATE_FIELDS = ['plan_start_date', 'plan_end_date', 'fact_start_date', 'fact_end_date'] as const;

/** Ikki sana orasidagi kunlar soni (ikkala kun ham hisobga olinadi) */
const daysBetween = (start: string, end: string) => {
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return null;
  return Math.round((e - s) / 86_400_000) + 1;
};

export const StageFormModal: React.FC<StageFormModalProps> = ({
  open,
  hidden,
  stage,
  presetType,
  choices,
  usedTypes,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isEdit = !!stage;
  const initial = useMemo<Values>(
    () => ({
      stage_type: stage?.stage_type ?? presetType ?? '',
      plan_days: stage ? String(stage.plan_days ?? '') : '',
      fact_days: stage ? String(stage.fact_days ?? '') : '',
      plan_start_date: stage?.plan_start_date ?? '',
      plan_end_date: stage?.plan_end_date ?? '',
      fact_start_date: stage?.fact_start_date ?? '',
      fact_end_date: stage?.fact_end_date ?? '',
      description: stage?.description ?? '',
    }),
    [stage, presetType],
  );

  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial);
      setErrors({});
      setFormError('');
      setSubmitting(false);
    }
  }, [open, initial]);

  const set = (name: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      // Sanalar to'liq kiritilganda kunlar sonini avtomatik hisoblash
      if (name === 'plan_start_date' || name === 'plan_end_date') {
        const d = daysBetween(next.plan_start_date, next.plan_end_date);
        if (d !== null) next.plan_days = String(d);
      }
      if (name === 'fact_start_date' || name === 'fact_end_date') {
        const d = daysBetween(next.fact_start_date, next.fact_end_date);
        if (d !== null) next.fact_days = String(d);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.stage_type) e.stage_type = 'Bosqich turini tanlang';
    ['plan_days', 'fact_days'].forEach((k) => {
      if (values[k] && !/^\d+$/.test(values[k])) e[k] = 'Musbat butun son kiriting';
    });
    if (values.plan_start_date && values.plan_end_date && values.plan_end_date < values.plan_start_date)
      e.plan_end_date = 'Boshlanish sanasidan oldin bo‘lishi mumkin emas';
    if (values.fact_start_date && values.fact_end_date && values.fact_end_date < values.fact_start_date)
      e.fact_end_date = 'Boshlanish sanasidan oldin bo‘lishi mumkin emas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    const payload: Record<string, unknown> = {
      stage_type: values.stage_type,
      plan_days: values.plan_days ? Number(values.plan_days) : 0,
      fact_days: values.fact_days ? Number(values.fact_days) : 0,
      description: values.description.trim() || null,
    };
    DATE_FIELDS.forEach((k) => (payload[k] = values[k] || null));
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setFormError(err.message);
      } else setFormError("Noma'lum xatolik yuz berdi");
      setSubmitting(false);
    }
  };

  const errorOf = (name: string) => errors[name] && <p className="field__hint field__hint--error">{errors[name]}</p>;

  const input = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field">
      <label className="field__label" htmlFor={`st-${name}`}>
        {label}
      </label>
      <input
        id={`st-${name}`}
        className={`input ${errors[name] ? 'input--error' : ''}`}
        value={values[name]}
        disabled={submitting}
        onChange={(e) => set(name, e.target.value)}
        {...props}
      />
      {errorOf(name)}
    </div>
  );

  const typeLabel = choices.find((c) => c.value === values.stage_type)?.label ?? stage?.stage_type_display;

  return (
    <Modal
      open={open}
      hidden={hidden}
      onClose={submitting ? () => undefined : onClose}
      title={isEdit ? `${typeLabel} bosqichi` : "Bosqich qo'shish"}
      footer={
        <>
          {isEdit && onDelete && stage && (
            <>
              <button type="button" className="btn btn--danger" onClick={() => onDelete(stage)} disabled={submitting}>
                <Trash2 size={14} />
                O'chirish
              </button>
              <span className="modal__footer-spacer" />
            </>
          )}
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            <X size={14} />
            Bekor qilish
          </button>
          <button type="submit" form="stage-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Saqlash
          </button>
        </>
      }
    >
      <form id="stage-form" className="form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="alert">{formError}</div>}
        <div className="field">
          <label className="field__label" htmlFor="st-stage_type">
            Bosqich turi<span className="field__required">*</span>
          </label>
          <div className="select-wrap">
            <select
              id="st-stage_type"
              className={`input ${errors.stage_type ? 'input--error' : ''}`}
              value={values.stage_type}
              disabled={submitting}
              onChange={(e) => set('stage_type', e.target.value)}
            >
              <option value="">Bosqich turini tanlang</option>
              {choices.map((c) => (
                <option
                  key={c.value}
                  value={c.value}
                  disabled={c.value !== stage?.stage_type && usedTypes.includes(c.value as StageType)}
                >
                  {c.label}
                  {c.value !== stage?.stage_type && usedTypes.includes(c.value as StageType) ? ' (kiritilgan)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-wrap__chevron" />
          </div>
          {errorOf('stage_type')}
        </div>

        <div className="form-subtitle">Reja</div>
        <div className="form-grid form-grid--3">
          {input('plan_start_date', 'Boshlanish sanasi', { type: 'date', max: values.plan_end_date || undefined })}
          {input('plan_end_date', 'Tugash sanasi', { type: 'date', min: values.plan_start_date || undefined })}
          {input('plan_days', 'Kunlar soni', { inputMode: 'numeric', placeholder: '0' })}
        </div>

        <div className="form-subtitle">Amalda (fakt)</div>
        <div className="form-grid form-grid--3">
          {input('fact_start_date', 'Boshlanish sanasi', { type: 'date', max: values.fact_end_date || undefined })}
          {input('fact_end_date', 'Tugash sanasi', { type: 'date', min: values.fact_start_date || undefined })}
          {input('fact_days', 'Kunlar soni', { inputMode: 'numeric', placeholder: '0' })}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="st-description">
            Izoh / Tavsif
          </label>
          <textarea
            id="st-description"
            className="input input--textarea"
            rows={3}
            value={values.description}
            disabled={submitting}
            placeholder="Bosqich bo'yicha izoh"
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {isEdit && stage && (
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="field__label">Yaratilgan vaqt</label>
              <input className="input" value={formatDateTimeShort(stage.created_at)} disabled readOnly />
            </div>
            <div className="field">
              <label className="field__label">Yangilangan vaqt</label>
              <input className="input" value={formatDateTimeShort(stage.updated_at)} disabled readOnly />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
