import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Loader2, MapPin, Pencil, Phone } from 'lucide-react';
import { ApiError } from '../../api/client';
import type { DailyWorkDescription, DerrickErectionOperation } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { formatDateTimeShort } from '../references/format';
import { dailyWorksApi, operationsApi } from './api';
import { CompletionRing, StageGantt, TransportBars, type TransportTotal } from './charts';
import { StageStatusBadge } from './components';
import { DailyWorksSection } from './DailyWorksSection';
import { OperationFormModal } from './OperationFormModal';
import { StagesSection } from './StagesSection';
import { STAGE_LABELS, STAGE_ORDER, formatDate, formatDecimal, stagesByType } from './utils';
import { tr } from '../../i18n';

interface OperationDetailPageProps {
  id: number;
  onBack: () => void;
}

type Tab = 'stages' | 'daily';

/** Operatsiyaning barcha kunlik hisobotlari (grafiklar va xulosa uchun) */
const useOperationWorks = (operationId: number, token: number) => {
  const [state, setState] = useState<{ works: DailyWorkDescription[]; loading: boolean }>({ works: [], loading: true });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const works: DailyWorkDescription[] = [];
      for (let page = 1; page <= 20; page += 1) {
        const res = await dailyWorksApi.list(
          { derrick_erection_operation: operationId, page, page_size: 200 },
          controller.signal,
        );
        works.push(...res.results);
        if (!res.next) break;
      }
      setState({ works, loading: false });
    })().catch(() => !controller.signal.aborted && setState({ works: [], loading: false }));
    return () => controller.abort();
  }, [operationId, token]);

  return state;
};

/** Transportlarni turi bo'yicha jamlash */
const totalsByType = (works: DailyWorkDescription[]): TransportTotal[] => {
  const map = new Map<string, TransportTotal>();
  works.forEach((w) =>
    w.transport_items.forEach((t) => {
      const name = t.transport_type?.name ?? '—';
      const row = map.get(name) ?? { name, count: 0, reports: 0 };
      row.count += t.count;
      row.reports += 1;
      map.set(name, row);
    }),
  );
  return [...map.values()];
};

