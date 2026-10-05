import React, { useEffect, useState } from 'react';
import { Loader2, X, Save, Plus, FileText, Wrench } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { DrillingBPA } from '../../api/types';
import { RelationSelect } from '../references/RelationSelect';

interface DrillingBPAFormModalProps {
  open: boolean;
  bpa: DrillingBPA | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

interface FormValues {
  number: string;
  well_number: string;
  enterprise: string;
  area: string;
  employee: string;
  machine_type: string;
  drilling_start_date: string;
  depth_plan: string;
}

const EMPTY_VALUES: FormValues = {
  number: '',
  well_number: '',
  enterprise: '',
  area: '',
  employee: '',
  machine_type: '',
  drilling_start_date: '',
  depth_plan: '',
};

export const DrillingBPAFormModal: React.FC<DrillingBPAFormModalProps> = ({
  open,
  bpa,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!bpa;
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (bpa) {
        setValues({
          number: bpa.number || '',
          well_number: bpa.well_number || '',
          enterprise: bpa.enterprise?.id ? String(bpa.enterprise.id) : '',
          area: bpa.area?.id ? String(bpa.area.id) : '',
          employee: bpa.employee?.id ? String(bpa.employee.id) : '',
          machine_type: bpa.machine_type?.id ? String(bpa.machine_type.id) : '',
          drilling_start_date: bpa.drilling_start_date ? bpa.drilling_start_date.slice(0, 16) : '',
          depth_plan: bpa.depth_plan != null ? String(bpa.depth_plan) : '',
        });
      } else {
        setValues(EMPTY_VALUES);
      }
      setErrors({});
      setServerError('');
      setSubmitting(false);
    }
  }, [open, bpa]);

  const setField = (field: keyof FormValues, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!values.well_number.trim()) errs.well_number = 'Quduq raqami kiritilishi shart';
    if (!values.enterprise) errs.enterprise = 'Tashkilotni tanlang';
    if (values.depth_plan && (!/^\d+$/.test(values.depth_plan.trim()) || Number(values.depth_plan) <= 0)) {
      errs.depth_plan = "Musbat butun son kiriting (masalan: 3800)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;

    setServerError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      number: values.number.trim(),
      well_number: values.well_number.trim(),
      enterprise: Number(values.enterprise),
      area: values.area ? Number(values.area) : null,
      employee: values.employee ? Number(values.employee) : null,
      machine_type: values.machine_type ? Number(values.machine_type) : null,
      drilling_start_date: values.drilling_start_date ? new Date(values.drilling_start_date).toISOString() : null,
      depth_plan: values.depth_plan ? Number(values.depth_plan) : null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
        if (err.fieldErrors) {
          setErrors(err.fieldErrors);
        }
      } else {
        setServerError("Ma'lumotlarni saqlashda xatolik yuz berdi");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `BPA pasportini tahrirlash (#${bpa.id})` : "Yangi burg'ilash (BPA) pasporti"}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            <X size={14} />
            Bekor qilish
          </button>
          <button type="submit" form="bpa-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saqlanmoqda…
              </>
            ) : isEdit ? (
              <>
                <Save size={14} />
                O‘zgarishlarni saqlash
              </>
            ) : (
              <>
                <Plus size={14} />
                Pasport yaratish
              </>
            )}
          </button>
        </>
      }
    >
      <form id="bpa-form" onSubmit={handleSubmit} className="bpa-form">
        {serverError && <div className="field-error-alert">{serverError}</div>}

        {/* 1-guruh: Asosiy ma'lumotlar va hudud */}
        <div className="bpa-form-group">
          <div className="bpa-form-group__title">
            <FileText size={15} />
            <span>Asosiy ma'lumotlar va hudud</span>
          </div>

          <div className="bpa-form-row">
            <label className="field">
              <span className="field__label">BPA Hujjat raqami</span>
              <input
                type="text"
                className={`input ${errors.number ? 'input--error' : ''}`}
                placeholder="Masalan: BPA-2026/01"
                value={values.number}
                onChange={(e) => setField('number', e.target.value)}
              />
              {errors.number && <span className="field__hint field__hint--error">{errors.number}</span>}
            </label>

            <label className="field">
              <span className="field__label">
                Quduq raqami <span className="field__required">*</span>
              </span>
              <input
                type="text"
                className={`input ${errors.well_number ? 'input--error' : ''}`}
                placeholder="Masalan: 324-sonli"
                value={values.well_number}
                onChange={(e) => setField('well_number', e.target.value)}
              />
              {errors.well_number && <span className="field__hint field__hint--error">{errors.well_number}</span>}
            </label>
          </div>

          <div className="bpa-form-row">
            <label className="field">
              <span className="field__label">
                Tashkilot (Korxona) <span className="field__required">*</span>
              </span>
              <RelationSelect
                reference="enterprises"
                placeholder="Korxonani tanlang"
                value={values.enterprise}
                error={!!errors.enterprise}
                onChange={(v) => setField('enterprise', v)}
              />
              {errors.enterprise && <span className="field__hint field__hint--error">{errors.enterprise}</span>}
            </label>

            <label className="field">
              <span className="field__label">Kon / Maydon</span>
              <RelationSelect
                reference="areas"
                placeholder="Maydonni tanlang"
                value={values.area}
                error={!!errors.area}
                onChange={(v) => setField('area', v)}
              />
              {errors.area && <span className="field__hint field__hint--error">{errors.area}</span>}
            </label>
          </div>
        </div>

        {/* 2-guruh: Texnik parametrlar va mas'ullar */}
        <div className="bpa-form-group">
          <div className="bpa-form-group__title">
            <Wrench size={15} />
            <span>Texnik parametrlar va mas'ullar</span>
          </div>

          <div className="bpa-form-row">
            <label className="field">
              <span className="field__label">Dastgoh (Mashina turi)</span>
              <RelationSelect
                reference="machine-types"
                placeholder="Mashina turini tanlang"
                value={values.machine_type}
                error={!!errors.machine_type}
                onChange={(v) => setField('machine_type', v)}
              />
              {errors.machine_type && <span className="field__hint field__hint--error">{errors.machine_type}</span>}
            </label>

            <label className="field">
              <span className="field__label">Mas'ul xodim (Muhandis / Prorab)</span>
              <RelationSelect
                reference="employees"
                placeholder="Xodimni tanlang"
                value={values.employee}
                error={!!errors.employee}
                onChange={(v) => setField('employee', v)}
              />
              {errors.employee && <span className="field__hint field__hint--error">{errors.employee}</span>}
            </label>
          </div>

          <div className="bpa-form-row">
            <label className="field">
              <span className="field__label">Burg'ilash boshlangan sana</span>
              <input
                type="datetime-local"
                className={`input ${errors.drilling_start_date ? 'input--error' : ''}`}
                value={values.drilling_start_date}
                onChange={(e) => setField('drilling_start_date', e.target.value)}
              />
              {errors.drilling_start_date && (
                <span className="field__hint field__hint--error">{errors.drilling_start_date}</span>
              )}
            </label>

            <label className="field">
              <span className="field__label">Chuqurlik(Plan) (m)</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="1"
                  className={`input ${errors.depth_plan ? 'input--error' : ''}`}
                  placeholder="Masalan: 3800"
                  value={values.depth_plan}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      setField('depth_plan', val);
                    }
                  }}
                />
                <span className="input-unit">m</span>
              </div>
              {errors.depth_plan && <span className="field__hint field__hint--error">{errors.depth_plan}</span>}
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};
