import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { ApiError } from '../../api/client';
import { rolesApi, usersApi, type UserListParams } from '../../api/accounts';
import type { Paginated } from '../../api/types';
import type { RoleItem, UserItem } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatDateTime } from '../references/format';
import { UserFormModal } from './UserFormModal';
import { UserPasswordModal } from './UserPasswordModal';

const PAGE_SIZE = 20;

export const UsersTablePanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, inactive
  const [reloadToken, setReloadToken] = useState(0);

  const [data, setData] = useState<Paginated<UserItem>>({ count: 0, next: null, previous: null, results: [] });
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modallar
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null);

  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim());

  // Rol ro'yxatini yuklash
  useEffect(() => {
    rolesApi
      .list({ page_size: 100 })
      .then((res) => setRoles(res.results || []))
      .catch(() => {});
  }, []);

  const queryParams = useMemo<UserListParams>(() => {
    const params: UserListParams = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter) params.role = Number(roleFilter);
    if (statusFilter === 'active') params.is_active = true;
    if (statusFilter === 'inactive') params.is_active = false;
    return params;
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [queryParams]);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  // Foydalanuvchilar ro'yxatini yuklash
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
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, queryParams, reloadToken]);

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await usersApi.remove(deletingUser.id);
      notify('success', "Foydalanuvchi o'chirildi", `@${deletingUser.username}`);
      setDeletingUser(null);
      reload();
    } catch (err) {
      notify('error', "O'chirishda xatolik", err instanceof ApiError ? err.message : "Foydalanuvchini o'chirib bo'lmadi");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(data.count / PAGE_SIZE) || 1;
  const startItem = data.count ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, data.count);

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Foydalanuvchilar boshqaruvi</h2>
          <p className="panel__desc">
            Tizimga kirish huquqiga ega foydalanuvchilar, ularning rollari va faollik holati
          </p>
        </div>

        <div className="panel__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={reload}
            title="Yangilash"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setEditingUser(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Yangi foydalanuvchi</span>
          </button>
        </div>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="search-input">
          <Search size={16} className="search-input__icon" />
          <input
            type="text"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Login, ism yoki email bo'yicha..."
          />
        </div>

        {/* Rol filtri */}
        <div className="select-wrap" style={{ minWidth: '180px' }}>
          <select
            className="input"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Barcha rollar</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <span className="select-wrap__chevron">▾</span>
        </div>

        {/* Status filtri */}
        <div className="select-wrap" style={{ minWidth: '150px' }}>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faqat faollar</option>
            <option value="inactive">Nofaol (bloklangan)</option>
          </select>
          <span className="select-wrap__chevron">▾</span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--gray-500)' }}>
          Jami: <strong>{data.count}</strong> ta foydalanuvchi
        </div>
      </div>

      {/* Table Content */}
      <div className="table-wrap">
        {loading && (
          <div className="table-loading">
            <Loader2 size={24} className="animate-spin" />
            <span>Yuklanmoqda...</span>
          </div>
        )}

        {error && !loading && <div className="alert">{error}</div>}

        {!loading && !error && data.results.length === 0 && (
          <div className="empty-state">
            <Users size={36} color="var(--gray-400)" />
            <div style={{ fontWeight: 600, color: 'var(--gray-700)', marginTop: '8px' }}>
              Foydalanuvchilar topilmadi
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--gray-500)' }}>
              Qidiruv shartlarini o'zgartiring yoki yangi foydalanuvchi qo'shing
            </div>
          </div>
        )}

        {data.results.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Foydalanuvchi</th>
                <th>F.I.SH / Xodim</th>
                <th>Rol</th>
                <th>Holati</th>
                <th>Oxirgi kirish</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((u) => {
                const initials = (u.username.slice(0, 2) || 'US').toUpperCase();
                const isSelf = String(currentUser?.id) === String(u.id);

                return (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--gray-500)', fontSize: '12px' }}>#{u.id}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell__avatar">{initials}</div>
                        <div className="user-cell__meta">
                          <span className="user-cell__username">
                            @{u.username} {isSelf && <span style={{ color: 'var(--brand-600)', fontSize: '11px' }}>(Siz)</span>}
                          </span>
                          <span className="user-cell__email">{u.email || 'Email kiritilmagan'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                        {u.employee_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      </div>
                      {u.employee_detail?.position_name && (
                        <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                          {u.employee_detail.position_name}
                        </div>
                      )}
                    </td>
                    <td>
                      {u.role_name ? (
                        <span className="badge badge--purple">{u.role_name}</span>
                      ) : (
                        <span className="badge badge--gray">Rolsiz</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {u.is_active ? (
                          <span className="badge badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={12} />
                            Faol
                          </span>
                        ) : (
                          <span className="badge badge--danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <UserX size={12} />
                            Bloklangan
                          </span>
                        )}

                        {u.is_superuser && (
                          <span className="badge badge--brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Shield size={12} />
                            Superuser
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--gray-600)' }}>
                      {u.last_login ? formatDateTime(u.last_login) : <span style={{ color: 'var(--gray-400)' }}>Kirilmagan</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => {
                            setPasswordUser(u);
                            setPasswordModalOpen(true);
                          }}
                          title="Yangi parol o'rnatish"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => {
                            setEditingUser(u);
                            setFormOpen(true);
                          }}
                          title="Tahrirlash"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setDeletingUser(u)}
                          title="O'chirish"
                          disabled={isSelf || u.is_superuser}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {data.count > 0 && (
        <div className="pager">
          <div className="pager__summary">
            {startItem}-{endItem} / {data.count} ta yozuv
          </div>
          <div className="pager__controls">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '13px', color: 'var(--gray-700)', padding: '0 8px' }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Keyingi sahifa"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modallar */}
      <UserFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        initialUser={editingUser}
        onSaved={(saved) => {
          notify('success', editingUser ? "O'zgarishlar saqlandi" : "Foydalanuvchi yaratildi", `@${saved.username}`);
          reload();
        }}
      />

      <UserPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setPasswordUser(null);
        }}
        user={passwordUser}
        onSuccess={() => {
          notify('success', 'Parol yangilandi', `@${passwordUser?.username} uchun yangi parol muvaffaqiyatli o'rnatildi`);
        }}
      />

      <ConfirmDialog
        open={!!deletingUser}
        title="Foydalanuvchini o'chirish"
        warning={
          deletingUser
            ? `Haqiqatan ham "@${deletingUser.username}" foydalanuvchisini tizimdan o'chirmoqchimisiz? Ushbu amalni bekor qilib bo'lmaydi.`
            : undefined
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
};