export const OperationDetailPage: React.FC<OperationDetailPageProps> = ({ id, onBack }) => {
  const { notify } = useToast();
  const [operation, setOperation] = useState<DerrickErectionOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [tab, setTab] = useState<Tab>('stages');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dataToken, setDataToken] = useState(0);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLSpanElement>(null);

  // Sarlavha qotib qolganini aniqlash (soya/chiziq ko'rsatish uchun)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: '-49px 0px 0px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [operation !== null]);

  const worksState = useOperationWorks(id, dataToken);
  const transports = useMemo(
    () => ({ data: totalsByType(worksState.works), loading: worksState.loading }),
    [worksState],
  );

  const load = useCallback(
    (signal?: AbortSignal) => {
      operationsApi
        .retrieve(id, signal)
        .then((res) => {
          setOperation(res);
          setError(null);
        })
        .catch((err) => {
          if (signal?.aborted) return;
          setError(
            err instanceof ApiError
              ? { status: err.status, message: err.message }
              : { status: 0, message: tr("Ma'lumotlarni yuklab bo'lmadi") },
          );
        })
        .finally(() => !signal?.aborted && setLoading(false));
    },
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => {
    load();
    setDataToken((t) => t + 1);
  }, [load]);

  const handleUpdate = async (payload: Record<string, unknown>) => {
    const updated = await operationsApi.update(id, payload);
    setOperation(updated);
    notify('success', tr("O'zgarishlar saqlandi"));
    setFormOpen(false);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await operationsApi.remove(id);
      notify('success', tr("Operatsiya o'chirildi"));
      onBack();
    } catch (err) {
      notify('error', tr("O'chirib bo'lmadi"), err instanceof ApiError ? err.message : undefined);
      setDeleteLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!operation) return null;
    const factDays = operation.stages.reduce((s, st) => s + (st.fact_days || 0), 0);
    const stagePlan = operation.stages.reduce((s, st) => s + (st.plan_days || 0), 0);
    return { factDays, stagePlan };
  }, [operation]);

  if (loading && !operation) {
    return (
      <div className="placeholder">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (error && !operation) {
    return (
      <div className="placeholder">
        <AlertTriangle size={28} />
        <h3>{error.status === 404 ? tr('Operatsiya topilmadi') : tr("Ma'lumotlarni yuklab bo'lmadi")}</h3>
        <p>{error.status === 404 ? tr("U o'chirilgan yoki mavjud emas") : error.message}</p>
        <button type="button" className="btn btn--outline" onClick={onBack}>
          <ArrowLeft size={14} />
          {tr("Ro'yxatga qaytish")}</button>
      </div>
    );
  }

  if (!operation || !summary) return null;
  const op = operation;
  const stageMap = stagesByType(op.stages);
  const totalVehicles = transports.data.reduce((s, t) => s + t.count, 0);

  const kpis: { label: string; value: React.ReactNode; hint?: string }[] = [
    { label: tr('Masofa'), value: <>{formatDecimal(op.distance_km)} <small>{tr('km')}</small></> },
    { label: tr('Rejadagi muddat'), value: <>{op.plan_days} <small>{tr('kun')}</small></> },
    {
      label: tr('Sarflangan (fakt)'),
      value: <>{summary.factDays} <small>{tr('kun')}</small></>
    },
    { label: tr('Ishchilar soni'), value: op.number_employees },
    { label: tr("Burg'ulash sanasi"), value: formatDate(op.expected_drilling_date) },
    { label: tr('Kunlik hisobotlar'), value: op.daily_works_count },
  ];

  return (
    <div className="op-detail">
      {/* Sarlavha */}
      {/* Scroll paytida sarlavha qatori topbar ostida qotib turadi */}
      <span ref={sentinelRef} className="op-detail__sentinel" aria-hidden />
      <div className={`op-detail__head ${stuck ? 'is-stuck' : ''}`}>
        <div className="op-detail__titles">
          <h1 className="op-detail__title">
            №{op.from_well_number} <span className="op-detail__arrow">→</span> №{op.to_well_number}
          </h1>
          <p className="op-detail__sub">
            {op.enterprise?.name} · {op.drilling_rig_type?.name} {tr('· ID')}{' '}{op.id}
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
          <Pencil size={14} />
          {tr('Tahrirlash')}</button>
      </div>

      <div className="op-layout">
        {/* ---------- Chap ustun ---------- */}
        <div className="op-layout__main">
          {/* Umumiy holat */}
          <section className="card overview">
            <div className="overview__ring">
              <CompletionRing value={op.completion_percentage} />
              <span className="overview__ring-label">{tr('Bajarilish')}</span>
            </div>
            <dl className="overview__kpis">
              {kpis.map((k) => (
                <div key={k.label} className="kpi">
                  <dt>{k.label}</dt>
                  <dd>{k.value}</dd>
                  {k.hint && <span className="kpi__hint">{k.hint}</span>}
                </div>
              ))}
            </dl>
          </section>

          {/* Bosqichlar grafigi */}
          <section className="card">
            <div className="card__head">
              <h3 className="card__title">{tr('Bosqichlar grafigi')}</h3>
              <div className="stage-chips">
                {STAGE_ORDER.map((t) => (
                  <span key={t} className="stage-chip">
                    {STAGE_LABELS[t]}
                    <StageStatusBadge stage={stageMap.get(t)} />
                  </span>
                ))}
              </div>
            </div>
            <StageGantt stages={op.stages} />
          </section>

          {/* Tablar */}
          <section className="card card--flush">
            <div className="tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'stages'}
                className={`tabs__item ${tab === 'stages' ? 'is-active' : ''}`}
                onClick={() => setTab('stages')}
              >
                {tr('Bosqichlar')}<span className="tabs__count">{op.stages.length}/3</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'daily'}
                className={`tabs__item ${tab === 'daily' ? 'is-active' : ''}`}
                onClick={() => setTab('daily')}
              >
                {tr('Kunlik hisobotlar')}<span className="tabs__count">{op.daily_works_count}</span>
              </button>
            </div>
            <div className="card__body">
              {tab === 'stages' ? (
                <StagesSection operationId={op.id} stages={op.stages} onChanged={refresh} />
              ) : (
                <DailyWorksSection
                  operationId={op.id}
                  onChanged={refresh}
                  allWorks={worksState.works}
                  allLoading={worksState.loading}
                />
              )}
            </div>
          </section>
        </div>

        {/* ---------- O'ng ustun ---------- */}
        <aside className="op-layout__side">
          <section className="card">
            <h3 className="card__title">{tr("Yo'nalish")}</h3>
            <ol className="route-v">
              <li className="route-v__point">
                <span className="route-v__dot" />
                <span className="route-v__label">{tr('Qayerdan')}</span>
                <strong>{tr('Quduq №')}{op.from_well_number}</strong>
                <span className="route-v__area">
                  <MapPin size={12} />
                  {op.from_area?.name}
                  {op.from_area?.region?.name && ` · ${op.from_area.region.name}`}
                </span>
              </li>
              <li className="route-v__distance">{formatDecimal(op.distance_km)} {tr('km')}</li>
              <li className="route-v__point">
                <span className="route-v__dot route-v__dot--end" />
                <span className="route-v__label">{tr('Qayerga')}</span>
                <strong>{tr('Quduq №')}{op.to_well_number}</strong>
                <span className="route-v__area">
                  <MapPin size={12} />
                  {op.to_area?.name}
                  {op.to_area?.region?.name && ` · ${op.to_area.region.name}`}
                </span>
              </li>
            </ol>
          </section>

          <section className="card">
            <h3 className="card__title">{tr("Ma'lumotlar")}</h3>
            <dl className="facts">
              <div>
                <dt>{tr('Korxona')}</dt>
                <dd>{op.enterprise?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>{tr("Burg'ulash uskunasi")}</dt>
                <dd>{op.drilling_rig_type?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>{tr('Prorab')}</dt>
                <dd>
                  {op.foreman?.name ?? '—'}
                  {op.foreman?.phone && (
                    <a className="facts__phone" href={`tel:${op.foreman.phone.replace(/[^\d+]/g, '')}`}>
                      <Phone size={12} />
                      {op.foreman.phone}
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt>{tr('Oxirgi yangilanish')}</dt>
                <dd>{formatDateTimeShort(op.updated_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <h3 className="card__title">{tr('Bajarilayotgan ish')}</h3>
            <p className="card__text">{op.work_description || tr('Tavsif kiritilmagan')}</p>
            {op.delay_reason && (
              <div className="delay-note">
                <span className="delay-note__title">
                  <AlertTriangle size={13} />
                  {tr('Kechikish sababi')}</span>
                <p>{op.delay_reason}</p>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card__head">
              <h3 className="card__title">{tr('Jalb qilingan transport')}</h3>
              {totalVehicles > 0 && <span className="card__meta">{tr('jami {0} ta', totalVehicles)}</span>}
            </div>
            {transports.loading ? (
              <div className="chart-empty">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : transports.data.length ? (
              <TransportBars data={transports.data} />
            ) : (
              <p className="chart-empty">{tr('Kunlik hisobotlarda transport qayd etilmagan')}</p>
            )}
          </section>
        </aside>
      </div>

      <OperationFormModal
        open={formOpen}
        hidden={deleteOpen}
        record={op}
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpdate}
        onDelete={() => setDeleteOpen(true)}
      />

      <ConfirmDialog
        open={deleteOpen}
        loading={deleteLoading}
        title={tr("Operatsiyani o'chirmoqchimisiz?")}
        warning={tr("Operatsiyaga tegishli barcha bosqichlar va kunlik hisobotlar ham o'chiriladi.")}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
};
