import React, { useEffect, useMemo, useState } from 'react';
import { CircleCheck, Flag, Play } from 'lucide-react';
import { ApiError } from '../../api/client';
import { operationStagesApi } from '../../api/resources';
import type { OperationStage, OperationStageChoice, StageType } from '../../api/types';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { stagesApi } from './api';
import { StageStatusBadge } from './components';
import { StageFormModal } from './StageFormModal';
import { StageActionDialog, type StageAction } from './StageActionDialog';
import { STAGE_LABELS, STAGE_ORDER, formatDate, getStageStatus, todayIso } from './utils';
import { tr } from '../../i18n';

interface StagesSectionProps {
  operationId: number;
  stages: OperationStage[];
  onChanged: () => void;
}

const FALLBACK_CHOICES: OperationStageChoice[] = STAGE_ORDER.map((value) => ({ value, label: STAGE_LABELS[value] }));

/** Ikki sana orasidagi kunlar (ikkala kun ham hisobga olinadi) */
const daysBetween = (start: string, end: string) =>
  Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1);

const periodLine = (label: string, start: string | null, end: string | null, days: number, ongoing = false, over = false) => (
  <span className={`period-line ${over ? 'is-over' : ''}`}>
    <em>{label}</em>
    {start || end ? (
      <>
        <span>
          {formatDate(start)} – {ongoing && !end ? 'hozir' : formatDate(end)}
        </span>
        <small>{days} {tr('kun')}</small>
      </>
    ) : (
      <span className="text-muted">—</span>
    )}
  </span>
);

const stageErrorMessage = (err: unknown) => {
  if (err instanceof ApiError && err.status === 405)
    return tr('Bosqich yaratish serverda hozircha yopiq (POST /operation-stages/ — 405). Backend administratoriga murojaat qiling.');
  return err instanceof ApiError ? err.message : undefined;
};

type Row = { type: StageType; stage?: OperationStage };

