import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  Droplets,
  Gauge,
  Calendar,
  Building2,
  ExternalLink,
  Save,
  RotateCcw,
  Trash2,
  Edit3,
  Search,
  Layers,
  Loader2,
  ChevronRight,
  FileText,
  X,
} from 'lucide-react';
import { drillingBpaApi, drillingBpaListApi, dailyWorksBpaApi } from './api';
import { DailyWorkBPAModal } from './DailyWorkBPAModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SearchableSelect, type SelectOption } from '../../components/ui/SearchableSelect';
import { ExportDropdown } from '../../components/ui/ExportDropdown';
import { useToast } from '../../components/ui/Toast';
import { calcProgress, formatDate, formatNumber, todayIso } from './utils';
import type { DailyWorkDescriptionBPA, DrillingBPA } from '../../api/types';
import type { ExportData } from '../../utils/exportUtils';
import { ApiError } from '../../api/client';
import { tr } from '../../i18n';

interface DailyReportPageProps {
  initialBpaId?: number;
  onNavigate: (path: string) => void;
}

export const DailyReportPage: React.FC<DailyReportPageProps> = ({ initialBpaId, onNavigate }) => {
  const { notify } = useToast();

  // Barcha quduqlar ro'yxati (BPA)
  const [bpaList, setBpaList] = useState<DrillingBPA[]>([]);
  const [loadingBpas, setLoadingBpas] = useState(true);

  // Tanlangan quduq
  const [selectedBpaId, setSelectedBpaId] = useState<number | null>(initialBpaId ?? null);
  const [selectedBpa, setSelectedBpa] = useState<DrillingBPA | null>(null);

  // Tanlangan quduqning kunlik hisobotlari
  const [reports, setReports] = useState<DailyWorkDescriptionBPA[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Tashkilot bo'yicha filter
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>('all');
  const [gallerySearch, setGallerySearch] = useState('');

  // Yangi hisobot formasi maydonlari
  const [reportDate, setReportDate] = useState(todayIso());
  const [description, setDescription] = useState('');

  // Eritma parametrlari (Promivka)
  const [density, setDensity] = useState('');
  const [viscosity, setViscosity] = useState('');
  const [fluidLoss, setFluidLoss] = useState('');
  const [mudCake, setMudCake] = useState('');
  const [phLevel, setPhLevel] = useState('');

  // Mexanik parametrlar
  const [weightOnBit, setWeightOnBit] = useState('');
  const [rpm, setRpm] = useState('');
  const [pumpPressure, setPumpPressure] = useState('');
  const [flowRate, setFlowRate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal orqali tahrirlash va o'chirish holatlari
  const [editingItem, setEditingItem] = useState<DailyWorkDescriptionBPA | null>(null);
  const [deletingItem, setDeletingItem] = useState<DailyWorkDescriptionBPA | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Barcha BPA quduqlarini yuklab olish
  useEffect(() => {
    let active = true;
    setLoadingBpas(true);
    drillingBpaListApi
      .list({ page_size: 100, ordering: 'id' })
      .then((res) => {
        if (!active) return;
        const items = res.results || [];
        setBpaList(items);

        // Agar initialBpaId berilgan bo'lsa yoki oldin tanlangan bo'lsa
        if (initialBpaId && !selectedBpaId) {
          setSelectedBpaId(initialBpaId);
        }
      })
      .catch(() => {
        if (!active) return;
        notify('error', tr('Quduqlar ro‘yxatini yuklab bo‘lmadi'));
      })
      .finally(() => {
        if (active) setLoadingBpas(false);
      });

    return () => {
      active = false;
    };
  }, [initialBpaId]);

  // 2. Tanlangan quduq ma'lumotlari va hisobotlarini yuklash
  const loadReportsForBpa = async (bpaId: number) => {
    setLoadingReports(true);
    try {
      const res = await dailyWorksBpaApi.list({ drilling_bpa: bpaId, ordering: '-report_date' });
      setReports(res.results || []);
    } catch {
      notify('error', tr('Kunlik hisobotlar tarixini yuklab bo‘lmadi'));
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (!selectedBpaId) {
      setSelectedBpa(null);
      setReports([]);
      return;
    }

    // Listdan tezkor topish
    const found = bpaList.find((b) => b.id === selectedBpaId);
    if (found) {
      setSelectedBpa(found);
    } else {
      drillingBpaApi
        .retrieve(selectedBpaId)
        .then((detail) => setSelectedBpa(detail))
        .catch(() => notify('error', tr('Quduq ma‘lumotlarini yuklab bo‘lmadi')));
    }

    loadReportsForBpa(selectedBpaId);
  }, [selectedBpaId, bpaList]);

  // Tashkilotlar ro'yxati (filter pillari uchun)
  const enterprises = useMemo(() => {
    const set = new Set<string>();
    bpaList.forEach((b) => {
      if (b.enterprise?.name) set.add(b.enterprise.name);
    });
    return Array.from(set);
  }, [bpaList]);

  // Filtrланган quduqlar (Select va Galereya uchun)
  const filteredBpas = useMemo(() => {
    return bpaList.filter((b) => {
      const matchEnt = selectedEnterprise === 'all' || b.enterprise?.name === selectedEnterprise;
      const search = gallerySearch.toLowerCase().trim();
      const matchSearch =
        !search ||
        (b.well_number && b.well_number.toLowerCase().includes(search)) ||
        (b.area?.name && b.area.name.toLowerCase().includes(search)) ||
        (b.enterprise?.name && b.enterprise.name.toLowerCase().includes(search));
      return matchEnt && matchSearch;
    });
  }, [bpaList, selectedEnterprise, gallerySearch]);

  // Select uchun options
  const selectOptions = useMemo<SelectOption[]>(() => {
    return bpaList.map((b) => ({
      value: String(b.id),
      label: `№ ${b.well_number} — ${b.area?.name || tr('Maydon')} · ${b.enterprise?.name || ''}`,
    }));
  }, [bpaList]);

  // Formani tozalash
  const handleResetForm = () => {
    setReportDate(todayIso());
    setDescription('');
    setDensity('');
    setViscosity('');
    setFluidLoss('');
    setMudCake('');
    setPhLevel('');
    setWeightOnBit('');
    setRpm('');
    setPumpPressure('');
    setFlowRate('');
    setFormError('');
  };

  // Yangi kunlik hisobotni saqlash
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBpaId) {
      setFormError(tr('Iltimos, avval quduqni tanlang'));
      return;
    }
    if (!reportDate) {
      setFormError(tr('Hisobot sanasini kiriting'));
      return;
    }

    const numericFields = [
      { name: tr('Zichlik'), val: density },
      { name: tr('Qovushqoqlik'), val: viscosity },
      { name: tr('Suv beruvchanlik'), val: fluidLoss },
      { name: tr("Loy qobig'i"), val: mudCake },
      { name: tr('pH darajasi'), val: phLevel },
      { name: tr('Dolotoga yuklama'), val: weightOnBit },
      { name: tr('Aylanishlar soni'), val: rpm },
      { name: tr('Nasos bosimi'), val: pumpPressure },
      { name: tr('Sarf / Oqim'), val: flowRate },
    ];

    for (const f of numericFields) {
      if (f.val.trim()) {
        const num = parseFloat(f.val);
        if (isNaN(num) || num < 0) {
          setFormError(tr('{0} musbat son bo‘lishi kerak', f.name));
          return;
        }
      }
    }

    setFormError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: selectedBpaId,
      report_date: reportDate,
      description: description.trim(),
      density: density.trim() ? parseFloat(density) : 0,
      viscosity: viscosity.trim() ? parseFloat(viscosity) : 0,
      fluid_loss: fluidLoss.trim() ? parseFloat(fluidLoss) : 0,
      mud_cake: mudCake.trim() ? parseFloat(mudCake) : 0,
      ph_level: phLevel.trim() ? parseFloat(phLevel) : 0,
      weight_on_bit: weightOnBit.trim() ? parseFloat(weightOnBit) : 0,
      rpm: rpm.trim() ? parseFloat(rpm) : 0,
      pump_pressure: pumpPressure.trim() ? parseFloat(pumpPressure) : 0,
      flow_rate: flowRate.trim() ? parseFloat(flowRate) : 0,
    };

    try {
      await dailyWorksBpaApi.create(payload);
      notify('success', tr('Kunlik hisobot muvaffaqiyatli saqlandi!'));
      handleResetForm();
      if (selectedBpaId) {
        await loadReportsForBpa(selectedBpaId);
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tr('Saqlashda xatolik yuz berdi'));
    } finally {
      setSubmitting(false);
    }
  };

  // Modal orqali tahrirlashni saqlash
  const handleModalSubmit = async (payload: Record<string, unknown>) => {
    if (!editingItem) return;
    try {
      await dailyWorksBpaApi.update(editingItem.id, payload);
      notify('success', tr('Kunlik hisobot yangilandi'));
      setEditingItem(null);
      if (selectedBpaId) {
        await loadReportsForBpa(selectedBpaId);
      }
    } catch (err) {
      notify('error', tr('Tahrirlashda xatolik yuz berdi'));
      throw err;
    }
  };

  // Hisobotni o'chirish
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await dailyWorksBpaApi.remove(deletingItem.id);
      notify('success', tr('Kunlik hisobot o‘chirildi'));
      setDeletingItem(null);
      if (selectedBpaId) {
        await loadReportsForBpa(selectedBpaId);
      }
    } catch {
      notify('error', tr('Hisobotni o‘chirib bo‘lmadi'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Eksport ma'lumotlari
  const exportData: ExportData = useMemo(() => {
    const wellTitle = selectedBpa
      ? tr('Quduq № {0} ({1})', selectedBpa.well_number, selectedBpa.area?.name || '')
      : tr('Kunlik hisobotlar');
    return {
      filename: tr('Kunlik-hisobotlar-{0}-{1}', selectedBpa?.well_number || 'bpa', todayIso()),
      title: tr('{0} — Kunlik hisobotlar ro‘yxati', wellTitle),
      headers: [
        '№',
        tr('Sana'),
        tr('Bajarilgan ishlar tavsifi'),
        tr('Zichlik (g/sm³)'),
        tr('Qovushqoqlik (sek)'),
        tr('Suv beruvch. (sm³)'),
        tr('Loy qobig‘i (mm)'),
        'pH',
        tr('Yuklama (t)'),
        tr('Bosim (MPa)'),
        tr('Aylanish (ayl/min)'),
        tr('Sarf (l/s)'),
      ],
      rows: reports.map((r, i) => [
        i + 1,
        formatDate(r.report_date),
        r.description || '—',
        r.density ?? '—',
        r.viscosity ?? '—',
        r.fluid_loss ?? '—',
        r.mud_cake ?? '—',
        r.ph_level ?? '—',
        r.weight_on_bit ?? '—',
        r.pump_pressure ?? '—',
        r.rpm ?? '—',
        r.flow_rate ?? '—',
      ]),
    };
  }, [reports, selectedBpa]);

  return (
    <div className="daily-report-page">
      {/* 1. Header */}
      <div className="daily-report-header">
        <div className="daily-report-header__left">
          <div className="daily-report-header__icon-box">
            <CalendarPlus size={22} />
          </div>
          <div>
            <h1 className="daily-report-header__title">{tr('Kunlik hisobot kiritish')}</h1>
            <p className="daily-report-header__subtitle">
              {tr('Burg‘ilash (BPA) qudug‘ini tanlang hamda sutkalik ishlar va ko‘rsatkichlarini kiriting')}</p>
          </div>
        </div>

        <div className="daily-report-header__badges">
          <span className="daily-report-badge">
            <Calendar size={13} />
            {tr('Bugun:')}{' '}{formatDate(todayIso())}
          </span>
          <span className="daily-report-badge daily-report-badge--primary">
            <Layers size={13} />
            {tr('Mavjud quduqlar:')}{' '}{bpaList.length} {tr('ta')}</span>
        </div>
      </div>

      {/* 2. Well Selector Card (Select komponenti) */}
      <div className="well-select-card">
        <div className="well-select-card__top">
          <div className="well-select-card__label-box">
            <Building2 size={16} color="#0284c7" />
            <span>{tr('Quduqni tanlang:')}</span>
          </div>

          <div className="well-select-card__select-wrapper">
            <SearchableSelect
              options={selectOptions}
              value={selectedBpaId ? String(selectedBpaId) : ''}
              onChange={(val) => setSelectedBpaId(val ? Number(val) : null)}
              placeholder={tr('Quduq raqami yoki maydon nomi bilan qidirish...')}
              loading={loadingBpas}
            />
          </div>
        </div>

        {/* Tezkor tashkilot filtrlari */}
        <div className="well-select-card__filters">
          <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 500, marginRight: '4px' }}>
            {tr('Tashkilot:')}</span>
          <button
            type="button"
            className={`well-filter-pill ${selectedEnterprise === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedEnterprise('all')}
          >
            {tr('Barchasi (')}{bpaList.length})
          </button>
          {enterprises.map((ent) => (
            <button
              key={ent}
              type="button"
              className={`well-filter-pill ${selectedEnterprise === ent ? 'is-active' : ''}`}
              onClick={() => setSelectedEnterprise(ent)}
            >
              {ent}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tanlangan quduq ma'lumotlari kartasi */}
      {selectedBpa && (
        <div className="well-passport-card">
          <div className="well-passport-card__head">
            <div className="well-passport-card__title-box">
              <span className="well-passport-badge">№ {selectedBpa.well_number}</span>
              <span className="well-passport-name">{selectedBpa.area?.name || tr('Maydon ko‘rsatilmagan')}</span>
            </div>

            <div className="well-passport-card__actions">
              <button
                type="button"
                className="well-passport-btn well-passport-btn--link"
                onClick={() => onNavigate(`gqi-burgulash/${selectedBpa.id}`)}
                title={tr("Quduq BPA pasportini to'liq ko'rish")}
              >
                <span>{tr('BPA pasportini ochish')}</span>
                <ExternalLink size={13} />
              </button>

              <button
                type="button"
                className="well-passport-btn well-passport-btn--clear"
                onClick={() => setSelectedBpaId(null)}
                title={tr('Boshqa quduqni tanlash')}
              >
                <X size={13} />
                <span>{tr('Tanlovni bekor qilish')}</span>
              </button>
            </div>
          </div>

          <div className="well-passport-card__grid">
            <div className="well-meta-item">
              <span className="well-meta-item__label">{tr('Tashkilot (Pudratchi)')}</span>
              <span className="well-meta-item__val">{selectedBpa.enterprise?.name || '—'}</span>
            </div>

            <div className="well-meta-item">
              <span className="well-meta-item__label">{tr('Burg‘ilash dastgohi (Stanok)')}</span>
              <span className="well-meta-item__val">{selectedBpa.machine_type?.name || '—'}</span>
            </div>

            <div className="well-meta-item">
              <span className="well-meta-item__label">{tr('Boshlangan sana')}</span>
              <span className="well-meta-item__val">{formatDate(selectedBpa.drilling_start_date)}</span>
            </div>

            <div className="well-meta-item">
              <span className="well-meta-item__label">{tr('Kiritilgan hisobotlar')}</span>
              <span className="well-meta-item__val">{reports.length} {tr('ta yozuv')}</span>
            </div>
          </div>

          {/* Chuqurlik jarayoni */}
          <div className="well-depth-progress">
            <div className="well-depth-progress__text">
              <span>
                {tr('Amaldagi chuqurlik (Zoboy):')}{' '}<strong>{formatNumber(selectedBpa.current_depth, 0)} {tr('m')}</strong>
              </span>
              <span>
                {tr('Loyiha chuqurligi:')}{' '}<strong>{formatNumber(selectedBpa.depth_plan, 0)} {tr('m')}</strong> (
                {calcProgress(selectedBpa.current_depth, selectedBpa.depth_plan)}%)
              </span>
            </div>
            <div className="well-depth-progress__bar">
              <div
                className="well-depth-progress__fill"
                style={{ width: `${calcProgress(selectedBpa.current_depth, selectedBpa.depth_plan)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Hisobot kiritish shakli (Faqat quduq tanlanganda) */}
      {selectedBpa ? (
        <>
          <div className="daily-report-form-card">
            <div className="daily-report-form-card__head">
              <div>
                <h2 className="daily-report-form-card__title">
                  <CalendarPlus size={18} color="#0284c7" />
                  {tr('Yangi kunlik hisobotni kiritish')}</h2>
                <p className="daily-report-form-card__subtitle">
                  {tr('Quduq №')}{' '}{selectedBpa.well_number} ({selectedBpa.area?.name}{tr(') bo‘yicha sutkalik ko‘rsatkichlar')}</p>
              </div>

              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleResetForm}
                title={tr('Formani tozalash')}
              >
                <RotateCcw size={13} />
                {tr('Tozalash')}</button>
            </div>

            <form onSubmit={handleSubmitForm} className="daily-report-form" noValidate>
              {formError && <div className="field-error-alert">{formError}</div>}

              {/* Asosiy ma'lumotlar guruhi */}
              <div className="form-subgroup">
                <div className="form-subgroup__head">
                  <Calendar size={16} />
                  <span>{tr('Sana va bajarilgan ishlar tavsifi')}</span>
                </div>

                <div className="bpa-form-row">
                  <label className="field" style={{ maxWidth: '300px' }}>
                    <span className="field__label">
                      {tr('Hisobot sanasi')}{' '}<span className="field__required">*</span>
                    </span>
                    <input
                      type="date"
                      className="input"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <label className="field">
                  <span className="field__label">{tr('Bajarilgan ishlar tavsifi')}</span>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder={tr('Sutka davomida bajarilgan burg‘ilash, reyslar, quvur tushirish yoki sementlash ishlari...')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
              </div>

              {/* Ikki ustunli parametrlar */}
              <div className="form-grid-params">
                {/* 1-ustun: Burg'ilash eritmasi parametrlari */}
                <div className="form-subgroup">
                  <div className="form-subgroup__head">
                    <Droplets size={16} />
                    <span>{tr('Burg‘ilash eritmasi (Promivka)')}</span>
                  </div>

                  <div className="bpa-form-row bpa-form-row--3">
                    <label className="field">
                      <span className="field__label">{tr('Zichlik (g/sm³)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="1.18"
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field__label">{tr('Qovushqoqlik (sek)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="38"
                        value={viscosity}
                        onChange={(e) => setViscosity(e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field__label">{tr('Suv beruvch. (sm³/30m)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="6.5"
                        value={fluidLoss}
                        onChange={(e) => setFluidLoss(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="bpa-form-row">
                    <label className="field">
                      <span className="field__label">{tr('Loy qobig‘i (mm)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="0.5"
                        value={mudCake}
                        onChange={(e) => setMudCake(e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field__label">{tr('pH darajasi')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="9.0"
                        value={phLevel}
                        onChange={(e) => setPhLevel(e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                {/* 2-ustun: Burg'ilash mexanik ko'rsatkichlari */}
                <div className="form-subgroup">
                  <div className="form-subgroup__head">
                    <Gauge size={16} />
                    <span>{tr('Burg‘ilash rejimi ko‘rsatkichlari')}</span>
                  </div>

                  <div className="bpa-form-row">
                    <label className="field">
                      <span className="field__label">{tr('Dolotoga yuklama (t)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="14.0"
                        value={weightOnBit}
                        onChange={(e) => setWeightOnBit(e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field__label">{tr('Nasos bosimi (MPa)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="12.5"
                        value={pumpPressure}
                        onChange={(e) => setPumpPressure(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="bpa-form-row">
                    <label className="field">
                      <span className="field__label">{tr('Rotor aylanishi (ayl/min)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="65"
                        value={rpm}
                        onChange={(e) => setRpm(e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field__label">{tr('Sarf / Oqim (l/s)')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="input"
                        placeholder="28"
                        value={flowRate}
                        onChange={(e) => setFlowRate(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Saqlash tugmalari */}
              <div className="daily-report-form__actions">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={handleResetForm}
                  disabled={submitting}
                >
                  <RotateCcw size={14} />
                  {tr('Tozalash')}</button>

                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {tr('Saqlanmoqda...')}
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      {tr('Hisobotni saqlash')}</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 5. Ushbu quduq bo'yicha kiritilgan hisobotlar tarixi */}
          <div className="daily-report-history-card">
            <div className="daily-report-history-card__head">
              <h2 className="daily-report-history-card__title">
                <FileText size={18} color="#0284c7" />
                {tr('Ushbu quduq bo‘yicha kiritilgan hisobotlar (')}{reports.length})
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExportDropdown data={exportData} size="sm" disabled={reports.length === 0} />
              </div>
            </div>

            {loadingReports ? (
              <div className="table-loading-wrap" style={{ padding: '32px' }}>
                <Loader2 size={24} className="animate-spin" color="var(--brand-600)" />
                <span style={{ fontSize: '13px', color: 'var(--gray-500)', marginLeft: '8px' }}>
                  {tr('Hisobotlar yuklanmoqda...')}</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 16px' }}>
                <CalendarPlus size={36} color="var(--gray-400)" />
                <h4 style={{ margin: '8px 0 4px', fontSize: '15px' }}>{tr('Hisobotlar mavjud emas')}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-500)' }}>
                  {tr('Ushbu quduq bo‘yicha hali kunlik hisobot kiritilmagan. Yuqoridagi forma orqali birinchi hisobotni kiriting.')}</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>№</th>
                      <th style={{ width: '110px' }}>{tr('Sana')}</th>
                      <th>{tr('Bajarilgan ishlar tavsifi')}</th>
                      <th style={{ minWidth: '180px' }}>{tr('Eritma ko‘rsatkichlari')}</th>
                      <th style={{ minWidth: '180px' }}>{tr('Mexanik parametrlar')}</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>{tr('Amallar')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ color: 'var(--gray-400)', fontSize: '12px' }}>{idx + 1}</td>
                        <td>
                          <span className="doc-num-tag">{formatDate(item.report_date)}</span>
                        </td>
                        <td>
                          <div
                            style={{
                              fontSize: '13px',
                              lineHeight: '1.4',
                              color: 'var(--gray-800)',
                              maxHeight: '70px',
                              overflowY: 'auto',
                            }}
                          >
                            {item.description || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                          </div>
                        </td>
                        <td>
                          <div className="history-chips-group">
                            {item.density ? (
                              <span className="param-chip" title={tr('Zichlik')}>
                                💧 <strong>{item.density}</strong> {tr('g/sm³')}
                              </span>
                            ) : null}
                            {item.viscosity ? (
                              <span className="param-chip" title={tr('Qovushqoqlik')}>
                                ⏱ <strong>{item.viscosity}</strong> {tr('s')}</span>
                            ) : null}
                            {item.fluid_loss ? (
                              <span className="param-chip" title={tr('Suv beruvchanlik')}>
                                🧪 <strong>{item.fluid_loss}</strong> {tr('sm³')}
                              </span>
                            ) : null}
                            {item.mud_cake ? (
                              <span className="param-chip" title={tr("Loy qobig'i")}>
                                📏 <strong>{item.mud_cake}</strong> {tr('mm')}</span>
                            ) : null}
                            {item.ph_level ? (
                              <span className="param-chip" title="pH">
                                pH <strong>{item.ph_level}</strong>
                              </span>
                            ) : null}
                            {!item.density &&
                              !item.viscosity &&
                              !item.fluid_loss &&
                              !item.mud_cake &&
                              !item.ph_level && <span style={{ color: 'var(--gray-400)' }}>—</span>}
                          </div>
                        </td>
                        <td>
                          <div className="history-chips-group">
                            {item.weight_on_bit ? (
                              <span className="param-chip" title={tr('Dolotoga yuklama')}>
                                ⚙ <strong>{item.weight_on_bit}</strong> {tr('t')}</span>
                            ) : null}
                            {item.pump_pressure ? (
                              <span className="param-chip" title={tr('Nasos bosimi')}>
                                📊 <strong>{item.pump_pressure}</strong> {tr('MPa')}
                              </span>
                            ) : null}
                            {item.rpm ? (
                              <span className="param-chip" title={tr('Aylanishlar soni')}>
                                🔄 <strong>{item.rpm}</strong> {tr('rpm')}</span>
                            ) : null}
                            {item.flow_rate ? (
                              <span className="param-chip" title="Sarf/Oqim">
                                🌊 <strong>{item.flow_rate}</strong> l/s
                              </span>
                            ) : null}
                            {!item.weight_on_bit &&
                              !item.pump_pressure &&
                              !item.rpm &&
                              !item.flow_rate && <span style={{ color: 'var(--gray-400)' }}>—</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn--ghost btn--icon-sm"
                              onClick={() => setEditingItem(item)}
                              title={tr('Tahrirlash')}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--icon-sm btn--danger"
                              onClick={() => setDeletingItem(item)}
                              title={tr('O‘chirish')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* 6. Quduq tanlanmagan holat: Quduqlar galereyasi va qidiruv */
        <div className="wells-selection-gallery">
          <div className="wells-selection-gallery__head">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--gray-900)' }}>
                {tr('Quduqlar ro‘yxatidan tanlang')}</h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--gray-500)' }}>
                {tr('Hisobot kiritish uchun quyi ro‘yxatdagi istalgan quduq ustiga bosing yoki yuqoridagi qidiruvdan foydalaning')}</p>
            </div>

            <div className="wells-gallery-search">
              <Search size={15} color="var(--gray-400)" />
              <input
                type="text"
                placeholder={tr('Quduq №, maydon yoki tashkilot...')}
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
              />
              {gallerySearch && (
                <button
                  type="button"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setGallerySearch('')}
                >
                  <X size={14} color="var(--gray-400)" />
                </button>
              )}
            </div>
          </div>

          {loadingBpas ? (
            <div className="table-loading-wrap" style={{ padding: '60px' }}>
              <Loader2 size={30} className="animate-spin" color="var(--brand-600)" />
              <span style={{ marginTop: '12px', fontSize: '14px', color: 'var(--gray-600)' }}>
                {tr('Burg‘ilash quduqlari yuklanmoqda...')}</span>
            </div>
          ) : filteredBpas.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 16px' }}>
              <Building2 size={36} color="var(--gray-400)" />
              <h4 style={{ margin: '8px 0 4px' }}>{tr('Mos quduq topilmadi')}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-500)' }}>
                {tr('Qidiruv so‘zini yoki tashkilot filtrini o‘zgartirib ko‘ring')}</p>
            </div>
          ) : (
            <div className="wells-cards-grid">
              {filteredBpas.map((bpa) => (
                <div
                  key={bpa.id}
                  className="well-select-item-card"
                  onClick={() => setSelectedBpaId(bpa.id)}
                >
                  <div className="well-select-item-card__top">
                    <span className="well-select-item-card__number">№ {bpa.well_number}</span>
                    <span className="well-select-item-card__area">{bpa.area?.name || tr('Maydon')}</span>
                  </div>

                  <div className="well-select-item-card__ent" title={bpa.enterprise?.name}>
                    {bpa.enterprise?.name || tr('Pudratchi ko‘rsatilmagan')}
                  </div>

                  <div className="table-progress" style={{ margin: '2px 0' }}>
                    <div className="table-progress__bar">
                      <div
                        className="table-progress__fill"
                        style={{ width: `${calcProgress(bpa.current_depth, bpa.depth_plan)}%` }}
                      />
                    </div>
                    <span className="table-progress__pct">
                      {calcProgress(bpa.current_depth, bpa.depth_plan)}%
                    </span>
                  </div>

                  <div className="well-select-item-card__bottom">
                    <span>
                      {tr('Zoboy:')}{' '}<strong>{formatNumber(bpa.current_depth, 0)} {tr('m')}</strong>
                    </span>
                    <span className="well-select-item-card__action-btn">
                      {tr('Hisobot kiritish')}<ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tahrirlash modali */}
      {editingItem && selectedBpaId && (
        <DailyWorkBPAModal
          open={!!editingItem}
          drillingBpaId={selectedBpaId}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleModalSubmit}
          onDelete={(item) => {
            setEditingItem(null);
            setDeletingItem(item);
          }}
        />
      )}

      {/* O'chirish dialogi */}
      <ConfirmDialog
        open={!!deletingItem}
        title={tr('Kunlik hisobotni o‘chirish')}
        warning={
          deletingItem
            ? tr('{0} sanasidagi hisobotni o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.', formatDate(deletingItem.report_date))
            : undefined
        }
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};
