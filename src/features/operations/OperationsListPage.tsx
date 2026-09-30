import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
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
import type { DerrickErectionOperation, Paginated } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { operationsApi } from './api';
import { OperationFilterModal, type OperationFilters } from './OperationFilterModal';
import { OperationFormModal } from './OperationFormModal';
import { ProgressBar, StageSegments } from './components';
import { STAGE_LABELS, STAGE_ORDER, STAGE_STATUS_LABELS, formatDate, formatDecimal, getStageStatus, stagesByType } from './utils';

const PAGE_SIZE = 20;

const csvEscape = (value: unknown) => {
  const s = value == null ? '' : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

interface SortButtonProps {
  label: string;
  field: string;
  ordering: string;
  onSort: (field: string) => void;
}

const SortButton: React.FC<SortButtonProps> = ({ label, field, ordering, onSort }) => {
  const active = ordering.replace('-', '') === field;
  const Icon = !active ? ArrowUpDown : ordering.startsWith('-') ? ArrowDown : ArrowUp;
  return (
    <button type="button" className={`sort-btn ${active ? 'is-active' : ''}`} onClick={() => onSort(field)}>
      {label}
      <Icon size={12} />
    </button>
  );
};

const SortableHeader: React.FC<SortButtonProps & { title?: string }> = ({ title, ...props }) => (
  <th title={title}>
    <SortButton {...props} />
  </th>
);

export const OperationsListPage: React.FC<{ onOpen: (id: number) => void }> = ({ onOpen }) => {
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<OperationFilters>({});
  const [ordering, setOrdering] = useState('-id');
  const [reloadToken, setReloadToken] = useState(0);

  const [data, setData] = useState<Paginated<DerrickErectionOperation> | null>(null);
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
    operationsApi
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
    const close = (e: MouseEvent) => !exportRef.current?.contains(e.target as Node) && setExportMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportMenu]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  const toggleSort = (field: string) =>
    setOrdering((prev) => (prev === `-${field}` ? field : prev === field ? '-id' : `-${field}`));

  const handleCreate = async (payload: Record<string, unknown>) => {
    const created = await operationsApi.create(payload);
    notify('success', "Operatsiya qo'shildi", `№${created.from_well_number} → №${created.to_well_number}`);
    setFormOpen(false);
    onOpen(created.id);
  };

  const handleExport = async (scope: 'all' | 'page') => {
    setExportMenu(false);
    setExporting(true);
    try {
      const rows: DerrickErectionOperation[] = [];
      if (scope === 'page') rows.push(...(data?.results ?? []));
      else {
        for (let p = 1; p <= 100; p += 1) {
          const res = await operationsApi.list({ page: p, page_size: 200, ...queryParams });
          rows.push(...res.results);
          if (!res.next) break;
        }
      }
      const header = [
        '#',
        'Korxona',
        "Burg'ulash uskunasi",
        'Qaysi maydondan',
        'Quduq (dan)',
        'Qaysi maydonga',
        'Quduq (ga)',
        'Prorab',
        'Ishchilar soni',
        'Masofa (km)',
        'Reja kun',
        "Burg'ulash sanasi",
        'Bajarilish (%)',
        ...STAGE_ORDER.map((t) => STAGE_LABELS[t]),
        'Kunlik hisobotlar',
        'Kechikish sababi',
      ];
      const lines = rows.map((op, i) => {
        const stages = stagesByType(op.stages);
        return [
          i + 1,
          op.enterprise?.name,
          op.drilling_rig_type?.name,
          op.from_area?.name,
          op.from_well_number,
          op.to_area?.name,
          op.to_well_number,
          op.foreman?.name,
          op.number_employees,
          op.distance_km,
          op.plan_days,
          formatDate(op.expected_drilling_date),
          op.completion_percentage,
          ...STAGE_ORDER.map((t) => STAGE_STATUS_LABELS[getStageStatus(stages.get(t))]),
          op.daily_works_count,
          op.delay_reason ?? '',
        ]
          .map(csvEscape)
          .join(';');
      });
      const blob = new Blob(['﻿' + [header.map(csvEscape).join(';'), ...lines].join('\n')], {
        type: 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GQI-minora-montaji-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify('error', "Yuklab bo'lmadi", err instanceof ApiError ? err.message : undefined);
    } finally {
      setExporting(false);
    }
  };

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;
  const colSpan = 8;

  return (
    <div className="ref-panel">
      <div className="toolbar">
        <div className="search-input search-input--wide">
          <Search size={14} className="search-input__icon" />
          <input
            className="input"
            placeholder="Quduq raqami, maydon yoki prorab..."
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
            aria-label="Yuklash turlari"
          >
            <ChevronDown size={14} />
          </button>
          {exportMenu && (
            <div className="dropdown">
              <button type="button" className="dropdown__item" onClick={() => handleExport('all')}>
                Barcha yozuvlar
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

      <div className={`table-wrap ${loading && data ? 'is-loading' : ''}`}>
        <table className="table table--ops">
          <colgroup>
            <col className="col-num" />
            <col className="col-route" />
            <col className="col-org" />
            <col className="col-foreman" />
            <col className="col-distance" />
            <col className="col-date" />
            <col className="col-stages" />
            <col className="col-progress" />
          </colgroup>
          <thead>
            <tr>
              <th className="table__num">#</th>
              <th>Yo'nalish</th>
              <th>Korxona / Uskuna</th>
              <th>Prorab</th>
              <th className="is-right">
                <span className="sort-pair">
                  <SortButton label="Masofa" field="distance_km" ordering={ordering} onSort={toggleSort} />
                  <span className="sort-pair__sep">/</span>
                  <SortButton label="Kun" field="plan_days" ordering={ordering} onSort={toggleSort} />
                </span>
              </th>
              <SortableHeader label="Burg'ulash" field="expected_drilling_date" ordering={ordering} onSort={toggleSort} title="Kutilayotgan burg'ulash sanasi" />
              <th>Bosqichlar</th>
              <SortableHeader label="Bajarilish" field="completion_percentage" ordering={ordering} onSort={toggleSort} />
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
                  {debouncedSearch || activeFilterCount ? 'Hech narsa topilmadi' : "Operatsiyalar mavjud emas"}
                </td>
              </tr>
            )}
            {!error &&
              rows.map((op, index) => (
                <tr
                  key={op.id}
                  className="is-clickable"
                  tabIndex={0}
                  onClick={() => onOpen(op.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onOpen(op.id)}
                >
                  <td className="table__num">{offset + index + 1}</td>
                  <td>
                    <div className="route-cell">
                      <span className="route-cell__point">
                        <strong>№{op.from_well_number}</strong>
                        <small title={op.from_area?.name}>{op.from_area?.name}</small>
                      </span>
                      <ChevronRight size={14} className="route-cell__arrow" />
                      <span className="route-cell__point">
                        <strong>№{op.to_well_number}</strong>
                        <small title={op.to_area?.name}>{op.to_area?.name}</small>
                      </span>
                    </div>
                  </td>
                  <td className="table__stack" title={`${op.enterprise?.name ?? ''}\n${op.drilling_rig_type?.name ?? ''}`}>
                    <span>{op.enterprise?.name}</span>
                    <small>{op.drilling_rig_type?.name}</small>
                  </td>
                  <td className="table__cut" title={op.foreman?.name}>
                    {op.foreman?.name}
                  </td>
                  <td className="is-right table__num-cell">
                    <span className="num-stack">
                      <span>
                        {formatDecimal(op.distance_km)} <span className="unit">km</span>
                      </span>
                      <small>{op.plan_days} kun</small>
                    </span>
                  </td>
                  <td className="table__num-cell">{formatDate(op.expected_drilling_date)}</td>
                  <td>
                    <StageSegments stages={op.stages} />
                  </td>
                  <td className="table__progress">
                    <ProgressBar value={op.completion_percentage} compact />
                  </td>
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

      <OperationFilterModal
        open={filterOpen}
        value={filters}
        onApply={(v) => {
          setFilters(v);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      <OperationFormModal open={formOpen} record={null} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
    </div>
  );
};
