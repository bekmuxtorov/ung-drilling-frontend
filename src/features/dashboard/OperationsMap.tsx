import React, { useMemo, useState } from 'react';
import { ChevronRight, MousePointerClick, TriangleAlert, ZoomOut } from 'lucide-react';
import type { DailySummary, RigRow } from './svodData';
import { DRILLING_SITES, UZ_REGIONS, UZ_VIEWBOX, type DrillingSite } from './uzMap';
import { tr, trName } from '../../i18n';

/* ---------- Tashkilotlar ---------- */

type OrgKey = 'ung' | 'cnpc';

interface OrgDef {
  key: OrgKey;
  short: string;
  /** svodData dagi pudratchi nomi */
  contractor: string;
  total: (r: RigRow) => number;
  states: { key: string; label: string; get: (r: RigRow) => number }[];
}

const ORGS: OrgDef[] = [
  {
    key: 'ung',
    short: "O'zNGBI",
    contractor: "O'zneftegaz burg'ulash ishlari",
    total: (r) => r.ung_total,
    states: [
      { key: 'drilling', label: "Burg'ilashda", get: (r) => r.ung_drilling },
      { key: 'testing', label: 'Sinovda', get: (r) => r.ung_testing },
      { key: 'mounting', label: 'Montaj ishlari', get: (r) => r.ung_mounting },
      { key: 'complication', label: 'Geol. asorat / mushkullik', get: (r) => r.ung_complication },
    ],
  },
  {
    key: 'cnpc',
    short: 'CNPC (SIBU)',
    contractor: 'CNPC Xibu Drilling',
    total: (r) => r.cnpc_total,
    states: [
      { key: 'drilling', label: "Burg'ilashda", get: (r) => r.cnpc_drilling },
      { key: 'testing', label: 'Sinovda', get: (r) => r.cnpc_testing },
      { key: 'mounting', label: 'Montaj ishlari', get: (r) => r.cnpc_mounting },
      { key: 'transport', label: 'Tashish ishlari', get: (r) => r.cnpc_transport },
    ],
  },
];

const WELL_TYPES = ['Ekspluatatsiya', 'Izlov-qidiruv'] as const;
type WellType = (typeof WELL_TYPES)[number];

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
const sum = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((s, r) => s + f(r), 0);
const toneOf = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat');

interface Selection {
  /** Tanlangan boshqarma (DrillingSite.org) */
  site?: string;
  org?: OrgKey;
  wellType?: WellType;
}

/* ---------- Kichik bloklar ---------- */

