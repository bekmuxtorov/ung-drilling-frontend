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

interface DrillingDetailPageProps {
  id: number;
  onBack: () => void;
}

type TabKey = 'designs' | 'dynamics' | 'layers' | 'daily' | 'resources';

export const DrillingDetailPage: React.FC<DrillingDetailPageProps> = ({ id, onBack }) => {
  const { notify } = useToast();
  const [bpa, setBpa] = useState<DrillingBPADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('designs');

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeProp, setActiveProp] = useState<string | null>(null);

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
          setError(err instanceof ApiError ? err.message : "Ma'lumotlarni yuklab bo'lmadi");
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
    notify('success', 'BPA pasporti yangilandi', String(payload.well_number || ''));
    setFormOpen(false);
    load();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await drillingBpaApi.remove(id);
      notify('success', 'BPA hujjati o‘chirildi', bpa?.well_number);
      onBack();
    } catch (err) {
      notify('error', 'O‘chirib bo‘lmadi', err instanceof ApiError ? err.message : undefined);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-state page-state--center">
        <Loader2 size={32} className="animate-spin text-brand" />
        <span>Burg'ilash hujjati yuklanmoqda...</span>
      </div>
    );
  }

  if (error || !bpa) {
    return (
      <div className="page-state page-state--center">
        <AlertCircle size={32} className="text-danger" />
        <h3 className="page-state__title">Xatolik</h3>
        <p className="page-state__desc">{error || "Hujjat topilmadi"}</p>
        <button type="button" className="btn btn--outline" onClick={onBack}>
          <ArrowLeft size={14} />
          Ro‘yxatga qaytish
        </button>
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
                BPA Hujjati
              </span>
              <h1 className="doc-title">
                {bpa.number ? `№ ${bpa.number} — ` : ''}Quduq {bpa.well_number}
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
            Tahrirlash
          </button>
          <button
            type="button"
            className="btn btn--outline btn--danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} />
            O‘chirish
          </button>
        </div>
      </div>

      {/* Passport Summary Banner Card */}
      <div className="bpa-passport-card">
        <div className="passport-grid">
          {/* Col 1: Attributes */}
          <div className="passport-col passport-col--details">
            <h3 className="passport-section-title">Pasport rekvizitlari</h3>
            <div className="passport-details-list">
              <div
                className={`passport-prop ${activeProp === 'enterprise' ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveProp('enterprise')}
                onMouseLeave={() => setActiveProp(null)}
              >
                <span className="passport-prop__label">
                  <Building2 size={13} />
                  Tashkilot:
                </span>
                <span className="passport-prop__val">{bpa.enterprise?.name || '—'}</span>
              </div>
              <div
                className={`passport-prop ${activeProp === 'area' ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveProp('area')}
                onMouseLeave={() => setActiveProp(null)}
              >
                <span className="passport-prop__label">
                  <MapPin size={13} />
                  Maydon / Kon:
                </span>
                <span className="passport-prop__val">
                  {bpa.area?.name || '—'}
                  {bpa.area?.region ? ` (${bpa.area.region.name})` : ''}
                </span>
              </div>
              <div
                className={`passport-prop ${activeProp === 'employee' ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveProp('employee')}
                onMouseLeave={() => setActiveProp(null)}
              >
                <span className="passport-prop__label">
                  <User size={13} />
                  Mas'ul muhandis:
                </span>
                <span className="passport-prop__val">{bpa.employee?.name || '—'}</span>
              </div>
              <div
                className={`passport-prop ${activeProp === 'machine' ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveProp('machine')}
                onMouseLeave={() => setActiveProp(null)}
              >
                <span className="passport-prop__label">
                  <Cog size={13} />
                  Burg'ilash dastgohi:
                </span>
                <span className="passport-prop__val">{bpa.machine_type?.name || '—'}</span>
              </div>
              <div
                className={`passport-prop ${activeProp === 'start_date' ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveProp('start_date')}
                onMouseLeave={() => setActiveProp(null)}
              >
                <span className="passport-prop__label">
                  <Calendar size={13} />
                  Boshlangan sana:
                </span>
                <span className="passport-prop__val">{formatDate(bpa.drilling_start_date)}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Depth Progress Cards */}
          <div className="passport-col passport-col--depths">
            <h3 className="passport-section-title">Chuqurlik ko‘rsatkichlari</h3>
            <div className="depth-kpi-grid">
              <div className="depth-kpi depth-kpi--plan">
                <span className="depth-kpi__icon">
                  <ArrowDownToLine size={16} />
                </span>
                <span className="depth-kpi__label">Chuqurlik(Plan)</span>
                <span className="depth-kpi__val">{depthPlan ? `${formatNumber(depthPlan, 0)} m` : '—'}</span>
              </div>

              <div className="depth-kpi depth-kpi--current">
                <span className="depth-kpi__icon">
                  <Gauge size={16} />
                </span>
                <span className="depth-kpi__label">Chuqurlik(Fakt)</span>
                <span className="depth-kpi__val">{formatNumber(currentDepth, 1)} m</span>
              </div>

              <div className="depth-kpi depth-kpi--remain">
                <span className="depth-kpi__icon">
                  <Layers size={16} />
                </span>
                <span className="depth-kpi__label">Qolgan masofa</span>
                <span className="depth-kpi__val">
                  {depthPlan > 0 ? `${formatNumber(remainingDepth, 1)} m` : '—'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="depth-progress-box">
              <div className="depth-progress-box__head">
                <span>O'tish progressi:</span>
                <strong>{formatNumber(progress, 1)}%</strong>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Sub-Sections (Tabs) */}
      <div className="doc-tabs-card">
        <div className="doc-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'designs'}
            className={`doc-tab-btn ${tab === 'designs' ? 'is-active' : ''}`}
            onClick={() => setTab('designs')}
          >
            <span>Quduq konstruksiyasi</span>
            <span className="doc-tab-badge">{bpa.well_designs?.length ?? 0}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'dynamics'}
            className={`doc-tab-btn ${tab === 'dynamics' ? 'is-active' : ''}`}
            onClick={() => setTab('dynamics')}
          >
            <span>O‘tish dinamikasi</span>
            <span className="doc-tab-badge">{bpa.well_designs_in_length?.length ?? 0}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'layers'}
            className={`doc-tab-btn ${tab === 'layers' ? 'is-active' : ''}`}
            onClick={() => setTab('layers')}
          >
            <span>Qatlamlar kesimi</span>
            <span className="doc-tab-badge">{bpa.depths_layers_lengths?.length ?? 0}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'daily'}
            className={`doc-tab-btn ${tab === 'daily' ? 'is-active' : ''}`}
            onClick={() => setTab('daily')}
          >
            <span>Kunlik hisobotlar</span>
            <span className="doc-tab-badge">{bpa.daily_works?.length ?? 0}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'resources'}
            className={`doc-tab-btn ${tab === 'resources' ? 'is-active' : ''}`}
            onClick={() => setTab('resources')}
          >
            <span>Resurslar</span>
            <span className="doc-tab-badge">{bpa.available_resources?.length ?? 0}</span>
          </button>
        </div>

        <div className="doc-tabs-body">
          {tab === 'designs' && (
            <WellDesignsSection
              drillingBpaId={bpa.id}
              designs={bpa.well_designs || []}
              onChanged={load}
            />
          )}

          {tab === 'dynamics' && (
            <WellDesignsInLengthSection
              drillingBpaId={bpa.id}
              items={bpa.well_designs_in_length || []}
              onChanged={load}
            />
          )}

          {tab === 'layers' && (
            <DepthsLayersSection
              drillingBpaId={bpa.id}
              layers={bpa.depths_layers_lengths || []}
              onChanged={load}
            />
          )}

          {tab === 'daily' && (
            <DailyWorksBPASection
              drillingBpaId={bpa.id}
              works={bpa.daily_works || []}
              onChanged={load}
            />
          )}

          {tab === 'resources' && (
            <AvailableResourcesSection
              drillingBpaId={bpa.id}
              resources={bpa.available_resources || []}
              onChanged={load}
            />
          )}
        </div>
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
        title="BPA hujjatini o‘chirmoqchimisiz?"
        warning="Ushbu amal qaytarilmaydi. Ushbu pasportga biriktirilgan barcha quduq konstruksiyalari, o'tish dinamikalari, kunlik hisobotlar va resurs ma'lumotlari ham o'chiriladi."
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
};
