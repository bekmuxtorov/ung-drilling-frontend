import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { DailyWorkDescriptionBPA } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { dailyWorksBpaApi } from './api';
import { DailyWorkBPAModal } from './DailyWorkBPAModal';
import { formatDate, formatNumber } from './utils';

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
        <button type="button" className="btn btn--primary" onClick={handleOpenAdd}>
          <Plus size={14} />
          Kunlik hisobot qo‘shish
        </button>
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
                <th style={{ width: '110px' }}>Sana</th>
                <th>Bajarilgan ish tavsifi</th>
                <th>Eritma parametrlari</th>
                <th>Burg'ilash rejimi</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w, index) => (
                <tr key={w.id}>
                  <td className="table__num">{index + 1}</td>
                  <td>
                    <strong>{formatDate(w.report_date)}</strong>
                  </td>
                  <td>
                    <div className="daily-work-desc">{w.description || '—'}</div>
                  </td>
                  <td>
                    <div className="params-compact">
                      {w.density != null && (
                        <span className="param-tag">
                          Zichlik: <b>{formatNumber(w.density, 2)} g/sm³</b>
                        </span>
                      )}
                      {w.viscosity != null && (
                        <span className="param-tag">
                          Qovushqoqlik: <b>{formatNumber(w.viscosity)} s</b>
                        </span>
                      )}
                      {w.fluid_loss != null && (
                        <span className="param-tag">
                          Suv: <b>{formatNumber(w.fluid_loss)} sm³</b>
                        </span>
                      )}
                      {w.mud_cake != null && (
                        <span className="param-tag">
                          Loy: <b>{formatNumber(w.mud_cake)} mm</b>
                        </span>
                      )}
                      {w.ph_level != null && (
                        <span className="param-tag">
                          pH: <b>{formatNumber(w.ph_level)}</b>
                        </span>
                      )}
                      {w.density == null && w.viscosity == null && w.fluid_loss == null && '—'}
                    </div>
                  </td>
                  <td>
                    <div className="params-compact">
                      {w.weight_on_bit != null && (
                        <span className="param-tag param-tag--mech">
                          Yuklama: <b>{formatNumber(w.weight_on_bit)} t</b>
                        </span>
                      )}
                      {w.rpm != null && (
                        <span className="param-tag param-tag--mech">
                          RPM: <b>{formatNumber(w.rpm, 0)}</b>
                        </span>
                      )}
                      {w.pump_pressure != null && (
                        <span className="param-tag param-tag--mech">
                          Bosim: <b>{formatNumber(w.pump_pressure)} MPa</b>
                        </span>
                      )}
                      {w.flow_rate != null && (
                        <span className="param-tag param-tag--mech">
                          Sarf: <b>{formatNumber(w.flow_rate)} l/s</b>
                        </span>
                      )}
                      {w.weight_on_bit == null && w.rpm == null && w.pump_pressure == null && '—'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="icon-btn"
                        title="Tahrirlash"
                        onClick={() => handleOpenEdit(w)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        title="O‘chirish"
                        onClick={() => setDeleting(w)}
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

      <DailyWorkBPAModal
        open={modalOpen}
        drillingBpaId={drillingBpaId}
        item={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
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
