import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  Calendar,
  Cog,
  FileText,
  Gauge,
  Layers,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  User,
} from 'lucide-react';
import { ApiError } from '../../api/client';
import type { DrillingBPADetail } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { drillingBpaApi } from './api';
import { AvailableResourcesSection } from './AvailableResourcesSection';
import { DailyWorksBPASection } from './DailyWorksBPASection';
import { DepthsLayersSection } from './DepthsLayersSection';
import { DrillingBPAFormModal } from './DrillingBPAFormModal';
import { WellDesignsInLengthSection } from './WellDesignsInLengthSection';
import { WellDesignsSection } from './WellDesignsSection';
import { calcProgress, formatDate, formatNumber } from './utils';
import { tr } from '../../i18n';

interface DrillingDetailPageProps {
  id: number;
  onBack: () => void;
}

export const DrillingDetailPage: React.FC<DrillingDetailPageProps> = ({ id, onBack }) => {
  const { notify } = useToast();
  const [bpa, setBpa] = useState<DrillingBPADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      drillingBpaApi
        .retrieve(id, signal)
        .then((res) => {
          setBpa(res);
          setError(null);
        })
        .catch((err) => {
          if (signal?.aborted) return;
          setError(err instanceof ApiError ? err.message : tr("Ma'lumotlarni yuklab bo'lmadi"));
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

  const handleUpdatePassport = async (payload: Record<string, unknown>) => {
    await drillingBpaApi.update(id, payload);
    notify('success', tr('BPA pasporti yangilandi'), String(payload.well_number || ''));
    setFormOpen(false);
    load();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await drillingBpaApi.remove(id);
      notify('success', tr('BPA hujjati o‘chirildi'), bpa?.well_number);
      onBack();
    } catch (err) {
      notify('error', tr('O‘chirib bo‘lmadi'), err instanceof ApiError ? err.message : undefined);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-state page-state--center">
        <Loader2 size={32} className="animate-spin text-brand" />
        <span>{tr("Burg'ilash hujjati yuklanmoqda...")}</span>
      </div>
    );
  }

  if (error || !bpa) {
    return (
      <div className="page-state page-state--center">
        <AlertCircle size={32} className="text-danger" />
        <h3 className="page-state__title">{tr('Xatolik')}</h3>
        <p className="page-state__desc">{error || tr('Hujjat topilmadi')}</p>
        <button type="button" className="btn btn--outline" onClick={onBack}>
          <ArrowLeft size={14} />
          {tr('Ro‘yxatga qaytish')}</button>
      </div>
    );
  }

  const currentDepth = bpa.current_depth ?? bpa.current_dept ?? 0;
  const depthPlan = bpa.depth_plan ?? 0;
  const remainingDepth = Math.max(0, depthPlan - currentDepth);
  const progress = calcProgress(currentDepth, depthPlan);

  return (
    <div className="drilling-detail-page">
      {/* Top Header */}
      <div className="doc-header">
        <div className="doc-header__left">
          <div className="doc-title-group">
            <div className="doc-title-row">
              <span className="doc-type-badge">
                <FileText size={13} />
                {tr('BPA Hujjati')}</span>
              <h1 className="doc-title">
                {bpa.number ? `№ ${bpa.number} — ` : ''}{tr('Quduq')}{' '}{bpa.well_number}
              </h1>
            </div>
            <div className="doc-meta-row">
              {bpa.area && (
                <span className="doc-meta-tag">
                  <MapPin size={12} />
                  {bpa.area.name}
                </span>
              )}
              {bpa.enterprise && (
                <span className="doc-meta-tag">
                  <Building2 size={12} />
                  {bpa.enterprise.name}
                </span>
              )}
              {bpa.machine_type && (
                <span className="doc-meta-tag">
                  <Cog size={12} />
                  {bpa.machine_type.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="doc-header__right">
          <button type="button" className="btn btn--outline" onClick={() => setFormOpen(true)}>
            <Pencil size={14} />
            {tr('Tahrirlash')}</button>
          <button
            type="button"
            className="btn btn--outline btn--danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} />
            {tr('O‘chirish')}</button>
        </div>
      </div>

      {/* Passport Summary Banner Card — Kompakt Gorizontal Uslub */}
      <div className="bpa-passport-card bpa-passport-card--compact">
        {/* 1-qavat: Pasport rekvizitlari gorizontal paneli */}
        <div className="passport-meta-strip">
          <div className="passport-chip" title={bpa.enterprise?.name || ''}>
            <div className="passport-chip__icon passport-chip__icon--blue">
              <Building2 size={14} />
            </div>
            <div className="passport-chip__content">
              <span className="passport-chip__label">{tr('Tashkilot')}</span>
              <span className="passport-chip__val">{bpa.enterprise?.name || '—'}</span>
            </div>
          </div>

          <div
            className="passport-chip"
            title={`${bpa.area?.name || ''}${bpa.area?.region ? ` (${bpa.area.region.name})` : ''}`}
          >
            <div className="passport-chip__icon passport-chip__icon--emerald">
              <MapPin size={14} />
            </div>
            <div className="passport-chip__content">
              <span className="passport-chip__label">{tr('Maydon / Kon')}</span>
              <span className="passport-chip__val">
                {bpa.area?.name || '—'}
                {bpa.area?.region ? ` (${bpa.area.region.name})` : ''}
              </span>
            </div>
          </div>

          <div className="passport-chip" title={bpa.employee?.name || ''}>
            <div className="passport-chip__icon passport-chip__icon--purple">
              <User size={14} />
            </div>
            <div className="passport-chip__content">
              <span className="passport-chip__label">{tr('Supervayzer')}</span>
              <span className="passport-chip__val">{bpa.employee?.name || '—'}</span>
            </div>
          </div>

          <div className="passport-chip" title={bpa.machine_type?.name || ''}>
            <div className="passport-chip__icon passport-chip__icon--amber">
              <Cog size={14} />
            </div>
            <div className="passport-chip__content">
              <span className="passport-chip__label">{tr('Dastgoh')}</span>
              <span className="passport-chip__val">{bpa.machine_type?.name || '—'}</span>
            </div>
          </div>

          <div className="passport-chip" title={formatDate(bpa.drilling_start_date)}>
            <div className="passport-chip__icon passport-chip__icon--cyan">
              <Calendar size={14} />
            </div>
            <div className="passport-chip__content">
              <span className="passport-chip__label">{tr('Boshlangan sana')}</span>
              <span className="passport-chip__val">{formatDate(bpa.drilling_start_date)}</span>
            </div>
          </div>
        </div>

        <div className="passport-divider" />

        {/* 2-qavat: Chuqurlik telemetriyasi va Progress integratsiyasi */}
        <div className="passport-telemetry-row">
          <div className="telemetry-kpi telemetry-kpi--plan">
            <div className="telemetry-kpi__icon">
              <ArrowDownToLine size={16} />
            </div>
            <div className="telemetry-kpi__body">
              <span className="telemetry-kpi__label">{tr('Chuqurlik (Plan)')}</span>
              <span className="telemetry-kpi__val">
                <strong>{depthPlan ? formatNumber(depthPlan, 0) : '—'}</strong> <small>{tr('m')}</small>
              </span>
            </div>
          </div>

          <div className="telemetry-kpi telemetry-kpi--fact">
            <div className="telemetry-kpi__icon">
              <Gauge size={16} />
            </div>
            <div className="telemetry-kpi__body">
              <span className="telemetry-kpi__label">{tr('Chuqurlik (Fakt)')}</span>
              <span className="telemetry-kpi__val">
                <strong>{formatNumber(currentDepth, 1)}</strong> <small>{tr('m')}</small>
              </span>
            </div>
          </div>

          <div className="telemetry-kpi telemetry-kpi--remain">
            <div className="telemetry-kpi__icon">
              <Layers size={16} />
            </div>
            <div className="telemetry-kpi__body">
              <span className="telemetry-kpi__label">{tr('Qolgan masofa')}</span>
              <span className="telemetry-kpi__val">
                <strong>{depthPlan > 0 ? formatNumber(remainingDepth, 1) : '—'}</strong> <small>{tr('m')}</small>
              </span>
            </div>
          </div>

          <div className="telemetry-kpi telemetry-kpi--progress">
            <div className="telemetry-progress__header">
              <span className="telemetry-kpi__label">{tr("O'tish progressi")}</span>
              <span className="telemetry-progress__pct">{formatNumber(progress, 1)}%</span>
            </div>
            <div className="telemetry-progress__track">
              <div
                className="telemetry-progress__bar"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hujjat bo'limlari — bitta sahifada ketma-ket */}
      <div className="doc-sections">
        <section className="doc-section-card">
          <WellDesignsSection drillingBpaId={bpa.id} designs={bpa.well_designs || []} onChanged={load} />
        </section>
        <section className="doc-section-card">
          <WellDesignsInLengthSection drillingBpaId={bpa.id} items={bpa.well_designs_in_length || []} onChanged={load} />
        </section>
        <section className="doc-section-card">
          <DepthsLayersSection drillingBpaId={bpa.id} layers={bpa.depths_layers_lengths || []} onChanged={load} />
        </section>
        <section className="doc-section-card">
          <DailyWorksBPASection drillingBpaId={bpa.id} works={bpa.daily_works || []} onChanged={load} />
        </section>
        <section className="doc-section-card">
          <AvailableResourcesSection drillingBpaId={bpa.id} resources={bpa.available_resources || []} onChanged={load} />
        </section>
      </div>

      {/* Edit Passport Modal */}
      <DrillingBPAFormModal
        open={formOpen}
        bpa={bpa}
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpdatePassport}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        loading={deleteLoading}
        title={tr('BPA hujjatini o‘chirmoqchimisiz?')}
        warning={tr("Ushbu amal qaytarilmaydi. Ushbu pasportga biriktirilgan barcha quduq konstruksiyalari, o'tish dinamikalari, kunlik hisobotlar va resurs ma'lumotlari ham o'chiriladi.")}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
};
