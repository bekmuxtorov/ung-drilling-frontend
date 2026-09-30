import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ClipboardList, Clock, Loader2, Pencil, Plus, Search, Truck, X } from 'lucide-react';
import { ApiError } from '../../api/client';
import type { DailyWorkDescription } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { dailyTransportsApi, dailyWorksApi } from './api';
import { ActivityColumns, type DayActivity } from './charts';
import { DailyWorkFormModal, type DailyWorkFormValues } from './DailyWorkFormModal';
import { formatDate } from './utils';

const PAGE_SIZE = 15;
const pad = (n: number) => String(n).padStart(2, '0');

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

/** Mahalliy sana kaliti: YYYY-MM-DD */
const localDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const timeOf = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const relativeLabel = (day: string) => {
  const today = localDay(new Date().toISOString());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (day === today) return 'Bugun';
  if (day === localDay(y.toISOString())) return 'Kecha';
  return null;
};

interface DailyWorksSectionProps {
  operationId: number;
  onChanged: () => void;
  /** Operatsiyaning barcha hisobotlari (xulosa va grafik uchun) */
  allWorks: DailyWorkDescription[];
  allLoading: boolean;
}

/** Kunlik hisobotni va unga biriktirilgan transportlarni saqlash (transportlar farq bo'yicha sinxronlanadi) */
const saveDailyWork = async (operationId: number, record: DailyWorkDescription | null, values: DailyWorkFormValues) => {
  const body = { derrick_erection_operation: operationId, description: values.description.trim() };
  const saved = record ? await dailyWorksApi.update(record.id, body) : await dailyWorksApi.create(body);

  const existing = new Map((record?.transport_items ?? []).map((t) => [t.id, t]));
  const keptIds = new Set(values.transports.filter((r) => r.id).map((r) => r.id!));
  const tasks: Promise<unknown>[] = [];

  values.transports.forEach((row) => {
    const payload = {
      daily_work_description: saved.id,
      transport_type: Number(row.transport_type),
      count: Number(row.count) || 0,
      description: row.description.trim() || null,
    };
    const prev = row.id ? existing.get(row.id) : undefined;
    if (!prev) tasks.push(dailyTransportsApi.create(payload));
    else if (
      String(prev.transport_type?.id) !== row.transport_type ||
      prev.count !== payload.count ||
      (prev.description ?? null) !== payload.description
    )
      tasks.push(dailyTransportsApi.update(prev.id, payload));
  });
  existing.forEach((_, id) => {
    if (!keptIds.has(id)) tasks.push(dailyTransportsApi.remove(id));
  });

  const results = await Promise.allSettled(tasks);
  const failed = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
  if (failed) {
    const reason = failed.reason;
    throw new PartialSaveError(
      `Hisobot saqlandi, lekin ayrim transportlarni saqlab bo'lmadi. ${reason instanceof ApiError ? reason.message : ''}`,
      await dailyWorksApi.retrieve(saved.id).catch(() => saved),
    );
  }
};

/** Hisobot saqlangan, ammo transportlarning bir qismi saqlanmagan holat */
class PartialSaveError extends ApiError {
  record: DailyWorkDescription;
  constructor(message: string, record: DailyWorkDescription) {
    super(0, message);
    this.record = record;
  }
}

