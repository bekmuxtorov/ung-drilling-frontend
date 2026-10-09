import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, CheckCircle2, Drill, Gauge, Layers, TrendingUp, TriangleAlert } from 'lucide-react';
import { OperationsMap } from './OperationsMap';
import { SVOD_2026_09_17, type DailySummary, type PlanFactRow, type RigRow } from './svodData';
import { tr, trName } from '../../i18n';

const ALL = 0;

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n)).replace(/,/g, ' ');
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
const ratio = (fact: number, plan: number) => (plan > 0 ? fact / plan : null);
const pct = (v: number | null) => (v == null ? '—' : `${(Math.round(v * 1000) / 10).toString().replace('.', ',')}%`);
const toneOf = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat');
/** "2026-09-16" → "16.09.2026" */
const dmy = (iso: string) => iso.split('-').reverse().join('.');

/* ---------- KPI ---------- */

interface KpiProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  hint: React.ReactNode;
}

const Kpi: React.FC<KpiProps> = ({ icon: Icon, label, value, unit, hint }) => (
  <div className="dsh-kpi">
    <div className="dsh-kpi__head">
      <span>{label}</span>
      <Icon size={18} />
    </div>
    <div className="dsh-kpi__value">
      {value}
      {unit && <small>{unit}</small>}
    </div>
    <div className="dsh-kpi__hint">{hint}</div>
  </div>
);

const Delta: React.FC<{ value: number; unit?: string }> = ({ value, unit = 'm' }) => (
  <span className={`dsh-pill dsh-pill--${toneOf(value)}`}>
    {signed(value)} {unit}
  </span>
);

/* ---------- Reja bajarilishi matritsasi ---------- */

const PERIODS = [
  { key: 'day', label: 'Kunlik' },
  { key: 'mtd', label: 'Oy boshidan' },
  { key: 'month', label: 'Oylik reja' },
  { key: 'ytd', label: 'Yil boshidan' },
] as const;

const periodRatio = (r: PlanFactRow, key: (typeof PERIODS)[number]['key']) => {
  if (key === 'day') return ratio(r.day_fact, r.day_plan);
  if (key === 'mtd') return ratio(r.mtd_fact, r.mtd_plan);
  if (key === 'month') return ratio(r.mtd_fact, r.month_plan);
  return ratio(r.ytd_fact, r.ytd_plan);
};

const PlanMatrix: React.FC<{ rows: PlanFactRow[]; monthShare: number }> = ({ rows, monthShare }) => (
  <div className="dsh-matrix">
    <span />
    {PERIODS.map((p) => (
      <span key={p.key} className="dsh-matrix__head">
        {tr(p.label)}
      </span>
    ))}
    {rows.map((r) => (
      <React.Fragment key={r.category}>
        <span className="dsh-matrix__name">{r.level === ALL ? tr('Jami') : tr(r.category)}</span>
        {PERIODS.map((p) => {
          const v = periodRatio(r, p.key);
          // Oylik reja uchun mezon — oyning o'tgan qismi
          const ok = v == null ? null : v >= (p.key === 'month' ? monthShare : 1);
          return (
            <span key={p.key} className={`dsh-matrix__cell ${ok == null ? '' : ok ? 'is-ok' : 'is-bad'}`}>
              {pct(v)}
            </span>
          );
        })}
      </React.Fragment>
    ))}
  </div>
);

/* ---------- Pudratchilar ---------- */

