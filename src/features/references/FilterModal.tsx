import React, { useEffect, useState } from 'react';
import { Funnel, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import type { ReferenceConfig } from './config';
import { RelationSelect } from './RelationSelect';
import { tr } from '../../i18n';

export type FilterValues = Record<string, string>;

interface FilterModalProps {
  open: boolean;
  config: ReferenceConfig;
  value: FilterValues;
  onApply: (value: FilterValues) => void;
  onClose: () => void;
}

/** M-1 Filtr: yaratilgan sana oralig'i (+ bog'langan ma'lumotnoma bo'yicha filtr) */
export const FilterModal: React.FC<FilterModalProps> = ({ open, config, value, onApply, onClose }) => {
  const [draft, setDraft] = useState<FilterValues>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const set = (key: string, v: string) => setDraft((prev) => ({ ...prev, [key]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(Object.fromEntries(Object.entries(draft).filter(([, v]) => v)));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr('Filtrlash')}
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
            {tr('Tozalash')}</button>
          <button type="submit" form="filter-form" className="btn btn--primary">
            <Search size={14} />
            {tr('Qidirish')}</button>
        </>
      }
    >
      <form id="filter-form" className="form-grid" onSubmit={submit}>
        <label className="field">
          <span className="field__label">{tr('Yaratilgan sanadan')}</span>
          <span className="date-wrap">
            <input
              type="date"
              className={`input ${draft.date_from ? '' : 'input--empty'}`}
              value={draft.date_from ?? ''}
              max={draft.date_to || undefined}
              onChange={(e) => set('date_from', e.target.value)}
            />
            <span className="date-ph">{tr('Boshlanish sanasini kiriting')}</span>
          </span>
        </label>
        <label className="field">
          <span className="field__label">{tr('Yaratilgan sanagacha')}</span>
          <span className="date-wrap">
            <input
              type="date"
              className={`input ${draft.date_to ? '' : 'input--empty'}`}
              value={draft.date_to ?? ''}
              min={draft.date_from || undefined}
              onChange={(e) => set('date_to', e.target.value)}
            />
            <span className="date-ph">{tr('Tugash sanasini kiriting')}</span>
          </span>
        </label>
        {config.filters?.map((f) => (
          <label key={f.relation.filterParam} className="field">
            <span className="field__label">{f.label}</span>
            <RelationSelect
              reference={f.relation.reference}
              placeholder={f.placeholder}
              value={draft[f.relation.filterParam] ?? ''}
              onChange={(v) => set(f.relation.filterParam, v)}
            />
          </label>
        ))}
      </form>
    </Modal>
  );
};
