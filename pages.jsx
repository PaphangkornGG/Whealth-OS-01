// Page views — each tab in the top nav renders one of these.
// Reuses the same building-block components from other files where possible.
const { Icon } = window;
const D = window.DataLayer;

// ------------------------- Page wrappers -----------------------------
function PageHeader({ kicker, title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between fade-up">
      <div>
        <div className="text-ink-500 text-[12px] uppercase tracking-wider">{kicker}</div>
        <h1 className="text-ink-800 text-[22px] font-semibold tracking-tight mt-0.5">{title}</h1>
        {subtitle && <p className="text-ink-500 text-[13px] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ------------------------- Holdings page -----------------------------
function HoldingsPage() {
  const { t, lang } = window.useT();
  const [groupBy, setGroupBy] = React.useState('none'); // 'none' | 'class' | 'broker'
  const [filter, setFilter] = React.useState(null);     // { broker?: id } | { cls?: id } | null
  const tableRef = React.useRef(null);

  // Smoothly scroll the holdings table into view when filter changes
  React.useEffect(() => {
    if (filter && tableRef.current) {
      const top = tableRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [filter]);

  // Reset filter when toggling group mode (avoids stale chip)
  React.useEffect(() => { setFilter(null); }, [groupBy]);

  // Per-class summary
  const classSummary = Object.values(D.ASSET_CLASSES).map(c => {
    const positions = D.ENRICHED.filter(a => a.cls === c.id);
    const value = positions.reduce((s, a) => s + a.valueTHB, 0);
    const cost = positions.reduce((s, a) => s + D.toTHB(a.cost, a.ccy), 0);
    const pl = value - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    const divs = positions.reduce((s, a) => s + D.toTHB(a.dividendsLifetime, a.ccy), 0);
    return { ...c, value, cost, pl, plPct, divs, count: positions.length };
  }).filter(x => x.count > 0);

  // Per-broker summary
  const brokerSummary = D.ALLOCATION_BROKER.map(b => {
    const positions = D.ENRICHED.filter(a => a.broker === b.id);
    const cost = positions.reduce((s, a) => s + D.toTHB(a.cost, a.ccy), 0);
    const pl = b.valueTHB - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    return { ...b, cost, pl, plPct };
  });

  return (
    <>
      <PageHeader
        kicker={t.nav.holdings}
        title={lang === 'th' ? 'ทุกพอร์ตในที่เดียว' : 'All holdings in one place'}
        subtitle={lang === 'th' ? `${D.ENRICHED.length} รายการ ใน ${D.ALLOCATION_BROKER.length} บัญชี` : `${D.ENRICHED.length} positions across ${D.ALLOCATION_BROKER.length} accounts`}
        action={
          <div className="flex items-center gap-1 bg-ink-100 border border-ink-200 rounded-lg p-0.5 text-[12px]">
            {[
              { id: 'none',   label: lang === 'th' ? 'ทั้งหมด' : 'All' },
              { id: 'class',  label: lang === 'th' ? 'ตามประเภท' : 'By Class' },
              { id: 'broker', label: lang === 'th' ? 'ตามบัญชี' : 'By Account' },
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setGroupBy(o.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${groupBy === o.id ? 'bg-ink-200 text-ink-800' : 'text-ink-500 hover:text-ink-700'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        }
      />

      {groupBy === 'class' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 fade-up" style={{ animationDelay: '30ms' }}>
          {classSummary.map(c => (
            <ClassSummaryCard
              key={c.id}
              c={c}
              active={filter?.cls === c.id}
              onClick={() => setFilter(filter?.cls === c.id ? null : { cls: c.id })}
            />
          ))}
        </div>
      )}

      {groupBy === 'broker' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 fade-up" style={{ animationDelay: '30ms' }}>
          {brokerSummary.map(b => (
            <BrokerSummaryCard
              key={b.id}
              b={b}
              active={filter?.broker === b.id}
              onClick={() => setFilter(filter?.broker === b.id ? null : { broker: b.id })}
            />
          ))}
        </div>
      )}

      <div ref={tableRef} className="fade-up scroll-mt-24" style={{ animationDelay: '60ms' }}>
        <window.AssetTable
          externalFilter={filter}
          onClearFilter={() => setFilter(null)}
        />
      </div>
    </>
  );
}

function ClassSummaryCard({ c, active, onClick }) {
  const { t, lang } = window.useT();
  const positive = c.pl >= 0;
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl p-3.5 shadow-card transition-all w-full ${active ? 'bg-ink-100 border-brand/40 ring-1 ring-brand/30' : 'bg-ink-50 border-ink-200 hover:border-ink-300'} border`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }}></span>
        <span className="text-[12px] text-ink-700 font-medium">{t.classes[c.id] || c.label}</span>
        <span className="text-[10px] text-ink-500 num ml-auto">{c.count}</span>
      </div>
      <div className="mt-2 num text-ink-800 text-[17px] font-medium">
        {D.fmtTHB(c.value, { compact: true })}
      </div>
      <div className={`text-[11px] num mt-0.5 ${positive ? 'text-gain' : 'text-loss'}`}>
        {positive ? '▲' : '▼'} {D.fmtPct(c.plPct)} · {D.fmtTHB(c.pl, { sign: true, compact: true })}
      </div>
      {active && (
        <div className="mt-2 text-[10px] text-brand uppercase tracking-wider flex items-center gap-1">
          <window.Icon.Check size={10}/>
          {lang === 'th' ? 'กรองอยู่' : 'Filtering'}
        </div>
      )}
    </button>
  );
}

function BrokerSummaryCard({ b, active, onClick }) {
  const { BrokerBadge } = window;
  const { lang } = window.useT();
  const positive = b.pl >= 0;
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl p-3.5 shadow-card transition-all w-full ${active ? 'bg-ink-100 border-brand/40 ring-1 ring-brand/30' : 'bg-ink-50 border-ink-200 hover:border-ink-300'} border`}
    >
      <div className="flex items-center gap-2">
        <BrokerBadge broker={b} size={20}/>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-ink-800 font-medium truncate">{b.label}</div>
          <div className="text-[10px] text-ink-500 uppercase tracking-wider">{b.kind}</div>
        </div>
        <span className="text-[10px] text-ink-500 num">{b.count}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="num text-ink-800 text-[16px] font-medium">
          {D.fmtTHB(b.valueTHB, { compact: true })}
        </div>
        <div className={`text-[11px] num ${positive ? 'text-gain' : 'text-loss'}`}>
          {D.fmtPct(b.plPct)}
        </div>
      </div>
      <div className="mt-2 h-1 bg-ink-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${b.pct * 100}%`, background: b.color }}></div>
      </div>
      <div className="text-[10px] text-ink-500 num mt-1 text-right">
        {(b.pct * 100).toFixed(1)}% {lang === 'th' ? 'ของพอร์ต' : 'of NW'}
      </div>
      {active && (
        <div className="mt-2 text-[10px] text-brand uppercase tracking-wider flex items-center gap-1">
          <window.Icon.Check size={10}/>
          {lang === 'th' ? 'กรองอยู่' : 'Filtering'}
        </div>
      )}
    </button>
  );
}

// ------------------------- Cashflow page -----------------------------
function CashflowPage() {
  const { t, lang } = window.useT();
  const I = window.Icon;

  // Page-level period filter. Drives the past chart, the "Received in last N"
  // KPI, and the forecast horizon. YTD-based metrics (Received YTD, YoC/YoV,
  // WHT) stay as-is because they're year-to-date or lifetime by convention.
  const [period, setPeriod] = React.useState(12);
  const [periodOpen, setPeriodOpen] = React.useState(false);
  const PERIODS = [
    { v: 3,  label: t.period3M },
    { v: 6,  label: t.period6M },
    { v: 12, label: t.period1Y },
    { v: 24, label: t.period2Y },
    { v: 36, label: t.period3Y },
    { v: 60, label: t.period5Y },
  ];
  const currentPeriod = PERIODS.find(p => p.v === period) || PERIODS[2];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthsTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  // Compute historical from transactions over the chosen window. Mock data
  // only covers ~12 months, so longer windows will have empty bars — honest
  // representation of what we actually know.
  const now = new Date(2026, 4, 27);
  const pastN = new Array(period).fill(0);
  D.TRANSACTIONS.filter(tx => tx.type === 'dividend').forEach(tx => {
    const monthsAgo = (now.getFullYear() - tx.date.getFullYear()) * 12 + (now.getMonth() - tx.date.getMonth());
    if (monthsAgo >= 0 && monthsAgo < period) {
      pastN[period - 1 - monthsAgo] += D.toTHB(tx.total, tx.ccy);
    }
  });
  const pastNTotal = pastN.reduce((s, v) => s + v, 0);

  // WHT breakdown YTD — dividend amounts are NET (after WHT). Derive gross
  // from class-default rates that the dividend modal already uses, so the
  // numbers stay coherent with how transactions are entered.
  const whtRate = (cls) => cls === 'us' ? 0.15 : (cls === 'th' || cls === 'fund') ? 0.10 : 0;
  const whtRows = D.ENRICHED.reduce((acc, a) => {
    const r = whtRate(a.cls);
    const netTHB = D.toTHB(a.dividendsYTD, a.ccy);
    if (netTHB <= 0 || r === 0) return acc;
    const grossTHB = netTHB / (1 - r);
    const whtTHB   = grossTHB - netTHB;
    const key = a.cls;
    if (!acc[key]) acc[key] = { cls: key, gross: 0, wht: 0, net: 0 };
    acc[key].gross += grossTHB;
    acc[key].wht   += whtTHB;
    acc[key].net   += netTHB;
    return acc;
  }, {});
  const whtList   = Object.values(whtRows).sort((a, b) => b.wht - a.wht);
  const whtGross  = whtList.reduce((s, r) => s + r.gross, 0);
  const whtPaid   = whtList.reduce((s, r) => s + r.wht,   0);
  const whtNet    = whtList.reduce((s, r) => s + r.net,   0);
  const whtEffPct = whtGross > 0 ? (whtPaid / whtGross) * 100 : 0;
  const whtClassLabel = {
    th:   t.whtClassTH,
    fund: t.whtClassFund,
    us:   t.whtClassUS,
  };

  // Yield analytics
  const yieldOnCost = (D.TOTAL_DIVS_LIFE_THB / D.TOTAL_COST_THB) * 100;
  const yieldOnValue = (D.TOTAL_DIVS_LIFE_THB / D.TOTAL_THB) * 100;

  // Top dividend payers
  const topDivPayers = [...D.ENRICHED]
    .map(a => ({ ...a, divTHB: D.toTHB(a.dividendsLifetime, a.ccy), divYTD_THB: D.toTHB(a.dividendsYTD, a.ccy) }))
    .filter(a => a.divTHB > 0)
    .sort((a, b) => b.divYTD_THB - a.divYTD_THB)
    .slice(0, 6);

  const maxPast = Math.max(...pastN, 1);

  return (
    <>
      <PageHeader
        kicker={t.nav.cashflow}
        title={lang === 'th' ? 'กระแสเงินสดจากปันผล' : 'Dividend cashflow'}
        subtitle={lang === 'th' ? 'ประวัติย้อนหลัง + คาดการณ์ล่วงหน้า' : 'Historical and projected income from your portfolio'}
        action={
          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodOpen(o => !o)}
              className={`flex items-center gap-2 bg-ink-50 border rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${periodOpen ? 'border-ink-300 text-ink-800' : 'border-ink-200 text-ink-700 hover:border-ink-300'}`}
            >
              <I.Calendar size={13}/>
              <span>{currentPeriod.label}</span>
              <I.ChevronDown size={12} className={`transition-transform ${periodOpen ? 'rotate-180' : ''}`}/>
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-ink-0 border border-ink-200 rounded-lg shadow-pop overflow-hidden z-30 min-w-[140px]">
                {PERIODS.map(p => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => { setPeriod(p.v); setPeriodOpen(false); }}
                    className={`block w-full text-left px-3 py-1.5 text-[13px] hover:bg-ink-100 transition-colors ${period === p.v ? 'text-warn font-medium bg-warn-soft/40' : 'text-ink-700'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 fade-up" style={{ animationDelay: '30ms' }}>
        <Kpi label={lang === 'th' ? 'รับปีนี้' : 'Received YTD'} value={D.fmtTHB(D.TOTAL_DIVS_YTD_THB)} tone="warn"/>
        <Kpi label={lang === 'th' ? `รับ ${period} เดือนล่าสุด` : `Last ${period} months`} value={D.fmtTHB(pastNTotal)} />
        <Kpi label={lang === 'th' ? 'Yield-on-Cost' : 'Yield-on-Cost'} value={`${yieldOnCost.toFixed(2)}%`} tone="gain"/>
        <Kpi label={lang === 'th' ? 'Yield-on-Value' : 'Yield-on-Value'} value={`${yieldOnValue.toFixed(2)}%`} />
      </div>

      {/* WHT (withholding tax) breakdown — lightweight "what's already been
          deducted at source" view. Not a tax-filing report. */}
      {whtPaid > 0 && (
        <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card fade-up" style={{ animationDelay: '45ms' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-ink-700 text-sm font-semibold">{t.whtCardTitle}</h3>
                <span className="text-[10px] uppercase tracking-wider text-ink-500 border border-ink-200 rounded px-1.5 py-0.5">{t.whtEffective} {whtEffPct.toFixed(1)}%</span>
              </div>
              <p className="text-ink-500 text-[12px] mt-0.5 max-w-xl">{t.whtCardSub}</p>
            </div>
          </div>

          {/* Gross → WHT → Net row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{t.whtGross}</div>
              <div className="num text-[19px] font-medium text-ink-800 mt-0.5">{D.fmtTHB(whtGross)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{t.whtPaid}</div>
              <div className="num text-[19px] font-medium text-loss mt-0.5">−{D.fmtTHB(whtPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{t.whtNet}</div>
              <div className="num text-[19px] font-medium text-warn mt-0.5">{D.fmtTHB(whtNet)}</div>
            </div>
          </div>

          {/* Stacked bar: gross composition */}
          <div className="mt-4 h-2 w-full rounded-full overflow-hidden bg-ink-100 flex">
            <div className="h-full bg-warn" style={{ width: `${whtGross > 0 ? (whtNet / whtGross) * 100 : 0}%` }}></div>
            <div className="h-full bg-loss" style={{ width: `${whtGross > 0 ? (whtPaid / whtGross) * 100 : 0}%` }}></div>
          </div>

          {/* Per-class breakdown */}
          {whtList.length > 1 && (
            <div className="mt-4 pt-4 border-t border-ink-200">
              <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-2">{t.whtByClass}</div>
              <div className="space-y-1.5">
                {whtList.map(r => (
                  <div key={r.cls} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center text-[12px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: D.ASSET_CLASSES[r.cls]?.color }}></span>
                      <span className="text-ink-700 truncate">{whtClassLabel[r.cls] || D.ASSET_CLASSES[r.cls]?.label}</span>
                    </div>
                    <div className="num text-ink-500 text-right">{D.fmtTHB(r.gross, { compact: true })}</div>
                    <div className="num text-loss text-right w-24">−{D.fmtTHB(r.wht, { compact: true })}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past N months bar chart */}
      <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-ink-700 text-sm font-semibold">{lang === 'th' ? `รับจริง ${period} เดือนล่าสุด` : (t.pastWindow ? t.pastWindow(period) : `Past ${period} months · received`)}</h3>
            <p className="text-ink-500 text-[12px] mt-0.5">{lang === 'th' ? 'แท่งสีอำพันคือเดือนที่ได้รับปันผลจริง' : (t.pastWindowSub || 'Amber bars = actual distributions received')}</p>
          </div>
        </div>
        <div className="mt-5 flex items-end gap-1.5 h-32">
          {pastN.map((v, i) => {
            const monthIdx = (now.getMonth() - (period - 1) + i + 120) % 12;
            const h = (v / maxPast) * 100;
            const stride = period > 36 ? 6 : period > 18 ? 3 : period > 12 ? 2 : 1;
            const showLabel = i % stride === 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-default" title={D.fmtTHB(v)}>
                <div className="text-[9px] text-ink-500 num opacity-0 group-hover:opacity-100 transition-opacity">
                  {v > 0 ? D.fmtTHB(v, { compact: true }) : ''}
                </div>
                <div
                  className={`w-full rounded-sm transition-all ${v > 0 ? 'bg-warn group-hover:bg-warn' : 'bg-ink-200'}`}
                  style={{ height: `${Math.max(h, 4)}%` }}
                ></div>
                <span className="text-[10px] text-ink-500 uppercase">{showLabel ? (lang === 'th' ? monthsTH[monthIdx] : months[monthIdx]) : ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast + Top dividend payers */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 fade-up" style={{ animationDelay: '90ms' }}>
        <window.CashflowCard horizon={period} />
        <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card">
          <h3 className="text-ink-700 text-sm font-semibold">{lang === 'th' ? 'ผู้จ่ายปันผลสูงสุด' : 'Top dividend payers'}</h3>
          <p className="text-ink-500 text-[12px] mt-0.5">{lang === 'th' ? 'จัดเรียงตามปันผลที่รับปีนี้' : 'Sorted by YTD distributions'}</p>
          <div className="mt-4 space-y-2.5">
            {topDivPayers.map(p => {
              const cls = D.ASSET_CLASSES[p.cls];
              const broker = D.BROKERS[p.broker];
              return (
                <div key={p.ticker} className="flex items-center gap-3">
                  <StockLogo ticker={p.ticker} cls={p.cls} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-ink-800 font-medium num truncate">{p.ticker}</div>
                    <div className="text-[10px] text-ink-500 truncate">{broker?.label || p.name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="num text-warn text-[13px] font-medium">{D.fmtTHB(p.divYTD_THB, { compact: true })}</div>
                    <div className="text-[10px] text-ink-500 num">{lang === 'th' ? 'ปีนี้' : 'YTD'}</div>
                  </div>
                </div>
              );
            })}
            {topDivPayers.length === 0 && (
              <div className="text-[12px] text-ink-500 py-8 text-center">{lang === 'th' ? 'ยังไม่มีปันผลปีนี้' : 'No dividends received YTD'}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone='ink' }) {
  const valColor = tone === 'gain' ? 'text-gain' : tone === 'warn' ? 'text-warn' : tone === 'loss' ? 'text-loss' : 'text-ink-800';
  return (
    <div className="bg-ink-50 border border-ink-200 rounded-xl p-4 shadow-card">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`num font-medium text-[20px] mt-1 ${valColor}`}>{value}</div>
    </div>
  );
}

// ------------------------- Goals page -----------------------------
function GoalsPage() {
  const { t, lang } = window.useT();
  const { goals, addGoal, updateGoal, removeGoal } = window.useGoals();
  const [editor, setEditor] = React.useState({ open: false, mode: 'create', goal: null });
  const openCreate = () => setEditor({ open: true, mode: 'create', goal: null });
  const openEdit   = (g) => setEditor({ open: true, mode: 'edit', goal: g });
  const close      = () => setEditor(e => ({ ...e, open: false }));

  return (
    <>
      <PageHeader
        kicker={lang === 'th' ? 'เป้าหมาย' : 'Goals'}
        title={lang === 'th' ? 'เป้าหมายทางการเงิน' : 'Financial goals'}
        subtitle={lang === 'th' ? 'ผูกแต่ละเป้าหมายเข้ากับ App เพื่อให้ความคืบหน้าอัปเดตอัตโนมัติ' : 'Link each goal to your apps so progress updates automatically'}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-ink-700 text-ink-0 hover:bg-ink-800 transition-colors rounded-lg px-3 py-1.5 text-[13px] font-medium"
          >
            <Icon.Plus size={14}/>
            {lang === 'th' ? 'เพิ่มเป้าหมาย' : 'New goal'}
          </button>
        }
      />

      {goals.length === 0 ? (
        <div className="bg-ink-50 border border-dashed border-ink-300 rounded-2xl p-8 text-center">
          <div className="text-ink-700 font-semibold text-[15px]">
            {lang === 'th' ? 'ยังไม่มีเป้าหมาย' : 'No goals yet'}
          </div>
          <p className="text-ink-500 text-[12px] mt-1">
            {lang === 'th' ? 'สร้างเป้าหมายแรกของคุณเพื่อติดตามความคืบหน้า' : 'Create your first goal to start tracking progress'}
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 bg-ink-700 text-ink-0 hover:bg-ink-800 transition-colors rounded-lg px-3 py-1.5 text-[13px] font-medium"
          >
            <Icon.Plus size={14}/>
            {lang === 'th' ? 'เพิ่มเป้าหมาย' : 'New goal'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-up" style={{ animationDelay: '30ms' }}>
          {goals.map(g => (
            <GoalDetailCard key={g.id} g={g} onEdit={() => openEdit(g)} />
          ))}
        </div>
      )}

      <window.GoalEditorModal
        open={editor.open}
        mode={editor.mode}
        goal={editor.goal}
        lang={lang}
        onClose={close}
        onSave={(payload) => {
          if (editor.mode === 'edit' && editor.goal) updateGoal(editor.goal.id, payload);
          else addGoal(payload);
        }}
        onDelete={editor.mode === 'edit' && editor.goal ? () => removeGoal(editor.goal.id) : null}
      />
    </>
  );
}

function GoalDetailCard({ g, onEdit }) {
  const { t, lang } = window.useT();
  const I = window.Icon;
  const pct = Math.min(100, (g.currentTHB / g.target) * 100);
  const remaining = Math.max(0, g.target - g.currentTHB);
  const yearsLeft = Math.max(0, g.etaYear - 2026);
  const monthlyNeed = yearsLeft > 0 ? remaining / (yearsLeft * 12) : remaining;
  const linkedBrokers = (g.linkedBrokers || [])
    .map(id => D.BROKERS[id])
    .filter(Boolean);
  const liveSum = D.ENRICHED
    .filter(a => (g.linkedBrokers || []).includes(a.broker))
    .reduce((s, a) => s + a.valueTHB, 0);
  const manual = g.manualTHB || 0;

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card relative group">
      <button
        onClick={onEdit}
        title={lang === 'th' ? 'แก้ไข' : 'Edit'}
        className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-ink-100 text-ink-400 hover:text-ink-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <I.Sliders size={13}/>
      </button>
      <div className="flex items-start gap-3 pr-7">
        <div className={`w-10 h-10 rounded-lg bg-${g.accent}-soft border border-${g.accent}/20 flex items-center justify-center text-${g.accent} shrink-0`}>
          <window.GoalIcon name={g.icon} size={16}/>
        </div>
        <div className="flex-1 min-w-0">
          <button onClick={onEdit} className="text-ink-800 text-[15px] font-semibold text-left hover:text-ink-900 truncate">
            {g.label[lang] || g.label.en}
          </button>
          <div className="text-ink-500 text-[12px] mt-0.5 num">
            {D.fmtTHB(g.currentTHB)} / {D.fmtTHB(g.target)}
          </div>
        </div>
        <div className={`num text-[22px] font-medium text-${g.accent}`}>{pct.toFixed(0)}%</div>
      </div>

      <div className="mt-4 h-2 bg-ink-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-${g.accent}`}
          style={{ width: `${pct}%`, transition: 'width .4s ease' }}
        ></div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
        <Stat label={lang === 'th' ? 'เหลือ' : 'Remaining'} value={D.fmtTHB(remaining, { compact: true })} />
        <Stat label={lang === 'th' ? 'ถึงปี' : 'Target year'} value={g.etaYear.toString()} />
        <Stat label={lang === 'th' ? 'ต่อเดือน' : 'Monthly need'} value={D.fmtTHB(monthlyNeed, { compact: true })} tone="warn"/>
      </div>

      {/* Linked apps */}
      <div className="mt-4 pt-4 border-t border-ink-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-500">
            {lang === 'th' ? 'ผูกกับแอป' : 'Linked apps'}
          </div>
          {linkedBrokers.length > 0 && (
            <div className="text-[10px] text-ink-500 num">
              {linkedBrokers.length} {lang === 'th' ? 'แอป · ' : 'apps · '}{D.fmtTHB(liveSum, { compact: true })}
            </div>
          )}
        </div>
        {linkedBrokers.length === 0 && manual === 0 ? (
          <button
            onClick={onEdit}
            className="w-full text-[11px] text-ink-500 hover:text-ink-700 border border-dashed border-ink-300 hover:border-ink-400 rounded-md py-2 transition-colors"
          >
            {lang === 'th' ? '+ ผูกกับ App / Broker' : '+ Link an app / broker'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {linkedBrokers.map(b => (
              <div key={b.id} className="flex items-center gap-1.5 bg-ink-100 border border-ink-200 rounded-md pl-1 pr-2 py-1">
                <window.BrokerBadge broker={b} size={18}/>
                <span className="text-[11px] text-ink-700">{b.label}</span>
              </div>
            ))}
            {manual > 0 && (
              <div className="flex items-center gap-1.5 bg-ink-100 border border-ink-200 rounded-md px-2 py-1">
                <I.Banknote size={11} className="text-ink-500"/>
                <span className="text-[11px] text-ink-700 num">
                  {lang === 'th' ? 'นอกแอป ' : 'Manual '}{D.fmtTHB(manual, { compact: true })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone='ink' }) {
  const v = tone === 'warn' ? 'text-warn' : tone === 'gain' ? 'text-gain' : 'text-ink-800';
  return (
    <div className="bg-ink-100 border border-ink-200 rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`num text-[13px] font-medium mt-0.5 ${v}`}>{value}</div>
    </div>
  );
}

// ------------------------- Settings page -----------------------------
const DEFAULT_PROFILE = {
  name: 'Natthapong Kittirungroj',
  email: 'natthapong@example.com',
  phone: '+66 81 234 5678',
  dob: '1992-04-18',
  country: 'TH',
  taxResidency: 'TH',
  refCcy: 'THB',
  timezone: 'Asia/Bangkok',
  riskTolerance: 'moderate', // conservative | moderate | aggressive
  horizon: 'long',           // short | medium | long
  monthlyContribTHB: 30000,
  avatarBg: 'brand',         // brand | violet | gain | warn | loss
  avatarImage: null,         // data URL — overrides gradient + initials when set
  initials: 'NK',
  twoFA: true,
  emailAlerts: true,
  pushAlerts: false,
  useMockData: true,
  policyMode: 'class',
  classTargets: null,
  assetTargets: null,
  hiddenApps: [],
  secDailyKey: '',
  secFactKey: '',
  lang: 'en',
};

const AVATAR_GRADIENT_CLS = {
  brand:  'from-brand to-violet',
  violet: 'from-violet to-brand',
  gain:   'from-gain to-lime',
  warn:   'from-warn to-loss',
  loss:   'from-loss to-violet',
};
const AVATAR_BG_ORDER = ['brand','violet','gain','warn','loss'];

// Avatar editor used in Settings — supports image upload, color cycle,
// and removal. Click the circle to pick a file; image is center-cropped
// + downscaled to 256px before being stored as a data URL.
function ProfileAvatarPicker({ draft, updateDraft, lang }) {
  const fileRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const grad = AVATAR_GRADIENT_CLS[draft.avatarBg] || AVATAR_GRADIENT_CLS.brand;
  const hasImage = !!draft.avatarImage;

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErr(lang === 'th' ? 'ไฟล์ใหญ่เกิน 8MB' : 'File exceeds 8MB');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const dataUrl = await window.fileToAvatarDataUrl(file, 256);
      if (dataUrl) updateDraft({ avatarImage: dataUrl });
    } catch (ex) {
      setErr(lang === 'th' ? 'อ่านไฟล์ไม่สำเร็จ' : 'Could not read file');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title={lang === 'th' ? 'อัปโหลดรูปโปรไฟล์' : 'Upload profile photo'}
        className={`relative w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-card cursor-pointer group hover:scale-105 transition-transform ${hasImage ? 'bg-ink-100' : `bg-gradient-to-br ${grad}`}`}
      >
        {hasImage ? (
          <img src={draft.avatarImage} alt="" className="w-full h-full object-cover"/>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-white text-[20px] font-semibold">{draft.initials}</span>
        )}
        {/* Hover overlay with camera glyph */}
        <span className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/45 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </span>
        {busy && (
          <span className="absolute inset-0 bg-ink-900/50 flex items-center justify-center">
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
          </span>
        )}
      </button>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick}/>

      <div className="flex items-center gap-1 text-[10px]">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-2 py-0.5 rounded-md text-ink-700 hover:bg-ink-100 transition-colors"
        >
          {lang === 'th' ? 'อัปโหลด' : 'Upload'}
        </button>
        {hasImage ? (
          <button
            type="button"
            onClick={() => updateDraft({ avatarImage: null })}
            className="px-2 py-0.5 rounded-md text-loss hover:bg-loss/10 transition-colors"
          >
            {lang === 'th' ? 'ลบรูป' : 'Remove'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updateDraft({ avatarBg: AVATAR_BG_ORDER[(AVATAR_BG_ORDER.indexOf(draft.avatarBg) + 1) % AVATAR_BG_ORDER.length] })}
            className="px-2 py-0.5 rounded-md text-ink-500 hover:bg-ink-100 transition-colors"
            title={lang === 'th' ? 'สลับสี' : 'Cycle color'}
          >
            {lang === 'th' ? 'สีพื้น' : 'Color'}
          </button>
        )}
      </div>

      {err && <div className="text-[10px] text-loss">{err}</div>}
    </div>
  );
}

function CloudSyncPanel({ lang }) {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState(null);
  const [successMsg, setSuccessMsg] = React.useState(null);

  React.useEffect(() => {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
    });

    // Listen to changes directly
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const supabase = window.supabaseClient;
    if (!supabase) {
      setErrorMsg(lang === 'th' ? 'ไม่สามารถเชื่อมต่อระบบฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต' : 'Cannot connect to database. Please check your internet connection.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg(lang === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill out all fields');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data.user && data.session === null) {
          setSuccessMsg(lang === 'th' ? 'สมัครสมาชิกสำเร็จ! โปรดตรวจสอบอีเมลเพื่อยืนยันตน' : 'Signed up successfully! Check your email to verify.');
        } else {
          setSuccessMsg(lang === 'th' ? 'สมัครสมาชิกสำเร็จและเข้าสู่ระบบเรียบร้อย!' : 'Registered and signed in successfully!');
          setSession(data.session);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        setSession(data.session);
        setSuccessMsg(lang === 'th' ? 'เข้าสู่ระบบสำเร็จ!' : 'Signed in successfully!');
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const supabase = window.supabaseClient;
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Supabase signOut error", err);
    } finally {
      // Force local clean state even if server session clean failed
      setSession(null);
      setLoading(false);
      window.location.reload();
    }
  };

  const user = session?.user;

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card fade-up mb-4">
      <div className="flex items-start gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${user ? 'bg-gain-soft text-gain' : 'bg-brand-soft text-brand'}`}>
            {user ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19A5.5 5.5 0 0 0 18 8.02a1 1 0 0 0-.89-.58h-.07a7.5 7.5 0 0 0-14.54 2.25 1 1 0 0 0 .78 1.13A4 4 0 0 0 7.5 19H17.5z"/>
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-ink-700 text-sm font-semibold">
              {lang === 'th' ? 'การซิงค์ข้อมูลคลาวด์' : 'Cloud Sync & Storage'}
            </h3>
            <p className="text-ink-500 text-[12px] mt-0.5">
              {user 
                ? (lang === 'th' ? 'พอร์ตของคุณกำลังซิงค์และแบ็กอัปอยู่บนเซิร์ฟเวอร์แบบเรียลไทม์' : 'Your portfolio is synced and backed up on the cloud in real-time')
                : (lang === 'th' ? 'สมัครสมาชิกเพื่อจัดเก็บข้อมูลธุรกรรมและพอร์ตของคุณบนคลาวด์ฟรี' : 'Create a free account to back up and sync your transactions across devices')}
            </p>
          </div>
        </div>
        {user && (
          <span className="text-[10px] uppercase tracking-wider text-gain bg-gain-soft border border-gain/20 rounded px-2 py-0.5 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-gain animate-ping"></span>
            {lang === 'th' ? 'เชื่อมต่อแล้ว' : 'Connected'}
          </span>
        )}
      </div>

      {user ? (
        <div className="mt-5 pt-4 border-t border-ink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-[10px] text-ink-500 uppercase tracking-wider font-semibold">
              {lang === 'th' ? 'บัญชีผู้ใช้ปัจจุบัน' : 'Logged in as'}
            </div>
            <div className="text-ink-800 text-[14px] font-medium">{user.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="px-4 py-2 bg-ink-100 hover:bg-ink-200 border border-ink-300 text-ink-700 text-[12px] font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (lang === 'th' ? 'กำลังโหลด...' : 'Loading...') : (lang === 'th' ? 'ออกจากระบบ' : 'Sign Out')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="mt-5 pt-4 border-t border-ink-200 space-y-4">
          <div className="flex items-center gap-1 bg-ink-100 border border-ink-200 rounded-lg p-0.5 text-[12px] w-fit">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMsg(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${authMode === 'signin' ? 'bg-ink-200 text-ink-800 font-medium' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${authMode === 'signup' ? 'bg-ink-200 text-ink-800 font-medium' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {lang === 'th' ? 'สมัครสมาชิก' : 'Create Account'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2 focus-within:border-brand focus-within:bg-card transition-colors">
              <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{lang === 'th' ? 'อีเมล' : 'Email Address'}</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400"
              />
            </label>
            <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2 focus-within:border-brand focus-within:bg-card transition-colors">
              <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{lang === 'th' ? 'รหัสผ่าน' : 'Password'}</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400"
              />
            </label>
          </div>

          {errorMsg && (
            <div className="text-loss text-[12px] bg-loss-soft/20 border border-loss/20 rounded-lg p-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="text-gain text-[12px] bg-gain-soft/20 border border-gain/20 rounded-lg p-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2 bg-brand text-white hover:opacity-90 text-[13px] font-semibold rounded-lg transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
            <span>
              {authMode === 'signin'
                ? (lang === 'th' ? 'เข้าสู่ระบบคลาวด์' : 'Sign In')
                : (lang === 'th' ? 'สร้างบัญชีผู้ใช้' : 'Create Account')}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}

function SettingsPage() {
  const { t, lang, setLang } = window.useT();
  // We now use draft for everything.
  const [useMockData, setUseMockData] = React.useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('netto:useMockData') !== 'false';
    }
    return true;
  });

  // Profile state — hydrated from localStorage, reset-able
  const [profile, setProfile] = React.useState(() => {
    try {
      const raw = localStorage.getItem('netto:profile');
      let base = { ...DEFAULT_PROFILE };
      const user = window.AppUser;
      if (user) {
        base.email = user.email;
      }
      let finalProfile = raw ? { ...base, ...JSON.parse(raw) } : base;
      
      // Supabase metadata always overrides local storage for name/email/phone/dob etc.
      if (user) {
        finalProfile.email = user.email;
        if (user.user_metadata) {
          const meta = user.user_metadata;
          if (meta.full_name) {
            finalProfile.name = meta.full_name;
            const parts = finalProfile.name.trim().split(/\s+/).filter(Boolean);
            if (parts.length >= 2) finalProfile.initials = (parts[0][0] + parts[1][0]).toUpperCase();
            else if (parts.length === 1) finalProfile.initials = parts[0].slice(0, 2).toUpperCase();
          }
          if (meta.phone) finalProfile.phone = meta.phone;
          if (meta.dob) finalProfile.dob = meta.dob;
          if (meta.country) finalProfile.country = meta.country;
          if (meta.taxResidency) finalProfile.taxResidency = meta.taxResidency;
          if (meta.refCcy) finalProfile.refCcy = meta.refCcy;
          if (meta.timezone) finalProfile.timezone = meta.timezone;
          if (meta.riskTolerance) finalProfile.riskTolerance = meta.riskTolerance;
          if (meta.horizon) finalProfile.horizon = meta.horizon;
          if (meta.monthlyContribTHB !== undefined) finalProfile.monthlyContribTHB = meta.monthlyContribTHB;
          if (meta.avatarBg) finalProfile.avatarBg = meta.avatarBg;
          if (meta.avatarImage !== undefined) finalProfile.avatarImage = meta.avatarImage;
          if (meta.twoFA !== undefined) finalProfile.twoFA = meta.twoFA;
          if (meta.emailAlerts !== undefined) finalProfile.emailAlerts = meta.emailAlerts;
          if (meta.pushAlerts !== undefined) finalProfile.pushAlerts = meta.pushAlerts;
          
          if (meta.useMockData !== undefined) finalProfile.useMockData = meta.useMockData;
          if (meta.policyMode) finalProfile.policyMode = meta.policyMode;
          if (meta.classTargets) finalProfile.classTargets = meta.classTargets;
          if (meta.assetTargets) finalProfile.assetTargets = meta.assetTargets;
          if (meta.hiddenApps) finalProfile.hiddenApps = meta.hiddenApps;
          if (meta.secDailyKey) finalProfile.secDailyKey = meta.secDailyKey;
          if (meta.secFactKey) finalProfile.secFactKey = meta.secFactKey;
          if (meta.lang) finalProfile.lang = meta.lang;
        }
      }
      return finalProfile;
    } catch { return { ...DEFAULT_PROFILE }; }
  });
  const [draft, setDraft] = React.useState(profile);
  const dirty = React.useMemo(() => JSON.stringify(profile) !== JSON.stringify(draft), [profile, draft]);
  const updateDraft = (patch) => setDraft(p => {
    const next = { ...p, ...patch };
    if (patch.name !== undefined) {
      const parts = (patch.name || '').trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) next.initials = (parts[0][0] + parts[1][0]).toUpperCase();
      else if (parts.length === 1) next.initials = parts[0].slice(0, 2).toUpperCase();
    }
    return next;
  });
  const saveProfile = () => {
    setProfile(draft);
    try { localStorage.setItem('netto:profile', JSON.stringify(draft)); } catch {}
    if (window.supabaseClient && window.AppUser) {
      window.supabaseClient.auth.updateUser({ 
        data: { 
          full_name: draft.name, 
          phone: draft.phone, 
          dob: draft.dob,
          country: draft.country,
          taxResidency: draft.taxResidency,
          refCcy: draft.refCcy,
          timezone: draft.timezone,
          riskTolerance: draft.riskTolerance,
          horizon: draft.horizon,
          monthlyContribTHB: draft.monthlyContribTHB,
          avatarBg: draft.avatarBg,
          avatarImage: draft.avatarImage,
          twoFA: draft.twoFA,
          emailAlerts: draft.emailAlerts,
          pushAlerts: draft.pushAlerts,
          useMockData: !!draft.useMockData,
          policyMode: draft.policyMode,
          classTargets: draft.classTargets,
          assetTargets: draft.assetTargets,
          hiddenApps: draft.hiddenApps,
          secDailyKey: draft.secDailyKey,
          secFactKey: draft.secFactKey,
          lang: draft.lang,
        } 
      });
    }
    // Also push updates to localStorage directly for immediate UI feedback elsewhere
    try {
      localStorage.setItem('netto:useMockData', draft.useMockData ? 'true' : 'false');
      if (draft.useMockData !== (profile.useMockData === true)) {
        window.location.reload();
        return;
      }
      if (draft.classTargets) {
        localStorage.setItem('netto:classTargets', JSON.stringify(draft.classTargets));
        window.DataLayer.TARGET = draft.classTargets;
        window.DataLayer.recomputeDerived();
      }
      if (draft.assetTargets) localStorage.setItem('netto:assetTargets', JSON.stringify(draft.assetTargets));
      localStorage.setItem('netto:policyMode', draft.policyMode || 'class');
      localStorage.setItem('netto:hiddenApps', JSON.stringify(draft.hiddenApps || []));
      localStorage.setItem('wealthos_lang', draft.lang || 'en');
      if (window.SecApi && (draft.secDailyKey || draft.secFactKey)) {
        window.SecApi.setKeys(draft.secDailyKey || '', draft.secFactKey || '');
      }
    } catch {}
    try { window.dispatchEvent(new Event('netto:profile-changed')); } catch {}
  };
  const revertProfile = () => setDraft(profile);

  if (!draft.classTargets) draft.classTargets = { ...D.TARGET };
  if (!draft.assetTargets) {
    const out = {};
    D.ENRICHED.filter(a => a.cls !== 'cash').forEach(a => {
      out[a.ticker] = a.valueTHB / D.TOTAL_THB;
    });
    draft.assetTargets = out;
  }
  const policyMode = draft.policyMode || 'class';

  function autoBalance(map, setter) {
    const sum = Object.values(map).reduce((s, v) => s + v, 0);
    if (sum === 0) return;
    const scale = 1 / sum;
    const next = {};
    Object.entries(map).forEach(([k, v]) => { next[k] = v * scale; });
    updateDraft({ [setter]: next });
  }

  function resetToCurrent() {
    if (policyMode === 'class') {
      const next = {};
      D.ALLOCATION.forEach(c => { next[c.id] = c.pct; });
      updateDraft({ classTargets: next });
    } else {
      const next = {};
      D.ENRICHED.filter(a => a.cls !== 'cash').forEach(a => { next[a.ticker] = a.valueTHB / D.TOTAL_THB; });
      updateDraft({ assetTargets: next });
    }
  }

  return (
    <>
      <PageHeader
        kicker={t.nav.settings}
        title={lang === 'th' ? 'การตั้งค่า' : 'Settings'}
        subtitle={lang === 'th' ? 'ภาษา นโยบาย และแอปลงทุน' : 'Language, policy, and connected investment apps'}
      />

      <CloudSyncPanel lang={lang} />

      <SettingsSection title={lang === 'th' ? 'ภาษา' : 'Language'} desc={lang === 'th' ? 'เปลี่ยนภาษาที่แสดง' : 'Display language for the app'}>
        <div className="flex items-center gap-2">
          {[
            { id: 'en', label: 'English' },
            { id: 'th', label: 'ภาษาไทย' },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => {
                setLang(l.id);
                updateDraft({ lang: l.id });
              }}
              className={`text-[13px] px-3 py-1.5 rounded-lg border transition-colors ${draft.lang === l.id ? 'bg-ink-200 text-ink-800 border-ink-300' : 'bg-ink-100 text-ink-500 border-ink-200 hover:text-ink-700'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title={lang === 'th' ? 'นโยบายการจัดสรร' : 'Target allocation policy'}
        desc={lang === 'th' ? 'น้ำหนักเป้าหมายที่ระบบจะใช้คำนวณ Smart Rebalancer' : 'Target weights powering the Smart Rebalancer'}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-ink-100 border border-ink-200 rounded-lg p-0.5 text-[12px]">
            {[
              { id: 'class', label: lang === 'th' ? 'ตาม Class' : 'By Class', sub: 'Basic' },
              { id: 'asset', label: lang === 'th' ? 'รายตัว'  : 'Per Asset', sub: 'Advanced' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => updateDraft({ policyMode: m.id })}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${policyMode === m.id ? 'bg-ink-200 text-ink-800' : 'text-ink-500 hover:text-ink-700'}`}
              >
                {m.label}
                {m.sub === 'Advanced' && policyMode !== m.id && (
                  <span className="text-[9px] uppercase tracking-wider text-violet bg-violet-soft px-1 py-0.5 rounded">Adv</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToCurrent}
              className="text-[11px] text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-ink-100"
            >
              <Icon.Refresh size={11}/>
              {lang === 'th' ? 'ใช้ค่าปัจจุบัน' : 'Use current'}
            </button>
            <button
              onClick={() => {
                if (policyMode === 'class') autoBalance(draft.classTargets, 'classTargets');
                else autoBalance(draft.assetTargets, 'assetTargets');
              }}
              className="text-[11px] text-brand hover:text-brand/80 transition-colors flex items-center gap-1 px-2 py-1 rounded-md bg-brand-soft border border-brand/30"
            >
              <Icon.Scale size={11}/>
              {lang === 'th' ? 'ปรับให้ครบ 100%' : 'Auto-balance'}
            </button>
          </div>
        </div>

        {policyMode === 'class' && (
          <ClassPolicy targets={draft.classTargets} update={(k, v) => updateDraft({ classTargets: { ...draft.classTargets, [k]: Math.max(0, Math.min(1, v / 100)) } })} />
        )}
        {policyMode === 'asset' && (
          <AssetPolicy targets={draft.assetTargets} update={(k, v) => updateDraft({ assetTargets: { ...draft.assetTargets, [k]: Math.max(0, Math.min(1, v / 100)) } })} />
        )}

        <PolicyTotal
          map={policyMode === 'class' ? draft.classTargets : draft.assetTargets}
        />
      </SettingsSection>

      <SettingsSection title={lang === 'th' ? 'แอปลงทุนที่เชื่อมโยง' : 'Investment apps'} desc={lang === 'th' ? 'เลือกแอปที่ใช้งานเพื่อให้ง่ายตอนบันทึกธุรกรรม' : 'Toggle visibility for apps you actually use'}>
        <ConnectedAppsManager lang={lang} draft={draft} updateDraft={updateDraft} />
      </SettingsSection>



      <SettingsSection title={lang === 'th' ? 'จัดการข้อมูล' : 'Data Management'}>
        <div className="flex items-center justify-between py-2">
          <div className="text-sm font-medium text-ink-900">{lang === 'th' ? 'แสดงข้อมูลพอร์ตจำลอง (Demo)' : 'Demo Portfolio Data'}</div>
          <button 
            onClick={() => updateDraft({ useMockData: !draft.useMockData })}
            className={`w-10 h-5 rounded-full relative transition-colors ${draft.useMockData ? 'bg-brand-500' : 'bg-ink-300'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${draft.useMockData ? 'left-[22px]' : 'left-0.5'}`}></div>
          </button>
        </div>
      </SettingsSection>

      <SettingsSection
        title={lang === 'th' ? 'โปรไฟล์' : 'Profile'}
        desc={lang === 'th' ? 'ข้อมูลบัญชี รหัสผ่าน และโปรไฟล์นักลงทุน' : 'Account, security, and investor profile'}
      >
        <div className="flex items-center gap-4 pb-5 mb-5 border-b border-ink-200">
          <ProfileAvatarPicker
            draft={draft}
            updateDraft={updateDraft}
            lang={lang}
          />
          <div className="flex-1 min-w-0">
            <div className="text-ink-900 font-semibold text-[15px] truncate">{draft.name || (lang === 'th' ? '— ไม่มีชื่อ —' : '— No name —')}</div>
            <div className="text-ink-500 text-[12px] truncate">{draft.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EditableField
            label={lang === 'th' ? 'ชื่อ–นามสกุล' : 'Full name'}
            value={draft.name}
            onChange={(v) => updateDraft({ name: v })}
          />
          <EditableField
            label="Email"
            value={draft.email}
            type="email"
            onChange={(v) => updateDraft({ email: v })}
          />
          <EditableField
            label={lang === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}
            value={draft.phone}
            type="tel"
            onChange={(v) => updateDraft({ phone: v })}
          />
          <EditableField
            label={lang === 'th' ? 'วันเกิด' : 'Date of birth'}
            value={draft.dob}
            type="date"
            onChange={(v) => updateDraft({ dob: v })}
          />
          <EditableSelect
            label={lang === 'th' ? 'ประเทศ' : 'Country'}
            value={draft.country}
            onChange={(v) => updateDraft({ country: v })}
            options={[
              { v: 'TH', l: lang === 'th' ? 'ไทย' : 'Thailand' },
              { v: 'US', l: 'United States' },
              { v: 'JP', l: lang === 'th' ? 'ญี่ปุ่น' : 'Japan' },
              { v: 'SG', l: lang === 'th' ? 'สิงคโปร์' : 'Singapore' },
              { v: 'HK', l: lang === 'th' ? 'ฮ่องกง' : 'Hong Kong' },
              { v: 'UK', l: lang === 'th' ? 'สหราชอาณาจักร' : 'United Kingdom' },
            ]}
          />
          <EditableSelect
            label={lang === 'th' ? 'ถิ่นที่เสียภาษี' : 'Tax residency'}
            value={draft.taxResidency}
            onChange={(v) => updateDraft({ taxResidency: v })}
            options={[
              { v: 'TH', l: lang === 'th' ? 'ไทย' : 'Thailand' },
              { v: 'US', l: 'United States' },
              { v: 'JP', l: lang === 'th' ? 'ญี่ปุ่น' : 'Japan' },
              { v: 'SG', l: lang === 'th' ? 'สิงคโปร์' : 'Singapore' },
              { v: 'OTHER', l: lang === 'th' ? 'อื่นๆ' : 'Other' },
            ]}
          />
          <EditableSelect
            label={lang === 'th' ? 'สกุลเงินอ้างอิง' : 'Reference currency'}
            value={draft.refCcy}
            onChange={(v) => updateDraft({ refCcy: v })}
            options={[
              { v: 'THB', l: 'THB · บาท' },
              { v: 'USD', l: 'USD · US Dollar' },
              { v: 'EUR', l: 'EUR · Euro' },
              { v: 'JPY', l: 'JPY · Japanese Yen' },
              { v: 'SGD', l: 'SGD · Singapore Dollar' },
            ]}
          />
          <EditableSelect
            label={lang === 'th' ? 'เขตเวลา' : 'Timezone'}
            value={draft.timezone}
            onChange={(v) => updateDraft({ timezone: v })}
            options={[
              { v: 'Asia/Bangkok', l: 'Asia/Bangkok · UTC+7' },
              { v: 'Asia/Singapore', l: 'Asia/Singapore · UTC+8' },
              { v: 'Asia/Tokyo', l: 'Asia/Tokyo · UTC+9' },
              { v: 'America/New_York', l: 'America/New_York · UTC−5' },
              { v: 'Europe/London', l: 'Europe/London · UTC±0' },
            ]}
          />
        </div>

        <div className="mt-6 pt-5 border-t border-ink-200">
          <h4 className="text-ink-700 text-[12px] font-semibold uppercase tracking-wider mb-3">
            {lang === 'th' ? 'โปรไฟล์นักลงทุน' : 'Investor Profile'}
          </h4>
          <div className="space-y-4">
            <SegmentedField
              label={lang === 'th' ? 'ระดับความเสี่ยงที่ยอมรับได้' : 'Risk tolerance'}
              value={draft.riskTolerance}
              onChange={(v) => updateDraft({ riskTolerance: v })}
              options={[
                { v: 'conservative', l: lang === 'th' ? 'ระมัดระวัง' : 'Conservative' },
                { v: 'moderate',     l: lang === 'th' ? 'ปานกลาง' : 'Moderate' },
                { v: 'aggressive',   l: lang === 'th' ? 'เชิงรุก' : 'Aggressive' },
              ]}
            />
            <SegmentedField
              label={lang === 'th' ? 'ระยะเวลาลงทุน' : 'Investment horizon'}
              value={draft.horizon}
              onChange={(v) => updateDraft({ horizon: v })}
              options={[
                { v: 'short',  l: lang === 'th' ? '< 3 ปี'  : '< 3 yrs' },
                { v: 'medium', l: lang === 'th' ? '3–7 ปี'  : '3–7 yrs' },
                { v: 'long',   l: lang === 'th' ? '> 7 ปี'  : '> 7 yrs' },
              ]}
            />
            <div>
              <label className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">
                {lang === 'th' ? 'เงินลงทุนรายเดือน (THB)' : 'Monthly contribution (THB)'}
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  type="range"
                  min="0" max="200000" step="5000"
                  value={draft.monthlyContribTHB}
                  onChange={(e) => updateDraft({ monthlyContribTHB: parseInt(e.target.value, 10) })}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0" step="1000"
                  value={draft.monthlyContribTHB}
                  onChange={(e) => updateDraft({ monthlyContribTHB: parseInt(e.target.value || '0', 10) })}
                  className="w-28 bg-ink-100 border border-ink-200 rounded-lg px-3 py-2 text-[13px] text-ink-900 num text-right focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-ink-200 flex items-center justify-between gap-3">
          <div className="text-[12px] text-ink-500">
            {dirty
              ? (lang === 'th' ? '• มีการเปลี่ยนแปลงยังไม่ได้บันทึก' : '• You have unsaved changes')
              : (lang === 'th' ? 'บันทึกล่าสุด: เมื่อสักครู่' : 'Last saved: just now')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={revertProfile}
              disabled={!dirty}
              className="px-3.5 py-2 rounded-full text-[12px] font-semibold border border-ink-200 text-ink-700 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {lang === 'th' ? 'ยกเลิก' : 'Discard'}
            </button>
            <button
              onClick={saveProfile}
              disabled={!dirty}
              className="px-4 py-2 rounded-full text-[12px] font-semibold bg-brand text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity flex items-center gap-1.5"
            >
              <Icon.Check size={12}/>
              {lang === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save changes'}
            </button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title={lang === 'th' ? 'ล้างข้อมูล' : 'Danger Zone'}
        desc={lang === 'th' ? 'ล้างข้อมูลธุรกรรมและประวัติทั้งหมด' : 'Delete all custom transaction history and reset data'}
      >
        <div className="bg-loss-soft/20 border border-loss/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-loss text-[13px] font-semibold flex items-center gap-1.5">
              <Icon.Alert size={14}/>
              {lang === 'th' ? 'ลบประวัติธุรกรรมทั้งหมด' : 'Clear All Transaction History'}
            </h4>
            <p className="text-ink-500 text-[12px] max-w-md">
              {lang === 'th' 
                ? 'การลบนี้จะล้างประวัติการทำรายการซื้อ/ขาย/ปันผลที่คุณบันทึกไว้ทั้งหมดจากเบราว์เซอร์นี้ และไม่สามารถกู้คืนได้' 
                : 'This will delete all custom buy, sell, and dividend transactions you have logged on this browser. This action cannot be undone.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const confirmMsg = lang === 'th' 
                ? 'คุณแน่ใจหรือไม่ที่จะลบประวัติธุรกรรมทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้' 
                : 'Are you sure you want to delete all transaction history? This action is permanent and cannot be undone.';
              if (window.confirm(confirmMsg)) {
                localStorage.removeItem('netto:userTxs');
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-loss text-white text-[12px] font-semibold rounded-lg hover:bg-loss/90 transition-colors shadow-sm self-start md:self-auto cursor-pointer"
          >
            {lang === 'th' ? 'ล้างประวัติทั้งหมด' : 'Clear All History'}
          </button>
        </div>
      </SettingsSection>
    </>
  );
}

function ClassPolicy({ targets, update }) {
  const { t } = window.useT();
  return (
    <div className="space-y-3">
      {Object.values(D.ASSET_CLASSES).map(c => {
        const tgt = (targets[c.id] || 0) * 100;
        const cur = (D.ALLOCATION.find(a => a.id === c.id)?.pct || 0) * 100;
        const drift = tgt - cur;
        return (
          <PolicyRow
            key={c.id}
            label={t.classes[c.id] || c.label}
            color={c.color}
            target={tgt}
            current={cur}
            drift={drift}
            onChange={(v) => update(c.id, v)}
          />
        );
      })}
    </div>
  );
}

function AssetPolicy({ targets, update }) {
  const { lang, t } = window.useT();
  const [groupBy, setGroupBy] = React.useState('class');
  const [collapsed, setCollapsed] = React.useState({});
  const assets = D.ENRICHED.filter(a => a.cls !== 'cash');

  const groups = React.useMemo(() => {
    const map = new Map();
    assets.forEach(a => {
      const key = groupBy === 'class' ? a.cls : a.broker;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    map.forEach(arr => arr.sort((a, b) => b.valueTHB - a.valueTHB));
    return [...map.entries()].map(([key, list]) => {
      const meta = groupBy === 'class'
        ? D.ASSET_CLASSES[key]
        : (D.BROKERS[key] || { id: key, label: key, color: 'oklch(0.62 0.015 250)' });
      const groupTargetPct = list.reduce((s, a) => s + (targets[a.ticker] || 0), 0) * 100;
      const groupCurrentPct = list.reduce((s, a) => s + a.valueTHB, 0) / D.TOTAL_THB * 100;
      return { key, meta, list, groupTargetPct, groupCurrentPct };
    }).sort((a, b) => b.groupCurrentPct - a.groupCurrentPct);
  }, [groupBy, targets]);

  function toggleCollapse(key) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-ink-500 uppercase tracking-wider">
          {lang === 'th' ? 'จัดกลุ่มตาม' : 'Group by'}
        </div>
        <div className="flex items-center gap-0.5 bg-ink-100 border border-ink-200 rounded-md p-0.5 text-[11px]">
          {[
            { id: 'class',  label: 'Class' },
            { id: 'broker', label: 'App' },
          ].map(g => (
            <button
              key={g.id}
              onClick={() => setGroupBy(g.id)}
              className={`px-2 py-0.5 rounded transition-colors ${groupBy === g.id ? 'bg-ink-200 text-ink-800' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-[560px] overflow-y-auto scroll-thin pr-1">
        {groups.map(g => {
          const isCollapsed = !!collapsed[g.key];
          const groupDrift = g.groupTargetPct - g.groupCurrentPct;
          return (
            <div key={g.key} className="border border-ink-200 rounded-lg bg-ink-100/40">
              <button
                onClick={() => toggleCollapse(g.key)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-ink-100 transition-colors"
              >
                <window.Icon.ChevronDown size={12} className={`text-ink-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}/>
                {groupBy === 'broker' && D.BROKERS[g.key] ? (
                  <window.BrokerBadge broker={D.BROKERS[g.key]} size={18}/>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: g.meta.color }}></span>
                )}
                <span className="text-[12px] text-ink-800 font-medium">{groupBy === 'class' ? (t.classes[g.key] || g.meta.label) : g.meta.label}</span>
                <span className="text-[10px] text-ink-500 num">{g.list.length}</span>
                <div className="flex-1"></div>
                <span className="text-[10px] text-ink-500 num">
                  {lang === 'th' ? 'รวมในกลุ่ม' : 'group sum'}
                </span>
                <span className="text-[11px] text-ink-700 num font-medium">{g.groupTargetPct.toFixed(1)}%</span>
                <span className="text-ink-400 mx-1">·</span>
                <span className="text-[10px] text-ink-500 num">
                  {lang === 'th' ? 'ปัจจุบัน' : 'now'} {g.groupCurrentPct.toFixed(1)}%
                </span>
                <span className={`text-[10px] num w-12 text-right ${Math.abs(groupDrift) < 1 ? 'text-ink-500' : groupDrift > 0 ? 'text-warn' : 'text-brand'}`}>
                  {groupDrift > 0 ? '+' : ''}{groupDrift.toFixed(1)}
                </span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-ink-200 px-3 py-2 space-y-1.5">
                  {g.list.map(a => {
                    const tgt = (targets[a.ticker] || 0) * 100;
                    const cls = D.ASSET_CLASSES[a.cls];
                    return (
                      <div key={a.ticker} className="flex items-center gap-3 py-1">
                        <div className="flex items-center gap-2 w-44 shrink-0 min-w-0">
                          <span
                            className="w-[18px] h-[18px] rounded-md flex items-center justify-center text-[8px] font-mono font-semibold shrink-0"
                            style={{ color: cls.color, background: `color-mix(in oklch, ${cls.color} 12%, transparent)`, border: `1px solid color-mix(in oklch, ${cls.color} 24%, transparent)` }}
                          >
                            {a.ticker.replace(/[^A-Z0-9]/g,'').slice(0,2)}
                          </span>
                          <div className="text-[12px] text-ink-700 truncate num">{a.ticker.replace('-THB','')}</div>
                        </div>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="0" max="100" step="0.5"
                            value={tgt}
                            onChange={(e) => update(a.ticker, parseFloat(e.target.value))}
                            className="w-full"
                            style={{ accentColor: cls.color }}
                          />
                        </div>
                        <div className="w-16 text-right shrink-0">
                          <input
                            type="number"
                            min="0" max="100" step="0.5"
                            value={tgt.toFixed(1)}
                            onChange={(e) => update(a.ticker, parseFloat(e.target.value) || 0)}
                            className="w-12 bg-ink-100 border border-ink-200 rounded px-1.5 py-0.5 text-[11px] text-ink-800 num text-right focus:outline-none focus:border-brand"
                          />
                          <span className="text-[11px] text-ink-500 ml-1">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PolicyRow({ label, sublabel, color, target, current, drift, onChange, step = 1 }) {
  const driftAbs = Math.abs(drift);
  const driftColor = driftAbs < 1 ? 'text-ink-500' : drift > 0 ? 'text-warn' : 'text-brand';
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex items-center gap-2 w-44 shrink-0 min-w-0">
        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }}></span>
        <div className="min-w-0">
          <div className="text-[13px] text-ink-700 truncate">{label}</div>
          {sublabel && <div className="text-[10px] text-ink-500 truncate">{sublabel}</div>}
        </div>
      </div>
      <div className="flex-1 relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-ink-100"></div>
        <div className="absolute left-0 h-1.5 rounded-full" style={{ width: `${target}%`, background: color, opacity: 0.9 }}></div>
        <div
          className="absolute w-0.5 h-4 rounded-full bg-ink-600 pointer-events-none"
          style={{ left: `${current}%`, transform: 'translateX(-50%)' }}
          title={`${current.toFixed(1)}%`}
        ></div>
        <div
          className="absolute w-4 h-4 rounded-full bg-white shadow-card pointer-events-none"
          style={{ left: `${target}%`, transform: 'translateX(-50%)', border: `3px solid ${color}` }}
        ></div>
        <input
          type="range"
          min="0" max="100" step={step}
          value={target}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-6 opacity-0 cursor-pointer m-0"
        />
      </div>
      <div className="flex items-center gap-2 w-44 shrink-0 justify-end">
        <span className={`text-[10px] num w-12 text-right ${driftColor}`} title="Drift vs current">
          {drift > 0 ? '+' : ''}{drift.toFixed(1)}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0" max="100" step={step}
            value={target.toFixed(step < 1 ? 1 : 0)}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-14 bg-ink-100 border border-ink-200 rounded px-1.5 py-0.5 text-[12px] text-ink-800 num text-right focus:outline-none focus:border-brand"
          />
          <span className="text-[12px] text-ink-500">%</span>
        </div>
      </div>
    </div>
  );
}

function PolicyTotal({ map }) {
  const { lang } = window.useT();
  const sumPct = Object.values(map).reduce((s, v) => s + v, 0) * 100;
  const balanced = Math.abs(sumPct - 100) < 0.5;
  return (
    <div className={`mt-4 px-3 py-2 rounded-lg border text-[12px] flex items-center justify-between ${balanced ? 'bg-gain-soft border-gain/20 text-gain' : 'bg-warn-soft border-warn/20 text-warn'}`}>
      <span className="flex items-center gap-2">
        {balanced ? <Icon.Check size={12}/> : <Icon.Alert size={12}/>}
        {balanced
          ? (lang === 'th' ? 'รวม 100% พอดี — บันทึกอัตโนมัติ' : 'Totals 100% — auto-saved')
          : (lang === 'th' ? `รวม ${sumPct.toFixed(1)}% — ปรับให้ครบ 100% ก่อนบันทึก` : `Weights total ${sumPct.toFixed(1)}% — must equal 100%`)
        }
      </span>
      <span className="num font-medium">{sumPct.toFixed(1)}%</span>
    </div>
  );
}

function SettingsSection({ title, desc, children }) {
  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card fade-up">
      <div className="mb-4">
        <h3 className="text-ink-700 text-sm font-semibold">{title}</h3>
        {desc && <p className="text-ink-500 text-[12px] mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SecApiSettingsManager({ lang, draft, updateDraft }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-700">Fund Daily Info Key</label>
        <input 
          type="text"
          className="px-3 py-2 bg-white border border-line rounded-lg text-sm text-ink-900 focus:outline-none focus:border-brand-500 transition-all"
          value={draft.secDailyKey || ''}
          onChange={e => updateDraft({ secDailyKey: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-700">Fund Factsheet Key</label>
        <input 
          type="text"
          className="px-3 py-2 bg-white border border-line rounded-lg text-sm text-ink-900 focus:outline-none focus:border-brand-500 transition-all"
          value={draft.secFactKey || ''}
          onChange={e => updateDraft({ secFactKey: e.target.value })}
        />
      </div>
    </div>
  );
}

function ConnectedAppsManager({ lang, draft, updateDraft }) {
  const D = window.DataLayer;
  const { BrokerBadge, Icon } = window;
  const allBrokers = Object.values(D.BROKERS);
  const hidden = new Set(draft.hiddenApps || []);
  const toggle = (id) => {
    const next = new Set(hidden);
    next.has(id) ? next.delete(id) : next.add(id);
    updateDraft({ hiddenApps: [...next] });
  };
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const [suggestName, setSuggestName] = React.useState('');
  const [suggestKind, setSuggestKind] = React.useState('Mutual funds');
  const [suggestNote, setSuggestNote] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const submitSuggestion = () => {
    if (!suggestName.trim()) return;
    setSubmitted(true);
    setTimeout(() => { setSuggestOpen(false); setSubmitted(false); setSuggestName(''); setSuggestNote(''); }, 1400);
  };
  const kindOrder = ['Thai stocks', 'All-in-one', 'TH + US', 'US stocks', 'Mutual funds', 'Auto-invest', 'Crypto', 'Global', 'Coop savings', 'Cash'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {allBrokers.map(b => {
          const isHidden = hidden.has(b.id);
          return (
            <button
              key={b.id}
              onClick={() => toggle(b.id)}
              className={`relative flex items-center gap-2.5 border rounded-lg px-3 py-2 cursor-pointer transition-all ${
                isHidden ? 'bg-ink-100/40 border-ink-200 opacity-55' : 'bg-card border-ink-200'
              }`}
            >
              <BrokerBadge broker={b} size={28}/>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-ink-800 font-medium truncate">{b.label}</div>
              </div>
              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isHidden ? 'border-ink-300' : 'border-brand bg-brand'}`}>
                {!isHidden && <Icon.Check size={11} className="text-white"/>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-ink-200">
        {!suggestOpen ? (
          <button onClick={() => setSuggestOpen(true)} className="w-full text-brand text-[13px] font-medium">+ {lang === 'th' ? 'แนะนำแอปเพิ่ม' : 'Suggest an app'}</button>
        ) : (
          <div className="bg-card border border-brand/40 rounded-lg p-4 space-y-3">
            {submitted ? (
              <div className="text-gain text-[13px]">{lang === 'th' ? 'ส่งคำขอเรียบร้อย' : 'Suggestion sent'}</div>
            ) : (
              <>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-1">
                    {lang === 'th' ? 'โน้ตเพิ่มเติม (ไม่บังคับ)' : 'Note (optional)'}
                  </div>
                  <textarea
                    value={suggestNote}
                    onChange={(e) => setSuggestNote(e.target.value)}
                    rows={2}
                    placeholder={lang === 'th' ? 'เช่น URL, ประเภทสินทรัพย์ที่ถือ, ความสำคัญ…' : 'URL, asset types, priority…'}
                    className="w-full bg-ink-100 border border-ink-200 rounded-lg px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand transition-colors resize-none"
                  />
                </label>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSuggestOpen(false)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-md text-ink-600 hover:text-ink-900 hover:bg-ink-100 cursor-pointer transition-colors"
                  >
                    {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    onClick={submitSuggestion}
                    disabled={!suggestName.trim()}
                    className="text-[12px] font-semibold px-3.5 py-1.5 rounded-md bg-brand text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity flex items-center gap-1.5"
                  >
                    <Icon.Check size={11}/>
                    {lang === 'th' ? 'ส่งคำขอ' : 'Send suggestion'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingField({ label, value }) {
  return (
    <div className="bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5">
      <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-ink-800 text-[13px] mt-0.5">{value}</div>
    </div>
  );
}

function EditableField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2 focus-within:border-brand focus-within:bg-card transition-colors">
      <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{label}</div>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none placeholder:text-ink-400"
      />
    </label>
  );
}

function EditableSelect({ label, value, onChange, options }) {
  return (
    <label className="block bg-ink-100 border border-ink-200 rounded-lg px-3 py-2 focus-within:border-brand focus-within:bg-card transition-colors relative">
      <div className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{label}</div>
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-ink-800 text-[13px] mt-0.5 focus:outline-none appearance-none cursor-pointer"
        >
          {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <Icon.ChevronDown size={12} className="text-ink-500 shrink-0 mt-1"/>
      </div>
    </label>
  );
}

function SegmentedField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-ink-500 text-[10px] uppercase tracking-wider font-semibold">{label}</label>
      <div className="mt-1.5 inline-flex p-1 bg-ink-100 border border-ink-200 rounded-full">
        {options.map(o => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${value === o.v ? 'bg-card text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleField({ label, desc, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg hover:bg-ink-100 cursor-pointer transition-colors text-left"
    >
      <div className="min-w-0">
        <div className="text-ink-800 text-[13px] font-medium">{label}</div>
        {desc && <div className="text-ink-500 text-[11px] mt-0.5">{desc}</div>}
      </div>
      <div className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${checked ? 'bg-brand' : 'bg-ink-300'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-card transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}></div>
      </div>
    </button>
  );
}

window.HoldingsPage = HoldingsPage;
window.CashflowPage = CashflowPage;
window.GoalsPage = GoalsPage;
window.SettingsPage = SettingsPage;
