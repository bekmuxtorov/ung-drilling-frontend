import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Funnel, Loader2, Plus, Search, Shield } from 'lucide-react';
import { ApiError } from '../../api/client';
import { rolesApi, usersApi, type UserListParams } from '../../api/accounts';
import type { Paginated } from '../../api/types';
import type { RoleItem, UserItem } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatDateTime } from '../references/format';
import { UserFormModal } from './UserFormModal';
import { UserPasswordModal } from './UserPasswordModal';

const PAGE_SIZE = 20;

type UserFilters = { role?: string; status?: 'active' | 'inactive' };

const fullName = (u: UserItem) => u.employee_name || [u.last_name, u.first_name].filter(Boolean).join(' ') || '';
const initialsOf = (u: UserItem) => {
  const name = [u.first_name, u.last_name].filter(Boolean);
  return (name.length ? name.map((p) => p[0]).join('') : u.username.slice(0, 2)).toUpperCase();
};

/** Filtr oynasi (Ma'lumotnomalardagi "Filtrlash" uslubida) */
const UserFilterModal: React.FC<{
  open: boolean;
  roles: RoleItem[];
  value: UserFilters;
  onApply: (v: UserFilters) => void;
  onClose: () => void;
}> = ({ open, roles, value, onApply, onClose }) => {
  const [draft, setDraft] = useState<UserFilters>(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filtrlash"
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={() => onApply({})}>
            <Funnel size={14} />
            Tozalash
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onApply(draft)}>
            <Search size={14} />
            Qidirish
          </button>
        </>
      }
    >
      <div className="form-grid form-grid--2">
        <label className="field">
          <span className="field__label">Rol</span>
          <span className="select-wrap">
            <select
              className={`input ${draft.role ? '' : 'input--placeholder'}`}
              value={draft.role ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value || undefined }))}
            >
              <option value="">Barcha rollar</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-wrap__chevron" />
          </span>
        </label>
        <label className="field">
          <span className="field__label">Holat</span>
          <span className="select-wrap">
            <select
              className={`input ${draft.status ? '' : 'input--placeholder'}`}
              value={draft.status ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, status: (e.target.value || undefined) as UserFilters['status'] }))}
            >
              <option value="">Barcha holatlar</option>
              <option value="active">Faol</option>
              <option value="inactive">Bloklangan</option>
            </select>
            <ChevronDown size={14} className="select-wrap__chevron" />
          </span>
        </label>
      </div>
    </Modal>
  );
};

