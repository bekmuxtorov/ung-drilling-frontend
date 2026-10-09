import React from 'react';
import type { OperationStage } from '../../api/types';
import { STAGE_LABELS, STAGE_ORDER, STAGE_STATUS_LABELS, getStageStatus, progressTone, stagesByType, toNumber } from './utils';

export const ProgressBar: React.FC<{ value: string | number; compact?: boolean }> = ({ value, compact }) => {
  const percent = Math.max(0, Math.min(100, toNumber(value)));
  return (
    <div className={`progress ${compact ? 'progress--compact' : ''}`}>
      <div className="progress__track">
        <div className={`progress__fill progress__fill--${progressTone(percent)}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="progress__value">{Math.round(percent * 100) / 100}%</span>
    </div>
  );
};

/** Demontaj · Tashish · Montaj holati — uchta segment */
export const StageSegments: React.FC<{ stages: OperationStage[] }> = ({ stages }) => {
  const map = stagesByType(stages);
  return (
    <div className="stage-segments">
      {STAGE_ORDER.map((type) => {
        const status = getStageStatus(map.get(type));
        return (
          <span
            key={type}
            className={`stage-segments__item stage-status--${status}`}
            title={`${STAGE_LABELS[type]}: ${STAGE_STATUS_LABELS[status]}`}
          />
        );
      })}
    </div>
  );
};

/** Bosqich bajarilishi: yakunlangan — 100%, aks holda fakt kun ÷ reja kun (100% bilan cheklangan) */
export const stagePercent = (stage?: OperationStage): number | null => {
  if (!stage) return null;
  if (stage.fact_end_date) return 100;
  if (!stage.plan_days) return stage.fact_start_date ? 0 : null;
  return Math.min(100, Math.round((stage.fact_days / stage.plan_days) * 100));
};

/** Bitta bosqich katagi: chiziq va foiz, rangi — holati bo'yicha */
export const StageProgressCell: React.FC<{ stage?: OperationStage; label: string }> = ({ stage, label }) => {
  const status = getStageStatus(stage);
  const pct = stagePercent(stage);
  return (
    <div className={`stage-cell stage-status--${status}`} title={`${label}: ${STAGE_STATUS_LABELS[status]}`}>
      <span className="stage-cell__track">
        <span className="stage-cell__fill" style={{ width: `${pct ?? 0}%` }} />
      </span>
      <span className="stage-cell__pct">{pct == null ? '—' : `${pct}%`}</span>
    </div>
  );
};

export const StageStatusBadge: React.FC<{ stage?: OperationStage }> = ({ stage }) => {
  const status = getStageStatus(stage);
  return <span className={`status-badge stage-status--${status}`}>{STAGE_STATUS_LABELS[status]}</span>;
};