const StateBars: React.FC<{ items: { key: string; label: string; value: number }[] }> = ({ items }) => {
  const total = sum(items, (i) => i.value);
  return (
    <div className="dmap-states">
      <div className="dmap-states__stack">
        {items.map((i) =>
          i.value ? <div key={i.key} className={`is-${i.key}`} style={{ flexGrow: i.value }} title={`${i.label}: ${i.value}`} /> : null,
        )}
      </div>
      <ul>
        {items.map((i) => (
          <li key={i.key} className={i.value ? '' : 'is-zero'}>
            <i className={`is-${i.key}`} />
            <span>{tr(i.label)}</span>
            <b>{i.value}</b>
            <em>{total ? Math.round((i.value / total) * 100) : 0}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

const DrillRow: React.FC<{ title: string; meta: string; value: number; unit?: string; onClick: () => void }> = ({
  title,
  meta,
  value,
  unit = 'ta',
  onClick,
}) => (
  <button type="button" className="dmap-row" onClick={onClick}>
    <span className="dmap-row__text">
      <strong>{title}</strong>
      <small>{meta}</small>
    </span>
    <span className="dmap-row__value">
      {value}
      <small>{unit}</small>
    </span>
    <ChevronRight size={16} />
  </button>
);

/* ---------- Xarita ---------- */

/** Kichik viloyatlar nomi yozilmaydi; ba'zilari belgi bilan ustma-ust tushmasligi uchun suriladi */
const LABELS: Record<string, [number, number] | null> = {
  'uz-qr': [262, 262],
  'uz-kh': null,
  'uz-nw': null,
  'uz-bu': [418, 505],
  'uz-sa': null,
  'uz-qa': [712, 548],
  'uz-su': null,
  'uz-ji': null,
  'uz-ta': [880, 318],
};

const MAP_W = Number(UZ_VIEWBOX.split(' ')[2]);
const MAP_H = Number(UZ_VIEWBOX.split(' ')[3]);
const ZOOM = 2.4;

export const OperationsMap: React.FC<{ data: DailySummary }> = ({ data }) => {
  const [sel, setSel] = useState<Selection>({});

  const byRegion = useMemo(() => {
    const map = new Map<string, RigRow[]>();
    data.rigs.forEach((r) => map.set(r.region, [...(map.get(r.region) ?? []), r]));
    return map;
  }, [data.rigs]);

  const sites = DRILLING_SITES;
  const rowsOf = (s: DrillingSite) => (s.region ? byRegion.get(s.region) ?? [] : []);
  const activeSite = sites.find((s) => s.org === sel.site);
  // Farg'ona vodiysi uchta viloyatni qamraydi
  const activeAdmin = new Set(sites.flatMap((s) => (s.admin === "Farg'ona vodiysi" ? ["Farg'ona", 'Namangan', 'Andijon'] : [s.admin])));

  // Tanlangan hududga yaqinlashish
  const transform = activeSite
    ? `translate(${MAP_W / 2 - activeSite.x * ZOOM}px, ${MAP_H / 2 - activeSite.y * ZOOM}px) scale(${ZOOM})`
    : 'none';
  const k = activeSite ? ZOOM : 1; // belgilar o'lchamini saqlash uchun

  const regionRows = activeSite ? rowsOf(activeSite) : data.rigs;
  const org = ORGS.find((o) => o.key === sel.org);
  const scoped = sel.wellType ? regionRows.filter((r) => r.well_type === sel.wellType) : regionRows;

  const orgStates = (o: OrgDef, rows: RigRow[]) => o.states.map((s) => ({ key: s.key, label: s.label, value: sum(rows, s.get) }));
  const allStates = (rows: RigRow[]) => {
    const m = new Map<string, { key: string; label: string; value: number }>();
    ORGS.forEach((o) =>
      o.states.forEach((s) => {
        const cur = m.get(s.key) ?? { key: s.key, label: s.label, value: 0 };
        cur.value += sum(rows, s.get);
        m.set(s.key, cur);
      }),
    );
    return [...m.values()];
  };

  const contractorMeterage = (o: OrgDef) => {
    const rows = data.meterage.filter((r) => r.level === 2 && r.contractor === o.contractor);
    return {
      day: sum(rows, (r) => r.day_fact),
      dayDelta: sum(rows, (r) => r.day_delta),
      mtd: sum(rows, (r) => r.mtd_fact),
      mtdDelta: sum(rows, (r) => r.mtd_delta),
      ytd: sum(rows, (r) => r.ytd_fact),
      ytdDelta: sum(rows, (r) => r.ytd_delta),
    };
  };

  const notes = data.shortfalls.filter(
    (n) => (!activeSite || n.region === activeSite.region) && (!org || n.contractor === org.contractor) && (!sel.wellType || n.well_type === sel.wellType),
  );

  const crumbs: { label: string; to: Selection }[] = [{ label: tr("O'zbekiston"), to: {} }];
  if (activeSite) crumbs.push({ label: trName(activeSite.org), to: { site: activeSite.org } });
  if (org) crumbs.push({ label: tr(org.short), to: { site: sel.site, org: org.key } });
  if (sel.wellType) crumbs.push({ label: tr(sel.wellType), to: sel });

  const pickSite = (s: DrillingSite) => setSel(sel.site === s.org ? {} : { site: s.org });

  return (
    <div className="dmap">
      <div className="dmap__map">
        <header className="dmap__head">
          <div>
            <h3>{tr("Burg'ilash boshqarmalari xaritasi")}</h3>
            <p>{tr("Yorliqdagi raqam — boshqarmadagi burg'ilash dastgohlari soni")}</p>
          </div>
          {activeSite ? (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setSel({})}>
              <ZoomOut size={14} />
              {tr('Butun respublika')}</button>
          ) : (
            <div className="dmap__legend">
              <span><i className="dmap__legend-site" />{tr('Boshqarma')}</span>
              <span><i className="dmap__legend-region" />{tr('Faoliyat bor viloyat')}</span>
            </div>
          )}
        </header>
        <svg viewBox={UZ_VIEWBOX} role="img" aria-label={tr("O'zbekiston bo'yicha burg'ilash hududlari xaritasi")}>
          <g className="dmap__zoom" style={{ transform }}>
            {UZ_REGIONS.map((r) => (
              <path
                key={r.key}
                d={r.d}
                className={`dmap__region ${activeAdmin.has(r.name) ? 'has-site' : ''}`}
                strokeWidth={1 / k}
              >
                <title>{trName(r.name)}</title>
              </path>
            ))}

            {UZ_REGIONS.filter((r) => r.key in LABELS).map((r) => {
              const [x, y] = LABELS[r.key] ?? [r.lx, r.ly];
              return (
                <text key={r.key} className="dmap__region-name" x={x} y={y} fontSize={10.5 / k}>
                  {trName(r.name)}
                </text>
              );
            })}

            {sites.map((s) => {
              const rows = rowsOf(s);
              const total = sum(rows, (r) => r.total);
              const hasData = s.region != null;
              const isActive = sel.site === s.org;
              const dimmed = sel.site && !isActive;
              const chipW = (s.org.length * 7.4 + 46) / k;
              const chipH = 30 / k;
              const lx = s.dx / k;
              const ly = s.dy / k;
              return (
                <g
                  key={s.org}
                  className={`dmap__site ${isActive ? 'is-active' : ''} ${dimmed ? 'is-dimmed' : ''} ${hasData ? '' : 'is-empty'}`}
                  transform={`translate(${s.x} ${s.y})`}
                  onClick={() => pickSite(s)}
                  role="button"
                  tabIndex={0}
                  aria-label={hasData ? tr('{0}: {1} ta dastgoh', trName(s.org), total) : tr("{0}: ma'lumot yo'q", trName(s.org))}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pickSite(s))}
                >
                  {isActive && <circle className="dmap__pulse" r={18 / k} />}
                  <line className="dmap__leader" x1={0} y1={0} x2={lx} y2={ly} strokeWidth={1.4 / k} />
                  <circle className="dmap__dot" r={6 / k} strokeWidth={2 / k} />

                  {/* Boshqarma yorlig'i */}
                  <g className="dmap__chip" transform={`translate(${lx} ${ly})`}>
                    <rect x={-chipW / 2} y={-chipH / 2} width={chipW} height={chipH} rx={6 / k} strokeWidth={1.4 / k} />
                    <circle className="dmap__chip-badge" cx={-chipW / 2 + 16 / k} cy={0} r={10.5 / k} />
                    <text className="dmap__chip-count" x={-chipW / 2 + 16 / k} fontSize={11 / k} dy={3.8 / k}>
                      {hasData ? total : '–'}
                    </text>
                    <text className="dmap__chip-name" x={-chipW / 2 + 33 / k} fontSize={12.5 / k} dy={4.3 / k}>
                      {trName(s.org)}
                    </text>
                  </g>

                  {/* Boshqarma tanlanganda — undagi pudratchilar */}
                  {isActive &&
                    ORGS.filter((o) => sum(rows, o.total) > 0).map((o, i, arr) => {
                      const x = ((i - (arr.length - 1) / 2) * 104) / k;
                      const y = (s.dy < 0 ? 1 : -1) * 48 / k;
                      const on = sel.org === o.key;
                      return (
                        <g
                          key={o.key}
                          className={`dmap__org ${on ? 'is-on' : ''} is-${o.key}`}
                          transform={`translate(${x} ${y})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSel({ site: s.org, org: on ? undefined : o.key });
                          }}
                        >
                          <line x1={0} y1={0} x2={-x} y2={-y} strokeWidth={1.2 / k} />
                          <rect x={-46 / k} y={-13 / k} width={92 / k} height={26 / k} rx={13 / k} strokeWidth={1.5 / k} />
                          <text fontSize={11 / k} dy={4 / k}>
                            {tr(o.short)} · {sum(rows, o.total)}
                          </text>
                        </g>
                      );
                    })}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="dmap__hint">
          <MousePointerClick size={14} />
          {activeSite ? "Pudratchi belgisini bosing — tafsilotlar o'ng panelda" : "Boshqarma yorlig'ini bosing — tafsilotlar o'ng panelda"}
        </div>
      </div>

      <aside className="dmap__panel">
        <nav className="dmap__crumbs" aria-label={tr("Tanlov yo'li")}>
          {crumbs.map((c, i) => (
            <React.Fragment key={c.label}>
              {i > 0 && <ChevronRight size={14} />}
              {i < crumbs.length - 1 ? (
                <button type="button" onClick={() => setSel(c.to)}>
                  {c.label}
                </button>
              ) : (
                <span>{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="dmap__total">
          <b>{sum(scoped, (r) => (org ? org.total(r) : r.total))}</b>
          <span>{tr("burg'ilash dastgohi")}</span>
        </div>

        <StateBars items={org ? orgStates(org, scoped) : allStates(scoped)} />

        {/* 0-bosqich: boshqarmalar */}
        {!activeSite && (
          <div className="dmap__list">
            <h4>{tr("Burg'ilash boshqarmalari")}</h4>
            {sites
              .map((s) => ({ s, rows: rowsOf(s) }))
              .sort((a, b) => sum(b.rows, (r) => r.total) - sum(a.rows, (r) => r.total))
              .map(({ s, rows }) => (
                <DrillRow
                  key={s.org}
                  title={trName(s.org)}
                  meta={
                    s.region
                      ? tr("{0} · burg'ilashda {1}", trName(s.admin), sum(rows, (r) => r.ung_drilling + r.cnpc_drilling))
                      : tr("{0} · svodkada ma'lumot yo'q", trName(s.admin))
                  }
                  value={sum(rows, (r) => r.total)}
                  onClick={() => pickSite(s)}
                />
              ))}
          </div>
        )}

        {/* 1-bosqich: boshqarmadagi pudratchilar */}
        {activeSite && !org && (
          <div className="dmap__list">
            <h4>{tr('Pudratchilar')}</h4>
            {regionRows.length === 0 && <p className="dmap__empty">{tr("Bu boshqarma bo'yicha svodkada dastgoh ma'lumoti berilmagan.")}</p>}
            {ORGS.filter((o) => sum(regionRows, o.total) > 0).map((o) => (
              <DrillRow
                key={o.key}
                title={tr(o.contractor)}
                meta={WELL_TYPES.map((t) => `${tr(t)}: ${sum(regionRows.filter((r) => r.well_type === t), o.total)}`).join(' · ')}
                value={sum(regionRows, o.total)}
                onClick={() => setSel({ site: sel.site, org: o.key })}
              />
            ))}
          </div>
        )}

        {/* 2-bosqich: tashkilot — quduq toifalari va metraj */}
        {org && !sel.wellType && (
          <>
            <div className="dmap__list">
              <h4>{tr("Quduq toifasi bo'yicha")}</h4>
              {WELL_TYPES.map((t) => {
                const rows = regionRows.filter((r) => r.well_type === t);
                const n = sum(rows, org.total);
                return n ? (
                  <DrillRow
                    key={t}
                    title={tr('{0} quduqlari', tr(t))}
                    meta={tr("burg'ilashda {0}", sum(rows, org.states[0].get))}
                    value={n}
                    onClick={() => setSel({ ...sel, wellType: t })}
                  />
                ) : null;
              })}
            </div>
            <div className="dmap__metrics">
              <h4>{tr("{0}: burg'ilab o'tish (respublika bo'yicha)", tr(org.short))}</h4>
              {(() => {
                const m = contractorMeterage(org);
                return (
                  <div className="dmap__metric-grid">
                    {[
                      ['Kunlik', m.day, m.dayDelta],
                      ['Oy boshidan', m.mtd, m.mtdDelta],
                      ['Yil boshidan', m.ytd, m.ytdDelta],
                    ].map(([label, v, d]) => (
                      <div key={label as string}>
                        <span>{tr(label as string)}</span>
                        <b>{fmt(v as number)} {tr('m')}</b>
                        <em className={`is-${toneOf(d as number)}`}>{signed(d as number)}</em>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* 3-bosqich: toifa — hudud jadvali */}
        {org && sel.wellType && (
          <div className="dmap__list">
            <h4>
              {tr('{0} · {1} quduqlari', trName(activeSite?.org ?? ''), tr(sel.wellType))}
            </h4>
            <table className="dmap__table">
              <tbody>
                {org.states.map((s) => (
                  <tr key={s.key}>
                    <td>
                      <i className={`is-${s.key}`} />
                      {tr(s.label)}
                    </td>
                    <td>{sum(scoped, s.get)}</td>
                  </tr>
                ))}
                <tr className="is-total">
                  <td>{tr('Jami')}</td>
                  <td>{sum(scoped, org.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {notes.length > 0 && activeSite && (
          <div className="dmap__notes">
            <h4>
              <TriangleAlert size={14} /> {tr('Kunlik reja bajarilmagan')}</h4>
            {notes.map((n) => (
              <div key={n.well} className="dmap__note">
                <b>−{n.shortfall_m} {tr('m')}</b>
                <div>
                  <strong>{trName(n.well)}</strong>
                  <span>{tr(n.reason)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};
