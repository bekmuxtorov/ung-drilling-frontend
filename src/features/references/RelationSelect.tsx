import React, { useState } from 'react';
import type { ReferenceKey } from './config';
import { REFERENCE_MAP } from './config';
import { useOptions } from './useOptions';
import { getReferenceApi, invalidateOptions } from './api';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Loader2, Plus, X } from 'lucide-react';
import { tr } from '../../i18n';

interface RelationSelectProps {
  reference: ReferenceKey;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  error?: boolean;
  allowCreate?: boolean;
  createLabel?: string;
}

/** Ma'lumotnomadan qiymat qidirish va tanlash (barcha yozuvlar keshlangan holda yuklanadi) */
export const RelationSelect: React.FC<RelationSelectProps> = ({
  reference,
  placeholder,
  value,
  onChange,
  id,
  disabled,
  error,
  allowCreate,
  createLabel,
}) => {
  const { notify } = useToast();
  const [version, setVersion] = useState(0);
  const { options, loading } = useOptions(reference, version);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Default allowCreate to true for references with a single 'name' field like resources and units
  const shouldAllowCreate = allowCreate ?? (reference === 'resources' || reference === 'units');
  const singular = REFERENCE_MAP[reference]?.singular || tr('Yozuv');

  const handleOpenCreate = (query: string) => {
    setNewName(query.trim());
    setCreateError('');
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;

    setCreating(true);
    setCreateError('');
    try {
      const api = getReferenceApi(reference);
      const created = await api.create({ name: newName.trim() });
      invalidateOptions(reference);
      setVersion((v) => v + 1);
      onChange(String(created.id));
      notify('success', tr('Yangi {0} muvaffaqiyatli qo‘shildi', singular.toLowerCase()));
      setCreateModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tr('Saqlashda xatolik yuz berdi');
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <SearchableSelect
        id={id}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        loading={loading}
        disabled={disabled}
        error={error}
        onCreate={shouldAllowCreate ? handleOpenCreate : undefined}
        createLabel={createLabel || tr('Yangi {0} qo‘shish', singular.toLowerCase())}
      />

      {shouldAllowCreate && (
        <Modal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          size="sm"
          title={tr('Yangi {0} qo‘shish', singular.toLowerCase())}
        >
          <form onSubmit={handleCreateSubmit} noValidate>
            {createError && <div className="field-error-alert">{createError}</div>}
            <div className="field" style={{ marginBottom: 16 }}>
              <span className="field__label">
                {tr('{0} nomi', singular)} <span className="field__required">*</span>
              </span>
              <input
                type="text"
                className="input"
                autoFocus
                placeholder={tr('{0} nomini kiriting...', singular)}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="modal__footer" style={{ padding: 0, margin: 0 }}>
              <div className="modal__footer-spacer" />
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >
                <X size={14} />
                {tr('Bekor qilish')}</button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={creating || !newName.trim()}
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {tr('Qo‘shish')}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
