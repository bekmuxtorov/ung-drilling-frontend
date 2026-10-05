import React, { useEffect, useState } from 'react';
import { Calendar, Droplets, Gauge, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../api/client';
import type { DailyWorkDescriptionBPA } from '../../api/types';
import { todayIso } from './utils';

interface DailyWorkBPAModalProps {
  open: boolean;
  drillingBpaId: number;
  item: DailyWorkDescriptionBPA | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: (item: DailyWorkDescriptionBPA) => void;
}

export const DailyWorkBPAModal: React.FC<DailyWorkBPAModalProps> = ({
  open,
  drillingBpaId,
  item,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const isEdit = !!item;
  const [reportDate, setReportDate] = useState(todayIso());
  const [description, setDescription] = useState('');

  // Eritma parametrlari
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

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setReportDate(item.report_date ? item.report_date.slice(0, 10) : todayIso());
        setDescription(item.description || '');
        setDensity(item.density != null && item.density > 0 ? String(item.density) : '');
        setViscosity(item.viscosity != null && item.viscosity > 0 ? String(item.viscosity) : '');
        setFluidLoss(item.fluid_loss != null && item.fluid_loss > 0 ? String(item.fluid_loss) : '');
        setMudCake(item.mud_cake != null && item.mud_cake > 0 ? String(item.mud_cake) : '');
        setPhLevel(item.ph_level != null && item.ph_level > 0 ? String(item.ph_level) : '');
        setWeightOnBit(item.weight_on_bit != null && item.weight_on_bit > 0 ? String(item.weight_on_bit) : '');
        setRpm(item.rpm != null && item.rpm > 0 ? String(item.rpm) : '');
        setPumpPressure(item.pump_pressure != null && item.pump_pressure > 0 ? String(item.pump_pressure) : '');
        setFlowRate(item.flow_rate != null && item.flow_rate > 0 ? String(item.flow_rate) : '');
      } else {
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
      }
      setError('');
      setSubmitting(false);
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!reportDate) {
      setError('Hisobot sanasini kiriting');
      return;
    }

    const numericFields = [
      { name: 'Zichlik', val: density },
      { name: 'Qovushqoqlik', val: viscosity },
      { name: 'Suv beruvchanlik', val: fluidLoss },
      { name: "Loy qobig'i", val: mudCake },
      { name: 'pH darajasi', val: phLevel },
      { name: 'Dolotoga yuklama', val: weightOnBit },
      { name: 'Aylanishlar soni', val: rpm },
      { name: 'Nasos bosimi', val: pumpPressure },
      { name: 'Sarf / Oqim', val: flowRate },
    ];

    for (const f of numericFields) {
      if (f.val.trim()) {
        const num = parseFloat(f.val);
        if (isNaN(num) || num < 0) {
          setError(`${f.name} musbat son bo‘lishi kerak`);
          return;
        }
      }
    }

    setError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: drillingBpaId,
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
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Kunlik hisobotni tahrirlash' : 'Yangi kunlik hisobot va parametrlar'}
      footer={
        <>
          {isEdit && onDelete && (
            <button
              type="button"
              className="btn btn--outline btn--danger"
              onClick={() => onDelete(item)}
              disabled={submitting}
              title="Hisobotni o‘chirish"
            >
              <Trash2 size={14} />
              O‘chirish
            </button>
          )}
          <div className="modal__footer-spacer" />
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            <X size={14} />
            Bekor qilish
          </button>
          <button type="submit" form="daily-work-bpa-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isEdit ? (
              <>
                <Save size={14} />
                O‘zgarishlarni saqlash
              </>
            ) : (
              <>
                <Plus size={14} />
                Qo‘shish
              </>
            )}
          </button>
        </>
      }
    >
      <form id="daily-work-bpa-form" onSubmit={handleSubmit} className="bpa-form" noValidate>
        {error && <div className="field-error-alert">{error}</div>}

        {/* 1-guruh: Asosiy hisobot ma'lumotlari */}
        <div className="bpa-form-group">
          <div className="bpa-form-group__title">
            <Calendar size={15} />
            <span>Asosiy hisobot ma'lumotlari</span>
          </div>

          <div className="bpa-form-row">
            <label className="field">
              <span className="field__label">
                Hisobot sanasi <span className="field__required">*</span>
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
            <span className="field__label">Bajarilgan ishlar tavsifi</span>
            <textarea
              className="input"
              rows={3}
              placeholder="Sutka davomida bajarilgan burg'ilash, quvur tushirish yoki sementlash ishlari..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>

        {/* 2-guruh: Burg'ilash eritmasi parametrlari */}
        <div className="bpa-form-group">
          <div className="bpa-form-group__title">
            <Droplets size={15} />
            <span>Burg'ilash eritmasi parametrlari (Promivka)</span>
          </div>

          <div className="bpa-form-row bpa-form-row--3">
            <label className="field">
              <span className="field__label">Zichlik (g/sm³)</span>
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
              <span className="field__label">Qovushqoqlik (sek)</span>
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
              <span className="field__label">Suv beruvchanlik (sm³/30m)</span>
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
              <span className="field__label">Loy qobig'i (mm)</span>
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
              <span className="field__label">pH darajasi</span>
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

        {/* 3-guruh: Burg'ilash rejimi va mexanik ko'rsatkichlari */}
        <div className="bpa-form-group">
          <div className="bpa-form-group__title">
            <Gauge size={15} />
            <span>Burg'ilash mexanik ko'rsatkichlari</span>
          </div>

          <div className="bpa-form-row">
            <label className="field">
              <span className="field__label">Dolotoga yuklama (t)</span>
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
              <span className="field__label">Nasos bosimi (MPa)</span>
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
              <span className="field__label">Aylanishlar soni (ayl/min)</span>
              <input
                type="number"
                step="any"
                min="0"
                className="input"
                placeholder="70"
                value={rpm}
                onChange={(e) => setRpm(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">Sarf / Oqim (l/sek)</span>
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
      </form>
    </Modal>
  );
};
