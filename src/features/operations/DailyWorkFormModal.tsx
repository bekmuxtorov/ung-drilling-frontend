import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { DailyWorkDescription } from '../../api/types';
import { RelationSelect } from '../references/RelationSelect';
import { formatDateTimeShort } from '../references/format';

export interface TransportRow {
  /** Mavjud yozuv ID si (yangi qatorlarda yo'q) */
  id?: number;
  key: string;
  transport_type: string;
  count: string;
  description: string;
}

export interface DailyWorkFormValues {
  description: string;
  transports: TransportRow[];
}

interface DailyWorkFormModalProps {
  open: boolean;
  hidden?: boolean;
  record: DailyWorkDescription | null;
  onClose: () => void;
  onSubmit: (values: DailyWorkFormValues) => Promise<void>;
  onDelete?: (record: DailyWorkDescription) => void;
}

let rowSeq = 0;
const newRow = (): TransportRow => ({ key: `new-${++rowSeq}`, transport_type: '', count: '1', description: '' });

export const DailyWorkFormModal: React.FC<DailyWorkFormModalProps> = ({ open, hidden, record, onClose, onSubmit, onDelete }) => {
  const isEdit = !!record;
  const initial = useMemo<DailyWorkFormValues>(
    () => ({
      description: record?.description ?? '',
      transports:
        record?.transport_items.map((t) => ({
          id: t.id,
          key: `id-${t.id}`,
          transport_type: String(t.transport_type?.id ?? ''),
          count: String(t.count ?? 0),
          description: t.description ?? '',
        })) ?? [],
    }),
    [record],
  );

  const [values, setValues] = useState<DailyWorkFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Oyna ochilganda — to'liq tozalash
  useEffect(() => {
    if (open) {
      setErrors({});
      setFormError('');
      setSubmitting(false);
    }
  }, [open]);

  // Yozuv yangilanganda (masalan qisman saqlangandan so'ng) — faqat qiymatlar, xato xabari saqlanadi
  useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);

  const updateRow = (key: string, patch: Partial<TransportRow>) => {
    setValues((prev) => ({ ...prev, transports: prev.transports.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((f) => delete next[`${key}.${f}`]);
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.description.trim()) e.description = 'Majburiy maydon';
    values.transports.forEach((r) => {
      if (!r.transport_type) e[`${r.key}.transport_type`] = 'Turini tanlang';
      if (!/^\d+$/.test(r.count)) e[`${r.key}.count`] = 'Butun son';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors.description) setErrors((prev) => ({ ...prev, description: err.fieldErrors.description }));
      } else setFormError("Noma'lum xatolik yuz berdi");
      setSubmitting(false);
    }
  };

  const totalVehicles = values.transports.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

  return (
    <Modal
      open={open}
      hidden={hidden}
      size="lg"
      onClose={submitting ? () => undefined : onClose}
      title={isEdit ? `Kunlik hisobot · ${formatDateTimeShort(record?.created_at)}` : 'Yangi kunlik hisobot'}
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
          <button type="submit" form="daily-work-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Saqlash
          </button>
        </>
      }
    >
      <form id="daily-work-form" className="form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="alert">{formError}</div>}

        <div className="field">
          <label className="field__label" htmlFor="dw-description">
            Kunlik ish tavsifi<span className="field__required">*</span>
          </label>
          <textarea
            id="dw-description"
            className={`input input--textarea ${errors.description ? 'input--error' : ''}`}
            rows={4}
            autoFocus={!isEdit}
            value={values.description}
            disabled={submitting}
            placeholder="Bugun bajarilgan ishlar, holat va muammolar..."
            onChange={(e) => {
              setValues((prev) => ({ ...prev, description: e.target.value }));
              setErrors((prev) => ({ ...prev, description: '' }));
            }}
          />
          {errors.description && <p className="field__hint field__hint--error">{errors.description}</p>}
        </div>

        <div className="transport-editor">
          <div className="transport-editor__head">
            <span className="form-subtitle">
              Jalb qilingan transport vositalari
              {totalVehicles > 0 && <span className="count-pill">{totalVehicles} ta</span>}
            </span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={submitting}
              onClick={() => setValues((prev) => ({ ...prev, transports: [...prev.transports, newRow()] }))}
            >
              <Plus size={14} />
              Transport qo'shish
            </button>
          </div>

          {values.transports.length === 0 ? (
            <p className="transport-editor__empty">Transport vositalari biriktirilmagan</p>
          ) : (
            <div className="transport-editor__rows">
              <div className="transport-row transport-row--head">
                <span>Transport turi</span>
                <span>Soni</span>
                <span>Izoh</span>
                <span />
              </div>
              {values.transports.map((row) => (
                <div key={row.key} className="transport-row">
                  <div>
                    <RelationSelect
                      reference="transport-types"
                      placeholder="Turini tanlang"
                      value={row.transport_type}
                      disabled={submitting}
                      error={!!errors[`${row.key}.transport_type`]}
                      onChange={(v) => updateRow(row.key, { transport_type: v })}
                    />
                  </div>
                  <div>
                    <input
                      className={`input ${errors[`${row.key}.count`] ? 'input--error' : ''}`}
                      inputMode="numeric"
                      value={row.count}
                      disabled={submitting}
                      onChange={(e) => updateRow(row.key, { count: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <input
                      className="input"
                      value={row.description}
                      placeholder="Ixtiyoriy"
                      disabled={submitting}
                      onChange={(e) => updateRow(row.key, { description: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    title="Olib tashlash"
                    disabled={submitting}
                    onClick={() =>
                      setValues((prev) => ({ ...prev, transports: prev.transports.filter((r) => r.key !== row.key) }))
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
