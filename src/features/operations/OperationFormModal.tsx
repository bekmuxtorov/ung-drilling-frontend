import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { DerrickErectionOperation } from '../../api/types';
import { RelationSelect } from '../references/RelationSelect';
import type { ReferenceKey } from '../references/config';
import { formatDateTimeShort } from '../references/format';

interface OperationFormModalProps {
  open: boolean;
  record: DerrickErectionOperation | null;
  hidden?: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: (record: DerrickErectionOperation) => void;
}

type Values = Record<string, string>;

const EMPTY: Values = {
  enterprise: '',
  drilling_rig_type: '',
  foreman: '',
  number_employees: '',
  from_area: '',
  from_well_number: '',
  to_area: '',
  to_well_number: '',
  distance_km: '',
  plan_days: '',
  expected_drilling_date: '',
  completion_percentage: '',
  work_description: '',
  delay_reason: '',
};

const toValues = (op: DerrickErectionOperation | null): Values =>
  op
    ? {
        enterprise: String(op.enterprise?.id ?? ''),
        drilling_rig_type: String(op.drilling_rig_type?.id ?? ''),
        foreman: String(op.foreman?.id ?? ''),
        number_employees: String(op.number_employees ?? ''),
        from_area: String(op.from_area?.id ?? ''),
        from_well_number: op.from_well_number ?? '',
        to_area: String(op.to_area?.id ?? ''),
        to_well_number: op.to_well_number ?? '',
        distance_km: op.distance_km ?? '',
        plan_days: String(op.plan_days ?? ''),
        expected_drilling_date: op.expected_drilling_date ?? '',
        completion_percentage: op.completion_percentage ?? '',
        work_description: op.work_description ?? '',
        delay_reason: op.delay_reason ?? '',
      }
    : EMPTY;

const RELATIONS: { name: string; label: string; reference: ReferenceKey; placeholder: string }[] = [
  { name: 'enterprise', label: 'Korxona', reference: 'enterprises', placeholder: 'Korxonani tanlang' },
  { name: 'drilling_rig_type', label: "Burg'ulash uskunasi turi", reference: 'drilling-rig-types', placeholder: 'Uskuna turini tanlang' },
  { name: 'foreman', label: 'Prorab (usta)', reference: 'foremen', placeholder: 'Prorabni tanlang' },
];

const validate = (v: Values) => {
  const e: Record<string, string> = {};
  const required = ['enterprise', 'drilling_rig_type', 'foreman', 'from_area', 'to_area', 'from_well_number', 'to_well_number'];
  required.forEach((k) => {
    if (!v[k]?.trim()) e[k] = 'Majburiy maydon';
  });
  ['from_well_number', 'to_well_number'].forEach((k) => {
    if (v[k] && v[k].trim().length > 50) e[k] = 'Maksimal 50 ta belgi';
  });
  ['number_employees', 'plan_days'].forEach((k) => {
    if (v[k] && !/^\d+$/.test(v[k])) e[k] = "Musbat butun son kiriting";
  });
  if (v.distance_km && !/^\d{1,6}([.,]\d{1,2})?$/.test(v.distance_km)) e.distance_km = "Masalan: 12.5 (maks. 2 kasr)";
  if (v.completion_percentage) {
    const ok = /^\d{1,3}([.,]\d{1,2})?$/.test(v.completion_percentage);
    const n = parseFloat(v.completion_percentage.replace(',', '.'));
    if (!ok || n > 100) e.completion_percentage = '0 dan 100 gacha';
  }
  if (v.from_area && v.to_area && v.from_area === v.to_area && v.from_well_number.trim() && v.from_well_number.trim() === v.to_well_number.trim())
    e.to_well_number = "Boshlang'ich va manzil quduq bir xil";
  return e;
};

const toPayload = (v: Values) => ({
  enterprise: Number(v.enterprise),
  drilling_rig_type: Number(v.drilling_rig_type),
  foreman: Number(v.foreman),
  from_area: Number(v.from_area),
  to_area: Number(v.to_area),
  from_well_number: v.from_well_number.trim(),
  to_well_number: v.to_well_number.trim(),
  number_employees: v.number_employees ? Number(v.number_employees) : 0,
  plan_days: v.plan_days ? Number(v.plan_days) : 0,
  distance_km: v.distance_km ? v.distance_km.replace(',', '.') : '0',
  completion_percentage: v.completion_percentage ? v.completion_percentage.replace(',', '.') : '0',
  expected_drilling_date: v.expected_drilling_date || null,
  work_description: v.work_description.trim() || null,
  delay_reason: v.delay_reason.trim() || null,
});