export const UsersTablePanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<UserFilters>({});
  const [reloadToken, setReloadToken] = useState(0);

  const [data, setData] = useState<Paginated<UserItem> | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim());
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    rolesApi
      .list({ page_size: 100 })
      .then((res) => setRoles(res.results || []))
      .catch(() => undefined);
  }, []);

  const queryParams = useMemo<UserListParams>(() => {
    const params: UserListParams = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.role) params.role = Number(filters.role);
    if (filters.status) params.is_active = filters.status === 'active';
    return params;
  }, [debouncedSearch, filters]);

  useEffect(() => {
    setPage(1);
  }, [queryParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    usersApi
      .list({ page, page_size: PAGE_SIZE, ...queryParams }, controller.signal)
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404 && page > 1) {
          setPage((p) => p - 1);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Foydalanuvchilarni yuklab bo'lmadi");
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [page, queryParams, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await usersApi.remove(deleting.id);
      notify('success', "Foydalanuvchi o'chirildi", `@${deleting.username}`);
      setDeleting(null);
      closeForm();
      reload();
    } catch (err) {
      notify('error', "O'chirib bo'lmadi", err instanceof ApiError ? err.message : undefined);
    } finally {
      setDeleteLoading(false);
    }
  };

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;
  const colSpan = 7;
  const isSelf = (u: UserItem | null) => !!u && String(currentUser?.id) === String(u.id);

  return (
    <div className="ref-panel">
      <div className="toolbar">
        <div className="search-input search-input--wide">
          <Search size={14} className="search-input__icon" />
          <input
            className="input"
            placeholder="Login, ism yoki email bo'yicha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`btn btn--outline ${activeFilterCount ? 'is-active' : ''}`}
          onClick={() => setFilterOpen(true)}
        >
          <Funnel size={14} />
          Filter
          {activeFilterCount > 0 && <span className="btn__badge">{activeFilterCount}</span>}
        </button>
        <div className="toolbar__spacer" />
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={14} />
          Qo'shish
        </button>
      </div>

      <div className={`table-wrap ${loading && data ? 'is-loading' : ''}`}>
        <table className="table table--users">
          <colgroup>
            <col style={{ width: 48 }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 170 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="table__num">#</th>
              <th>Foydalanuvchi</th>
              <th>F.I.SH / Lavozim</th>
              <th>Rol</th>
              <th>Holat</th>
              <th className="table__date">Oxirgi kirish</th>
              <th className="table__date">Yaratilgan sana</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td colSpan={colSpan} className="table__state">
                  <Loader2 size={18} className="animate-spin" />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={colSpan} className="table__state">
                  {error}{' '}
                  <button type="button" className="link-btn" onClick={reload}>
                    Qayta urinish
                  </button>
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="table__state">
                  {debouncedSearch || activeFilterCount ? 'Hech narsa topilmadi' : 'Foydalanuvchilar mavjud emas'}
                </td>
              </tr>
            )}
            {!error &&
              rows.map((u, index) => {
                const open = () => {
                  setEditing(u);
                  setFormOpen(true);
                };
                return (
                  <tr key={u.id} className="is-clickable" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === 'Enter' && open()}>
                    <td className="table__num">{offset + index + 1}</td>
                    <td>
                      <div className="user-cell">
                        <span className="user-cell__avatar">{initialsOf(u)}</span>
                        <span className="user-cell__meta">
                          <span className="user-cell__username">
                            @{u.username}
                            {isSelf(u) && <span className="user-cell__self">Siz</span>}
                          </span>
                          <span className="user-cell__email">{u.email || 'Email kiritilmagan'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="table__stack">
                      <span>{fullName(u) || '—'}</span>
                      {u.employee_detail?.position_name && <small>{u.employee_detail.position_name}</small>}
                    </td>
                    <td className="table__cut">
                      {u.role_name ? u.role_name : <span className="text-muted">Rolsiz</span>}
                    </td>
                    <td>
                      <span className="user-status">
                        <span className={`status-badge ${u.is_active ? 'user-status--active' : 'user-status--blocked'}`}>
                          {u.is_active ? 'Faol' : 'Bloklangan'}
                        </span>
                        {u.is_superuser && (
                          <span className="user-status__super" title="Superuser — cheksiz huquq">
                            <Shield size={13} />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="table__date">
                      {u.last_login ? formatDateTime(u.last_login) : <span className="text-muted">Kirilmagan</span>}
                    </td>
                    <td className="table__date">{formatDateTime(u.created_at)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination__info">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total}
          </span>
          <button type="button" className="icon-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="Oldingi">
            <ChevronLeft size={16} />
          </button>
          <span className="pagination__page">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="icon-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Keyingi"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <UserFilterModal
        open={filterOpen}
        roles={roles}
        value={filters}
        onApply={(v) => {
          setFilters(v);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      <UserFormModal
        isOpen={formOpen}
        hidden={!!deleting || !!passwordUser}
        initialUser={editing}
        canDelete={!!editing && !isSelf(editing) && !editing.is_superuser}
        onClose={closeForm}
        onSaved={(saved) => {
          notify('success', editing ? "O'zgarishlar saqlandi" : 'Foydalanuvchi yaratildi', `@${saved.username}`);
          closeForm();
          reload();
        }}
        onDelete={setDeleting}
        onChangePassword={setPasswordUser}
      />

      <UserPasswordModal
        isOpen={!!passwordUser}
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
        onSuccess={() => notify('success', 'Parol yangilandi', `@${passwordUser?.username}`)}
      />

      <ConfirmDialog
        open={!!deleting}
        loading={deleteLoading}
        title="Foydalanuvchini o'chirmoqchimisiz?"
        warning={deleting ? `«@${deleting.username}» tizimga kira olmay qoladi. Bu amalni qaytarib bo'lmaydi.` : undefined}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
