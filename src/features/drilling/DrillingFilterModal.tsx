import React, { useEffect, useState } from 'react';
import { Funnel, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { RelationSelect } from '../references/RelationSelect';
import { tr } from '../../i18n';

export type DrillingFilters = Record<string, string>;

interface DrillingFilterModalProps {
  open: boolean;
  value: DrillingFilters;
  onApply: (filters: DrillingFilters) => void;
  onClose: () => void;
}

export const DrillingFilterModal: React.FC<DrillingFilterModalProps> = ({
  open,
  value,
  onApply,
  onClose,
}) => {
  const [draft, setDraft] = useState<DrillingFilters>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const setField = (key: string, val: string) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean: DrillingFilters = {};
    Object.entries(draft).forEach(([k, v]) => {
      if (v && v.trim()) clean[k] = v.trim();
    });
    onApply(clean);
  };

  const handleReset = () => {
    setDraft({});
    onApply({});
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tr('BPA operatsiyalarini filtrlash')}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={handleReset}>
            <Funnel size={14} />
            {tr('Tozalash')}</button>
          <button type="submit" form="drilling-filter-form" className="btn btn--primary">
            <Search size={14} />
            {tr('Filtrlash')}</button>
        </>
      }
    >
      <form id="drilling-filter-form" onSubmit={handleSubmit} className="form-grid">
        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">{tr('Tashkilot')}</span>
            <RelationSelect
              reference="enterprises"
              placeholder={tr('Barcha tashkilotlar')}
              value={draft.enterprise || ''}
              onChange={(v) => setField('enterprise', v)}
            />
          </label>

          <label className="field">
            <span className="field__label">{tr('Maydon')}</span>
            <RelationSelect
              reference="areas"
              placeholder={tr('Barcha maydonlar')}
              value={draft.area || ''}
              onChange={(v) => setField('area', v)}
            />
          </label>
        </div>

        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">{tr('Dastgoh (Mashina turi)')}</span>
            <RelationSelect
              reference="machine-types"
              placeholder={tr('Barcha mashina turlari')}
              value={draft.machine_type || ''}
              onChange={(v) => setField('machine_type', v)}
            />
          </label>

          <label className="field">
            <span className="field__label">{tr("Mas'ul xodim")}</span>
            <RelationSelect
              reference="employees"
              placeholder={tr('Barcha xodimlar')}
              value={draft.employee || ''}
              onChange={(v) => setField('employee', v)}
            />
          </label>
        </div>

        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">{tr('Boshlangan sana (dan)')}</span>
            <input
              type="date"
              className="input"
              value={draft.start_date_from || ''}
              onChange={(e) => setField('start_date_from', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">{tr('Boshlangan sana (gacha)')}</span>
            <input
              type="date"
              className="input"
              value={draft.start_date_to || ''}
              onChange={(e) => setField('start_date_to', e.target.value)}
            />
          </label>
        </div>

        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">{tr('Loyihaviy chuqurlik min (m)')}</span>
            <input
              type="number"
              className="input"
              placeholder={tr('Masalan: 2000')}
              value={draft.depth_min || ''}
              onChange={(e) => setField('depth_min', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">{tr('Loyihaviy chuqurlik max (m)')}</span>
            <input
              type="number"
              className="input"
              placeholder={tr('Masalan: 5000')}
              value={draft.depth_max || ''}
              onChange={(e) => setField('depth_max', e.target.value)}
            />
          </label>
        </div>
      </form>
    </Modal>
  );
};
