import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Shield, ShieldCheck } from 'lucide-react';
import { ApiError } from '../../api/client';
import { permissionsApi, rolesApi } from '../../api/accounts';
import type { PermissionItem, RoleItem, RolePayload } from '../../types/auth';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (role: RoleItem) => void;
  initialRole?: RoleItem | null;
}

const APP_LABEL_NAMES: Record<string, string> = {
  directory: "Ma'lumotnomalar (Tashkilotlar, Hududlar, Xodimlar va b.)",
  operations: "Operatsiyalar (VBM, Bosqichlar, Kunlik hisobotlar)",
  accounts: "Foydalanuvchilar va Rollar",
  auth: "Tizim autentifikatsiyasi",
  contenttypes: "Tizim obyektlari",
  sessions: "Sessiyalar",
};

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialRole,
}) => {
  const isEdit = !!initialRole;

  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Formani to'ldirish
  useEffect(() => {
    if (initialRole) {
      setName(initialRole.name || '');
      setSelectedPerms(new Set(initialRole.permissions || []));
    } else {
      setName('');
      setSelectedPerms(new Set());
    }
    setPermSearch('');
    setError('');
    setFieldErrors({});
  }, [initialRole, isOpen]);

  // Ruxsatlarni yuklash
  useEffect(() => {
    if (!isOpen) return;
    setLoadingPerms(true);
    permissionsApi
      .list()
      .then((perms) => setAllPermissions(perms || []))
      .catch(() => {})
      .finally(() => setLoadingPerms(false));
  }, [isOpen]);

  // Ruxsatlarni guruhlash
  const filteredPermissions = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return allPermissions;
    return allPermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.codename.toLowerCase().includes(q) ||
        p.app_label.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
    );
  }, [allPermissions, permSearch]);

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const p of filteredPermissions) {
      const key = p.app_label;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [filteredPermissions]);

  if (!isOpen) return null;

  const togglePerm = (id: number) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupPerms: PermissionItem[]) => {
    const allSelected = groupPerms.every((p) => selectedPerms.has(p.id));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupPerms.forEach((p) => next.delete(p.id));
      } else {
        groupPerms.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(selectedPerms);
    filteredPermissions.forEach((p) => next.add(p.id));
    setSelectedPerms(next);
  };

  const clearAll = () => {
    setSelectedPerms(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: "Rol nomini kiritish shart" });
      return;
    }

    setSaving(true);
    try {
      const payload: RolePayload = {
        name: name.trim(),
        permissions: Array.from(selectedPerms),
      };

      if (isEdit && initialRole) {
        const updated = await rolesApi.update(initialRole.id, payload);
        onSaved(updated);
        onClose();
      } else {
        const created = await rolesApi.create(payload);
        onSaved(created);
        onClose();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError("Rolni saqlashda xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: '680px', width: '94%' }}>
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--brand-600)" />
            <h3 className="modal__title">
              {isEdit ? `Rolni tahrirlash: ${initialRole?.name}` : 'Yangi tizim rolini yaratish'}
            </h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form" style={{ padding: '16px 20px' }}>
          {error && <div className="alert">{error}</div>}

          {/* Rol nomi */}
          <div className="field">
            <label className="field__label">
              Rol nomi <span className="field__required">*</span>
            </label>
            <input
              type="text"
              className={`input ${fieldErrors.name ? 'input--error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="masalan: Burg'ilash muhandisi yoki Dispetcher"
              disabled={saving}
              autoFocus
            />
            {fieldErrors.name && <span className="field__hint field__hint--error">{fieldErrors.name}</span>}
          </div>

          {/* Ruxsatlar (Permissions matrix) */}
          <div className="field" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="field__label">
                Tizim ruxsatlari ({selectedPerms.size} ta tanlandi)
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="link-btn"
                  style={{ fontSize: '12px' }}
                  onClick={selectAll}
                >
                  Hammasini tanlash
                </button>
                <span style={{ color: 'var(--gray-300)' }}>•</span>
                <button
                  type="button"
                  className="link-btn"
                  style={{ fontSize: '12px', color: 'var(--gray-600)' }}
                  onClick={clearAll}
                >
                  Tozalash
                </button>
              </div>
            </div>

            {/* Qidiruv */}
            <div className="search-input" style={{ width: '100%', marginBottom: '8px' }}>
              <Search size={15} className="search-input__icon" />
              <input
                type="text"
                className="input"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Ruxsat nomini qidirish (masalan: add, change, enterprise)..."
              />
            </div>

            {/* Permissions list */}
            <div className="perm-container">
              {loadingPerms && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px' }}>
                  <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                  Ruxsatlar yuklanmoqda...
                </div>
              )}

              {!loadingPerms && groupedPermissions.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px' }}>
                  Mos ruxsatlar topilmadi
                </div>
              )}

              {!loadingPerms &&
                groupedPermissions.map(([appLabel, perms]) => {
                  const title = APP_LABEL_NAMES[appLabel] || appLabel.toUpperCase();
                  const groupSelectedCount = perms.filter((p) => selectedPerms.has(p.id)).length;
                  const allGroupSelected = groupSelectedCount === perms.length;

                  return (
                    <div key={appLabel} className="perm-group">
                      <div className="perm-group__header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} color="var(--brand-600)" />
                          <span>{title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                            ({groupSelectedCount}/{perms.length})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="perm-group__toggle-btn"
                          onClick={() => toggleGroup(perms)}
                        >
                          {allGroupSelected ? 'Bekor qilish' : 'Barchasini tanlash'}
                        </button>
                      </div>

                      <div className="perm-group__items">
                        {perms.map((p) => {
                          const isChecked = selectedPerms.has(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`perm-item ${isChecked ? 'is-checked' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePerm(p.id)}
                              />
                              <div className="perm-item__text">
                                <span className="perm-item__name">{p.name}</span>
                                <span className="perm-item__code">{p.codename}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="modal__footer" style={{ marginTop: '16px', padding: 0 }}>
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
              Bekor qilish
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <span>{isEdit ? "O'zgarishlarni saqlash" : 'Rolni yaratish'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
