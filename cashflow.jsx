// Cashflow Forecast — projects next 12 months of dividend income from current holdings.
// Based on each holding's dividendsYTD and typical pay schedules (Thai: semi-annual, US: quarterly).
const { ENRICHED, ASSET_CLASSES, BROKERS, toTHB, fmtTHB, fmtNum } = window.DataLayer;

function buildForecast(horizon = 12) {
  // Pay-schedule patterns: which months a given class typically distributes (1-indexed)
  // Thai stocks: heavy interim May/Aug + final Apr; Funds: Mar/Sep; US: quarterly Mar/Jun/Sep/Dec
  const PATTERNS = {
    th:     [0.05, 0,    0,    0.25, 0.30, 0,    0,    0.30, 0,    0.10, 0,    0],
    fund:   [0,    0,    0.40, 0,    0,    0.10, 0,    0,    0.40, 0,    0,    0.10],
    gold:   [0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0],
    us:     [0,    0,    0.25, 0,    0,    0.25, 0,    0,    0.25, 0,    0,    0.25],
    crypto: [0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0],
    cash:   [0,    0.083,0.083,0.083,0.083,0.083,0.083,0.083,0.083,0.083,0.083,0.084],
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthsTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  // Starting from June 2026 (current = May 27)
  const startMonth = 5; // June (0-indexed)

  // Estimate annual dividend per asset:
  //   if YTD > 0, assume YTD is 5 months of payments (Jan-May), gross up
  //   else: 0
  const perAsset = ENRICHED.map(a => {
    if (!a.dividendsYTD) return { ...a, annual: 0, monthly: new Array(12).fill(0) };
    // Gross-up factor: YTD covers Jan-May (~50%) → 2.0x; safer 1.9
    const annualNative = a.dividendsYTD * 1.9;
    const annualTHB = toTHB(annualNative, a.ccy);
    const pat = PATTERNS[a.cls] || PATTERNS.us;
    const monthly = pat.map(p => p * annualTHB);
    return { ...a, annual: annualTHB, monthly };
  });

  // Build forecast rows
  const rows = [];
  for (let i = 0; i < horizon; i++) {
    const m = (startMonth + i) % 12;
    const yearOffset = Math.floor((startMonth + i) / 12);
    const total = perAsset.reduce((s, a) => s + a.monthly[m], 0);
    const breakdown = perAsset
      .map(a => ({ ticker: a.ticker, name: a.name, cls: a.cls, broker: a.broker, value: a.monthly[m] }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value);
    rows.push({
      monthIdx: m,
      year: 2026 + yearOffset,
      label: months[m],
      labelTH: monthsTH[m],
      total,
      breakdown,
    });
  }
  const annualTotal = rows.reduce((s, r) => s + r.total, 0);
  return { rows, annualTotal };
}

function CashflowCard({ horizon: externalHorizon, hideRange = false } = {}) {
  const { t, lang } = window.useT();
  const I = window.Icon;
  const nav = window.useNav();
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const [internalHorizon, setHorizon] = React.useState(12);
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const horizon = externalHorizon ?? internalHorizon;
  const showRange = !hideRange && externalHorizon == null;
  const { rows, annualTotal } = React.useMemo(() => buildForecast(horizon), [horizon]);

  const max = Math.max(...rows.map(r => r.total), 1);
  const peak = rows.reduce((best, r, i) => r.total > best.total ? { total: r.total, idx: i } : best, { total: 0, idx: 0 });

  const detail = hoverIdx !== null ? rows[hoverIdx] : rows[peak.idx];

  const RANGES = [
    { v: 3,  label: t.period3M },
    { v: 6,  label: t.period6M },
    { v: 12, label: t.period1Y },
    { v: 24, label: t.period2Y },
    { v: 36, label: t.period3Y },
    { v: 60, label: t.period5Y },
  ];
  const currentRange = RANGES.find(r => r.v === horizon) || RANGES[2];
  // Compact bar labels when horizon is long
  const labelStride = horizon > 36 ? 6 : horizon > 18 ? 3 : horizon > 12 ? 2 : 1;
  const dynSub = t.cashflowSubDyn ? t.cashflowSubDyn(horizon) : t.cashflowSub;

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => nav.goTo('cashflow')} className="text-left group min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-ink-700 text-sm font-semibold group-hover:text-ink-800 transition-colors">{t.cashflow}</h3>

            {/* Info icon — hover reveals an explainer of the forecast logic.
                stopPropagation so hovering doesn't trigger the parent button. */}
            <span
              className="relative inline-flex"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              tabIndex={0}
            >
              <span className="peer text-ink-400 hover:text-ink-700 transition-colors cursor-help inline-flex">
                <I.Info size={13}/>
              </span>
              {/* Tooltip: hidden by default, shown on hover/focus of the peer.
                  Positioned absolutely below the icon, fixed width, pointer-events-none
                  so it doesn't steal hover from the underlying chart. */}
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 opacity-0 translate-y-1 peer-hover:opacity-100 peer-hover:translate-y-0 peer-focus:opacity-100 peer-focus:translate-y-0 transition-all z-30">
                <div className="bg-ink-800 text-ink-0 rounded-xl px-3.5 py-3 shadow-pop border border-ink-700">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-0/90">{t.forecastLogicTitle}</div>
                  <ol className="mt-2 space-y-1 text-[11px] text-ink-0/80 leading-relaxed">
                    <li>{t.forecastLogicStep1}</li>
                    <li>{t.forecastLogicStep2}</li>
                    <li>{t.forecastLogicStep3}</li>
                  </ol>
                  <ul className="mt-2 space-y-1 text-[11px] text-ink-0/70 pl-3">
                    <li className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-ink-0/50 mt-1.5 shrink-0"></span>{t.forecastLogicTH}</li>
                    <li className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-ink-0/50 mt-1.5 shrink-0"></span>{t.forecastLogicFund}</li>
                    <li className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-ink-0/50 mt-1.5 shrink-0"></span>{t.forecastLogicUS}</li>
                  </ul>
                  <div className="mt-2.5 pt-2 border-t border-ink-700 text-[10px] text-ink-0/50 italic">{t.forecastLogicNote}</div>
                </div>
              </div>
            </span>

            <I.ChevronDown size={12} className="text-ink-500 opacity-0 group-hover:opacity-100 -rotate-90 transition-opacity"/>
          </div>
          <p className="text-ink-500 text-[12px] mt-0.5">{dynSub}</p>
        </button>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Range filter — hidden when horizon is driven externally (e.g. by the
              page-level period selector on the Cashflow page) */}
          {showRange && (
            <div
              className="relative"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                type="button"
                onClick={() => setRangeOpen(o => !o)}
                className={`flex items-center gap-1 text-[10px] uppercase tracking-wider rounded-md border px-2 py-1 transition-colors ${rangeOpen ? 'border-warn text-warn bg-warn-soft' : 'border-ink-200 text-warn bg-warn-soft hover:border-warn/40'}`}
              >
                {currentRange.label}
                <I.ChevronDown size={10} className={`transition-transform ${rangeOpen ? 'rotate-180' : ''}`}/>
              </button>
              {rangeOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-ink-0 border border-ink-200 rounded-lg shadow-pop overflow-hidden z-30 min-w-[110px]">
                  {RANGES.map(r => (
                    <button
                      key={r.v}
                      type="button"
                      onClick={() => { setHorizon(r.v); setRangeOpen(false); setHoverIdx(null); }}
                      className={`block w-full text-left px-3 py-1.5 text-[12px] hover:bg-ink-100 transition-colors ${horizon === r.v ? 'text-warn font-medium bg-warn-soft/40' : 'text-ink-700'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-ink-500">{t.projAnnual}</div>
            <div className="num text-ink-800 text-[20px] font-medium leading-none mt-0.5">
              {window.DataLayer.fmtTHB(annualTotal, { compact: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic horizon bar chart */}
      <div className="mt-5 flex items-end gap-1.5 h-24" onMouseLeave={() => setHoverIdx(null)}>
        {rows.map((r, i) => {
          const h = (r.total / max) * 100;
          const active = (hoverIdx !== null ? hoverIdx === i : peak.idx === i);
          const showLabel = i % labelStride === 0;
          return (
            <button
              key={i}
              onMouseEnter={() => setHoverIdx(i)}
              className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer min-w-0"
            >
              <div
                className={`w-full rounded-sm transition-all ${active ? 'bg-warn' : 'bg-warn/50 group-hover:bg-warn/80'}`}
                style={{ height: `${Math.max(h, 4)}%` }}
              ></div>
              <span className={`text-[9px] uppercase ${active ? 'text-warn' : 'text-ink-500'} font-medium`}>
                {showLabel ? (lang === 'th' ? r.labelTH : r.label) : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail box for focused month */}
      <div className="mt-4 bg-ink-100 border border-ink-200 rounded-xl p-3 flex-1 min-h-[100px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-warn-soft border border-warn/20 flex items-center justify-center text-warn">
              <I.Coins size={12}/>
            </div>
            <div>
              <div className="text-[12px] text-ink-800 font-medium">
                {lang === 'th' ? `${detail.labelTH} ${detail.year + 543}` : `${detail.label} ${detail.year}`}
              </div>
              <div className="text-[10px] text-ink-500 uppercase tracking-wider">{t.expectedIncome}</div>
            </div>
          </div>
          <div className="num text-warn font-medium text-[15px]">
            {fmtTHB(detail.total, { compact: true })}
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {detail.breakdown.slice(0, 3).map(b => {
            const cls = ASSET_CLASSES[b.cls];
            return (
              <div key={b.ticker} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: cls.color }}></span>
                  <span className="text-ink-700 num font-medium">{b.ticker}</span>
                  <span className="text-ink-500 truncate">· {b.name}</span>
                </div>
                <span className="text-ink-700 num shrink-0">{fmtTHB(b.value, { compact: true })}</span>
              </div>
            );
          })}
          {detail.breakdown.length === 0 && (
            <div className="text-[11px] text-ink-500 italic">{t.noPayouts}</div>
          )}
          {detail.breakdown.length > 3 && (
            <div className="text-[10px] text-ink-500 pt-0.5">
              + {detail.breakdown.length - 3} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.CashflowCard = CashflowCard;
window.buildDivForecast = buildForecast;