export const OperationFormModal: React.FC<OperationFormModalProps> = ({ open, record, hidden, onClose, onSubmit, onDelete }) => {
  const isEdit = !!record;
  const initial = useMemo(() => toValues(record), [record]);
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
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setFormError(err.message);
      } else setFormError("Noma'lum xatolik yuz berdi");
      setSubmitting(false);
    }
  };

  const errorOf = (name: string) => errors[name] && <p className="field__hint field__hint--error">{errors[name]}</p>;

  const textInput = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, required = false) => (
    <div className="field">
      <label className="field__label" htmlFor={`op-${name}`}>
        {label}
        {required && <span className="field__required">*</span>}
      </label>
      <input
        id={`op-${name}`}
        className={`input ${errors[name] ? 'input--error' : ''}`}
        value={values[name]}
        disabled={submitting}
        autoComplete="off"
        onChange={(e) => set(name, e.target.value)}
        {...props}
      />
      {errorOf(name)}
    </div>
  );

  const relation = (name: string, label: string, reference: ReferenceKey, placeholder: string) => (
    <div className="field">
      <label className="field__label" htmlFor={`op-${name}`}>
        {label}
        <span className="field__required">*</span>
      </label>
      <RelationSelect
        id={`op-${name}`}
        reference={reference}
        placeholder={placeholder}
        value={values[name]}
        disabled={submitting}
        error={!!errors[name]}
        onChange={(v) => set(name, v)}
      />
      {errorOf(name)}
    </div>
  );

  const textarea = (name: string, label: string, placeholder: string) => (
    <div className="field">
      <label className="field__label" htmlFor={`op-${name}`}>
        {label}
      </label>
      <textarea
        id={`op-${name}`}
        className={`input input--textarea ${errors[name] ? 'input--error' : ''}`}
        rows={3}
        value={values[name]}
        placeholder={placeholder}
        disabled={submitting}
        onChange={(e) => set(name, e.target.value)}
      />
      {errorOf(name)}
    </div>
  );

  return (
    <Modal
      open={open}
      hidden={hidden}
      size="lg"
      onClose={submitting ? () => undefined : onClose}
      title={isEdit ? `Operatsiya №${record?.from_well_number} → №${record?.to_well_number}` : 'Yangi operatsiya'}
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
          <button type="submit" form="operation-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Saqlash
          </button>
        </>
      }
    >
      <form id="operation-form" className="form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="alert">{formError}</div>}

        <fieldset className="form-section">
          <legend className="form-section__title">Asosiy ma'lumotlar</legend>
          <div className="form-grid form-grid--2">
            {RELATIONS.map((r) => (
              <React.Fragment key={r.name}>{relation(r.name, r.label, r.reference, r.placeholder)}</React.Fragment>
            ))}
            {textInput('number_employees', 'Ishchilar soni', { inputMode: 'numeric', placeholder: '0' })}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section__title">Ko'chirish yo'nalishi</legend>
          <div className="form-grid form-grid--2">
            {relation('from_area', 'Qaysi maydondan', 'areas', 'Maydonni tanlang')}
            {textInput('from_well_number', 'Qaysi quduqdan (№)', { maxLength: 50, placeholder: 'Masalan: 125' }, true)}
            {relation('to_area', 'Qaysi maydonga', 'areas', 'Maydonni tanlang')}
            {textInput('to_well_number', 'Qaysi quduqqa (№)', { maxLength: 50, placeholder: 'Masalan: 131' }, true)}
            {textInput('distance_km', 'Masofa (km)', { inputMode: 'decimal', placeholder: '0.00' })}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section__title">Reja va bajarilish</legend>
          <div className="form-grid form-grid--3">
            {textInput('plan_days', 'Rejadagi kunlar', { inputMode: 'numeric', placeholder: '0' })}
            {textInput('expected_drilling_date', "Burg'ulash boshlanishi (kutilayotgan)", { type: 'date' })}
            {textInput('completion_percentage', 'Bajarilish foizi (%)', { inputMode: 'decimal', placeholder: '0' })}
          </div>
          <div className="form-grid form-grid--2">
            {textarea('work_description', 'Bajarilayotgan ish tavsifi', 'Ish jarayoni haqida qisqacha')}
            {textarea('delay_reason', 'Kechikish sababi', 'Agar kechikish bo‘lsa, sababini yozing')}
          </div>
        </fieldset>

        {isEdit && record && (
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="field__label">Yaratilgan vaqt</label>
              <input className="input" value={formatDateTimeShort(record.created_at)} disabled readOnly />
            </div>
            <div className="field">
              <label className="field__label">Yangilangan vaqt</label>
              <input className="input" value={formatDateTimeShort(record.updated_at)} disabled readOnly />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
