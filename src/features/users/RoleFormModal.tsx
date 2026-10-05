import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, Trash2, X } from 'lucide-react';
import { ApiError } from '../../api/client';
import { permissionsApi, rolesApi } from '../../api/accounts';
import { Modal } from '../../components/ui/Modal';
import { formatDateTimeShort } from '../references/format';
import type { PermissionItem, RoleItem, RolePayload } from '../../types/auth';

interface RoleFormModalProps {
  isOpen: boolean;
  hidden?: boolean;
  initialRole?: RoleItem | null;
  onClose: () => void;
  onSaved: (role: RoleItem) => void;
  onDelete?: (role: RoleItem) => void;
}

const APP_LABEL_NAMES: Record<string, string> = {
  directory: "Ma'lumotnomalar",
  operations: 'Operatsiyalar',
  accounts: 'Foydalanuvchilar va rollar',
  auth: 'Autentifikatsiya',
  contenttypes: 'Tizim obyektlari',
  sessions: 'Sessiyalar',
};

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ isOpen, hidden, initialRole, onClose, onSaved, onDelete }) => {
  const isEdit = !!initialRole;

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setName(initialRole?.name ?? '');
    setSelected(new Set(initialRole?.permissions ?? []));
    setPermSearch('');
    setError('');
    setFieldErrors({});
    setSaving(false);
  }, [initialRole, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingPerms(true);
    permissionsApi
      .list()
      .then((perms) => setAllPermissions(perms || []))
      .catch(() => undefined)
      .finally(() => setLoadingPerms(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return allPermissions;
    return allPermissions.filter((p) =>
      [p.name, p.codename, p.app_label, p.model].some((v) => v.toLowerCase().includes(q)),
    );
  }, [allPermissions, permSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    filtered.forEach((p) => map.set(p.app_label, [...(map.get(p.app_label) ?? []), p]));
    return [...map.entries()];
  }, [filtered]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleGroup = (perms: PermissionItem[]) => {
    const all = perms.every((p) => selected.has(p.id));
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (all ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    if (!name.trim()) {
      setFieldErrors({ name: 'Majburiy maydon' });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload: RolePayload = { name: name.trim(), permissions: [...selected] };
      const saved = isEdit && initialRole ? await rolesApi.update(initialRole.id, payload) : await rolesApi.create(payload);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else setError('Saqlashda xatolik yuz berdi');
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      hidden={hidden}
      size="lg"
      onClose={saving ? () => undefined : onClose}
      title={isEdit ? initialRole?.name : "Rol qo'shish"}
      footer={
        <>
          {isEdit && initialRole && onDelete && (
            <>
              <button type="button" className="btn btn--danger" onClick={() => onDelete(initialRole)} disabled={saving}>
                <Trash2 size={14} />
                O'chirish
              </button>
              <span className="modal__footer-spacer" />
            </>
          )}
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
            <X size={14} />
            Bekor qilish
          </button>
          <button type="submit" form="role-form" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Saqlash
          </button>
        </>
      }
    >
      <form id="role-form" className="form" onSubmit={handleSubmit} noValidate>
        {error && <div className="alert">{error}</div>}

        <div className="field">
          <label className="field__label" htmlFor="role-name">
            Nomi<span className="field__required">*</span>
          </label>
          <input
            id="role-name"
            className={`input ${fieldErrors.name ? 'input--error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Dispetcher"
            disabled={saving}
            autoFocus={!isEdit}
          />
          {fieldErrors.name && <p className="field__hint field__hint--error">{fieldErrors.name}</p>}
        </div>

        <div className="perm">
          <div className="perm__head">
            <span className="form-subtitle">
              Ruxsatlar
              <span className="count-pill">
                {selected.size} / {allPermissions.length}
              </span>
            </span>
            <div className="perm__actions">
              <button
                type="button"
                className="link-btn"
                onClick={() => setSelected((prev) => new Set([...prev, ...filtered.map((p) => p.id)]))}
              >
                Hammasini tanlash
              </button>
              <button type="button" className="link-btn link-btn--muted" onClick={() => setSelected(new Set())}>
                Tozalash
              </button>
            </div>
          </div>

          <div className="search-input perm__search">
            <Search size={14} className="search-input__icon" />
            <input
              className="input"
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              placeholder="Ruxsatni qidirish (add, change, enterprise...)"
            />
          </div>

          <div className="perm__list">
            {loadingPerms && (
              <div className="perm__state">
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}
            {!loadingPerms && grouped.length === 0 && <div className="perm__state">Mos ruxsatlar topilmadi</div>}
            {!loadingPerms &&
              grouped.map(([app, perms]) => {
                const count = perms.filter((p) => selected.has(p.id)).length;
                const all = count === perms.length;
                return (
                  <section key={app} className="perm-group">
                    <header className="perm-group__head">
                      <label className="perm-group__title">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={all}
                          ref={(el) => {
                            if (el) el.indeterminate = count > 0 && !all;
                          }}
                          onChange={() => toggleGroup(perms)}
                        />
                        {APP_LABEL_NAMES[app] ?? app}
                      </label>
                      <span className="perm-group__count">
                        {count} / {perms.length}
                      </span>
                    </header>
                    <div className="perm-group__items">
                      {perms.map((p) => (
                        <label key={p.id} className={`perm-item ${selected.has(p.id) ? 'is-checked' : ''}`}>
                          <input type="checkbox" className="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                          <span className="perm-item__text">
                            <span className="perm-item__name">{p.name}</span>
                            <code className="perm-item__code">{p.codename}</code>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        </div>

        {isEdit && initialRole && (
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="field__label">Yaratilgan vaqt</label>
              <input className="input" value={initialRole.created_at ? formatDateTimeShort(initialRole.created_at) : '—'} disabled readOnly />
            </div>
            <div className="field">
              <label className="field__label">Yangilangan vaqt</label>
              <input className="input" value={initialRole.updated_at ? formatDateTimeShort(initialRole.updated_at) : '—'} disabled readOnly />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
