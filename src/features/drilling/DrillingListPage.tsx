import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
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
import { tr } from '../../i18n';

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
  const [retryToken, setRetryToken] = useState(0);

  const [data, setData] = useState<Paginated<DrillingBPA> | null>(null);
  /** Scroll orqali yig'ilgan barcha yuklangan qatorlar */
  const [items, setItems] = useState<DrillingBPA[]>([]);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
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

  // Qidiruv/filtr o'zgarsa yoki qayta yuklansa — boshidan
  useEffect(() => {
    setPage(1);
  }, [queryParams, reloadToken]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    drillingBpaListApi
      .list({ page, page_size: PAGE_SIZE, ...queryParams }, controller.signal)
      .then((res) => {
        setData(res);
        setItems((prev) => (page === 1 ? res.results : [...prev, ...res.results.filter((r) => !prev.some((p) => p.id === r.id))]));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : tr("Ma'lumotlarni yuklab bo'lmadi"));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [page, queryParams, reloadToken, retryToken]);

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
    notify('success', tr('BPA pasporti yaratildi'), `Quduq ${created.well_number}`);
    setFormOpen(false);
    reload();
  };

  const handleExport = async (scope: 'all' | 'page') => {
    setExportMenu(false);
    setExporting(true);
    try {
      const rows: DrillingBPA[] = [];
      if (scope === 'page') rows.push(...items);
      else {
        for (let p = 1; p <= 50; p += 1) {
          const res = await drillingBpaListApi.list({ page: p, page_size: 200, ...queryParams });
          rows.push(...res.results);
          if (!res.next) break;
        }
      }

      const header = [
        '#',
        tr('BPA Raqami'),
        tr('Quduq raqami'),
        tr('Tashkilot'),
        tr('Hudud'),
        tr('Maydon'),
        tr('Dastgoh turi'),
        tr('Masʼul xodim'),
        tr('Boshlangan sana'),
        tr('Loyihaviy chuqurlik (m)'),
        tr('Joriy chuqurlik (m)'),
        tr('Progress (%)'),
      ];

      const lines = rows.map((row, i) => {
        const cur = row.current_depth ?? row.current_dept ?? 0;
        const prog = calcProgress(cur, row.depth_plan);
        return [
          i + 1,
          row.number || '',
          row.well_number,
          row.enterprise?.name || '',
          row.area?.region?.name || '',
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
      notify('error', tr('Eksport qilib bo‘lmadi'));
    } finally {
      setExporting(false);
    }
  };

  const rows = items;
  const total = data?.count ?? 0;
  const hasMore = !!data?.next;

  // Ro'yxat oxiri ko'ringanda keyingi sahifani yuklash
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setPage((p) => p + 1),
      { rootMargin: '300px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, error]);

  return (
    <div className="ref-panel">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input search-input--wide">
          <Search size={14} className="search-input__icon" />
          <input
            className="input"
            placeholder={tr('Quduq raqami, hujjat №, maydon yoki korxona bilan qidirish...')}
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
            aria-label={tr('Yuklash variantlari')}
          >
            <ChevronDown size={14} />
          </button>
          {exportMenu && (
            <div className="dropdown">
              <button type="button" className="dropdown__item" onClick={() => handleExport('all')}>
                {tr('Barcha BPA hujjatlari')}</button>
              <button type="button" className="dropdown__item" onClick={() => handleExport('page')}>
                {tr('Yuklangan qatorlar (')}{items.length})
              </button>
            </div>
          )}
        </div>

        <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
          <Plus size={14} />
          {tr("Qo'shish")}</button>
      </div>

      {/* Table Container */}
      <div className={`table-wrap ${loading && page === 1 && data ? 'is-loading' : ''}`}>
        <table className="table">
          <thead>
            <tr>
              <th className="table__num">#</th>
              <th>{tr('Hudud')}</th>
              <th>{tr('Maydon')}</th>
              <th>{tr('Quduq raqami')}</th>
              <th>{tr('Tashkilot')}</th>
              <th>{tr('Dastgoh turi')}</th>
              <th>{tr("Mas'ul xodim")}</th>
              <th>{tr('Boshlangan sana')}</th>
              <th>{tr('Loyiha chuqurligi')}</th>
              <th>{tr('Joriy chuqurlik')}</th>
              <th style={{ width: '150px' }}>{tr('Progress')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && page === 1 && !rows.length && (
              <tr>
                <td colSpan={11} className="table__state">
                  <Loader2 size={20} className="animate-spin" />
                </td>
              </tr>
            )}

            {!loading && error && !rows.length && (
              <tr>
                <td colSpan={11} className="table__state">
                  {error}{' '}
                  <button type="button" className="link-btn" onClick={reload}>
                    {tr('Qayta urinish')}</button>
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={11} className="table__state">
                  {debouncedSearch || activeFilterCount
                    ? tr('Qidiruv bo‘yicha hech qanday BPA pasporti topilmadi')
                    : tr("Hozircha burg'ilash (BPA) pasportlari mavjud emas")}
                </td>
              </tr>
            )}

            {rows.map((row, index) => {
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
                    <td className="table__num">{index + 1}</td>
                    <td>{row.area?.region?.name || '—'}</td>
                    <td>{row.area?.name || '—'}</td>
                    <td>
                      <strong className="well-num-text">{row.well_number}</strong>
                    </td>
                    <td>{row.enterprise?.name || '—'}</td>
                    <td>{row.machine_type?.name || '—'}</td>
                    <td>{row.employee?.name || '—'}</td>
                    <td>{formatDate(row.drilling_start_date)}</td>
                    <td>{row.depth_plan ? `${formatNumber(row.depth_plan, 0)} m` : '—'}</td>
                    <td>
                      <strong>{formatNumber(cur, 1)} {tr('m')}</strong>
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

      {/* Scroll pagination */}
      {rows.length > 0 && (
        <div ref={sentinelRef} className="scroll-loader">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {tr('Yuklanmoqda...')}
            </>
          ) : error ? (
            <>
              {error}{' '}
              <button type="button" className="link-btn" onClick={() => setRetryToken((t) => t + 1)}>
                {tr('Qayta urinish')}</button>
            </>
          ) : hasMore ? (
            <span>
              {rows.length} / {total} {tr('— davomi uchun pastga aylantiring')}</span>
          ) : (
            <span>{tr('Barchasi yuklandi ·')}{' '}{total} {tr('ta BPA pasporti')}</span>
          )}
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
