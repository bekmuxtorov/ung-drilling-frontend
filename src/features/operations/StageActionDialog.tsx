import React, { useEffect, useState } from 'react';
import { Check, CircleCheck, Loader2, Play, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { todayIso, formatDate } from './utils';

export type StageActionKind = 'start' | 'finish';

export interface StageAction {
  kind: StageActionKind;
  label: string;
  /** Yakunlashda: amaldagi boshlanish sanasi (tugash undan oldin bo'lmasin) */
  minDate?: string;
  /** Boshlashda: oldingi bosqich hali yakunlanmagan bo'lsa ogohlantirish */
  warning?: string;
  /** Yakunlashda: keyingi bosqichni ham boshlash taklifi */
  nextLabel?: string;
}

interface StageActionDialogProps {
  action: StageAction | null;
  loading: boolean;
  onConfirm: (date: string, startNext: boolean) => void;
  onClose: () => void;
}

/** Bosqich holatini bitta tugma + tasdiq bilan o'zgartirish (boshlash / yakunlash) */
export const StageActionDialog: React.FC<StageActionDialogProps> = ({ action, loading, onConfirm, onClose }) => {
  const [date, setDate] = useState(todayIso());
  const [startNext, setStartNext] = useState(true);

  useEffect(() => {
    if (action) {
      setDate(todayIso());
      setStartNext(true);
    }
  }, [action]);

  const isFinish = action?.kind === 'finish';
  const invalid = !date || (!!action?.minDate && date < action.minDate);

  return (
    <Modal
      open={!!action}
      onClose={loading ? () => undefined : onClose}
      size="sm"
      divided
      title={action ? `${action.label} bosqichini ${isFinish ? 'yakunlaysizmi' : 'boshlaysizmi'}?` : ''}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={loading}>
            <X size={14} />
            Bekor qilish
          </button>
          <button
            type="button"
            className={`btn ${isFinish ? 'btn--success' : 'btn--primary'}`}
            disabled={loading || invalid}
            onClick={() => onConfirm(date, !!action?.nextLabel && startNext)}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : isFinish ? <Check size={14} /> : <Play size={14} />}
            {isFinish ? 'Yakunlash' : 'Boshlash'}
          </button>
        </>
      }
    >
      {action && (
        <div className="form">
          <label className="field">
            <span className="field__label">{isFinish ? 'Amaldagi tugash sanasi' : 'Amaldagi boshlanish sanasi'}</span>
            <input
              type="date"
              className={`input ${invalid ? 'input--error' : ''}`}
              value={date}
              min={action.minDate}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
            />
            {action.minDate && (
              <span className="field__hint">Boshlangan sana: {formatDate(action.minDate)}</span>
            )}
          </label>
          {action.nextLabel && (
            <label className="check-row">
              <input type="checkbox" className="checkbox" checked={startNext} onChange={(e) => setStartNext(e.target.checked)} />
              <span>
                <CircleCheck size={14} />
                «{action.nextLabel}» bosqichini ham shu sanadan boshlash
              </span>
            </label>
          )}
          {action.warning && <p className="confirm__warning">{action.warning}</p>}
        </div>
      )}
    </Modal>
  );
};
