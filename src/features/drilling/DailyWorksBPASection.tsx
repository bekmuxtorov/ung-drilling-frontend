import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DailyWorkDescriptionBPA } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { dailyWorksBpaApi } from './api';
import { DailyWorkBPAModal } from './DailyWorkBPAModal';
import { formatDate, formatNumber } from './utils';
import { ExportDropdown } from '../../components/ui/ExportDropdown';

interface DailyWorksBPASectionProps {
  drillingBpaId: number;
  works: DailyWorkDescriptionBPA[];
  onChanged: () => void;
}

export const DailyWorksBPASection: React.FC<DailyWorksBPASectionProps> = ({
  drillingBpaId,
  works,
  onChanged,
}) => {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DailyWorkDescriptionBPA | null>(null);
  const [deleting, setDeleting] = useState<DailyWorkDescriptionBPA | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (w: DailyWorkDescriptionBPA) => {
    setEditing(w);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (editing) {
      await dailyWorksBpaApi.update(editing.id, payload);
      notify('success', 'Kunlik hisobot yangilandi');
    } else {
      await dailyWorksBpaApi.create(payload);
      notify('success', 'Kunlik hisobot qo‘shildi');
    }
    setModalOpen(false);
    setEditing(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await dailyWorksBpaApi.remove(deleting.id);
      notify('success', 'Kunlik hisobot o‘chirildi');
      setDeleting(null);
      onChanged();
    } catch {
      notify('error', 'O‘chirib bo‘lmadi');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="tab-section">
      <div className="tab-section__toolbar">
        <div>
          <h4 className="tab-section__title">Kunlik burg'ilash hisobotlari va eritma parametrlari</h4>
          <p className="tab-section__sub">
            Sutkalik bajarilgan ishlar, burg'ilash eritmasi (promivka) va gidravlik / mexanik rejimlar jurnali
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExportDropdown
            data={{
              title: `Kunlik burg'ilash hisobotlari va eritma parametrlari`,
              subtitle: `Sutkalik bajarilgan ishlar, eritma (promivka) va burg'ilash rejimlari jurnali`,
              filename: `kunlik_hisobotlar_${drillingBpaId}`,
              headers: ['#', 'Sana', 'Bajarilgan ish tavsifi', 'Zichlik', 'Qovushqoqlik', 'Suv berish', 'Loy qobig‘i', 'pH', 'Yuklama', 'RPM', 'Bosim', 'Sarf'],
              rows: works.map((w, idx) => [
                idx + 1,
                formatDate(w.report_date),
                w.description || '—',
                Number(w.density) > 0 ? `${formatNumber(w.density, 2)} g/sm³` : '—',
                Number(w.viscosity) > 0 ? `${formatNumber(w.viscosity)} s` : '—',
                Number(w.fluid_loss) > 0 ? `${formatNumber(w.fluid_loss)} sm³` : '—',
                Number(w.mud_cake) > 0 ? `${formatNumber(w.mud_cake)} mm` : '—',
                Number(w.ph_level) > 0 ? String(w.ph_level) : '—',
                Number(w.weight_on_bit) > 0 ? `${formatNumber(w.weight_on_bit)} t` : '—',
                Number(w.rpm) > 0 ? String(w.rpm) : '—',
                Number(w.pump_pressure) > 0 ? `${formatNumber(w.pump_pressure)} MPa` : '—',
                Number(w.flow_rate) > 0 ? `${formatNumber(w.flow_rate)} l/s` : '—',
              ]),
            }}
          />
          <button type="button" className="btn btn--primary" onClick={handleOpenAdd}>
            <Plus size={14} />
            Kunlik hisobot qo‘shish
          </button>
        </div>
      </div>

      {works.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">Kunlik hisobotlar kiritilmagan</p>
          <button type="button" className="btn btn--outline" onClick={handleOpenAdd}>
            <Plus size={14} />
            Birinchi hisobotni kiritish
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="table__num">#</th>
                <th style={{ width: '120px' }}>Sana</th>
                <th>Bajarilgan ish tavsifi</th>
                <th>Eritma parametrlari</th>
                <th>Burg'ilash rejimi</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w, index) => (
                <tr
                  key={w.id}
                  className="clickable-row"
                  onClick={() => handleOpenEdit(w)}
                  title="Batafsil ko‘rish va tahrirlash uchun bosing"
                >
                  <td className="table__num">{index + 1}</td>
                  <td>
                    <strong>{formatDate(w.report_date)}</strong>
                  </td>
                  <td>
                    <div className="daily-work-desc">{w.description || '—'}</div>
                  </td>
                  <td>
                    <div className="params-compact">
                      {Number(w.density) > 0 && (
                        <span className="param-tag">
                          Zichlik: <b>{formatNumber(w.density, 2)} g/sm³</b>
                        </span>
                      )}
                      {Number(w.viscosity) > 0 && (
                        <span className="param-tag">
                          Qovushqoqlik: <b>{formatNumber(w.viscosity)} s</b>
                        </span>
                      )}
                      {Number(w.fluid_loss) > 0 && (
                        <span className="param-tag">
                          Suv: <b>{formatNumber(w.fluid_loss)} sm³</b>
                        </span>
                      )}
                      {Number(w.mud_cake) > 0 && (
                        <span className="param-tag">
                          Loy: <b>{formatNumber(w.mud_cake)} mm</b>
                        </span>
                      )}
                      {Number(w.ph_level) > 0 && (
                        <span className="param-tag">
                          pH: <b>{formatNumber(w.ph_level)}</b>
                        </span>
                      )}
                      {!Number(w.density) &&
                        !Number(w.viscosity) &&
                        !Number(w.fluid_loss) &&
                        !Number(w.mud_cake) &&
                        !Number(w.ph_level) &&
                        '—'}
                    </div>
                  </td>
                  <td>
                    <div className="params-compact">
                      {Number(w.weight_on_bit) > 0 && (
                        <span className="param-tag param-tag--mech">
                          Yuklama: <b>{formatNumber(w.weight_on_bit)} t</b>
                        </span>
                      )}
                      {Number(w.rpm) > 0 && (
                        <span className="param-tag param-tag--mech">
                          RPM: <b>{formatNumber(w.rpm, 0)}</b>
                        </span>
                      )}
                      {Number(w.pump_pressure) > 0 && (
                        <span className="param-tag param-tag--mech">
                          Bosim: <b>{formatNumber(w.pump_pressure)} MPa</b>
                        </span>
                      )}
                      {Number(w.flow_rate) > 0 && (
                        <span className="param-tag param-tag--mech">
                          Sarf: <b>{formatNumber(w.flow_rate)} l/s</b>
                        </span>
                      )}
                      {!Number(w.weight_on_bit) &&
                        !Number(w.rpm) &&
                        !Number(w.pump_pressure) &&
                        !Number(w.flow_rate) &&
                        '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DailyWorkBPAModal
        open={modalOpen}
        drillingBpaId={drillingBpaId}
        item={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        onDelete={(item) => {
          setModalOpen(false);
          setDeleting(item);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        loading={deleteLoading}
        title="Kunlik hisobotni o‘chirmoqchimisiz?"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
