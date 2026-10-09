import type { DerrickErectionOperation, OperationStage, StageType } from '../../api/types';
import { tr } from '../../i18n';

export const STAGE_ORDER: StageType[] = ['dismantling', 'transportation', 'installation'];

export const STAGE_LABELS: Record<StageType, string> = {
  dismantling: tr('Demontaj'),
  transportation: tr('Tashish'),
  installation: tr('Montaj'),
};

export type StageStatus = 'missing' | 'planned' | 'in_progress' | 'done' | 'overdue';

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  missing: tr('Kiritilmagan'),
  planned: tr('Rejada'),
  in_progress: tr('Jarayonda'),
  done: tr('Yakunlangan'),
  overdue: tr('Kechikmoqda'),
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-02-12" → "12.02.2026" */
export const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return y && m && d ? `${d}.${m}.${y}` : '—';
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const toNumber = (value: string | number | null | undefined) => {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '');
  return Number.isFinite(n) ? n : 0;
};

/** 12.50 → "12,5" */
export const formatDecimal = (value: string | number | null | undefined, digits = 2) =>
  new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: digits }).format(toNumber(value));

export const getStageStatus = (stage?: OperationStage): StageStatus => {
  if (!stage) return 'missing';
  const today = todayIso();
  if (stage.fact_end_date) return 'done';
  if (stage.plan_end_date && stage.plan_end_date < today) return 'overdue';
  if (stage.fact_start_date) return stage.plan_days > 0 && stage.fact_days > stage.plan_days ? 'overdue' : 'in_progress';
  return 'planned';
};

export const stagesByType = (stages: OperationStage[]) => {
  const map = new Map<StageType, OperationStage>();
  // Bir turdagi bir nechta bosqich bo'lsa — oxirgisi
  stages.forEach((s) => map.set(s.stage_type, s));
  return map;
};

export const operationTitle = (op: Pick<DerrickErectionOperation, 'from_well_number' | 'to_well_number'>) =>
  `№${op.from_well_number} → №${op.to_well_number}`;

export const progressTone = (percent: number) => (percent >= 100 ? 'done' : percent >= 50 ? 'mid' : 'low');
