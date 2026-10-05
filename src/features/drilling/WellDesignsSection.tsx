import React, { useState } from 'react';
import { Plus, Compass, CheckCircle2 } from 'lucide-react';
import type { WellDesign, WellDesignType } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { wellDesignApi } from './api';
import { WellDesignModal } from './WellDesignModal';
import { formatDateTime, formatNumber } from './utils';

interface WellDesignsSectionProps {
  drillingBpaId: number;
  designs: WellDesign[];
  onChanged: () => void;
}

export const WellDesignsSection: React.FC<WellDesignsSectionProps> = ({
  drillingBpaId,
  designs,
  onChanged,
}) => {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WellDesign | null>(null);
  const [targetType, setTargetType] = useState<WellDesignType>('plan');
  const [deleting, setDeleting] = useState<WellDesign | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const planDesigns = designs.filter((d) => d.type === 'plan');
  const factDesigns = designs.filter((d) => d.type === 'fact');

  const handleOpenAdd = (type: WellDesignType) => {
    setEditing(null);
    setTargetType(type);
    setModalOpen(true);
  };

  const handleOpenEdit = (d: WellDesign) => {
    setEditing(d);
    setTargetType(d.type);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    const isFact = (payload.type || targetType) === 'fact';
    const typeLabel = isFact ? 'Fakt' : 'Reja (Plan)';
    if (editing) {
      await wellDesignApi.update(editing.id, payload);
      notify('success', `${typeLabel} konstruksiyasi yangilandi`, `${payload.pipe_diameter || ''} mm`);
    } else {
      await wellDesignApi.create(payload);
      notify('success', `${typeLabel} konstruksiyasi qo‘shildi`, `${payload.pipe_diameter || ''} mm`);
    }
    setModalOpen(false);
    setEditing(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await wellDesignApi.remove(deleting.id);
      notify('success', 'O‘chirildi', `Konstruksiya elementi #${deleting.id}`);
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

  const renderTable = (items: WellDesign[], type: WellDesignType) => {
    const isPlan = type === 'plan';

    if (items.length === 0) {
      return (
        <div className="well-design-empty">
          <p className="well-design-empty__text">
            {isPlan
              ? 'Reja bo‘yicha konstruksiyalar kiritilmagan'
              : 'Fakt bo‘yicha konstruksiyalar kiritilmagan'}
          </p>
          <button
            type="button"
            className={`btn btn--sm ${isPlan ? 'btn--primary' : 'btn--success'}`}
            onClick={() => handleOpenAdd(type)}
          >
            <Plus size={13} />
            {isPlan ? 'Reja qo‘shish' : 'Fakt qo‘shish'}
          </button>
        </div>
      );
    }

    return (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="table__num">#</th>
              <th>Quvur diametri (mm)</th>
              <th>Tushirish chuqurligi / Uzunligi (m)</th>
              <th>Boshlanish sanasi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d, index) => (
              <tr
                key={d.id}
                className="clickable-row"
                onClick={() => handleOpenEdit(d)}
                title="Batafsil ko‘rish va tahrirlash uchun bosing"
              >
                <td className="table__num">{index + 1}</td>
                <td>
                  <strong>{d.pipe_diameter ? `${formatNumber(d.pipe_diameter)} mm` : '—'}</strong>
                </td>
                <td>
                  <strong>{d.length ? `${formatNumber(d.length)} m` : '—'}</strong>
                </td>
                <td>{formatDateTime(d.start_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="tab-section">
      <div className="tab-section__toolbar">
        <div>
          <h4 className="tab-section__title">Quduq konstruksiyasi (Well Design)</h4>
          <p className="tab-section__sub">
            Reja (Plan) va amaldagi (Fakt) quduq kesimi bo‘yicha tushirilgan quvurlar taqqoslamasi
          </p>
        </div>
      </div>

      {/* 2-Column Split: Plan (Left) and Fact (Right) */}
      <div className="well-designs-split">
        {/* Left Column: Plan */}
        <div className="well-design-card well-design-card--plan">
          <div className="well-design-card__header">
            <div className="well-design-card__title-wrap">
              <span className="well-design-card__icon">
                <Compass size={16} />
              </span>
              <div className="well-design-card__titles">
                <h5 className="well-design-card__title">Reja (Plan)</h5>
                <span className="well-design-card__subtitle">Loyiha bo‘yicha konstruksiya</span>
              </div>
              <span className="well-design-card__count">{planDesigns.length} ta</span>
            </div>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => handleOpenAdd('plan')}
            >
              <Plus size={13} />
              Qo‘shish
            </button>
          </div>
          <div className="well-design-card__body">{renderTable(planDesigns, 'plan')}</div>
        </div>

        {/* Right Column: Fact */}
        <div className="well-design-card well-design-card--fact">
          <div className="well-design-card__header">
            <div className="well-design-card__title-wrap">
              <span className="well-design-card__icon">
                <CheckCircle2 size={16} />
              </span>
              <div className="well-design-card__titles">
                <h5 className="well-design-card__title">Fakt (Amaldagi)</h5>
                <span className="well-design-card__subtitle">Quduqqa amalda tushirilgan</span>
              </div>
              <span className="well-design-card__count">{factDesigns.length} ta</span>
            </div>
            <button
              type="button"
              className="btn btn--sm btn--success"
              onClick={() => handleOpenAdd('fact')}
            >
              <Plus size={13} />
              Qo‘shish
            </button>
          </div>
          <div className="well-design-card__body">{renderTable(factDesigns, 'fact')}</div>
        </div>
      </div>

      <WellDesignModal
        open={modalOpen}
        drillingBpaId={drillingBpaId}
        item={editing}
        defaultType={targetType}
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
        title="Konstruksiyani o‘chirish"
        warning={
          deleting
            ? `${deleting.type === 'fact' ? 'Fakt' : 'Reja'} konstruksiyasi (#${deleting.id}, ${deleting.pipe_diameter ? deleting.pipe_diameter + ' mm' : ''}) ni rostdan ham o‘chirmoqchimisiz?`
            : undefined
        }
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};
