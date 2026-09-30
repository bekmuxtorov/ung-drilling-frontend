import React, { useEffect, useState } from 'react';
import { Funnel, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { RelationSelect } from '../references/RelationSelect';
import type { ReferenceKey } from '../references/config';

export type OperationFilters = Record<string, string>;

interface OperationFilterModalProps {
  open: boolean;
  value: OperationFilters;
  onApply: (value: OperationFilters) => void;
  onClose: () => void;
}

const RELATION_FILTERS: { param: string; label: string; reference: ReferenceKey; placeholder: string }[] = [
  { param: 'enterprise', label: 'Korxona', reference: 'enterprises', placeholder: 'Barcha korxonalar' },
  { param: 'drilling_rig_type', label: "Burg'ulash uskunasi turi", reference: 'drilling-rig-types', placeholder: 'Barcha uskunalar' },
  { param: 'from_area', label: 'Qaysi maydondan', reference: 'areas', placeholder: 'Barcha maydonlar' },
  { param: 'to_area', label: 'Qaysi maydonga', reference: 'areas', placeholder: 'Barcha maydonlar' },
  { param: 'foreman', label: 'Prorab', reference: 'foremen', placeholder: 'Barcha prorablar' },
];

export const OperationFilterModal: React.FC<OperationFilterModalProps> = ({ open, value, onApply, onClose }) => {
  const [draft, setDraft] = useState<OperationFilters>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const set = (key: string, v: string) => setDraft((prev) => ({ ...prev, [key]: v }));

  const dateInput = (key: string, placeholder: string, extra: React.InputHTMLAttributes<HTMLInputElement>) => (
    <span className="date-wrap">
      <input
        type="date"
        className={`input ${draft[key] ? '' : 'input--empty'}`}
        value={draft[key] ?? ''}
        onChange={(e) => set(key, e.target.value)}
        {...extra}
      />
      <span className="date-ph">{placeholder}</span>
    </span>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filtrlash"
      footer={
        <>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => {
              setDraft({});
              onApply({});
            }}
          >
            <Funnel size={14} />
            Tozalash
          </button>
          <button type="submit" form="op-filter-form" className="btn btn--primary">
            <Search size={14} />
            Qidirish
          </button>
        </>
      }
    >
      <form
        id="op-filter-form"
        className="form-grid form-grid--2"
        onSubmit={(e) => {
          e.preventDefault();
          onApply(Object.fromEntries(Object.entries(draft).filter(([, v]) => v)));
        }}
      >
        {RELATION_FILTERS.map((f) => (
          <label key={f.param} className="field">
            <span className="field__label">{f.label}</span>
            <RelationSelect reference={f.reference} placeholder={f.placeholder} value={draft[f.param] ?? ''} onChange={(v) => set(f.param, v)} />
          </label>
        ))}
        <label className="field">
          <span className="field__label">Bajarilish foizi (%)</span>
          <span className="range-inputs">
            <input
              className="input"
              inputMode="decimal"
              placeholder="dan"
              value={draft.min_completion ?? ''}
              onChange={(e) => set('min_completion', e.target.value.replace(/[^\d.]/g, ''))}
            />
            <span className="range-inputs__sep">—</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="gacha"
              value={draft.max_completion ?? ''}
              onChange={(e) => set('max_completion', e.target.value.replace(/[^\d.]/g, ''))}
            />
          </span>
        </label>
        <label className="field">
          <span className="field__label">Burg'ulash sanasidan</span>
          {dateInput('drilling_date_from', 'Boshlanish sanasini kiriting', { max: draft.drilling_date_to || undefined })}
        </label>
        <label className="field">
          <span className="field__label">Burg'ulash sanasigacha</span>
          {dateInput('drilling_date_to', 'Tugash sanasini kiriting', { min: draft.drilling_date_from || undefined })}
        </label>
      </form>
    </Modal>
  );
};
