import React, { useState } from 'react';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import type { WellDesignInLength } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { wellDesignInLengthApi } from './api';
import { WellDesignInLengthModal } from './WellDesignInLengthModal';
import { formatDateTime, formatNumber } from './utils';

interface WellDesignsInLengthSectionProps {
  drillingBpaId: number;
  items: WellDesignInLength[];
  onChanged: () => void;
}

const PERIOD_LABELS: Record<string, string> = {
  day: 'Kunlik',
  month: 'Oylik',
  year: 'Yillik',
};

const PERIOD_CLASSES: Record<string, string> = {
  day: 'badge--period-day',
  month: 'badge--period-month',
  year: 'badge--period-year',
};

export const WellDesignsInLengthSection: React.FC<WellDesignsInLengthSectionProps> = ({
  drillingBpaId,
  items,
  onChanged,
}) => {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WellDesignInLength | null>(null);
  const [deleting, setDeleting] = useState<WellDesignInLength | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: WellDesignInLength) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (editing) {
      await wellDesignInLengthApi.update(editing.id, payload);
      notify('success', 'Dinamika yangilandi');
    } else {
      await wellDesignInLengthApi.create(payload);
      notify('success', 'Dinamika qo‘shildi');
    }
    setModalOpen(false);
    setEditing(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await wellDesignInLengthApi.remove(deleting.id);
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
          <h4 className="tab-section__title">Quduq o‘tish dinamikasi (Well Design in Length)</h4>
          <p className="tab-section__sub">
            Davrlar kesimida (kunlik, oylik, yillik) burg'ilash reja va amaldagi fakt ko'rsatkichlari taqqoslanishi
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleOpenAdd}>
          <Plus size={14} />
          Qo‘shish
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">O‘tish dinamikasi bo‘yicha ma’lumot kiritilmagan</p>
          <button type="button" className="btn btn--outline" onClick={handleOpenAdd}>
            <Plus size={14} />
            Birinchi yozuvni qo‘shish
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="table__num">#</th>
                <th>Davr</th>
                <th>Reja o‘tish (m)</th>
                <th>Fakt o‘tish (m)</th>
                <th>Farq (Delta m)</th>
                <th>Bajarilish (%)</th>
                <th>Boshlanish sanasi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, index) => {
                const delta =
                  it.delta ??
                  (it.length_fact != null && it.length_plan != null
                    ? it.length_fact - it.length_plan
                    : 0);
                const isPositive = delta >= 0;
                const pct =
                  it.delta_percent ??
                  (it.length_plan ? ((it.length_fact ?? 0) / it.length_plan) * 100 : 0);

                const periodClass = PERIOD_CLASSES[it.type] || 'badge--period-day';
                const periodLabel = PERIOD_LABELS[it.type] || it.type_display || it.type;

                return (
                  <tr
                    key={it.id}
                    className="clickable-row"
                    onClick={() => handleOpenEdit(it)}
                    title="Batafsil ko‘rish va tahrirlash uchun bosing"
                  >
                    <td className="table__num">{index + 1}</td>
                    <td>
                      <span className={`badge badge--period ${periodClass}`}>
                        {periodLabel}
                      </span>
                    </td>
                    <td>{it.length_plan ? `${formatNumber(it.length_plan)} m` : '—'}</td>
                    <td>
                      <strong>{it.length_fact ? `${formatNumber(it.length_fact)} m` : '—'}</strong>
                    </td>
                    <td>
                      <span
                        className={`delta-badge ${isPositive ? 'delta-badge--pos' : 'delta-badge--neg'}`}
                      >
                        {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {isPositive ? `+${formatNumber(delta)} m` : `${formatNumber(delta)} m`}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          pct >= 100
                            ? 'status-badge--success'
                            : pct >= 80
                              ? 'status-badge--warning'
                              : 'status-badge--error'
                        }`}
                      >
                        {formatNumber(pct, 1)}%
                      </span>
                    </td>
                    <td>{formatDateTime(it.start_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <WellDesignInLengthModal
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
        title="O‘tish dinamikasini o‘chirish"
        warning={
          deleting
            ? `${PERIOD_LABELS[deleting.type] || deleting.type} dinamikasi yozuvini rostdan ham o‘chirmoqchimisiz?`
            : undefined
        }
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
