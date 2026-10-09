import React, { useMemo, useState } from 'react';
import type { OperationStage } from '../../api/types';
import { STAGE_LABELS, STAGE_ORDER, formatDate, stagesByType, todayIso, toNumber } from './utils';
import { tr } from '../../i18n';

/* Validatsiyadan o'tgan palitra (dataviz validator: light, surface #fff):
   Fakt — brend ko'k, Reja — ayni rampning ochroq pog'onasi. */
const COLOR_FACT = '#1570cd';
const COLOR_PLAN = '#53b1fd';
const COLOR_TRACK = '#d1e9ff';

/* ---------- Bajarilish halqasi (bitta seriya — legend shart emas) ---------- */

export const CompletionRing: React.FC<{ value: string | number; size?: number }> = ({ value, size = 96 }) => {
  const percent = Math.max(0, Math.min(100, toNumber(value)));
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={tr('Bajarilish {0}%', percent)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLOR_TRACK} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={COLOR_FACT}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring__value">
        {Math.round(percent * 10) / 10}
        <small>%</small>
      </span>
    </div>
  );
};

/* ---------- Bosqichlar Gantt'i: Reja va Fakt ---------- */

const DAY = 86_400_000;
const parse = (d: string) => Date.parse(`${d}T00:00:00`);
const shortDate = (t: number) => {
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

interface Tip {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

export const StageGantt: React.FC<{ stages: OperationStage[] }> = ({ stages }) => {
  const [tip, setTip] = useState<Tip | null>(null);
  const today = parse(todayIso());
  const byType = stagesByType(stages);

  const domain = useMemo(() => {
    const points: number[] = [];
    stages.forEach((s) => {
      [s.plan_start_date, s.plan_end_date, s.fact_start_date, s.fact_end_date].forEach((d) => d && points.push(parse(d)));
    });
    if (!points.length) return null;
    points.push(today);
    const min = Math.min(...points) - DAY;
    const max = Math.max(...points) + 2 * DAY;
    return { min, max };
  }, [stages, today]);

  if (!domain) {
    return <p className="chart-empty">{tr("Bosqichlar uchun sanalar kiritilmagan — grafik sanalar kiritilgach paydo bo'ladi.")}</p>;
  }

  const span = domain.max - domain.min;
  const pct = (t: number) => ((t - domain.min) / span) * 100;

  // ~6 ta toza belgi (hafta qadamida)
  const totalDays = span / DAY;
  const stepDays = totalDays <= 21 ? 3 : totalDays <= 45 ? 7 : totalDays <= 120 ? 14 : 30;
  const ticks: number[] = [];
  for (let t = domain.min + DAY; t < domain.max; t += stepDays * DAY) ticks.push(t);

  const bar = (start: string | null, end: string | null, fallbackEnd?: number) => {
    if (!start) return null;
    const s = parse(start);
    const e = end ? parse(end) + DAY : (fallbackEnd ?? s + DAY);
    return { left: pct(s), width: Math.max(pct(e) - pct(s), 0.8) };
  };

  const show = (e: React.MouseEvent, title: string, lines: string[]) => {
    const host = (e.currentTarget as HTMLElement).closest('.gantt') as HTMLElement;
    const rect = host.getBoundingClientRect();
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title, lines });
  };

  return (
    <div className="gantt" onMouseLeave={() => setTip(null)}>
      <div className="chart-legend">
        <span className="chart-legend__item">
          <i style={{ background: COLOR_PLAN }} />
          {tr('Reja')}</span>
        <span className="chart-legend__item">
          <i style={{ background: COLOR_FACT }} />
          {tr('Fakt')}</span>
        <span className="chart-legend__item">
          <i className="chart-legend__today" />
          {tr('Bugun')}</span>
      </div>

      <div className="gantt__grid">
        {STAGE_ORDER.map((type) => {
          const s = byType.get(type);
          const plan = s ? bar(s.plan_start_date, s.plan_end_date) : null;
          const fact = s ? bar(s.fact_start_date, s.fact_end_date, today + DAY) : null;
          const ongoing = !!(s?.fact_start_date && !s.fact_end_date);
          return (
            <React.Fragment key={type}>
              <div className="gantt__label">
                <span>{s?.stage_type_display || STAGE_LABELS[type]}</span>
                <small>{s ? `${s.fact_days} / ${s.plan_days} kun` : 'kiritilmagan'}</small>
              </div>
              <div className="gantt__track">
                {ticks.map((t) => (
                  <span key={t} className="gantt__gridline" style={{ left: `${pct(t)}%` }} />
                ))}
                {plan && s && (
                  <span
                    className="gantt__bar gantt__bar--plan"
                    style={{ left: `${plan.left}%`, width: `${plan.width}%`, background: COLOR_PLAN }}
                    onMouseMove={(e) =>
                      show(e, tr('{0} — reja', STAGE_LABELS[type]), [
                        `${formatDate(s.plan_start_date)} – ${formatDate(s.plan_end_date)}`,
                        `${s.plan_days} kun`,
                      ])
                    }
                  />
                )}
                {fact && s && (
                  <span
                    className={`gantt__bar gantt__bar--fact ${ongoing ? 'is-ongoing' : ''}`}
                    style={{ left: `${fact.left}%`, width: `${fact.width}%`, background: COLOR_FACT }}
                    onMouseMove={(e) =>
                      show(e, tr('{0} — fakt', STAGE_LABELS[type]), [
                        `${formatDate(s.fact_start_date)} – ${ongoing ? tr('davom etmoqda') : formatDate(s.fact_end_date)}`,
                        `${s.fact_days} kun`,
                      ])
                    }
                  />
                )}
                {!plan && !fact && <span className="gantt__none">{tr("Sana yo'q")}</span>}
              </div>
            </React.Fragment>
          );
        })}

        <div />
        <div className="gantt__axis">
          {ticks.map((t) => (
            <span key={t} style={{ left: `${pct(t)}%` }}>
              {shortDate(t)}
            </span>
          ))}
        </div>

        {today >= domain.min && today <= domain.max && (
          <span className="gantt__today" style={{ left: `calc(var(--gantt-label) + (100% - var(--gantt-label)) * ${pct(today) / 100})` }}>
            <em>{tr('Bugun')}</em>
          </span>
        )}
      </div>

      {tip && (
        <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>
          <strong>{tip.title}</strong>
          {tip.lines.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Jalb qilingan transport: gorizontal barlar (bitta seriya) ---------- */

export interface TransportTotal {
  name: string;
  count: number;
  reports: number;
}

export const TransportBars: React.FC<{ data: TransportTotal[]; max?: number }> = ({ data, max = 6 }) => {
  const [hover, setHover] = useState<string | null>(null);
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const shown = sorted.slice(0, max);
  const rest = sorted.slice(max);
  if (rest.length) {
    shown.push({
      name: tr('Boshqa ({0} tur)', rest.length),
      count: rest.reduce((s, r) => s + r.count, 0),
      reports: rest.reduce((s, r) => s + r.reports, 0),
    });
  }
  const top = Math.max(1, ...shown.map((d) => d.count));

  return (
    <ul className="hbars">
      {shown.map((d) => (
        <li
          key={d.name}
          className={`hbars__row ${hover && hover !== d.name ? 'is-dim' : ''}`}
          onMouseEnter={() => setHover(d.name)}
          onMouseLeave={() => setHover(null)}
          title={tr('{0}: {1} ta ({2} ta hisobotda)', d.name, d.count, d.reports)}
        >
          <span className="hbars__label">{d.name}</span>
          <span className="hbars__track">
            <span className="hbars__bar" style={{ width: `${(d.count / top) * 100}%`, background: COLOR_FACT }} />
            <span className="hbars__value">{d.count}</span>
          </span>
        </li>
      ))}
    </ul>
  );
};

/* ---------- Kunlik faollik: kunlar bo'yicha jalb qilingan transport birliklari (bitta seriya) ---------- */

export interface DayActivity {
  /** YYYY-MM-DD (mahalliy sana) */
  date: string;
  units: number;
  reports: number;
}

const MAX_DAYS = 60;
const isoOf = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const ActivityColumns: React.FC<{
  data: DayActivity[];
  selected?: string;
  onSelect?: (date: string) => void;
}> = ({ data, selected, onSelect }) => {
  const [hover, setHover] = useState<{ day: DayActivity; left: number } | null>(null);

  // Hisobot bo'lmagan kunlar ham o'qda ko'rinsin — uzluksiz kunlar qatori (oxirgi 60 kun)
  const days = useMemo(() => {
    if (!data.length) return [];
    const map = new Map(data.map((d) => [d.date, d]));
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const end = parse(sorted[sorted.length - 1].date);
    const start = Math.max(parse(sorted[0].date), end - (MAX_DAYS - 1) * DAY);
    const out: DayActivity[] = [];
    for (let t = start; t <= end; t += DAY) {
      const key = isoOf(t);
      out.push(map.get(key) ?? { date: key, units: 0, reports: 0 });
    }
    return out;
  }, [data]);

  if (!days.length) return null;
  const top = Math.max(1, ...days.map((d) => d.units));

  return (
    <div className="activity" onMouseLeave={() => setHover(null)}>
      <div className="activity__plot">
        <span className="activity__max">{top}</span>
        <span className="activity__gridline" style={{ bottom: '100%' }} />
        <span className="activity__gridline" style={{ bottom: '50%' }} />
        <div className="activity__cols">
          {days.map((d, i) => (
            <button
              key={d.date}
              type="button"
              className={`activity__col ${selected && selected !== d.date ? 'is-dim' : ''} ${d.reports ? '' : 'is-empty'}`}
              disabled={!d.reports}
              onClick={() => onSelect?.(d.date)}
              onMouseEnter={() => setHover({ day: d, left: ((i + 0.5) / days.length) * 100 })}
              aria-label={tr('{0}: {1} transport, {2} hisobot', formatDate(d.date), d.units, d.reports)}
            >
              <span style={{ height: `${(d.units / top) * 100}%`, background: COLOR_FACT }} />
            </button>
          ))}
        </div>
      </div>
      <div className="activity__axis">
        <span>{formatDate(days[0].date)}</span>
        <span>{formatDate(days[days.length - 1].date)}</span>
      </div>
      {hover && (
        <div className="chart-tip chart-tip--top" style={{ left: `${hover.left}%` }}>
          <strong>{formatDate(hover.day.date)}</strong>
          <span>{hover.day.units} {tr('ta transport')}</span>
          <span>{hover.day.reports} {tr('ta hisobot')}</span>
        </div>
      )}
    </div>
  );
};
