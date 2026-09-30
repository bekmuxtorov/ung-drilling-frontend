import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { AnyRow, FieldDef, ReferenceConfig } from './config';
import { useOptions } from './useOptions';
import { formatDateTimeShort } from './format';

interface ReferenceFormModalProps {
  config: ReferenceConfig;
  open: boolean;
  record: AnyRow | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  /** Tahrirlash (detail) rejimida o'chirish tugmasi */
  onDelete?: (row: AnyRow) => void;
  hidden?: boolean;
}

const SelectField: React.FC<{
  field: FieldDef;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}> = ({ field, value, error, disabled, onChange }) => {
  const { options, loading, error: loadError } = useOptions(field.relation?.reference);
  const empty = !loading && !loadError && options.length === 0;

  return (
    <>
      <div className="select-wrap">
        <select
          id={`f-${field.name}`}
          className={`input ${error ? 'input--error' : ''}`}
          value={value}
          disabled={disabled || loading}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{loading ? 'Yuklanmoqda…' : field.placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="select-wrap__chevron" />
      </div>
      {loadError && <p className="field__hint field__hint--error">Ro'yxatni yuklab bo'lmadi</p>}
      {empty && <p className="field__hint">Avval «{field.label}» ma'lumotnomasiga yozuv qo'shing</p>}
    </>
  );
};

export const ReferenceFormModal: React.FC<ReferenceFormModalProps> = ({ config, open, record, onClose, onSubmit, onDelete, hidden }) => {
  const isEdit = !!record;
  const initialValues = useMemo(
    () => Object.fromEntries(config.fields.map((f) => [f.name, record ? f.getValue(record) : ''])),
    [config, record],
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setErrors({});
      setFormError('');
      setSubmitting(false);
    }
  }, [open, initialValues]);

  const validate = () => {
    const next: Record<string, string> = {};
    config.fields.forEach((f) => {
      const v = values[f.name]?.trim() ?? '';
      if (f.required && !v) next[f.name] = f.type === 'select' ? `${f.label}ni tanlang` : "Majburiy maydon";
      else if (f.maxLength && v.length > f.maxLength) next[f.name] = `Maksimal ${f.maxLength} ta belgi`;
      else if (f.type === 'tel' && v && !/^[+\d\s()-]{5,}$/.test(v)) next[f.name] = "Telefon raqami noto'g'ri";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;

    const payload: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      const v = values[f.name]?.trim() ?? '';
      if (f.type === 'select') payload[f.name] = v ? Number(v) : null;
      else if (f.type === 'tel') payload[f.name] = v || null;
      else payload[f.name] = v;
    });

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError("Noma'lum xatolik yuz berdi");
      }
      setSubmitting(false);
    }
  };

  const formId = `ref-form-${config.key}`;

  return (
    <Modal
      open={open}
      hidden={hidden}
      onClose={submitting ? () => undefined : onClose}
      title={isEdit ? record?.name : `${config.singular} qo'shish`}
      footer={
        <>
          {isEdit && onDelete && record && (
            <>
              <button type="button" className="btn btn--danger" onClick={() => onDelete(record)} disabled={submitting}>
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
          <button type="submit" form={formId} className="btn btn--primary" disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Saqlash
          </button>
        </>
      }
    >
      <form id={formId} className="form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="alert">{formError}</div>}
        {config.fields.map((field, index) => (
          <div key={field.name} className="field">
            <label htmlFor={`f-${field.name}`} className="field__label">
              {field.label}
              {field.required && <span className="field__required">*</span>}
            </label>
            {field.type === 'select' ? (
              <SelectField
                field={field}
                value={values[field.name] ?? ''}
                error={errors[field.name]}
                disabled={submitting}
                onChange={(v) => {
                  setValues((prev) => ({ ...prev, [field.name]: v }));
                  setErrors((prev) => ({ ...prev, [field.name]: '' }));
                }}
              />
            ) : (
              <input
                id={`f-${field.name}`}
                className={`input ${errors[field.name] ? 'input--error' : ''}`}
                type={field.type}
                value={values[field.name] ?? ''}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                autoFocus={index === 0}
                autoComplete="off"
                disabled={submitting}
                onChange={(e) => {
                  const v = e.target.value;
                  setValues((prev) => ({ ...prev, [field.name]: v }));
                  setErrors((prev) => ({ ...prev, [field.name]: '' }));
                }}
              />
            )}
            {errors[field.name] && <p className="field__hint field__hint--error">{errors[field.name]}</p>}
          </div>
        ))}
        {isEdit && record && (
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="f-created_at">
                Yaratilgan vaqt
              </label>
              <input id="f-created_at" className="input" value={formatDateTimeShort(record.created_at)} disabled readOnly />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="f-updated_at">
                Yangilangan vaqt
              </label>
              <input id="f-updated_at" className="input" value={formatDateTimeShort(record.updated_at)} disabled readOnly />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
