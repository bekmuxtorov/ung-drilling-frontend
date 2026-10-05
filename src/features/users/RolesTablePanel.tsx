import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react';
import { ApiError } from '../../api/client';
import { permissionsApi, rolesApi } from '../../api/accounts';
import type { Paginated } from '../../api/types';
import type { RoleItem } from '../../types/auth';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatDateTime } from '../references/format';
import { RoleFormModal } from './RoleFormModal';

const PAGE_SIZE = 20;

export const RolesTablePanel: React.FC = () => {
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [data, setData] = useState<Paginated<RoleItem> | null>(null);
  const [permTotal, setPermTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [deleting, setDeleting] = useState<RoleItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim());
  const queryParams = useMemo(() => ({ search: debouncedSearch || undefined }), [debouncedSearch]);

  // Ruxsatlarning umumiy soni — rol qamrovini ko'rsatish uchun
  useEffect(() => {
    permissionsApi
      .list()
      .then((perms) => setPermTotal(perms?.length ?? 0))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [queryParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    rolesApi
      .list({ page, page_size: PAGE_SIZE, ...queryParams }, controller.signal)
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404 && page > 1) {
          setPage((p) => p - 1);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Rollarni yuklab bo'lmadi");
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
      await rolesApi.remove(deleting.id);
      notify('success', "Rol o'chirildi", deleting.name);
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
  const colSpan = 5;

  return (
    <div className="ref-panel">
      <div className="toolbar">
        <div className="search-input">
          <Search size={14} className="search-input__icon" />
          <input className="input" placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
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
        <table className="table">
          <thead>
            <tr>
              <th className="table__num">#</th>
              <th>Nomi</th>
              <th className="role-perms-col">Ruxsatlar</th>
              <th className="table__date">Yaratilgan sana</th>
              <th className="table__date">Yangilangan sana</th>
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
                  {debouncedSearch ? 'Hech narsa topilmadi' : "Ma'lumot mavjud emas"}
                </td>
              </tr>
            )}
            {!error &&
              rows.map((r, index) => {
                const count = r.permissions?.length ?? 0;
                const share = permTotal ? Math.min(100, (count / permTotal) * 100) : 0;
                const open = () => {
                  setEditing(r);
                  setFormOpen(true);
                };
                return (
                  <tr key={r.id} className="is-clickable" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === 'Enter' && open()}>
                    <td className="table__num">{offset + index + 1}</td>
                    <td>{r.name}</td>
                    <td>
                      <span className="role-perms">
                        <span className="role-perms__value">
                          {count}
                          {permTotal > 0 && <small> / {permTotal}</small>}
                        </span>
                        {permTotal > 0 && (
                          <span className="role-perms__track" aria-hidden>
                            <span style={{ width: `${share}%` }} />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="table__date">{r.created_at ? formatDateTime(r.created_at) : '—'}</td>
                    <td className="table__date">{r.updated_at ? formatDateTime(r.updated_at) : '—'}</td>
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

      <RoleFormModal
        isOpen={formOpen}
        hidden={!!deleting}
        initialRole={editing}
        onClose={closeForm}
        onSaved={(saved) => {
          notify('success', editing ? "O'zgarishlar saqlandi" : "Rol qo'shildi", saved.name);
          closeForm();
          reload();
        }}
        onDelete={setDeleting}
      />

      <ConfirmDialog
        open={!!deleting}
        loading={deleteLoading}
        title="Rolni o'chirmoqchimisiz?"
        warning="Ushbu roldagi foydalanuvchilar rolsiz qoladi."
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
