import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { ApiError } from '../../api/client';
import { rolesApi } from '../../api/accounts';
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

  const [data, setData] = useState<Paginated<RoleItem>>({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim());
  const queryParams = useMemo(() => ({ search: debouncedSearch || undefined }), [debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [queryParams]);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

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
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, queryParams, reloadToken]);

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    try {
      await rolesApi.remove(deletingRole.id);
      notify('success', "Rol o'chirildi", deletingRole.name);
      setDeletingRole(null);
      reload();
    } catch (err) {
      notify('error', "O'chirishda xatolik", err instanceof ApiError ? err.message : "Rolni o'chirib bo'lmadi");
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
          <h2 className="panel__title">Rollar va Ruxsatlar</h2>
          <p className="panel__desc">
            Foydalanuvchilarga biriktiriladigan tizim rollari hamda ularga berilgan ruxsatlar boshqaruvi
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
              setEditingRole(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Yangi rol</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input">
          <Search size={16} className="search-input__icon" />
          <input
            type="text"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rol nomi bo'yicha qidirish..."
          />
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--gray-500)' }}>
          Jami: <strong>{data.count}</strong> ta rol
        </div>
      </div>

      {/* Table */}
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
            <ShieldCheck size={36} color="var(--gray-400)" />
            <div style={{ fontWeight: 600, color: 'var(--gray-700)', marginTop: '8px' }}>
              Rollar topilmadi
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--gray-500)' }}>
              Yangi tizim rolini yaratish uchun "Yangi rol" tugmasini bosing
            </div>
          </div>
        )}

        {data.results.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Rol nomi</th>
                <th>Biriktirilgan ruxsatlar</th>
                <th>Yaratilgan sana</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => {
                const permsCount = r.permissions?.length || 0;

                return (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--gray-500)', fontSize: '12px' }}>#{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'rgba(21, 112, 205, 0.08)',
                            color: 'var(--brand-600)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Shield size={15} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{r.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge--purple">
                        {permsCount} ta ruxsat berilgan
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--gray-600)' }}>
                      {r.created_at ? formatDateTime(r.created_at) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => {
                            setEditingRole(r);
                            setFormOpen(true);
                          }}
                          title="Tahrirlash"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setDeletingRole(r)}
                          title="O'chirish"
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
      <RoleFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRole(null);
        }}
        initialRole={editingRole}
        onSaved={(saved) => {
          notify('success', editingRole ? "O'zgarishlar saqlandi" : 'Rol yaratildi', saved.name);
          reload();
        }}
      />

      <ConfirmDialog
        open={!!deletingRole}
        title="Rolni o'chirish"
        warning={
          deletingRole
            ? `Haqiqatan ham "${deletingRole.name}" rolini tizimdan o'chirmoqchimisiz? Ushbu roldagi foydalanuvchilar rolsiz qolishi mumkin.`
            : undefined
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeletingRole(null)}
      />
    </div>
  );
};
