import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Funnel,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';


import { ApiError } from '../../api/client';
import type { DrillingBPA, Paginated } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { drillingBpaApi, drillingBpaListApi } from './api';
import { DrillingBPAFormModal } from './DrillingBPAFormModal';
import { DrillingFilterModal, type DrillingFilters } from './DrillingFilterModal';
import { calcProgress, formatDate, formatNumber } from './utils';

const PAGE_SIZE = 20;

const csvEscape = (value: unknown) => {
  const s = value == null ? '' : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const DrillingListPage: React.FC<{ onOpen: (id: number) => void }> = ({ onOpen }) => {
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DrillingFilters>({});
  const [ordering] = useState('-id');
  const [reloadToken, setReloadToken] = useState(0);

  const [data, setData] = useState<Paginated<DrillingBPA> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(search.trim());
  const activeFilterCount = Object.keys(filters).length;
  const queryParams = useMemo(
    () => ({ search: debouncedSearch || undefined, ordering, ...filters }),
    [debouncedSearch, ordering, filters],
  );

  useEffect(() => {
    setPage(1);
  }, [queryParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    drillingBpaListApi
      .list({ page, page_size: PAGE_SIZE, ...queryParams }, controller.signal)
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404 && page > 1) {
          setPage((p) => p - 1);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklab bo'lmadi");
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [page, queryParams, reloadToken]);

  useEffect(() => {
    if (!exportMenu) return;
    const close = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportMenu]);

  const reload = () => setReloadToken((t) => t + 1);

  const handleCreatePassport = async (payload: Record<string, unknown>) => {
    const created = await drillingBpaApi.create(payload);
    notify('success', 'BPA pasporti yaratildi', `Quduq ${created.well_number}`);
    setFormOpen(false);
    reload();
  };

  const handleExport = async (scope: 'all' | 'page') => {
    setExportMenu(false);
    setExporting(true);
    try {
      const rows: DrillingBPA[] = [];
      if (scope === 'page') rows.push(...(data?.results ?? []));
      else {
        for (let p = 1; p <= 50; p += 1) {
          const res = await drillingBpaListApi.list({ page: p, page_size: 200, ...queryParams });
          rows.push(...res.results);
          if (!res.next) break;
        }
      }

      const header = [
        '#',
        'BPA Raqami',
        'Quduq raqami',
        'Tashkilot',
        'Maydon',
        'Dastgoh turi',
        'Masʼul xodim',
        'Boshlangan sana',
        'Loyihaviy chuqurlik (m)',
        'Joriy chuqurlik (m)',
        'Progress (%)',
      ];

      const lines = rows.map((row, i) => {
        const cur = row.current_depth ?? row.current_dept ?? 0;
        const prog = calcProgress(cur, row.depth_plan);
        return [
          i + 1,
          row.number || '',
          row.well_number,
          row.enterprise?.name || '',
          row.area?.name || '',
          row.machine_type?.name || '',
          row.employee?.name || '',
          formatDate(row.drilling_start_date),
          row.depth_plan || '',
          cur,
          `${prog}%`,
        ]
          .map(csvEscape)
          .join(';');
      });

      const blob = new Blob(['\uFEFF' + [header.map(csvEscape).join(';'), ...lines].join('\n')], {
        type: 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GRR-Burgulash-BPA-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notify('error', 'Eksport qilib bo‘lmadi');
    } finally {
      setExporting(false);
    }
  };

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;

  return (
    <div className="ref-panel">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input search-input--wide">
          <Search size={14} className="search-input__icon" />
          <input
            className="input"
            placeholder="Quduq raqami, hujjat №, maydon yoki korxona bilan qidirish..."
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

        <div className="split-btn" ref={exportRef}>
          <button
            type="button"
            className="btn btn--outline split-btn__main"
            onClick={() => handleExport('all')}
            disabled={exporting || !total}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} className="icon-excel" />}
            Yuklash
          </button>
          <button
            type="button"
            className="btn btn--outline split-btn__toggle"
            onClick={() => setExportMenu((v) => !v)}
            disabled={exporting || !total}
            aria-label="Yuklash variantlari"
          >
            <ChevronDown size={14} />
          </button>
          {exportMenu && (
            <div className="dropdown">
              <button type="button" className="dropdown__item" onClick={() => handleExport('all')}>
                Barcha BPA hujjatlari
              </button>
              <button type="button" className="dropdown__item" onClick={() => handleExport('page')}>
                Joriy sahifa
              </button>
            </div>
          )}
        </div>

        <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
          <Plus size={14} />
          Qo'shish
        </button>
      </div>

      {/* Table Container */}
      <div className={`table-wrap ${loading && data ? 'is-loading' : ''}`}>
        <table className="table">
          <thead>
            <tr>
              <th className="table__num">#</th>
              <th>Hujjat №</th>
              <th>Quduq raqami</th>
              <th>Maydon / Hudud</th>
              <th>Tashkilot</th>
              <th>Dastgoh turi</th>
              <th>Mas'ul xodim</th>
              <th>Boshlangan sana</th>
              <th>Loyiha chuqurligi</th>
              <th>Joriy chuqurlik</th>
              <th style={{ width: '150px' }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td colSpan={11} className="table__state">
                  <Loader2 size={20} className="animate-spin" />
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={11} className="table__state">
                  {error}{' '}
                  <button type="button" className="link-btn" onClick={reload}>
                    Qayta urinish
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={11} className="table__state">
                  {debouncedSearch || activeFilterCount
                    ? 'Qidiruv bo‘yicha hech qanday BPA pasporti topilmadi'
                    : "Hozircha burg'ilash (BPA) pasportlari mavjud emas"}
                </td>
              </tr>
            )}

            {!error &&
              rows.map((row, index) => {
                const cur = row.current_depth ?? row.current_dept ?? 0;
                const prog = calcProgress(cur, row.depth_plan);
                return (
                  <tr
                    key={row.id}
                    className="is-clickable"
                    onClick={() => onOpen(row.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onOpen(row.id)}
                  >
                    <td className="table__num">{offset + index + 1}</td>
                    <td>
                      <span className="doc-num-tag">{row.number || `#${row.id}`}</span>
                    </td>
                    <td>
                      <strong className="well-num-text">{row.well_number}</strong>
                    </td>
                    <td>{row.area?.name || '—'}</td>
                    <td>{row.enterprise?.name || '—'}</td>
                    <td>{row.machine_type?.name || '—'}</td>
                    <td>{row.employee?.name || '—'}</td>
                    <td>{formatDate(row.drilling_start_date)}</td>
                    <td>{row.depth_plan ? `${formatNumber(row.depth_plan, 0)} m` : '—'}</td>
                    <td>
                      <strong>{formatNumber(cur, 1)} m</strong>
                    </td>
                    <td>
                      <div className="table-progress">
                        <div className="table-progress__bar">
                          <div
                            className="table-progress__fill"
                            style={{ width: `${Math.min(100, Math.max(0, prog))}%` }}
                          />
                        </div>
                        <span className="table-progress__pct">{formatNumber(prog, 0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
            aria-label="Oldingi sahifa"
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
            aria-label="Keyingi sahifa"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Filter Modal */}
      <DrillingFilterModal
        open={filterOpen}
        value={filters}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      {/* Form Modal */}
      <DrillingBPAFormModal
        open={formOpen}
        bpa={null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreatePassport}
      />
    </div>
  );
};