const ContractorBars: React.FC<{ rows: PlanFactRow[] }> = ({ rows }) => {
  const items = useMemo(() => {
    const map = new Map<string, { plan: number; fact: number }>();
    rows
      .filter((r) => r.level === 2)
      .forEach((r) => {
        const m = map.get(r.contractor) ?? { plan: 0, fact: 0 };
        m.plan += r.ytd_plan;
        m.fact += r.ytd_fact;
        map.set(r.contractor, m);
      });
    return [...map.entries()].map(([name, m]) => ({ name, ...m })).sort((a, b) => b.fact - a.fact);
  }, [rows]);
  const max = Math.max(...items.map((i) => Math.max(i.plan, i.fact)), 1);

  return (
    <div className="dsh-bars">
      {items.map((i) => {
        const delta = i.fact - i.plan;
        return (
          <div key={i.name} className="dsh-bars__row">
            <div className="dsh-bars__top">
              <strong>{tr(i.name)}</strong>
              <span>
                {fmt(i.fact)} / {fmt(i.plan)} {tr('m')}{' '}<em className={`is-${toneOf(delta)}`}>{signed(delta)}</em>
              </span>
            </div>
            <div className="dsh-bars__track" title={tr('Reja: {0} m · Fakt: {1} m', fmt(i.plan), fmt(i.fact))}>
              <div className={`dsh-bars__fill ${delta >= 0 ? 'is-ok' : 'is-bad'}`} style={{ width: `${(i.fact / max) * 100}%` }} />
              <div className="dsh-bars__plan" style={{ left: `${(i.plan / max) * 100}%` }} />
            </div>
          </div>
        );
      })}
      <div className="dsh-legend">
        <span><i className="is-ok" />{tr('Reja bajarilgan')}</span>
        <span><i className="is-bad" />{tr('Rejadan ortda')}</span>
        <span><i className="is-plan" />{tr("Reja chizig'i")}</span>
      </div>
    </div>
  );
};

/* ---------- Jadval ---------- */

