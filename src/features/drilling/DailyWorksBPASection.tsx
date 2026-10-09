import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DailyWorkDescriptionBPA } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { dailyWorksBpaApi } from './api';
import { DailyWorkBPAModal } from './DailyWorkBPAModal';
import { formatDate, formatNumber } from './utils';
import { tr } from '../../i18n';

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
      notify('success', tr('Kunlik hisobot yangilandi'));
    } else {
      await dailyWorksBpaApi.create(payload);
      notify('success', tr('Kunlik hisobot qo‘shildi'));
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
      notify('success', tr('Kunlik hisobot o‘chirildi'));
      setDeleting(null);
      onChanged();
    } catch {
      notify('error', tr('O‘chirib bo‘lmadi'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="tab-section">
      <div className="tab-section__toolbar">
        <div>
          <h4 className="tab-section__title">{tr("Kunlik burg'ilash hisobotlari va eritma parametrlari")}</h4>
          <p className="tab-section__sub">
            {tr("Sutkalik bajarilgan ishlar, burg'ilash eritmasi (promivka) va gidravlik / mexanik rejimlar jurnali")}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="btn btn--primary" onClick={handleOpenAdd}>
            <Plus size={14} />
            {tr('Kunlik hisobot qo‘shish')}</button>
        </div>
      </div>

      {works.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">{tr('Kunlik hisobotlar kiritilmagan')}</p>
          <button type="button" className="btn btn--outline" onClick={handleOpenAdd}>
            <Plus size={14} />
            {tr('Birinchi hisobotni kiritish')}</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="table__num">#</th>
                <th style={{ width: '120px' }}>{tr('Sana')}</th>
                <th>{tr('Bajarilgan ish tavsifi')}</th>
                <th>{tr('Eritma parametrlari')}</th>
                <th>{tr("Burg'ilash rejimi")}</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w, index) => (
                <tr
                  key={w.id}
                  className="clickable-row"
                  onClick={() => handleOpenEdit(w)}
                  title={tr('Batafsil ko‘rish va tahrirlash uchun bosing')}
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
                          {tr('Zichlik:')}{' '}<b>{formatNumber(w.density, 2)} {tr('g/sm³')}</b>
                        </span>
                      )}
                      {Number(w.viscosity) > 0 && (
                        <span className="param-tag">
                          {tr('Qovushqoqlik:')}{' '}<b>{formatNumber(w.viscosity)} {tr('s')}</b>
                        </span>
                      )}
                      {Number(w.fluid_loss) > 0 && (
                        <span className="param-tag">
                          {tr('Suv:')}{' '}<b>{formatNumber(w.fluid_loss)} {tr('sm³')}</b>
                        </span>
                      )}
                      {Number(w.mud_cake) > 0 && (
                        <span className="param-tag">
                          {tr('Loy:')}{' '}<b>{formatNumber(w.mud_cake)} {tr('mm')}</b>
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
                          {tr('Yuklama:')}{' '}<b>{formatNumber(w.weight_on_bit)} {tr('t')}</b>
                        </span>
                      )}
                      {Number(w.rpm) > 0 && (
                        <span className="param-tag param-tag--mech">
                          RPM: <b>{formatNumber(w.rpm, 0)}</b>
                        </span>
                      )}
                      {Number(w.pump_pressure) > 0 && (
                        <span className="param-tag param-tag--mech">
                          {tr('Bosim:')}{' '}<b>{formatNumber(w.pump_pressure)} {tr('MPa')}</b>
                        </span>
                      )}
                      {Number(w.flow_rate) > 0 && (
                        <span className="param-tag param-tag--mech">
                          {tr('Sarf:')}{' '}<b>{formatNumber(w.flow_rate)} l/s</b>
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
        title={tr('Kunlik hisobotni o‘chirmoqchimisiz?')}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
