import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, Funnel, Loader2, Plus, Search } from 'lucide-react';
import { ApiError } from '../../api/client';
import type { Paginated } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { AnyRow, ReferenceConfig } from './config';
import { getReferenceApi, invalidateOptions } from './api';
import { formatDateTime } from './format';
import { FilterModal, type FilterValues } from './FilterModal';
import { ReferenceFormModal } from './ReferenceFormModal';
import { tr } from '../../i18n';

const PAGE_SIZE = 20;

const csvEscape = (value: unknown) => {
  const s = value == null ? '' : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const ReferenceTablePanel: React.FC<{ config: ReferenceConfig }> = ({ config }) => {
  const api = useMemo(() => getReferenceApi(config.key), [config.key]);
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterValues>({});
  const [reloadToken, setReloadToken] = useState(0);

  const [data, setData] = useState<Paginated<AnyRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [deleting, setDeleting] = useState<AnyRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(search.trim());
  const activeFilterCount = Object.keys(filters).length;
  const queryParams = useMemo(() => ({ search: debouncedSearch || undefined, ...filters }), [debouncedSearch, filters]);

  useEffect(() => {
    setPage(1);
  }, [queryParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .list({ page, page_size: PAGE_SIZE, ...queryParams }, controller.signal)
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        // O'chirishdan so'ng sahifa bo'sh qolsa — oldingi sahifaga qaytish
        if (err instanceof ApiError && err.status === 404 && page > 1) {
          setPage((p) => p - 1);
          return;
        }
        setError(err instanceof ApiError ? err.message : tr("Ma'lumotlarni yuklab bo'lmadi"));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [api, page, queryParams, reloadToken]);

  useEffect(() => {
    if (!exportMenu) return;
    const close = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportMenu]);

  const reload = useCallback(() => {
    invalidateOptions(config.key);
    setReloadToken((t) => t + 1);
  }, [config.key]);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (editing) await api.update(editing.id, payload);
    else await api.create(payload);
    notify('success', editing ? tr("O'zgarishlar saqlandi") : `${config.singular} qo'shildi`, String(payload.name));
    setFormOpen(false);
    setEditing(null);
    reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api.remove(deleting.id);
      notify('success', tr("O'chirildi"), deleting.name);
      setDeleting(null);
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (err) {
      notify('error', tr("O'chirib bo'lmadi"), err instanceof ApiError ? err.message : undefined);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async (scope: 'all' | 'page') => {
    setExportMenu(false);
    setExporting(true);
    try {
      const rows: AnyRow[] = [];
      if (scope === 'page') rows.push(...(data?.results ?? []));
      else {
        for (let p = 1; p <= 100; p += 1) {
          const res = await api.list({ page: p, page_size: 200, ...queryParams });
          rows.push(...res.results);
          if (!res.next) break;
        }
      }
      const header = ['#', ...config.columns.map((c) => c.label), tr('Yaratilgan sana'), tr('Yangilangan sana')];
      const lines = rows.map((row, i) =>
        [
          i + 1,
          ...config.columns.map((c) => {
            const v = c.render(row);
            return typeof v === 'string' || typeof v === 'number' ? v : '';
          }),
          formatDateTime(row.created_at),
          formatDateTime(row.updated_at),
        ]
          .map(csvEscape)
          .join(';'),
      );
      const blob = new Blob(['﻿' + [header.map(csvEscape).join(';'), ...lines].join('\n')], {
        type: 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.title}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify('error', tr("Yuklab bo'lmadi"), err instanceof ApiError ? err.message : undefined);
    } finally {
      setExporting(false);
    }
  };

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;
  const colSpan = config.columns.length + 3;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: AnyRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div className="ref-panel">
      <div className="toolbar">
        <div className="search-input">
          <Search size={14} className="search-input__icon" />
          <input className="input" placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button
          type="button"
          className={`btn btn--outline ${activeFilterCount ? 'is-active' : ''}`}
          onClick={() => setFilterOpen(true)}
        >
          <Funnel size={14} />
          {tr('Filter')}{activeFilterCount > 0 && <span className="btn__badge">{activeFilterCount}</span>}
        </button>

        <div className="toolbar__spacer" />

        <div className="split-btn" ref={exportRef}>
          <button
            type="button"
            className="btn btn--outline split-btn__main"
            onClick={() => handleExport('all')}
            disabled={exporting || !total}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} className="icon-excel" />}
            {tr('Yuklash')}</button>
          <button
            type="button"
            className="btn btn--outline split-btn__toggle"
            onClick={() => setExportMenu((v) => !v)}
            disabled={exporting || !total}
            aria-label={tr('Yuklash turlari')}
          >
            <ChevronDown size={14} />
          </button>
          {exportMenu && (
            <div className="dropdown">
              <button type="button" className="dropdown__item" onClick={() => handleExport('all')}>
                {tr('Barcha yozuvlar')}</button>
              <button type="button" className="dropdown__item" onClick={() => handleExport('page')}>
                {tr('Joriy sahifa')}</button>
            </div>
          )}
        </div>

        <button type="button" className="btn btn--primary" onClick={openCreate}>
          <Plus size={14} />
          {tr("Qo'shish")}</button>
      </div>

      <div className={`table-wrap ${loading && data ? 'is-loading' : ''}`}>
        <table className="table">
          <thead>
            <tr>
              <th className="table__num">#</th>
              {config.columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
              <th className="table__date">{tr('Yaratilgan sana')}</th>
              <th className="table__date">{tr('Yangilangan sana')}</th>
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
                    {tr('Qayta urinish')}</button>
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="table__state">
                  {debouncedSearch || activeFilterCount ? tr('Hech narsa topilmadi') : tr("Ma'lumot mavjud emas")}
                </td>
              </tr>
            )}
            {!error &&
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="is-clickable"
                  tabIndex={0}
                  onClick={() => openEdit(row)}
                  onKeyDown={(e) => e.key === 'Enter' && openEdit(row)}
                >
                  <td className="table__num">{offset + index + 1}</td>
                  {config.columns.map((col) => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                  <td className="table__date">{formatDateTime(row.created_at)}</td>
                  <td className="table__date">{formatDateTime(row.updated_at)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination__info">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total}
          </span>
          <button
            type="button"
            className="icon-btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            aria-label={tr('Oldingi')}
          >
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
            aria-label={tr('Keyingi')}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <FilterModal
        open={filterOpen}
        config={config}
        value={filters}
        onApply={(v) => {
          setFilters(v);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      <ReferenceFormModal
        config={config}
        open={formOpen}
        record={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        onDelete={setDeleting}
        hidden={!!deleting}
      />

      <ConfirmDialog
        open={!!deleting}
        loading={deleteLoading}
        title={tr("{0}ni o'chirmoqchimisiz?", config.singular)}
        warning={config.deleteWarning}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
