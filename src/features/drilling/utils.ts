import type { WellDesignPeriodType, WellDesignType } from '../../api/types';
import { tr } from '../../i18n';

export const WELL_DESIGN_TYPE_LABELS: Record<WellDesignType, string> = {
  plan: tr('Loyihaviy (Reja)'),
  fact: tr('Amaldagi (Fakt)'),
};

export const WELL_DESIGN_PERIOD_LABELS: Record<WellDesignPeriodType, string> = {
  day: tr('Kunlik'),
  month: tr('Oylik'),
  year: tr('Yillik'),
};

const pad = (n: number) => String(n).padStart(2, '0');

export const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return y && m && d ? `${d}.${m}.${y}` : '—';
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const toNumber = (value: string | number | null | undefined) => {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '');
  return Number.isFinite(n) ? n : 0;
};

export const formatNumber = (value: string | number | null | undefined, digits = 1) => {
  const n = toNumber(value);
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: digits }).format(n);
};

export const calcProgress = (current: number | null | undefined, plan: number | null | undefined): number => {
  const c = toNumber(current);
  const p = toNumber(plan);
  if (p <= 0) return 0;
  const pct = (c / p) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
};