export const DailyWorksSection: React.FC<DailyWorksSectionProps> = ({ operationId, onChanged, allWorks, allLoading }) => {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DailyWorkDescription[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyWorkDescription | null>(null);
  const [deleting, setDeleting] = useState<DailyWorkDescription | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim());
  const params = useMemo(
    () => ({
      derrick_erection_operation: operationId,
      search: debouncedSearch || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [operationId, debouncedSearch, dateFrom, dateTo],
  );
  const hasFilters = !!(debouncedSearch || dateFrom || dateTo);
  const singleDay = dateFrom && dateFrom === dateTo ? dateFrom : undefined;

  // Filtr yoki ma'lumot o'zgarsa — boshidan
  useEffect(() => {
    setPage(1);
  }, [params, reloadToken]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    dailyWorksApi
      .list({ page, page_size: PAGE_SIZE, ...params }, controller.signal)
      .then((res) => {
        setItems((prev) => (page === 1 ? res.results : [...prev, ...res.results]));
        setTotal(res.count);
        setHasMore(!!res.next);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklab bo'lmadi");
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [page, params, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
    onChanged();
  }, [onChanged]);

  const handleSubmit = async (values: DailyWorkFormValues) => {
    try {
      await saveDailyWork(operationId, editing, values);
    } catch (err) {
      // Qayta urinishda dublikat bo'lmasligi uchun forma serverdagi holatga o'tadi
      if (err instanceof PartialSaveError) setEditing(err.record);
      throw err;
    } finally {
      setReloadToken((t) => t + 1);
    }
    notify('success', editing ? 'Hisobot yangilandi' : "Hisobot qo'shildi");
    setFormOpen(false);
    setEditing(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await dailyWorksApi.remove(deleting.id);
      notify('success', "Hisobot o'chirildi");
      setDeleting(null);
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (err) {
      notify('error', "O'chirib bo'lmadi", err instanceof ApiError ? err.message : undefined);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ---------- Xulosa (barcha hisobotlar bo'yicha) ---------- */
  const summary = useMemo(() => {
    const byDay = new Map<string, DayActivity>();
    let units = 0;
    allWorks.forEach((w) => {
      const key = localDay(w.created_at);
      const row = byDay.get(key) ?? { date: key, units: 0, reports: 0 };
      const u = w.transport_items.reduce((s, t) => s + t.count, 0);
      row.units += u;
      row.reports += 1;
      units += u;
      byDay.set(key, row);
    });
    const latest = allWorks.reduce<string | null>((m, w) => (!m || w.created_at > m ? w.created_at : m), null);
    return { days: [...byDay.values()], units, activeDays: byDay.size, latest };
  }, [allWorks]);

  /* ---------- Sana bo'yicha guruhlash ---------- */
  const groups = useMemo(() => {
    const map = new Map<string, DailyWorkDescription[]>();
    items.forEach((r) => {
      const k = localDay(r.created_at);
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return [...map.entries()];
  }, [items]);

  const openEdit = (row: DailyWorkDescription) => {
    setEditing(row);
    setFormOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const dateInput = (value: string, onChange: (v: string) => void, placeholder: string, extra: React.InputHTMLAttributes<HTMLInputElement>) => (
    <span className="date-wrap">
      <input type="date" className={`input ${value ? '' : 'input--empty'}`} value={value} onChange={(e) => onChange(e.target.value)} {...extra} />
      <span className="date-ph">{placeholder}</span>
    </span>
  );

  const stats = [
    { icon: ClipboardList, label: 'Jami hisobotlar', value: allWorks.length },
    { icon: CalendarDays, label: 'Faol kunlar', value: summary.activeDays },
    { icon: Truck, label: 'Transport birliklari', value: summary.units },
    { icon: Clock, label: 'Oxirgi hisobot', value: summary.latest ? formatDate(localDay(summary.latest)) : '—' },
  ];

  return (
    <section className="section daily">
      {/* Xulosa va faollik grafigi */}
      {allWorks.length > 0 && (
        <div className="daily__summary">
          <dl className="daily__stats">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="daily__stat">
                <dt>
                  <Icon size={13} />
                  {label}
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="daily__chart">
            <div className="daily__chart-head">
              <span>Kunlik jalb qilingan transport</span>
              <small>{singleDay ? 'Qayta bosib bekor qiling' : 'Ustun — kun filtri'}</small>
            </div>
            <ActivityColumns
              data={summary.days}
              selected={singleDay}
              onSelect={(d) => {
                if (singleDay === d) {
                  setDateFrom('');
                  setDateTo('');
                } else {
                  setDateFrom(d);
                  setDateTo(d);
                }
              }}
            />
          </div>
        </div>
      )}
      {allLoading && !allWorks.length && <div className="daily__summary daily__summary--loading" />}

      {/* Asboblar paneli */}
      <div className="toolbar toolbar--compact">
        <div className="search-input">
          <Search size={14} className="search-input__icon" />
          <input className="input" placeholder="Tavsif bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="date-range">
          {dateInput(dateFrom, setDateFrom, 'Sanadan', { max: dateTo || undefined, 'aria-label': 'Sanadan' })}
          <span className="range-inputs__sep">—</span>
          {dateInput(dateTo, setDateTo, 'Sanagacha', { min: dateFrom || undefined, 'aria-label': 'Sanagacha' })}
        </div>
        {hasFilters && (
          <button type="button" className="icon-btn icon-btn--bordered" onClick={clearFilters} title="Filtrlarni tozalash" aria-label="Filtrlarni tozalash">
            <X size={15} />
          </button>
        )}
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
          Hisobot qo'shish
        </button>
      </div>

      {hasFilters && !loading && !error && items.length > 0 && (
        <div className="daily__found">
          Filtr bo'yicha <strong>{total}</strong> ta hisobot topildi
        </div>
      )}

      {/* Vaqt shkalasi */}
      <div className={`tl ${loading && page === 1 && items.length ? 'is-loading' : ''}`}>
        {loading && !items.length && (
          <div className="table__state">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
        {!loading && error && (
          <div className="table__state">
            {error}{' '}
            <button type="button" className="link-btn" onClick={() => setReloadToken((t) => t + 1)}>
              Qayta urinish
            </button>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="daily__empty">
            <ClipboardList size={22} />
            <strong>{hasFilters ? 'Hech narsa topilmadi' : 'Kunlik hisobotlar hali kiritilmagan'}</strong>
            <span>{hasFilters ? "Qidiruv yoki sana oralig'ini o'zgartirib ko'ring" : "Birinchi hisobotni qo'shish uchun yuqoridagi tugmani bosing"}</span>
          </div>
        )}

        {!error &&
          groups.map(([day, rows]) => {
            const d = new Date(`${day}T00:00:00`);
            const rel = relativeLabel(day);
            const units = rows.reduce((s, r) => s + r.transport_items.reduce((a, t) => a + t.count, 0), 0);
            return (
              <div key={day} className="tl-day">
                <div className="tl-day__badge" aria-hidden>
                  <strong>{d.getDate()}</strong>
                  <span>{MONTHS_SHORT[d.getMonth()]}</span>
                </div>
                <div className="tl-day__content">
                  <div className="tl-day__head">
                    <span className="tl-day__title">
                      {d.getDate()}-{MONTHS[d.getMonth()]}, {d.getFullYear()}
                      <span className="tl-day__weekday">· {WEEKDAYS[d.getDay()]}</span>
                      {rel && <span className="tl-day__rel">{rel}</span>}
                    </span>
                    <span className="tl-day__meta">
                      {rows.length} ta hisobot{units > 0 && ` · ${units} ta transport`}
                    </span>
                  </div>
                  <div className="tl-day__items">
                    {rows.map((row) => (
                      <article
                        key={row.id}
                        className="tl-item"
                        tabIndex={0}
                        onClick={() => openEdit(row)}
                        onKeyDown={(e) => e.key === 'Enter' && openEdit(row)}
                      >
                        <time className="tl-item__time">{timeOf(row.created_at)}</time>
                        <div className="tl-item__body">
                          <p className="tl-item__text">{row.description}</p>
                          {row.transport_items.length > 0 && (
                            <div className="tl-item__chips">
                              {row.transport_items.map((t) => (
                                <span key={t.id} className="t-chip" title={t.description ?? undefined}>
                                  <Truck size={12} />
                                  <span className="t-chip__name">{t.transport_type?.name}</span>
                                  <span className="t-chip__count">{t.count}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Pencil size={14} className="tl-item__edit" aria-hidden />
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {items.length > 0 && (
        <div className="daily__more">
          <span>
            {items.length} / {total} ta hisobot ko'rsatilmoqda
          </span>
          {hasMore && (
            <button type="button" className="btn btn--outline" disabled={loading} onClick={() => setPage((p) => p + 1)}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
              Ko'proq yuklash
            </button>
          )}
        </div>
      )}

      <DailyWorkFormModal
        open={formOpen}
        hidden={!!deleting}
        record={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        onDelete={setDeleting}
      />

      <ConfirmDialog
        open={!!deleting}
        loading={deleteLoading}
        title="Kunlik hisobotni o'chirmoqchimisiz?"
        warning={deleting?.transport_items.length ? "Unga biriktirilgan transportlar ham o'chiriladi." : undefined}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
};
