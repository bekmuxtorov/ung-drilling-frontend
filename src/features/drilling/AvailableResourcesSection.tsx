import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { AvailableResourcesBPA } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { availableResourcesBpaApi } from './api';
import { AvailableResourceBPAModal } from './AvailableResourceBPAModal';
import { formatDateTime, formatNumber } from './utils';
import { tr } from '../../i18n';

interface AvailableResourcesSectionProps {
  drillingBpaId: number;
  resources: AvailableResourcesBPA[];
  onChanged: () => void;
}

export const AvailableResourcesSection: React.FC<AvailableResourcesSectionProps> = ({
  drillingBpaId,
  resources,
  onChanged,
}) => {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AvailableResourcesBPA | null>(null);
  const [deleting, setDeleting] = useState<AvailableResourcesBPA | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (r: AvailableResourcesBPA) => {
    setEditing(r);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (editing) {
      await availableResourcesBpaApi.update(editing.id, payload);
      notify('success', tr('Resurs ma’lumoti yangilandi'));
    } else {
      await availableResourcesBpaApi.create(payload);
      notify('success', tr('Resurs biriktirildi'));
    }
    setModalOpen(false);
    setEditing(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await availableResourcesBpaApi.remove(deleting.id);
      notify('success', tr('Resurs o‘chirildi'));
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
          <h4 className="tab-section__title">{tr('Mavjud va sarflangan resurslar (Available Resources)')}</h4>
          <p className="tab-section__sub">
            {tr("Burg'ilash operatsiyasida foydalaniladigan materiallar, xomashyo, yoqilg'i va quvurlar hisobi")}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="btn btn--primary" onClick={handleOpenAdd}>
            <Plus size={14} />
            {tr('Resurs biriktirish')}</button>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">{tr('Resurslar bo‘yicha ma’lumot biriktirilmagan')}</p>
          <button type="button" className="btn btn--outline" onClick={handleOpenAdd}>
            <Plus size={14} />
            {tr('Birinchi resursni biriktirish')}</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="table__num">#</th>
                <th>{tr('Resurs nomi')}</th>
                <th>{tr('Miqdori')}</th>
                <th>{tr('O‘lchov birligi')}</th>
                <th>{tr('Izoh / Holat')}</th>
                <th style={{ width: '160px' }}>{tr('Yaratilgan sana')}</th>
                <th style={{ width: '160px' }}>{tr('Yangilangan')}</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r, index) => (
                <tr
                  key={r.id}
                  className="clickable-row"
                  onClick={() => handleOpenEdit(r)}
                  title={tr('Tahrirlash uchun bosing')}
                >
                  <td className="table__num">{index + 1}</td>
                  <td>
                    <strong>{r.resources?.name || '—'}</strong>
                  </td>
                  <td>
                    <span className="res-amount">{r.value != null ? formatNumber(r.value, 2) : '—'}</span>
                  </td>
                  <td>
                    <span className="res-unit">{r.unit?.name || '—'}</span>
                  </td>
                  <td>
                    <span className="res-desc">{r.description || '—'}</span>
                  </td>
                  <td className="table__date">
                    {formatDateTime(r.created_at)}
                  </td>
                  <td className="table__date">
                    {formatDateTime(r.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AvailableResourceBPAModal
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
        title={tr('Resursni o‘chirmoqchimisiz?')}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
