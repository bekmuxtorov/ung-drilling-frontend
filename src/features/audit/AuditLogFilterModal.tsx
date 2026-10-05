import React, { useEffect, useState } from 'react';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import type { AuditAction } from '../../types/audit';

export interface AuditFilters {
  action?: AuditAction;
  username?: string;
  model_name?: string;
  app_label?: string;
  object_id?: string;
  ip_address?: string;
  mac_address?: string;
  date_from?: string;
  date_to?: string;
}

interface AuditLogFilterModalProps {
  open: boolean;
  value: AuditFilters;
  onApply: (filters: AuditFilters) => void;
  onClose: () => void;
}

export const AuditLogFilterModal: React.FC<AuditLogFilterModalProps> = ({
  open,
  value,
  onApply,
  onClose,
}) => {
  const [draft, setDraft] = useState<AuditFilters>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const handleReset = () => {
    setDraft({});
    onApply({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Audit loglarini filtrlash"
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={handleReset}>
            <RotateCcw size={14} />
            Tozalash
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSubmit}>
            <Search size={14} />
            Qidirish
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="form-grid form-grid--2">
        <label className="field">
          <span className="field__label">Harakat turi</span>
          <span className="select-wrap">
            <select
              className={`input ${draft.action ? '' : 'input--placeholder'}`}
              value={draft.action || ''}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  action: (e.target.value || undefined) as AuditAction | undefined,
                }))
              }
            >
              <option value="">Barcha harakatlar</option>
              <option value="create">Yaratish (create)</option>
              <option value="update">Tahrirlash (update)</option>
              <option value="delete">O‘chirish (delete)</option>
            </select>
            <ChevronDown size={14} className="select-wrap__chevron" />
          </span>
        </label>

        <label className="field">
          <span className="field__label">Foydalanuvchi (Login)</span>
          <input
            className="input"
            placeholder="Masalan: admin yoki bekmuxtorov"
            value={draft.username || ''}
            onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value || undefined }))}
          />
        </label>

        <label className="field">
          <span className="field__label">Model nomi</span>
          <input
            className="input"
            placeholder="Masalan: DrillingBPA, Resources, Area"
            value={draft.model_name || ''}
            onChange={(e) => setDraft((d) => ({ ...d, model_name: e.target.value || undefined }))}
          />
        </label>

        <label className="field">
          <span className="field__label">Ilova (App label)</span>
          <input
            className="input"
            placeholder="Masalan: directory, drilling, common"
            value={draft.app_label || ''}
            onChange={(e) => setDraft((d) => ({ ...d, app_label: e.target.value || undefined }))}
          />
        </label>

        <label className="field">
          <span className="field__label">Obyekt ID</span>
          <input
            className="input"
            placeholder="Masalan: 12"
            value={draft.object_id || ''}
            onChange={(e) => setDraft((d) => ({ ...d, object_id: e.target.value || undefined }))}
          />
        </label>

        <label className="field">
          <span className="field__label">IP manzil</span>
          <input
            className="input"
            placeholder="Masalan: 192.168.1.100 yoki 127.0.0.1"
            value={draft.ip_address || ''}
            onChange={(e) => setDraft((d) => ({ ...d, ip_address: e.target.value || undefined }))}
          />
        </label>

        <label className="field">
          <span className="field__label">Boshlanish sanasi</span>
          <div className="input-with-icon">
            <input
              type="datetime-local"
              className="input"
              value={draft.date_from ? String(draft.date_from).substring(0, 16) : ''}
              onChange={(e) => setDraft((d) => ({ ...d, date_from: e.target.value || undefined }))}
            />
          </div>
        </label>

        <label className="field">
          <span className="field__label">Tugash sanasi</span>
          <div className="input-with-icon">
            <input
              type="datetime-local"
              className="input"
              value={draft.date_to ? String(draft.date_to).substring(0, 16) : ''}
              onChange={(e) => setDraft((d) => ({ ...d, date_to: e.target.value || undefined }))}
            />
          </div>
        </label>
      </form>
    </Modal>
  );
};
