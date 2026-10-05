import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
}

export const DailyWorkBPAModal: React.FC<DailyWorkBPAModalProps> = ({
  open,
  drillingBpaId,
  item,
  onClose,
  onSubmit,
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
        setDensity(item.density != null ? String(item.density) : '');
        setViscosity(item.viscosity != null ? String(item.viscosity) : '');
        setFluidLoss(item.fluid_loss != null ? String(item.fluid_loss) : '');
        setMudCake(item.mud_cake != null ? String(item.mud_cake) : '');
        setPhLevel(item.ph_level != null ? String(item.ph_level) : '');
        setWeightOnBit(item.weight_on_bit != null ? String(item.weight_on_bit) : '');
        setRpm(item.rpm != null ? String(item.rpm) : '');
        setPumpPressure(item.pump_pressure != null ? String(item.pump_pressure) : '');
        setFlowRate(item.flow_rate != null ? String(item.flow_rate) : '');
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

    setError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      drilling_bpa: drillingBpaId,
      report_date: reportDate,
      description: description.trim(),
      density: density ? parseFloat(density) : null,
      viscosity: viscosity ? parseFloat(viscosity) : null,
      fluid_loss: fluidLoss ? parseFloat(fluidLoss) : null,
      mud_cake: mudCake ? parseFloat(mudCake) : null,
      ph_level: phLevel ? parseFloat(phLevel) : null,
      weight_on_bit: weightOnBit ? parseFloat(weightOnBit) : null,
      rpm: rpm ? parseFloat(rpm) : null,
      pump_pressure: pumpPressure ? parseFloat(pumpPressure) : null,
      flow_rate: flowRate ? parseFloat(flowRate) : null,
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
      title={isEdit ? 'Kunlik hisobotni tahrirlash' : 'Yangi kunlik hisobot va parametrlar'}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </button>
          <button type="submit" form="daily-work-bpa-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Saqlash' : 'Qo‘shish'}
          </button>
        </>
      }
    >
      <form id="daily-work-bpa-form" onSubmit={handleSubmit} className="form-grid">
        {error && <div className="field-error-alert">{error}</div>}

        <label className="field">
          <span className="field__label">
            Hisobot sanasi <span className="field__required">*</span>
          </span>
          <input
            type="date"
            className="input"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </label>

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

        <div className="section-title-sub">Burg'ilash eritmasi parametrlari</div>
        <div className="form-row form-row--3">
          <label className="field">
            <span className="field__label">Zichlik (g/sm³)</span>
            <input
              type="number"
              step="0.01"
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
              step="0.1"
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
              step="0.1"
              className="input"
              placeholder="6.5"
              value={fluidLoss}
              onChange={(e) => setFluidLoss(e.target.value)}
            />
          </label>
        </div>

        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">Loy qobig'i (mm)</span>
            <input
              type="number"
              step="0.1"
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
              step="0.1"
              className="input"
              placeholder="9.0"
              value={phLevel}
              onChange={(e) => setPhLevel(e.target.value)}
            />
          </label>
        </div>

        <div className="section-title-sub">Burg'ilash mexanik ko'rsatkichlari</div>
        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">Dolotoga yuklama (t)</span>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="14.0"
              value={weightOnBit}
              onChange={(e) => setWeightOnBit(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Aylanishlar soni (ayl/min)</span>
            <input
              type="number"
              step="1"
              className="input"
              placeholder="70"
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
            />
          </label>
        </div>

        <div className="form-row form-row--2">
          <label className="field">
            <span className="field__label">Nasos bosimi (MPa)</span>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="12.5"
              value={pumpPressure}
              onChange={(e) => setPumpPressure(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Sarf / Oqim (l/sek)</span>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="28"
              value={flowRate}
              onChange={(e) => setFlowRate(e.target.value)}
            />
          </label>
        </div>
      </form>
    </Modal>
  );
};
