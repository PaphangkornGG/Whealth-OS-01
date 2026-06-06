// More bento cards: Goals (gauge), Cashflow chart, Premium, Reports, Transactions
const D2 = window.DataLayer;
const I2 = window.Icon;
const { Card, Pill, MoneyBig, ChangeBadge } = window.Bento;

// ─── Goals card with gauge ring ──────────────────────────────────────
function GoalsBento() {
  const { t, lang } = window.useT();
  const nav = window.useNav();
  const { goals } = window.useGoals();
  const [focused, setFocused] = React.useState(null);

  if (!goals || goals.length === 0) {
    return (
      <Card padding="p-5" className="h-[432px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-surface-soft border border-line flex items-center justify-center text-ink-400 mb-3">
          <I2.Target size={24}/>
        </div>
        <h4 className="text-ink-900 font-semibold mb-1">{lang === 'th' ? 'ไม่มีเป้าหมาย' : 'No goals yet'}</h4>
        <p className="text-[13px] text-ink-500 mb-4">{lang === 'th' ? 'สร้างเป้าหมายการลงทุนของคุณ' : 'Create your first goal to start tracking progress'}</p>
        <button onClick={() => nav.goTo('goals')} className="px-4 py-2 bg-ink-900 text-white rounded-xl font-medium text-[13px] hover:bg-ink-800 transition-colors">
          + {lang === 'th' ? 'เป้าหมายใหม่' : 'New goal'}
        </button>
      </Card>
    );
  }

  const main = goals.find(g => g.id === focused) || goals[0];
  const others = goals.filter(g => g.id !== main.id);
  const cycleNext = () => {
    const idx = goals.findIndex(g => g.id === main.id);
    const next = goals[(idx + 1) % goals.length];
    setFocused(next.id);
  };

  return (
    <Card padding="p-0" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-brand/15 flex items-center justify-center text-brand">
            <I2.Target size={16}/>
          </div>
          <span className="text-ink-900 text-[15px] font-semibold">{lang === 'th' ? 'เป้าหมายของฉัน' : 'My Goals'}</span>
          <window.InfoTip title={lang === 'th' ? 'เป้าหมายของฉัน' : 'My Goals'}>
            {lang === 'th'
              ? 'ความคืบหน้าสู่เป้าหมายการออม/ลงทุนแต่ละอัน วงแหวน = % ที่ทำได้เทียบเป้า กดลูกศรเพื่อสลับเป้าหมาย'
              : 'Your progress toward each savings/investment target. The ring shows % of the goal reached. Use the arrow to switch between goals.'}
          </window.InfoTip>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => nav.goTo('goals')} className="w-7 h-7 rounded-full bg-surface-soft border border-line flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors" title="Add goal">
            <I2.Plus size={12}/>
          </button>
          <button onClick={() => nav.goTo('settings')} className="relative w-7 h-7 rounded-full bg-surface-soft border border-line flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors">
            <I2.Sliders size={12}/>
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-loss"></span>
          </button>
        </div>
      </div>

      {/* Featured gauge card */}
      <div className="px-5 pt-4">
        <div className="relative bg-surface-inverse rounded-2xl px-5 pt-4 pb-3 text-white overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-semibold">{main.label[lang] || main.label.en}</div>
            <button
              onClick={cycleNext}
              title={lang === 'th' ? 'เป้าหมายถัดไป' : 'Next goal'}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <I2.ChevronDown size={12}/>
            </button>
          </div>
          <div className="-mt-1 flex justify-center">
            <Gauge value={main.currentTHB} target={main.target} accent={main.accent}/>
          </div>
        </div>
      </div>

      {/* Collapsed list */}
      <div className="px-5 pb-5 pt-2 space-y-2">
        {others.map(g => {
          const pct = Math.min(100, (g.currentTHB / g.target) * 100);
          const positive = pct >= 50;
          return (
            <button
              key={g.id}
              onClick={() => setFocused(g.id)}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border border-line hover:border-line2 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink-900 font-medium truncate">{g.label[lang] || g.label.en}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`num text-[12px] font-semibold ${positive ? 'text-gain' : 'text-loss'}`}>{pct.toFixed(0)}%</span>
                <div className="w-16 h-1.5 bg-surface-soft rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${positive ? 'bg-gain' : 'bg-loss'}`} style={{ width: `${pct}%` }}></div>
                </div>
                <I2.ChevronDown size={12} className="text-ink-500"/>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Gauge({ value, target, accent='brand' }) {
  const pct = Math.min(1, value / target);
  const radius = 80;
  const stroke = 12;
  const cx = 110, cy = 110;
  // Half-circle gauge — 270° arc with the gap centered at the BOTTOM (6 o'clock).
  // Arc starts at lower-left (7:30), sweeps CLOCKWISE through 9 → 12 → 3 → lower-right (4:30).
  const sweepAngle = 270;
  const startAngle = 225; // → rotateRing = 135 so dash anchor lands at lower-left
  const c = 2 * Math.PI * radius;
  const visibleArc = (sweepAngle / 360) * c;
  // Map color
  const COLORS = {
    brand: 'oklch(0.55 0.22 264)',
    gain:  'oklch(0.66 0.18 145)',
    warn:  'oklch(0.78 0.16 75)',
    loss:  'oklch(0.62 0.22 28)',
  };
  const stroke_color = COLORS[accent] || COLORS.brand;

  // SVG <circle> stroke starts at (cx+r, cy) and progresses CLOCKWISE in screen coords.
  // We rotate the whole ring by (startAngle - 90) clockwise so the start sits at our chosen angle.
  // Dot grows clockwise from the un-rotated start by +sweep*pct so it lands on the arc tip.
  const rotateRing = startAngle - 90; // applied clockwise to track+filled+dot
  const dotPreAngle = sweepAngle * pct; // clockwise growth before ring rotation

  return (
    <div className="relative" style={{ width: 200, height: 150 }}>
      <svg width="200" height="170" viewBox="0 0 220 200" style={{ display: 'block' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeDasharray={`${visibleArc} ${c}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotateRing} ${cx} ${cy})`}
        />
        {/* Filled portion */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={stroke_color}
          strokeWidth={stroke}
          strokeDasharray={`${visibleArc * pct} ${c}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotateRing} ${cx} ${cy})`}
        />
        {/* Dot handle — same transform stack as the stroke so it sits at the arc tip */}
        <g transform={`rotate(${rotateRing} ${cx} ${cy})`}>
          <g transform={`rotate(${dotPreAngle} ${cx} ${cy})`}>
            <circle cx={cx + radius} cy={cy} r={8} fill="white" stroke={stroke_color} strokeWidth="3"/>
          </g>
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[10px] text-white/60 uppercase tracking-[0.14em]">Target</div>
        <div className="mt-0.5 flex items-baseline">
          <span className="num text-white text-[22px] font-bold leading-none">{D2.fmtTHB(value, { compact: true })}</span>
        </div>
        <div className="mt-1 text-[10px] text-white/60 num flex items-center gap-1">/ {D2.fmtTHB(target, { compact: true })}
          <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-gain">
            <I2.Check size={7}/>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Cashflow chart (big middle) ──────────────────────────────────────
function CashflowBento() {
  const { t, lang } = window.useT();
  const [hover, setHover] = React.useState(null);

  // Last 6 months data based on past 12 transactions
  const months = ['JAN','FEB','MAR','APR','MAY','JUN'];
  const monthsTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.'];
  const now = new Date(2026, 4, 27);
  // Build past 6 months Dividends + Realized Gains.
  const data = [];
  for (let i = 5; i >= 0; i--) {
    let dividends = 0;
    let gains     = 0;
    D2.TRANSACTIONS.forEach(tx => {
      const monthsAgo = (now.getFullYear() - tx.date.getFullYear()) * 12 + (now.getMonth() - tx.date.getMonth());
      if (monthsAgo === i) {
        if (tx.type === 'dividend') dividends += D2.toTHB(tx.total, tx.ccy);
        if (tx.type === 'sell')     gains     += D2.toTHB(tx.total * 0.18, tx.ccy);
      }
    });
    data.push({ month: months[5 - i], monthTH: monthsTH[5 - i], dividends, gains });
  }
  const max = Math.max(...data.map(d => d.dividends + d.gains), 1);

  const focused = hover !== null ? data[hover] : null;

  return (
    <Card padding="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-brand/15 flex items-center justify-center text-brand">
            <I2.Bars size={16}/>
          </div>
          <span className="text-ink-900 text-[15px] font-semibold">{lang === 'th' ? 'กระแสเงินสด' : 'Cashflow chart'}</span>
          <window.InfoTip title={lang === 'th' ? 'กระแสเงินสด' : 'Cashflow'}>
            {lang === 'th'
              ? 'เงินสดที่เข้าพอร์ตย้อนหลัง 6 เดือน แยกเป็นเงินปันผล (น้ำเงิน) และกำไรที่รับรู้จากการขาย (เขียว) ชี้ที่แท่งเพื่อดูยอดแต่ละเดือน'
              : 'Cash your portfolio generated over the last 6 months, split into dividends (blue) and gains you realized by selling (green). Hover a bar for the monthly total.'}
          </window.InfoTip>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect/>
          <PeriodSelect/>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-ink-500 uppercase tracking-wider num">{lang === 'th' ? 'จำนวน (THB)' : 'Amount (THB)'}</div>
        {/* Inline legend so users know the colors even when the tooltip is hidden */}
        <div className="flex items-center gap-3 text-[10px] text-ink-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand"></span>{lang === 'th' ? 'เงินปันผล' : 'Dividends'}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-lime"></span>{lang === 'th' ? 'กำไรที่รับรู้' : 'Realized Gains'}</span>
        </div>
      </div>

      {/* Tooltip rail — reserved space ABOVE the bars; only appears while hovering a bar */}
      <div className="relative mt-3 h-[88px]">
        {focused && (() => {
          const idx = hover;
          // Center over the bar; clamp so the popover doesn't run off either edge
          const leftPct = ((idx + 0.5) / data.length) * 100;
          const clamped = Math.min(Math.max(leftPct, 18), 82);
          return (
            <div
              className="absolute bottom-2 bg-surface-inverse text-white rounded-xl px-3 py-2 text-[11px] shadow-pop pointer-events-none whitespace-nowrap"
              style={{ left: `${clamped}%`, transform: 'translateX(-50%)' }}
            >
              <div className="text-white/60 font-semibold mb-1.5">{focused.month} 2026</div>
              <div className="flex items-center gap-2 num">
                <span className="w-2 h-2 rounded-full bg-brand shrink-0"></span>
                <span className="text-white/70 w-24">{lang === 'th' ? 'เงินปันผล' : 'Dividends'}</span>
                <span className="text-white font-semibold">{D2.fmtTHB(focused.dividends, { compact: true })}</span>
              </div>
              <div className="flex items-center gap-2 num mt-0.5">
                <span className="w-2 h-2 rounded-full bg-lime shrink-0"></span>
                <span className="text-white/70 w-24">{lang === 'th' ? 'กำไรที่รับรู้' : 'Realized Gains'}</span>
                <span className="text-white font-semibold">{D2.fmtTHB(focused.gains, { compact: true })}</span>
              </div>
              {/* Tiny down-pointer */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-inverse rotate-45"></div>
            </div>
          );
        })()}
      </div>

      <div className="relative h-[160px]" onMouseLeave={() => setHover(null)}>
        <div className="flex items-end gap-3 h-full">
          {data.map((d, i) => {
            const highlight = hover === i;
            const totalH = ((d.dividends + d.gains) / max) * 100;
            const divsH  = d.dividends > 0 ? (d.dividends / (d.dividends + d.gains)) * totalH : 0;
            const gainsH = d.gains > 0     ? (d.gains     / (d.dividends + d.gains)) * totalH : 0;
            return (
              <button
                key={i}
                onMouseEnter={() => setHover(i)}
                className="flex-1 h-full flex flex-col items-center justify-end relative"
              >
                <div className="w-full max-w-[60px] mx-auto relative" style={{ height: `${Math.max(totalH, 8)}%` }}>
                  {highlight ? (
                    <div className="absolute inset-0 rounded-[20px] flex flex-col-reverse overflow-hidden">
                      <div className="bg-brand" style={{ height: `${(divsH / totalH) * 100}%`, minHeight: 8 }}></div>
                      <div className="bg-lime" style={{ height: `${(gainsH / totalH) * 100}%`, minHeight: 8 }}></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 rounded-[20px] bg-surface-soft border border-line" style={{
                      backgroundImage: 'linear-gradient(135deg, transparent 49%, oklch(0.85 0.005 250) 49%, oklch(0.85 0.005 250) 51%, transparent 51%)',
                      backgroundSize: '8px 8px',
                    }}></div>
                  )}
                </div>
                <span className={`mt-2 text-[10px] uppercase tracking-wider font-medium ${highlight ? 'text-ink-900' : 'text-ink-500'}`}>
                  {lang === 'th' ? d.monthTH : d.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function YearSelect() {
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState('2026');
  const years = ['2026', '2025', '2024'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 bg-white border border-line2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-700 hover:bg-surface-soft cursor-pointer transition-colors"
      >
        {val} <I2.ChevronDown size={10}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1 z-40 bg-card border border-line2 rounded-xl shadow-pop py-1 min-w-[80px]">
            {years.map(y => (
              <button key={y} onClick={() => { setVal(y); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-soft cursor-pointer">{y}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function PeriodSelect() {
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState('6 MONTH');
  const opts = ['1 MONTH', '3 MONTH', '6 MONTH', 'YTD', '1 YEAR'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 bg-white border border-line2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-700 hover:bg-surface-soft cursor-pointer transition-colors"
      >
        {val} <I2.ChevronDown size={10}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1 z-40 bg-card border border-line2 rounded-xl shadow-pop py-1 min-w-[110px]">
            {opts.map(o => (
              <button key={o} onClick={() => { setVal(o); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-soft cursor-pointer">{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Dividend yield / Today received (right rail stack) ─────────────
// Forward dividend yield — a real KPI not surfaced anywhere else on the
// dashboard (the Cashflow chart shows baht amounts, not yield %).
function DividendYieldCard() {
  const { lang } = window.useT();
  const D = window.DataLayer;
  const nav = window.useNav();
  const { annualTotal } = React.useMemo(() => window.buildDivForecast?.() || { annualTotal: 0 }, []);
  const portfolio = D.TOTAL_THB || 0;
  const cost = D.TOTAL_COST_THB || 0;
  const fwdYield = portfolio > 0 ? (annualTotal / portfolio) * 100 : 0;
  const yieldOnCost = cost > 0 ? (annualTotal / cost) * 100 : 0;

  return (
    <Card padding="p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-500 uppercase tracking-wider">{lang === 'th' ? 'ผลตอบแทนปันผล' : 'Dividend Yield'}</span>
          {/* Info tooltip — explains what dividend yield is, how it's
              calculated, and how to read it. Sits OUTSIDE the nav button
              so hovering it doesn't navigate. */}
          <span
            className="relative inline-flex"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            tabIndex={0}
          >
            <span className="peer text-ink-400 hover:text-ink-700 transition-colors cursor-help inline-flex">
              <I2.Info size={12}/>
            </span>
            <div className="pointer-events-none absolute left-0 top-full mt-2 w-72 opacity-0 translate-y-1 peer-hover:opacity-100 peer-hover:translate-y-0 peer-focus:opacity-100 peer-focus:translate-y-0 transition-all z-30">
              <div className="bg-ink-800 text-ink-0 rounded-xl px-3.5 py-3 shadow-pop border border-ink-700">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-0/90">
                  {lang === 'th' ? 'ผลตอบแทนปันผลคืออะไร' : 'What is dividend yield'}
                </div>
                <p className="mt-2 text-[11px] text-ink-0/80 leading-relaxed">
                  {lang === 'th'
                    ? 'เงินปันผลที่คาดว่าจะได้รับทั้งปี คิดเป็นกี่ % ของเงินที่ลงไป ยิ่งสูง = พอร์ตสร้างกระแสเงินสดได้มาก'
                    : 'How much dividend income you’re projected to earn in a year, as a % of what you’ve invested. Higher = more cash your portfolio throws off.'}
                </p>
                <div className="mt-2.5 space-y-1.5 text-[11px] text-ink-0/70">
                  <div className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-ink-0/50 mt-1.5 shrink-0"></span>
                    <span>
                      <span className="text-ink-0/90 font-medium">{lang === 'th' ? 'ต่อปี (ล่วงหน้า)' : 'Forward / yr'}</span>{' '}
                      = {lang === 'th' ? 'คาดรับทั้งปี ÷ มูลค่าพอร์ตวันนี้' : 'est. annual income ÷ current value'}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-ink-0/50 mt-1.5 shrink-0"></span>
                    <span>
                      <span className="text-ink-0/90 font-medium">{lang === 'th' ? 'บนต้นทุน' : 'On cost'}</span>{' '}
                      = {lang === 'th' ? 'คาดรับทั้งปี ÷ ต้นทุนที่ซื้อมา' : 'est. annual income ÷ cost basis'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-ink-700 text-[10px] text-ink-0/60 leading-relaxed">
                  {lang === 'th'
                    ? 'ใช้เทียบกับดอกเบี้ยเงินฝากหรือพันธบัตร — เป็นประมาณการ ไม่รวมปันผลพิเศษ'
                    : 'Compare it to a savings or bond rate. Estimate only — special dividends excluded.'}
                </div>
              </div>
            </div>
          </span>
        </span>
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 rounded border border-line">
          {lang === 'th' ? 'คาด' : 'est.'}
        </span>
      </div>
      <button onClick={() => nav.goTo('cashflow')} className="w-full text-left">
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-[26px] font-semibold text-ink-900 num leading-none">{fwdYield.toFixed(2)}</span>
          <span className="text-[16px] font-semibold text-ink-500">%</span>
          <span className="text-[10px] text-ink-500 ml-1">{lang === 'th' ? 'ต่อปี (ล่วงหน้า)' : 'fwd / yr'}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-line space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-500">{lang === 'th' ? 'คาดรับทั้งปี' : 'Est. annual income'}</span>
            <span className="num font-semibold text-ink-700">{D.fmtTHB(annualTotal, { compact: true })}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-500">{lang === 'th' ? 'ผลตอบแทนบนต้นทุน' : 'Yield on cost'}</span>
            <span className="num font-semibold text-ink-700">{yieldOnCost.toFixed(2)}%</span>
          </div>
        </div>
      </button>
    </Card>
  );
}

function TodayReceivedCard() {
  const { t, lang } = window.useT();
  const D = window.DataLayer;
  const nav = window.useNav();
  // Forward-looking: find the soonest upcoming month that has expected
  // dividend payouts (built from the same forecast model as the Cashflow page).
  const forecast = React.useMemo(() => window.buildDivForecast?.() || { rows: [] }, []);
  const next = forecast.rows.find(r => r.total > 0);
  const monthsEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthsTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  if (!next) {
    return (
      <Card padding="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-500 uppercase tracking-wider">{lang === 'th' ? 'ปันผลที่จะรับ' : 'Upcoming Dividend'}</span>
          <I2.Calendar size={12} className="text-ink-500"/>
        </div>
        <div className="mt-3 text-[13px] text-ink-500">{lang === 'th' ? 'ไม่มีนัดถัดไป' : 'No upcoming payouts'}</div>
      </Card>
    );
  }

  const top = next.breakdown[0];
  const monthLabel = lang === 'th' ? monthsTH[next.monthIdx] : monthsEN[next.monthIdx];

  return (
    <Card padding="p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-500 uppercase tracking-wider">{lang === 'th' ? 'ปันผลที่จะรับ' : 'Upcoming Dividend'}</span>
          {/* Info tooltip — explains where this estimate comes from and how
              it's calculated. Sits OUTSIDE the nav button below so hovering
              it doesn't trigger navigation. */}
          <span
            className="relative inline-flex"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            tabIndex={0}
          >
            <span className="peer text-ink-400 hover:text-ink-700 transition-colors cursor-help inline-flex">
              <I2.Info size={12}/>
            </span>
            <div className="pointer-events-none absolute left-0 top-full mt-2 w-72 opacity-0 translate-y-1 peer-hover:opacity-100 peer-hover:translate-y-0 peer-focus:opacity-100 peer-focus:translate-y-0 transition-all z-30">
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
                <div className="mt-2 pt-2 border-t border-ink-700 text-[10px] text-ink-0/60 leading-relaxed">{t.forecastLogicNote}</div>
              </div>
            </div>
          </span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-ink-500 num">
          <I2.Calendar size={10}/>
          {monthLabel} {String(next.year).slice(2)}
        </span>
      </div>
      <button onClick={() => nav.goTo('cashflow')} className="w-full text-left">
        <div className="mt-2 flex items-baseline gap-2">
          <MoneyBig value={next.total} ccy="THB" size={22}/>
          <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 rounded border border-line">
            {lang === 'th' ? 'คาด' : 'est.'}
          </span>
        </div>
        {top && (
          <div className="flex items-center gap-1.5 min-w-0 mt-2">
            {window.StockLogo && <window.StockLogo ticker={top.ticker} cls={top.cls} size={16} showFallbackBorder={false} />}
            {!window.StockLogo && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: D.ASSET_CLASSES[top.cls]?.color }}></span>}
            <span className="text-[12px] font-medium text-ink-800 truncate">{top.ticker.replace('-THB','')}</span>
            <span>{lang === 'th' ? 'นำกลุ่ม' : 'leads'}</span>
            <span className="num text-ink-700">{D.fmtTHB(top.value, { compact: true })}</span>
          </div>
        )}
      </button>
    </Card>
  );
}

// Compact upcoming-payout schedule — extends the single "next month" figure
// into a short timeline so the user sees their income rhythm at a glance.
function DividendCalendarCard() {
  const { lang } = window.useT();
  const D = window.DataLayer;
  const nav = window.useNav();
  const forecast = React.useMemo(() => window.buildDivForecast?.() || { rows: [] }, []);
  const monthsEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthsTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const upcoming = forecast.rows.filter(r => r.total > 0).slice(0, 4);
  if (!upcoming.length) return null;
  const max = Math.max(...upcoming.map(r => r.total), 1);

  return (
    <Card padding="p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-500 uppercase tracking-wider">{lang === 'th' ? 'ปฏิทินปันผล' : 'Dividend Calendar'}</span>
          <window.InfoTip title={lang === 'th' ? 'ปฏิทินปันผล' : 'Dividend Calendar'}>
            {lang === 'th'
              ? 'รอบจ่ายปันผลที่คาดว่าจะได้รับใน 4 เดือนถัดไป ความยาวแถบ = ยอดมากน้อยเทียบกัน กดเพื่อดูรายละเอียดทั้งปี'
              : 'Your projected dividend payouts over the next few months. Bar length compares the amounts. Tap for the full-year view.'}
          </window.InfoTip>
        </span>
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 rounded border border-line">
          {lang === 'th' ? 'คาด' : 'est.'}
        </span>
      </div>
      <button onClick={() => nav.goTo('cashflow')} className="w-full text-left mt-3 space-y-2.5">
        {upcoming.map((r, i) => {
          const monthLabel = lang === 'th' ? monthsTH[r.monthIdx] : monthsEN[r.monthIdx];
          const pct = (r.total / max) * 100;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[11px] text-ink-500 num w-14 shrink-0">{monthLabel} {String(r.year).slice(2)}</span>
              <div className="flex-1 h-1.5 bg-surface-soft rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${i === 0 ? 'bg-brand' : 'bg-brand/45'}`} style={{ width: `${Math.max(pct, 6)}%` }}></div>
              </div>
              <span className="num text-[11px] font-semibold text-ink-700 w-14 text-right shrink-0">{D.fmtTHB(r.total, { compact: true })}</span>
            </div>
          );
        })}
      </button>
    </Card>
  );
}

// ─── Transactions table (bottom row) ──────────────────────────────────
function TransactionsBento() {
  const { t, lang } = window.useT();
  const nav = window.useNav();
  const [search, setSearch] = React.useState('');

  const STATUS_TONES = {
    buy:      { label: lang === 'th' ? 'สำเร็จ' : 'Complete', cls: 'bg-gain text-white' },
    sell:     { label: lang === 'th' ? 'สำเร็จ' : 'Complete', cls: 'bg-gain text-white' },
    dividend: { label: lang === 'th' ? 'รับแล้ว' : 'Received', cls: 'bg-brand text-white' },
  };

  const rows = D2.TRANSACTIONS
    .filter(tx => !search || tx.ticker.toLowerCase().includes(search.toLowerCase()) || tx.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 6);

  return (
    <Card padding="p-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-brand/15 flex items-center justify-center text-brand">
            <I2.Activity size={16}/>
          </div>
          <span className="text-ink-900 text-[15px] font-semibold">{lang === 'th' ? 'ประวัติธุรกรรม' : 'Transaction history'}</span>
          <window.InfoTip title={lang === 'th' ? 'ประวัติธุรกรรม' : 'Transactions'}>
            {lang === 'th'
              ? 'รายการซื้อ ขาย และรับปันผลล่าสุดของคุณ ค้นหาด้วยชื่อ/สัญลักษณ์ หรือกดดาวน์โหลดเพื่อส่งออก CSV'
              : 'Your most recent buys, sells and dividends. Search by name or ticker, or use the download button to export a CSV.'}
          </window.InfoTip>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <I2.Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"/>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหา' : 'Search'}
              className="bg-surface-soft border border-line rounded-full pl-8 pr-3 py-1.5 text-[12px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-brand transition-colors w-48"
            />
          </div>
          <button
            title={lang === 'th' ? 'ตัวกรอง' : 'Filters'}
            className="w-8 h-8 rounded-full bg-surface-soft border border-line flex items-center justify-center text-ink-700 hover:bg-line hover:text-ink-900 cursor-pointer transition-colors"
          >
            <I2.Sliders size={12}/>
          </button>
          <button
            title={lang === 'th' ? 'ดาวน์โหลด CSV' : 'Download CSV'}
            className="w-8 h-8 rounded-full bg-surface-soft border border-line flex items-center justify-center text-ink-700 hover:bg-line hover:text-ink-900 cursor-pointer transition-colors"
          >
            <I2.ArrowDown size={12}/>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-[12px] min-w-[780px]">
          <thead>
            <tr className="text-ink-500 text-[10px] uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">{lang === 'th' ? 'ชื่อ' : 'Name'}</th>
              <th className="text-right px-3 py-3 font-semibold">{lang === 'th' ? 'จำนวน' : 'Quantity'}</th>
              <th className="text-right px-3 py-3 font-semibold">{lang === 'th' ? 'มูลค่ารวม' : 'Total Value'}</th>
              <th className="text-left px-3 py-3 font-semibold">{lang === 'th' ? 'วิธี' : 'Method'}</th>
              <th className="text-left px-3 py-3 font-semibold">{lang === 'th' ? 'วันที่' : 'Date'}</th>
              <th className="text-center px-3 py-3 font-semibold">{lang === 'th' ? 'สถานะ' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(tx => {
              const cls = D2.ASSET_CLASSES[tx.cls] || { color: 'oklch(0.62 0.015 250)', label: tx.cls || 'Other' };
              const broker = D2.BROKERS[tx.broker];
              const status = STATUS_TONES[tx.type] || { label: tx.type || 'Unknown', cls: 'bg-ink-300 text-ink-800' };
              // Pick a sensible unit label per asset class
              const unitLabel =
                tx.cls === 'crypto'             ? tx.ticker :
                tx.cls === 'fund'               ? (lang === 'th' ? 'หน่วย' : 'units') :
                tx.cls === 'cash'               ? (lang === 'th' ? 'บาท'  : 'THB') :
                                                  (lang === 'th' ? 'หุ้น' : 'shares');
              // Display:  buy = +units (received), sell = −units, dividend = +cash received
              let amountDisplay;
              if (tx.type === 'dividend') {
                amountDisplay = `+${D2.fmtTHB(D2.toTHB(tx.total, tx.ccy), { compact: true })}`;
              } else if (tx.units != null) {
                const unitsStr = D2.fmtUnits(tx.units);
                const sign = tx.type === 'sell' ? '−' : '+';
                amountDisplay = `${sign}${unitsStr} ${unitLabel}`;
              } else {
                amountDisplay = '—';
              }
              const isPositive = tx.type === 'buy' || tx.type === 'dividend';
              return (
                <tr key={tx.id} className="border-t border-line hover:bg-surface-soft transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <StockLogo ticker={tx.ticker} cls={tx.cls} size={28} />
                      <div>
                        <div className="text-ink-900 font-semibold num">{tx.ticker}</div>
                        <div className="text-ink-500 text-[10px] truncate">{tx.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-right num font-semibold ${isPositive ? 'text-gain' : 'text-ink-900'}`}>
                    {amountDisplay}
                  </td>
                  <td className="px-3 py-3 text-right num text-ink-700">
                    {D2.fmtTHB(D2.toTHB(tx.total, tx.ccy), { compact: true })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      {broker && <window.BrokerBadge broker={broker} size={16}/>}
                      <span className="text-ink-700 text-[11px] truncate">{broker?.label || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-ink-700 num text-[11px]">
                    {tx.date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Pill tone="neutral" size="sm" className={`${status.cls} border-0`}>
                      {status.label}
                    </Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-line flex items-center justify-between text-[11px]">
        <span className="text-ink-500 num">{lang === 'th' ? `แสดง ${rows.length} จาก ${D2.TRANSACTIONS.length}` : `Showing ${rows.length} of ${D2.TRANSACTIONS.length}`}</span>
        <button onClick={() => nav.openLedger()} className="text-brand font-semibold hover:underline">
          {lang === 'th' ? 'ดูทั้งหมด →' : 'View all →'}
        </button>
      </div>
    </Card>
  );
}

Object.assign(window.Bento, { GoalsBento, CashflowBento, DividendYieldCard, TodayReceivedCard, DividendCalendarCard, TransactionsBento });
