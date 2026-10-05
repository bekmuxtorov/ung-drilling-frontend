import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Filter,
  Globe,
  Inbox,
  Laptop,
  Loader2,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Trash2,
} from 'lucide-react';
import { auditLogsApi } from '../../api/audit';
import { ApiError } from '../../api/client';
import { ExportDropdown } from '../../components/ui/ExportDropdown';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { AuditAction, AuditLog, AuditLogListParams } from '../../types/audit';
import { formatDateTime } from '../references/format';
import { AuditLogDetailModal } from './AuditLogDetailModal';
import { AuditLogFilterModal, type AuditFilters } from './AuditLogFilterModal';
import '../../styles/audit.css';

const SCROLL_PAGE_SIZE = 25;

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | ''>('');
  const [filters, setFilters] = useState<AuditFilters>({});
  const [reloadToken, setReloadToken] = useState(0);

  // Modals
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedAction) count++;
    Object.values(filters).forEach((v) => {
      if (v !== undefined && v !== null && v !== '') count++;
    });
    return count;
  }, [selectedAction, filters]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedAction('');
    setFilters({});
  }, []);

  // Initial Load / Filter Change Effect
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setPage(1);

    const params: AuditLogListParams = {
      page: 1,
      page_size: SCROLL_PAGE_SIZE,
      search: debouncedSearch || undefined,
      action: (selectedAction || filters.action || undefined) as AuditAction | undefined,
      ...filters,
    };

    auditLogsApi
      .list(params, controller.signal)
      .then((res) => {
        setLogs(res.results || []);
        setTotal(res.count || 0);
        setHasMore(Boolean(res.next));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Audit loglarni yuklab bo‘lmadi');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, selectedAction, filters, reloadToken]);

  // Load next page on scroll
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    const params: AuditLogListParams = {
      page: nextPage,
      page_size: SCROLL_PAGE_SIZE,
      search: debouncedSearch || undefined,
      action: (selectedAction || filters.action || undefined) as AuditAction | undefined,
      ...filters,
    };

    auditLogsApi
      .list(params)
      .then((res) => {
        setLogs((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = (res.results || []).filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
        setTotal(res.count || 0);
        setHasMore(Boolean(res.next));
      })
      .catch((err) => {
        console.error('Failed to load more audit logs', err);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [loading, loadingMore, hasMore, page, debouncedSearch, selectedAction, filters]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: '300px',
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const handleActionTabChange = (action: AuditAction | '') => {
    setSelectedAction(action);
    setFilters((f) => ({ ...f, action: action || undefined }));
  };

  const renderActionBadge = (action: string, display: string) => {
    switch (action) {
      case 'create':
        return (
          <span className="audit-badge audit-badge--create">
            <PlusCircle size={13} />
            {display || 'Yaratish'}
          </span>
        );
      case 'update':
        return (
          <span className="audit-badge audit-badge--update">
            <RefreshCw size={13} />
            {display || 'Tahrirlash'}
          </span>
        );
      case 'delete':
        return (
          <span className="audit-badge audit-badge--delete">
            <Trash2 size={13} />
            {display || 'O‘chirish'}
          </span>
        );
      default:
        return <span className="audit-badge">{display || action}</span>;
    }
  };

  return (
    <div className="ref-panel audit-page">
      {/* Toolbar */}
      <div className="toolbar audit-toolbar">
          {/* Global search */}
          <div className="search-input search-input--wide">
            <Search size={14} className="search-input__icon" />
            <input
              className="input"
              placeholder="Login, obyekt, model, IP yoki MAC bo‘yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Action Segmented Tabs */}
          <div className="audit-action-tabs">
            <button
              type="button"
              className={`audit-action-tab ${selectedAction === '' ? 'is-active' : ''}`}
              onClick={() => handleActionTabChange('')}
            >
              Barchasi
            </button>
            <button
              type="button"
              className={`audit-action-tab ${selectedAction === 'create' ? 'is-active' : ''}`}
              onClick={() => handleActionTabChange('create')}
            >
              <PlusCircle size={12} color="#079455" />
              Yaratish
            </button>
            <button
              type="button"
              className={`audit-action-tab ${selectedAction === 'update' ? 'is-active' : ''}`}
              onClick={() => handleActionTabChange('update')}
            >
              <RefreshCw size={12} color="#175cd3" />
              Tahrirlash
            </button>
            <button
              type="button"
              className={`audit-action-tab ${selectedAction === 'delete' ? 'is-active' : ''}`}
              onClick={() => handleActionTabChange('delete')}
            >
              <Trash2 size={12} color="#d92d20" />
              O‘chirish
            </button>
          </div>

          {/* Advanced Filter Modal Trigger */}
          <button
            type="button"
            className={`btn btn--outline ${activeFilterCount > 0 ? 'is-active' : ''}`}
            onClick={() => setFilterModalOpen(true)}
          >
            <Filter size={14} />
            Filter
            {activeFilterCount > 0 && <span className="btn__badge">{activeFilterCount}</span>}
          </button>

          {(Boolean(search) || activeFilterCount > 0) && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={handleResetFilters}
              title="Barcha filtrlarni tozalash"
            >
              <RotateCcw size={13} />
              Tozalash
            </button>
          )}

          <div className="toolbar__spacer" />

          <button
            type="button"
            className="btn btn--outline"
            onClick={reload}
            title="Yangilash"
            disabled={loading}
          >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Yangilash
            </button>
            {/* Export Dropdown */}
            <ExportDropdown
              data={{
                title: 'Tizim audit loglari hisoboti',
                subtitle: 'Foydalanuvchilar harakatlari va xavfsizlik nazorati jurnali',
                filename: `audit_loglari_${new Date().toISOString().slice(0, 10)}`,
                headers: [
                  '#',
                  'Sana va vaqt',
                  'Foydalanuvchi',
                  'Harakat',
                  'Ilova',
                  'Model',
                  'Obyekt ID',
                  'Obyekt tavsifi',
                  'O‘zgartirilgan maydonlar soni',
                  'IP manzil',
                  'MAC ID',
                ],
                rows: logs.map((r, i) => {
                  const count = r.changes
                    ? Object.keys(r.changes).length
                    : r.new_values
                      ? Object.keys(r.new_values).length
                      : 0;
                  return [
                    i + 1,
                    formatDateTime(r.created_at),
                    r.user_full_name ? `${r.user_full_name} (@${r.username})` : `@${r.username}`,
                    r.action_display || r.action,
                    r.app_label,
                    r.model_name,
                    r.object_id,
                    r.object_repr || '—',
                    count > 0 ? count : 0,
                    r.ip_address || '—',
                    r.mac_address || '—',
                  ];
                }),
              }}
            />
        </div>

        {/* Table Content */}
        <div className={`table-wrap ${loading && logs.length === 0 ? 'is-loading' : ''}`}>
          <table className="table table--audit">
            <thead>
              <tr>
                <th className="table__num">#</th>
                <th style={{ width: '165px' }}>Vaqt (Sana / Soat)</th>
                <th style={{ width: '210px' }}>Foydalanuvchi</th>
                <th style={{ width: '130px' }}>Harakat</th>
                <th style={{ width: '170px' }}>Model / Ilova</th>
                <th>Obyekt tavsifi</th>
                <th style={{ width: '190px', textAlign: 'center' }}>O‘zgartirilgan maydonlar soni(ta)</th>
                <th style={{ width: '175px' }}>Tarmoq / Qurilma</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="audit-empty-td">
                    <div className="audit-empty-state">
                      <div className="audit-empty-state__icon-wrap audit-empty-state__icon-wrap--loading">
                        <Loader2
                          size={28}
                          className="animate-spin"
                          color="var(--brand-600)"
                        />
                      </div>
                      <h4 className="audit-empty-state__title">Audit loglari yuklanmoqda...</h4>
                      <p className="audit-empty-state__desc">
                        Iltimos, kuting. Tizim amallari jurnali serverdan olinmoqda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="audit-empty-td">
                    <div className="audit-empty-state">
                      <div className="audit-empty-state__icon-wrap audit-empty-state__icon-wrap--error">
                        <AlertCircle size={28} color="#dc2626" />
                      </div>
                      <h4 className="audit-empty-state__title">Ma’lumotlarni yuklashda xatolik</h4>
                      <p className="audit-empty-state__desc">{error}</p>
                      <button
                        type="button"
                        className="audit-empty-state__btn"
                        onClick={reload}
                      >
                        <RefreshCw size={14} />
                        <span>Qayta urinish</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="audit-empty-td">
                    <div className="audit-empty-state">
                      {debouncedSearch || activeFilterCount > 0 ? (
                        <>
                          <div className="audit-empty-state__icon-wrap audit-empty-state__icon-wrap--filter">
                            <SearchX size={30} strokeWidth={1.8} color="var(--brand-600)" />
                          </div>
                          <h4 className="audit-empty-state__title">Audit loglari topilmadi</h4>
                          <p className="audit-empty-state__desc">
                            {debouncedSearch
                              ? `«${debouncedSearch}» qidiruv so‘rovi yoki tanlangan filtrlar bo‘yicha mos keluvchi yozuvlar topilmadi.`
                              : 'Tanlangan filtrlar bo‘yicha mos keluvchi audit yozuvlari mavjud emas.'}
                          </p>
                          <button
                            type="button"
                            className="audit-empty-state__btn"
                            onClick={handleResetFilters}
                          >
                            <RotateCcw size={14} />
                            <span>Filtrlarni tozalash</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="audit-empty-state__icon-wrap audit-empty-state__icon-wrap--empty">
                            <Inbox size={30} strokeWidth={1.8} color="var(--gray-400)" />
                          </div>
                          <h4 className="audit-empty-state__title">Audit loglari mavjud emas</h4>
                          <p className="audit-empty-state__desc">
                            Tizimda foydalanuvchilar tomonidan amalga oshirilgan harakatlar tarixi avtomatik shu yerda qayd etiladi.
                          </p>
                          <button
                            type="button"
                            className="audit-empty-state__btn"
                            onClick={reload}
                          >
                            <RefreshCw size={14} />
                            <span>Yangilash</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((row, index) => {
                  const changedCount = row.changes ? Object.keys(row.changes).length : 0;
                  return (
                    <tr
                      key={row.id}
                      className="clickable-row"
                      onClick={() => handleOpenDetail(row)}
                      title="Batafsil ko‘rish uchun bosing"
                    >
                      <td className="table__num">{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                            {formatDateTime(row.created_at).split(',')[0]}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} />
                            {formatDateTime(row.created_at).split(',')[1] || ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="audit-user">
                          <div className="audit-user__avatar">
                            {row.user_full_name
                              ? row.user_full_name.slice(0, 2).toUpperCase()
                              : row.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="audit-user__info">
                            <span className="audit-user__name">
                              {row.user_full_name || row.username}
                            </span>
                            <span className="audit-user__username">@{row.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>{renderActionBadge(row.action, row.action_display)}</td>
                      <td>
                        <span className="audit-model-tag" title={`Obyekt ID: ${row.object_id}`}>
                          <span className="audit-model-app">{row.app_label}.</span>
                          {row.model_name}
                        </span>
                      </td>
                      <td>
                        <span className="audit-obj-repr" title={row.object_repr}>
                          {row.object_repr || `ID: #${row.object_id}`}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--gray-800)' }}>
                        {changedCount}
                      </td>
                      <td>
                        <div className="audit-network">
                          <span className="audit-network__ip" title="IP manzil">
                            <Globe size={11} />
                            {row.ip_address || '—'}
                          </span>
                          {row.mac_address && (
                            <span className="audit-network__mac" title="MAC ID / Qurilma">
                              <Laptop size={11} />
                              {row.mac_address}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* Loading more spinner on scroll */}
          {loadingMore && (
            <div className="audit-scroll-loading">
              <Loader2 size={16} className="animate-spin" color="var(--brand-600)" />
              <span>Yana ma’lumotlar yuklanmoqda...</span>
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && logs.length > 0 && (
            <div className="audit-scroll-end">
              <span>Barcha {total} ta qayd ko‘rsatildi</span>
            </div>
          )}
        </div>

      {/* Filter Modal */}
      <AuditLogFilterModal
        open={filterModalOpen}
        value={filters}
        onApply={(f) => {
          setFilters(f);
          if (f.action) setSelectedAction(f.action as AuditAction);
        }}
        onClose={() => setFilterModalOpen(false)}
      />

      {/* Detail Modal */}
      <AuditLogDetailModal
        logId={selectedLog?.id ?? null}
        initialLog={selectedLog}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};