export const StagesSection: React.FC<StagesSectionProps> = ({ operationId, stages, onChanged }) => {
  const { notify } = useToast();
  const [choices, setChoices] = useState<OperationStageChoice[]>(FALLBACK_CHOICES);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OperationStage | null>(null);
  const [presetType, setPresetType] = useState<StageType | undefined>();
  const [deleting, setDeleting] = useState<OperationStage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pending, setPending] = useState<{ row: Row; index: number; action: StageAction } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    operationStagesApi
      .choices(controller.signal)
      .then((res) => res.length && setChoices(res))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  // Har bir bosqich turi uchun qator: mavjud bosqichlar tartib bo'yicha, kiritilmaganlari — bo'sh qator
  const rows = useMemo<Row[]>(() => {
    const order = (t: StageType) => STAGE_ORDER.indexOf(t);
    const existing = [...stages].sort((a, b) => order(a.stage_type) - order(b.stage_type) || a.id - b.id);
    const result: Row[] = existing.map((stage) => ({ type: stage.stage_type, stage }));
    STAGE_ORDER.forEach((type) => {
      if (!existing.some((s) => s.stage_type === type)) result.push({ type });
    });
    return result.sort((a, b) => order(a.type) - order(b.type));
  }, [stages]);

  const usedTypes = stages.map((s) => s.stage_type);
  const labelOf = (type: StageType) => choices.find((c) => c.value === type)?.label ?? STAGE_LABELS[type];

  const openCreate = (type?: StageType) => {
    setEditing(null);
    setPresetType(type);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (editing) await stagesApi.update(editing.id, { ...payload, operation: operationId });
    else {
      try {
        await stagesApi.create({ ...payload, operation: operationId });
      } catch (err) {
        // Backend: `/operation-stages/` manzilini bosqich turlari (GET) endpointi egallagan
        if (err instanceof ApiError && err.status === 405) throw new ApiError(405, stageErrorMessage(err)!);
        throw err;
      }
    }
    notify('success', editing ? tr('Bosqich yangilandi') : tr("Bosqich qo'shildi"), labelOf(payload.stage_type as StageType));
    setFormOpen(false);
    setEditing(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await stagesApi.remove(deleting.id);
      notify('success', tr("Bosqich o'chirildi"), labelOf(deleting.stage_type));
      setDeleting(null);
      setFormOpen(false);
      setEditing(null);
      onChanged();
    } catch (err) {
      notify('error', tr("O'chirib bo'lmadi"), err instanceof ApiError ? err.message : undefined);
    } finally {
      setDeleteLoading(false);
    }
  };

  /** Qator uchun amal: boshlash / yakunlash / yo'q (yakunlangan) */
  const actionFor = (row: Row, index: number): StageAction | null => {
    const status = getStageStatus(row.stage);
    const label = row.stage?.stage_type_display || labelOf(row.type);
    const prev = index > 0 ? rows[index - 1] : undefined;
    const next = rows[index + 1];
    if (status === 'done') return null;
    if (row.stage?.fact_start_date) {
      const nextNotStarted = next && !next.stage?.fact_start_date;
      return {
        kind: 'finish',
        label,
        minDate: row.stage.fact_start_date,
        nextLabel: nextNotStarted ? next.stage?.stage_type_display || labelOf(next.type) : undefined,
      };
    }
    const prevOpen = prev && getStageStatus(prev.stage) !== 'done';
    return {
      kind: 'start',
      label,
      warning: prevOpen ? tr('Oldingi bosqich («{0}») hali yakunlanmagan.', prev.stage?.stage_type_display || labelOf(prev.type)) : undefined,
    };
  };

  const startStage = (row: Row, date: string) => {
    const payload = { fact_start_date: date, fact_days: daysBetween(date, todayIso()) };
    return row.stage
      ? stagesApi.patch(row.stage.id, payload)
      : stagesApi.create({ operation: operationId, stage_type: row.type, ...payload });
  };

  const handleAction = async (date: string, startNext: boolean) => {
    if (!pending) return;
    const { row, index, action } = pending;
    setActionLoading(true);
    try {
      if (action.kind === 'finish' && row.stage?.fact_start_date) {
        await stagesApi.patch(row.stage.id, { fact_end_date: date, fact_days: daysBetween(row.stage.fact_start_date, date) });
        if (startNext) {
          const next = rows[index + 1];
          if (next) await startStage(next, date);
        }
        notify('success', tr('«{0}» yakunlandi', action.label), startNext && action.nextLabel ? tr('«{0}» boshlandi', action.nextLabel) : undefined);
      } else {
        await startStage(row, date);
        notify('success', tr('«{0}» boshlandi', action.label), formatDate(date));
      }
      setPending(null);
    } catch (err) {
      notify('error', tr("Holatni o'zgartirib bo'lmadi"), stageErrorMessage(err));
    } finally {
      setActionLoading(false);
      onChanged();
    }
  };

  const actionButton = (row: Row, index: number) => {
    const action = actionFor(row, index);
    if (!action)
      return (
        <span className="stage-done" title={tr('Bosqich yakunlangan')}>
          <CircleCheck size={16} />
        </span>
      );
    const isFinish = action.kind === 'finish';
    return (
      <button
        type="button"
        className={`btn btn--sm ${isFinish ? 'btn--success-soft' : 'btn--outline'}`}
        onClick={(e) => {
          e.stopPropagation();
          setPending({ row, index, action });
        }}
      >
        {isFinish ? <Flag size={13} /> : <Play size={13} />}
        {isFinish ? tr('Yakunlash') : tr('Boshlash')}
      </button>
    );
  };

  return (
    <section className="section">
      <div className="table-wrap">
        <table className="table table--stages">
          <colgroup>
            <col style={{ width: 44 }} />
            <col />
            <col style={{ width: 124 }} />
            <col style={{ width: 250 }} />
            <col style={{ width: 136 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="table__num">#</th>
              <th>{tr('Bosqich')}</th>
              <th>{tr('Holat')}</th>
              <th>{tr('Muddat (reja / fakt)')}</th>
              <th className="is-right">{tr('Amal')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ type, stage }, i) =>
              stage ? (
                <tr
                  key={stage.id}
                  className="is-clickable"
                  tabIndex={0}
                  onClick={() => {
                    setEditing(stage);
                    setFormOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditing(stage);
                      setFormOpen(true);
                    }
                  }}
                >
                  <td className="table__num">{i + 1}</td>
                  <td>
                    <span className="stage-name">
                      <strong>{stage.stage_type_display || labelOf(type)}</strong>
                      {stage.description && <small title={stage.description}>{stage.description}</small>}
                    </span>
                  </td>
                  <td>
                    <StageStatusBadge stage={stage} />
                  </td>
                  <td>
                    <span className="period-cell">
                      {periodLine(tr('Reja'), stage.plan_start_date, stage.plan_end_date, stage.plan_days)}
                      {periodLine(
                        tr('Fakt'),
                        stage.fact_start_date,
                        stage.fact_end_date,
                        stage.fact_days,
                        true,
                        stage.plan_days > 0 && stage.fact_days > stage.plan_days,
                      )}
                    </span>
                  </td>
                  <td className="is-right">{actionButton({ type, stage }, i)}</td>
                </tr>
              ) : (
                <tr key={`missing-${type}`} className="is-clickable is-muted" tabIndex={0} onClick={() => openCreate(type)}>
                  <td className="table__num">{i + 1}</td>
                  <td className="table__strong">{labelOf(type)}</td>
                  <td>
                    <StageStatusBadge />
                  </td>
                  <td>
                    <span className="text-muted">{tr("Ma'lumot kiritilmagan")}</span>
                  </td>
                  <td className="is-right">{actionButton({ type }, i)}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <StageFormModal
        open={formOpen}
        hidden={!!deleting}
        stage={editing}
        presetType={presetType}
        choices={choices}
        usedTypes={usedTypes}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        onDelete={setDeleting}
      />

      <StageActionDialog
        action={pending?.action ?? null}
        loading={actionLoading}
        onConfirm={handleAction}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        open={!!deleting}
        loading={deleteLoading}
        title={tr("Bosqichni o'chirmoqchimisiz?")}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
};
