import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import type { DepthsLayersLength } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { depthsLayersLengthApi } from './api';
import { DepthsLayersLengthModal } from './DepthsLayersLengthModal';
import { formatNumber } from './utils';

interface DepthsLayersSectionProps {
  drillingBpaId: number;
  layers: DepthsLayersLength[];
  onChanged: () => void;
}

const STRATA_COLORS = [
  '#2563eb', // ko'k
  '#059669', // yashil
  '#d97706', // to'q sariq
  '#7c3aed', // binafsha
  '#db2777', // pushti
  '#0891b2', // feruza
  '#4b5563', // kulrang
];

export const DepthsLayersSection: React.FC<DepthsLayersSectionProps> = ({
  drillingBpaId,
  layers,
  onChanged,
}) => {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepthsLayersLength | null>(null);
  const [deleting, setDeleting] = useState<DepthsLayersLength | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const totalLength = layers.reduce((acc, curr) => acc + (curr.length || 0), 0);

  const handleOpenAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: DepthsLayersLength) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (editing) {
      await depthsLayersLengthApi.update(editing.id, payload);
      notify('success', 'Qatlam kesimi yangilandi');
    } else {
      await depthsLayersLengthApi.create(payload);
      notify('success', 'Qatlam kesimi qo‘shildi');
    }
    setModalOpen(false);
    setEditing(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await depthsLayersLengthApi.remove(deleting.id);
      notify('success', 'O‘chirildi');
      setDeleting(null);
      setModalOpen(false);
      setEditing(null);
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
          <h4 className="tab-section__title">Geologik chuqurlik qatlamlari (Depths Layers)</h4>
          <p className="tab-section__sub">
            Burg'ilangan geologik formatsiyalar va stratigrafik gorizontlar chuqurlik oraliqlari
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleOpenAdd}>
          <Plus size={14} />
          Qo‘shish
        </button>
      </div>

      {layers.length > 0 && totalLength > 0 && (
        <div className="strata-summary-card">
          <div className="strata-summary-head">
            <span className="strata-summary-title">
              <Layers size={15} />
              Stratigrafik qatlamlar diagrammasi (Jami: {formatNumber(totalLength)} m)
            </span>
          </div>
          <div className="strata-bar">
            {layers.map((l, i) => {
              const pct = totalLength > 0 ? ((l.length || 0) / totalLength) * 100 : 0;
              const color = STRATA_COLORS[i % STRATA_COLORS.length];
              return (
                <div
                  key={l.id}
                  className="strata-bar__segment"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  title={`${l.layer?.name || 'Qatlam'}: ${formatNumber(l.length)} m (${formatNumber(pct, 1)}%)`}
                >
                  {pct > 8 && <span className="strata-bar__label">{l.layer?.name || ''}</span>}
                </div>
              );
            })}
          </div>
          <div className="strata-legend">
            {layers.map((l, i) => {
              const color = STRATA_COLORS[i % STRATA_COLORS.length];
              const pct = totalLength > 0 ? ((l.length || 0) / totalLength) * 100 : 0;
              return (
                <div key={l.id} className="strata-legend__item">
                  <span className="strata-legend__dot" style={{ backgroundColor: color }} />
                  <span className="strata-legend__name">{l.layer?.name || '—'}</span>
                  <span className="strata-legend__val">{formatNumber(l.length)} m ({formatNumber(pct, 1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {layers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">Chuqurlik qatlamlari bo‘yicha ma’lumot kiritilmagan</p>
          <button type="button" className="btn btn--outline" onClick={handleOpenAdd}>
            <Plus size={14} />
            Birinchi qatlamni qo‘shish
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="table__num">#</th>
                <th>Qatlam nomi</th>
                <th>Qatlam qalinligi / Oralig'i (m)</th>
                <th>Umumiy chuqurlikdagi ulushi</th>
              </tr>
            </thead>
            <tbody>
              {layers.map((l, index) => {
                const pct = totalLength > 0 ? ((l.length || 0) / totalLength) * 100 : 0;
                return (
                  <tr
                    key={l.id}
                    className="clickable-row"
                    onClick={() => handleOpenEdit(l)}
                    title="Batafsil ko‘rish va tahrirlash uchun bosing"
                  >
                    <td className="table__num">{index + 1}</td>
                    <td>
                      <div className="flex-row items-center gap-2">
                        <span
                          className="strata-legend__dot"
                          style={{ backgroundColor: STRATA_COLORS[index % STRATA_COLORS.length] }}
                        />
                        <strong>{l.layer?.name || '—'}</strong>
                      </div>
                    </td>
                    <td>
                      <strong>{l.length ? `${formatNumber(l.length)} m` : '—'}</strong>
                    </td>
                    <td>
                      <span className="badge badge--neutral">{formatNumber(pct, 1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DepthsLayersLengthModal
        open={modalOpen}
        drillingBpaId={drillingBpaId}
        item={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        onDelete={(item) => {
          setDeleting(item);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        loading={deleteLoading}
        title="Qatlam kesimini o‘chirish"
        warning={
          deleting
            ? `${deleting.layer?.name || 'Ushbu qatlam'} kesimini (${deleting.length ? deleting.length + ' m' : ''}) rostdan ham o‘chirmoqchimisiz?`
            : undefined
        }
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