const MeterageTable: React.FC<{ rows: PlanFactRow[]; monthName: string }> = ({ rows, monthName }) => (
  <div className="dsh-table-wrap">
    <table className="dsh-table">
      <thead>
        <tr className="dsh-table__group">
          <th />
          <th />
          <th colSpan={3} className="sep">{tr('Kunlik')}</th>
          <th colSpan={3} className="sep">{tr('Oy boshidan')}</th>
          <th colSpan={3} className="sep">{tr('Yil boshidan')}</th>
        </tr>
        <tr>
          <th>{tr('Toifa / pudratchi')}</th>
          <th>{tr('{0} rejasi', tr(monthName))}</th>
          <th className="sep">{tr('Reja')}</th>
          <th>{tr('Fakt')}</th>
          <th>±</th>
          <th className="sep">{tr('Reja')}</th>
          <th>{tr('Fakt')}</th>
          <th>±</th>
          <th className="sep">{tr('Reja')}</th>
          <th>{tr('Fakt')}</th>
          <th>±</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={`${r.category}-${r.contractor}`} className={`lvl-${r.level}`}>
            <td>{tr(r.contractor)}</td>
            <td>{fmt(r.month_plan)}</td>
            <td className="sep">{fmt(r.day_plan)}</td>
            <td>{fmt(r.day_fact)}</td>
            <td className={`is-${toneOf(r.day_delta)}`}>{signed(r.day_delta)}</td>
            <td className="sep">{fmt(r.mtd_plan)}</td>
            <td>{fmt(r.mtd_fact)}</td>
            <td className={`is-${toneOf(r.mtd_delta)}`}>{signed(r.mtd_delta)}</td>
            <td className="sep">{fmt(r.ytd_plan)}</td>
            <td>{fmt(r.ytd_fact)}</td>
            <td className={`is-${toneOf(r.ytd_delta)}`}>{signed(r.ytd_delta)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ---------- Oy davomidagi quduqlar ---------- */

const MonthTimeline: React.FC<{ data: DailySummary }> = ({ data }) => {
  const { monthWells, reportDate, daysInMonth } = data;
  const day = (iso: string) => Number(iso.slice(8, 10));
  const x = (d: number) => `${((d - 0.5) / daysInMonth) * 100}%`;
  const doneSet = new Set(monthWells.filter((w) => w.status === 'Tugatildi').map((w) => w.well));
  const names = [...new Set(monthWells.map((w) => w.well))].sort(
    (a, b) =>
      Math.min(...monthWells.filter((w) => w.well === a).map((w) => day(w.date))) -
      Math.min(...monthWells.filter((w) => w.well === b).map((w) => day(w.date))),
  );
  const ticks = [1, 5, 10, 15, 20, 25, daysInMonth];

  return (
    <div className="dsh-tl">
      <div className="dsh-tl__row dsh-tl__axis">
        <span />
        <div className="dsh-tl__lane">
          {ticks.map((t) => (
            <span key={t} style={{ left: x(t) }}>
              {String(t).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>
      <div className="dsh-tl__body">
        {names.map((name) => (
          <div key={name} className="dsh-tl__row">
            <span className="dsh-tl__name" title={trName(name)}>{trName(name)}</span>
            <div className="dsh-tl__lane">
              {monthWells
                .filter((w) => w.well === name)
                .map((w) => {
                  const done = w.status === 'Tugatildi';
                  const overdue = !done && !doneSet.has(w.well) && w.date < reportDate;
                  const tone = done ? 'done' : overdue ? 'overdue' : 'plan';
                  const label = done ? tr('Tugatildi') : overdue ? tr("Reja muddati o'tgan") : tr('Reja sanasi');
                  return (
                    <span
                      key={w.status}
                      className={`dsh-tl__dot is-${tone}`}
                      style={{ left: x(day(w.date)) }}
                      title={`${trName(w.well)} — ${label}: ${dmy(w.date)} (${tr(w.well_type)})`}
                    />
                  );
                })}
            </div>
          </div>
        ))}
        <div className="dsh-tl__today" style={{ '--today-ratio': (day(reportDate) - 0.5) / daysInMonth } as React.CSSProperties}>
          <span>{tr('Bugun')}</span>
        </div>
      </div>
      <div className="dsh-legend">
        <span><i className="is-ring-plan" />{tr('Rejada')}</span>
        <span><i className="is-ring-bad" />{tr("Muddati o'tgan")}</span>
        <span><i className="is-dot-ok" />{tr('Tugatildi')}</span>
      </div>
    </div>
  );
};

/* ---------- Dastgohlar ---------- */

const RIG_STATES: { key: string; label: string; get: (r: RigRow) => number }[] = [
  { key: 'drilling', label: "Burg'ilashda", get: (r) => r.ung_drilling + r.cnpc_drilling },
  { key: 'testing', label: 'Sinovda', get: (r) => r.ung_testing + r.cnpc_testing },
  { key: 'mounting', label: 'Montaj ishlari', get: (r) => r.ung_mounting + r.cnpc_mounting },
  { key: 'complication', label: 'Geol. asorat / mushkullik', get: (r) => r.ung_complication },
  { key: 'transport', label: 'Tashish ishlari', get: (r) => r.cnpc_transport },
];

const Rigs: React.FC<{ rows: RigRow[] }> = ({ rows }) => {
  const total = rows.reduce((s, r) => s + r.total, 0);
  const max = Math.max(...rows.map((r) => r.total), 1);
  const groups = ['Ekspluatatsiya', 'Izlov-qidiruv'] as const;

  return (
    <div className="dsh-rigs">
      <div className="dsh-rigs__summary">
        <div>
          <b>{total}</b>
          <span>{tr('Jami dastgoh')}</span>
        </div>
        {RIG_STATES.map((s) => (
          <div key={s.key} className={`is-${s.key}`}>
            <b>{rows.reduce((sum, r) => sum + s.get(r), 0)}</b>
            <span>{tr(s.label)}</span>
          </div>
        ))}
      </div>
      {groups.map((g) => (
        <div key={g} className="dsh-rigs__group">
          <div className="dsh-rigs__caption">{tr('{0} quduqlari', tr(g))}</div>
          {rows
            .filter((r) => r.well_type === g)
            .map((r) => (
              <div key={r.region} className="dsh-rigs__row">
                <span>{trName(r.region)}</span>
                <div className="dsh-rigs__track">
                  <div className="dsh-rigs__stack" style={{ width: `${(r.total / max) * 100}%` }}>
                    {RIG_STATES.map((s) => {
                      const v = s.get(r);
                      return v ? (
                        <div
                          key={s.key}
                          className={`is-${s.key}`}
                          style={{ flexGrow: v }}
                          title={`${trName(r.region)}: ${tr(s.label)} — ${v} (${tr("O'zNGBI")} ${r.ung_total}, CNPC ${r.cnpc_total})`}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
                <strong>{r.total}</strong>
              </div>
            ))}
        </div>
      ))}
      <div className="dsh-legend">
        {RIG_STATES.map((s) => (
          <span key={s.key}>
            <i className={`is-${s.key}`} />
            {tr(s.label)}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Joriy vaqt (har soniyada yangilanadi) ---------- */

const timeNow = () => new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const useClock = () => {
  const [time, setTime] = useState(timeNow);
  useEffect(() => {
    const id = window.setInterval(() => setTime(timeNow()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
};

/* ---------- Sahifa ---------- */

export const DashboardPage: React.FC<{ data?: DailySummary }> = ({ data = SVOD_2026_09_17 }) => {
  const total = data.meterage.find((r) => r.level === ALL)!;
  const wellsTotal = data.completedWells.find((r) => r.level === ALL)!;
  const summaryRows = data.meterage.filter((r) => r.level <= 1);
  const drilling = data.rigs.reduce((s, r) => s + r.ung_drilling + r.cnpc_drilling, 0);
  const rigsTotal = data.rigs.reduce((s, r) => s + r.total, 0);
  const monthShare = Number(data.reportDate.slice(8, 10)) / data.daysInMonth;
  const now = useClock();

  return (
    <div className="dsh">
      <header className="dsh-hero">
        <div>
          <div className="dsh-hero__eyebrow">{tr("O'zbekneftegaz AJ · Svodka")}</div>
          <h1>{tr("Quduqlarni burg'ilash bo'yicha kunlik ma'lumot")}</h1>
        </div>
        <div className="dsh-hero__date">
          <Clock size={15} />
          <b>{now}</b>
          <span className="dsh-hero__sep" />
          <CalendarDays size={15} />
          {tr('Holat:')} <b>{dmy(data.reportDate)}</b> {tr("· kunlik ko'rsatkich {0} uchun", dmy(data.dayDate))}
        </div>
      </header>

      <section className="dsh-kpis">
        <Kpi icon={Gauge} label={tr("Kunlik burg'ilab o'tish")} value={fmt(total.day_fact)} unit={tr('m')}
          hint={<>{tr('reja {0} m', fmt(total.day_plan))} <Delta value={total.day_delta} /></>} />
        <Kpi icon={TrendingUp} label={tr('Oy boshidan ({0})', tr(data.monthName).toLowerCase())} value={fmt(total.mtd_fact)} unit={tr('m')}
          hint={<>{tr('reja {0} m', fmt(total.mtd_plan))} <Delta value={total.mtd_delta} /></>} />
        <Kpi icon={Layers} label={tr('Yil boshidan')} value={fmt(total.ytd_fact)} unit={tr('m')}
          hint={<>{tr('reja {0} m', fmt(total.ytd_plan))} <Delta value={total.ytd_delta} /></>} />
        <Kpi icon={CalendarDays} label={tr('{0} oylik rejasi bajarilishi', tr(data.monthName))} value={pct(ratio(total.mtd_fact, total.month_plan))}
          hint={tr("oylik reja {0} m · oyning {1}% o'tdi", fmt(total.month_plan), Math.round(monthShare * 100))} />
        <Kpi icon={CheckCircle2} label={tr('Tugatilgan quduqlar (yil boshidan)')} value={fmt(wellsTotal.ytd_fact)} unit={tr('ta')}
          hint={tr('reja {0} ta · {1}: {2} / {3}', fmt(wellsTotal.ytd_plan), tr(data.monthName).toLowerCase(), wellsTotal.mtd_fact, wellsTotal.month_plan)} />
        <Kpi icon={Drill} label={tr("Burg'ilash dastgohlari")} value={fmt(rigsTotal)} unit={tr('ta')}
          hint={tr("shundan burg'ilashda {0} ta", drilling)} />
      </section>

      <h2 className="dsh-section">{tr('Hududlar va tashkilotlar')}</h2>
      <section className="card card--flush">
        <OperationsMap data={data} />
      </section>

      <h2 className="dsh-section">{tr("Burg'ilab o'tish")}</h2>
      <div className="dsh-grid">
        <section className="card">
          <div className="dsh-card-head">
            <h3>{tr('Reja bajarilishi, %')}</h3>
            <p>{tr('Fakt ÷ reja. "Oylik reja" — oy boshidan fakt ÷ butun oy rejasi.')}</p>
          </div>
          <PlanMatrix rows={summaryRows} monthShare={monthShare} />
        </section>
        <section className="card">
          <div className="dsh-card-head">
            <h3>{tr('Pudratchilar: yil boshidan reja va fakt')}</h3>
            <p>{tr("Metr, barcha quduq toifalari bo'yicha")}</p>
          </div>
          <ContractorBars rows={data.meterage} />
        </section>
        <section className="card dsh-grid__wide">
          <div className="dsh-card-head">
            <h3>
              <TriangleAlert size={16} className="dsh-warn-icon" />
              {dmy(data.dayDate)} {tr('kunlik reja bajarilmaganining sabablari')}</h3>
          </div>
          <div className="dsh-reasons">
            {data.shortfalls.map((s) => (
              <div key={s.well} className="dsh-reason">
                <div className="dsh-reason__m">
                  −{fmt(s.shortfall_m)}
                  <small>{tr('m')}</small>
                </div>
                <div>
                  <div className="dsh-reason__well">{trName(s.well)}</div>
                  <div className="dsh-reason__meta">
                    {tr(s.well_type)} · {tr(s.contractor)}
                  </div>
                  <div>{tr(s.reason)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <h2 className="dsh-section">{tr('Qurilish bilan tugatish')}</h2>
      <div className="dsh-grid">
        <section className="card">
          <div className="dsh-card-head">
            <h3>{tr('{0}da tugatilishi rejalashtirilgan quduqlar', tr(data.monthName))}</h3>
            <p>{tr('Reja sanasi va amalda tugatilgan sana')}</p>
          </div>
          <MonthTimeline data={data} />
        </section>
        <section className="card">
          <div className="dsh-card-head">
            <h3>{tr('Tugatilgan quduqlar soni')}</h3>
            <p>{tr('Reja / fakt, quduq')}</p>
          </div>
          <div className="dsh-table-wrap">
            <table className="dsh-table dsh-table--compact">
              <thead>
                <tr>
                  <th>{tr('Toifa / pudratchi')}</th>
                  <th>{tr('{0} rejasi', tr(data.monthName))}</th>
                  <th className="sep">{tr('Oy boshidan')}</th>
                  <th className="sep">{tr('Yil reja')}</th>
                  <th>{tr('Yil fakt')}</th>
                  <th>±</th>
                </tr>
              </thead>
              <tbody>
                {data.completedWells.map((r) => (
                  <tr key={`${r.category}-${r.contractor}`} className={`lvl-${r.level}`}>
                    <td>{tr(r.contractor)}</td>
                    <td>{r.month_plan}</td>
                    <td className="sep">{r.mtd_fact}</td>
                    <td className="sep">{r.ytd_plan}</td>
                    <td>{r.ytd_fact}</td>
                    <td className={`is-${toneOf(r.ytd_delta)}`}>{signed(r.ytd_delta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <h2 className="dsh-section">{tr("Burg'ilash dastgohlari")}</h2>
      <section className="card">
        <div className="dsh-card-head">
          <h3>{tr("Hududlar bo'yicha dastgohlar holati")}</h3>
          <p>{tr("O'zNGBI va CNPC (SIBU) dastgohlari birgalikda")}</p>
        </div>
        <Rigs rows={data.rigs} />
      </section>

      <h2 className="dsh-section">{tr('Batafsil: toifa va pudratchilar kesimida')}</h2>
      <section className="card">
        <div className="dsh-card-head">
          <h3>{tr("Burg'ilab o'tish, metr")}</h3>
          <p>{tr('Kunlik, oy boshidan va yil boshidan reja va fakt')}</p>
        </div>
        <MeterageTable rows={data.meterage} monthName={data.monthName} />
      </section>
    </div>
  );
};
