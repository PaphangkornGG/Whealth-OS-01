// All Bento-style cards for the redesign.
// Reuses window.DataLayer + window.useT.
const D = window.DataLayer;
const { Icon } = window;

// ─── Shared atoms ──────────────────────────────────────────────────────
function Pill({ children, tone='neutral', size='sm', className='', onClick }) {
  const TONES = {
    neutral: 'bg-surface-soft text-ink-700 border border-line',
    brand:   'bg-brand text-white',
    dark:    'bg-surface-inverse text-white',
    outline: 'bg-white text-ink-700 border border-line2',
    soft:    'bg-surface-soft text-ink-700',
    gain:    'bg-gain/15 text-gain border border-gain/25',
    loss:    'bg-loss/15 text-loss border border-loss/25',
    warn:    'bg-warn/15 text-ink-700 border border-warn/30',
  };
  const SIZES = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-[12px]',
    lg: 'px-4 py-2.5 text-[13px]',
  };
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors ${TONES[tone]} ${SIZES[size]} ${onClick ? 'hover:opacity-90 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Comp>
  );
}

function Card({ children, className='', dark=false, padding='p-5', onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`rounded-3xl ${padding} ${dark ? 'bg-surface-inverse text-white' : 'bg-card text-ink-900 shadow-card'} ${onClick ? 'text-left w-full cursor-pointer hover:shadow-pop transition-shadow' : ''} ${className}`}
    >
      {children}
    </Comp>
  );
}

// Reusable info tooltip. Drop next to any card title to explain what the
// box shows and how to read it. `align` flips the popover (use 'right' for
// cards near the right edge). stopPropagation so it never triggers a
// parent card's click/nav.
function InfoTip({ title, children, align='left', size=12, width='w-64' }) {
  return (
    <span
      className="relative inline-flex shrink-0"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      tabIndex={0}
    >
      <span className="peer text-ink-400 hover:text-ink-700 transition-colors cursor-help inline-flex">
        <Icon.Info size={size}/>
      </span>
      <div className={`pointer-events-none absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 ${width} opacity-0 translate-y-1 peer-hover:opacity-100 peer-hover:translate-y-0 peer-focus:opacity-100 peer-focus:translate-y-0 transition-all z-40`}>
        <div className="bg-ink-800 text-ink-0 rounded-xl px-3.5 py-3 shadow-pop border border-ink-700">
          {title && <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-0/90">{title}</div>}
          <div className={`${title ? 'mt-1.5 ' : ''}text-[11px] text-ink-0/80 leading-relaxed`}>{children}</div>
        </div>
      </div>
    </span>
  );
}
window.InfoTip = InfoTip;

function MoneyBig({ value, ccy='THB', size=44 }) {
  // Splits "12,345.67" → integer "12,345" and decimal ".67" smaller
  const num = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  const intPart = Math.floor(num).toLocaleString('en-US');
  const decPart = (num - Math.floor(num)).toFixed(2).slice(1); // ".67"
  const sym = ccy === 'USD' ? '$' : '฿';
  return (
    <div className="flex items-baseline num font-bold tracking-tight">
      <span className="text-ink-900" style={{ fontSize: `${size}px`, lineHeight: '1' }}>
        {sign}{sym}{intPart}
      </span>
      <span className="text-ink-500 font-medium" style={{ fontSize: `${size * 0.55}px`, lineHeight: '1' }}>
        {decPart}
      </span>
    </div>
  );
}

function ChangeBadge({ value, prefix='', tone, size='sm' }) {
  const positive = value >= 0;
  const t = tone || (positive ? 'gain' : 'loss');
  const tones = {
    gain: 'bg-gain/15 text-gain',
    loss: 'bg-loss/15 text-loss',
    warn: 'bg-warn/15 text-warn',
  };
  const sizes = { sm: 'text-[11px] px-1.5 py-0.5', md: 'text-[12px] px-2 py-0.5' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold num ${tones[t]} ${sizes[size]}`}>
      <span className={`w-4 h-4 rounded-full bg-white/60 flex items-center justify-center`}>
        {positive ? <Icon.ArrowUp size={10}/> : <Icon.ArrowDown size={10}/>}
      </span>
      {prefix}{positive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

// ─── 1. My Balance card (big left) ────────────────────────────────────
function BalanceCard() {
  const { t, lang } = window.useT();
  const nav = window.useNav();
  const [ccy, setCcy] = React.useState('THB');
  const [hidden, setHidden] = React.useState(false);

  const balance = ccy === 'THB' ? D.TOTAL_THB : D.TOTAL_THB / D.FX.USD_THB;
  // 30-day weighted change
  const startV = D.PORTFOLIO_SPARK[0];
  const endV = D.PORTFOLIO_SPARK[D.PORTFOLIO_SPARK.length - 1];
  const monthPct = startV > 0 ? ((endV - startV) / startV) * 100 : 0;
  const positive = monthPct >= 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-brand/15 flex items-center justify-center text-brand">
            <Icon.Wallet size={18}/>
          </div>
          <span className="text-ink-500 text-[14px] font-medium">{lang === 'th' ? 'ยอดรวมของฉัน' : 'My Balance'}</span>
          <window.InfoTip title={lang === 'th' ? 'ยอดรวมของฉัน' : 'My Balance'}>
            {lang === 'th'
              ? 'มูลค่ารวมของทุกสินทรัพย์จากทุกบัญชี/โบรกเกอร์ แปลงเป็นสกุลที่เลือก ตัวเลข % คือเทียบกับเดือนก่อน กดรูปตาเพื่อซ่อนยอด'
              : 'Total value of every asset across all your accounts, converted to the selected currency. The % compares to last month. Tap the eye to hide the balance.'}
          </window.InfoTip>
        </div>
        <div className="flex items-center gap-2">
          <CcySelect value={ccy} onChange={setCcy}/>
          <RangeSelect/>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-4">
        <div className="flex-1">
          {hidden ? (
            <div className="num font-bold text-ink-900 tracking-tight" style={{ fontSize: '44px' }}>
              ••••••••
            </div>
          ) : (
            <MoneyBig value={balance} ccy={ccy} size={44}/>
          )}
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            <ChangeBadge value={monthPct}/>
            <span className="text-ink-500">{lang === 'th' ? 'เดือนนี้ดีขึ้น' : 'Balance increase, good progress.'}</span>
          </div>
        </div>
        <button
          onClick={() => setHidden(h => !h)}
          className="shrink-0 w-9 h-9 rounded-full bg-surface-soft border border-line flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
        >
          {hidden ? <Icon.Eye size={14}/> : <Icon.EyeOff size={14}/>}
        </button>
        <MiniHeatmap />
      </div>

      {/* Action pills */}
      <div className="mt-6 flex items-center gap-2">
        <Pill tone="brand" size="lg" className="flex-1 justify-center py-3" onClick={() => nav.openTx({ type: 'buy' })}>
          <Icon.Plus size={14}/>
          {lang === 'th' ? 'ซื้อสินทรัพย์' : 'Buy Asset'}
        </Pill>
        <Pill tone="dark" size="lg" className="flex-1 justify-center py-3" onClick={() => nav.openTx({ type: 'sell' })}>
          <Icon.ArrowUp size={14}/>
          {lang === 'th' ? 'ขายสินทรัพย์' : 'Sell Asset'}
        </Pill>
        <Pill tone="outline" size="lg" className="flex-1 justify-center py-3" onClick={() => nav.openTx({ type: 'dividend' })}>
          <Icon.ArrowDown size={14}/>
          {lang === 'th' ? 'บันทึกปันผล' : 'Log Dividend'}
        </Pill>
      </div>
    </Card>
  );
}

function CcySelect({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const opts = ['THB','USD'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 bg-white border border-line2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-700 hover:bg-surface-soft transition-colors"
      >
        <span className="w-3.5 h-3.5 rounded-full bg-brand/20 flex items-center justify-center text-[8px]">฿</span>
        {value}
        <Icon.ChevronDown size={10}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1 z-40 bg-card border border-line2 rounded-xl shadow-pop py-1 min-w-[80px]">
            {opts.map(o => (
              <button key={o} onClick={() => { onChange(o); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-soft">{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RangeSelect() {
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState('ALL TIME');
  const opts = ['1M', '3M', '1Y', 'YTD', 'ALL TIME'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 bg-white border border-line2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-700 hover:bg-surface-soft transition-colors"
      >
        {val}
        <Icon.ChevronDown size={10}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1 z-40 bg-card border border-line2 rounded-xl shadow-pop py-1 min-w-[110px]">
            {opts.map(o => (
              <button key={o} onClick={() => { setVal(o); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-soft">{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiniHeatmap() {
  // Holdings heatmap — each square = 1 holding slot, allocated proportionally to weight.
  // Color = today's % change (red → grey → green). Hover for tooltip.
  const D = window.DataLayer;
  const { lang } = window.useT();
  const [hover, setHover] = React.useState(null);

  const SLOTS = 35; // 7 × 5
  const holdings = D.ENRICHED.filter(a => a.cls !== 'cash');
  const totalValue = holdings.reduce((s, a) => s + a.valueTHB, 0);

  // Distribute slots proportionally, guarantee at least 1 slot for any holding > 1% weight
  const allocated = [];
  let used = 0;
  holdings.forEach(a => {
    const w = a.valueTHB / totalValue;
    let n = Math.max(w > 0.02 ? 1 : 0, Math.round(w * SLOTS));
    allocated.push({ a, n });
    used += n;
  });
  // Adjust to fit exactly SLOTS
  if (allocated.length > 0) {
    while (used > SLOTS) { const i = allocated.findIndex(x => x.n > 1); if (i < 0) break; allocated[i].n--; used--; }
    while (used < SLOTS) { allocated[0].n++; used++; }
  }

  // Build flat list of cells
  const cells = [];
  allocated.forEach(({ a, n }) => {
    for (let i = 0; i < n; i++) cells.push(a);
  });

  // Color scale based on today's change
  function cellColor(a) {
    const p = a.dayChangePct;
    if (p > 1.5)  return 'oklch(0.62 0.18 145)';                 // strong green
    if (p > 0.3)  return 'oklch(0.72 0.14 145)';                 // mid green
    if (p > -0.3) return 'oklch(0.82 0.04 250)';                 // neutral grey-blue
    if (p > -1.5) return 'oklch(0.72 0.16 28)';                  // mid red
    return 'oklch(0.62 0.22 28)';                                // strong red
  }

  return (
    <div className="relative shrink-0 -mt-1">
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((a, i) => (
          <button
            key={i}
            onMouseEnter={() => setHover({ a, i })}
            onMouseLeave={() => setHover(null)}
            className="w-3.5 h-3.5 rounded-[3px] transition-transform hover:scale-125 hover:z-10 relative"
            style={{
              background: cellColor(a),
              outline: hover?.a.ticker === a.ticker ? '1.5px solid oklch(0.15 0.01 250)' : 'none',
              outlineOffset: '1px',
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[9px] text-ink-500 num">
        <span className="flex items-center gap-1">
          {lang === 'th' ? 'วันนี้' : 'Today'}
          <window.InfoTip title={lang === 'th' ? 'แผนที่ความร้อนรายวัน' : 'Daily heatmap'} align="right" size={11} width="w-60">
            {lang === 'th'
              ? 'แต่ละช่องคือสินทรัพย์ 1 ตัว ขนาดสัดส่วนตามน้ำหนักในพอร์ต สีบอกผลตอบแทนวันนี้: เขียว = ขึ้น, แดง = ลง, เทา = แทบไม่เปลี่ยน ชี้ที่ช่องเพื่อดูชื่อและ %'
              : 'Each square is one holding, sized by its weight in your portfolio. Color shows today’s move: green = up, red = down, grey = flat. Hover a square for its name and %.'}
          </window.InfoTip>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ background: 'oklch(0.62 0.22 28)' }}></span>
          <span>−</span>
          <span className="w-2 h-2 rounded-sm" style={{ background: 'oklch(0.82 0.04 250)' }}></span>
          <span>0</span>
          <span className="w-2 h-2 rounded-sm" style={{ background: 'oklch(0.62 0.18 145)' }}></span>
          <span>+</span>
        </span>
      </div>
      {hover && (
        <div className="absolute right-0 top-full mt-1.5 z-20 bg-surface-inverse text-white rounded-lg shadow-pop px-3 py-2 text-[11px] min-w-[160px] pointer-events-none">
          <div className="flex items-center justify-between gap-3">
            <span className="num font-semibold">{hover.a.ticker}</span>
            <span className={`num font-semibold ${hover.a.dayChangePct >= 0 ? 'text-gain' : 'text-loss'}`}>
              {hover.a.dayChangePct >= 0 ? '+' : ''}{hover.a.dayChangePct.toFixed(2)}%
            </span>
          </div>
          <div className="text-white/60 text-[10px] mt-0.5 truncate">{hover.a.name}</div>
          <div className="text-white/80 num text-[10px] mt-1">{D.fmtTHB(hover.a.valueTHB, { compact: true })} · {((hover.a.valueTHB / totalValue) * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}

// ─── 2. Total P/L card (unrealized gain/loss) ─────────────────────────
// One of the two "mover" slots at the bottom of the P/L card. Defaults to a
// top mover but the user can tap it to track ANY holding they care about.
function MoverSlot({ assets, value, exclude, onChange, lang }) {
  const [open, setOpen] = React.useState(false);
  const a = assets.find(x => x.ticker === value) || assets[0];
  if (!a) return <div></div>;
  const pos = a.unrealTHB >= 0;
  const options = assets.filter(x => x.ticker === value || x.ticker !== exclude);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left group" title={lang === 'th' ? 'เลือกสินทรัพย์' : 'Choose an asset'}>
        <div className="flex items-center gap-1 text-[11px] text-ink-500">
          <span className="truncate">{a.ticker.replace('-THB','')}</span>
          <Icon.ChevronDown size={10} className="text-ink-400 group-hover:text-ink-700 transition-colors shrink-0"/>
        </div>
        <div className={`num text-[15px] font-semibold mt-0.5 ${pos ? 'text-gain' : 'text-loss'}`}>
          {pos ? '+' : '−'}{D.fmtTHB(Math.abs(a.unrealTHB), { compact: true })}
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute left-0 top-full mt-1 z-40 bg-card border border-line2 rounded-xl shadow-pop py-1 min-w-[200px] max-h-64 overflow-y-auto scroll-thin">
            {options.map(o => {
              const op = o.unrealTHB >= 0;
              return (
                <button
                  key={o.ticker}
                  onClick={() => { onChange(o.ticker); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-surface-soft transition-colors ${o.ticker === value ? 'bg-surface-soft' : ''}`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: D.ASSET_CLASSES[o.cls]?.color }}></span>
                    <span className="num text-[12px] text-ink-800 truncate">{o.ticker.replace('-THB','')}</span>
                  </span>
                  <span className={`num text-[11px] font-semibold shrink-0 ${op ? 'text-gain' : 'text-loss'}`}>
                    {op ? '+' : '−'}{D.fmtTHB(Math.abs(o.unrealTHB), { compact: true })}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PLCard() {
  const { lang } = window.useT();
  const unrealized = D.TOTAL_THB - D.TOTAL_COST_THB;
  const positive = unrealized >= 0;
  const totalReturnPct = D.TOTAL_COST_THB > 0 ? (unrealized / D.TOTAL_COST_THB) * 100 : 0;

  // Build a P/L trend from the portfolio sparkline → daily portfolio value minus a constant cost basis.
  const spark = D.PORTFOLIO_SPARK;
  const endSpark = spark[spark.length - 1];
  const scale = endSpark > 0 ? D.TOTAL_THB / endSpark : 0;
  const plSeries = spark.map(v => v * scale - D.TOTAL_COST_THB);
  const minP = Math.min(...plSeries), maxP = Math.max(...plSeries);
  const yRange = Math.max(maxP - minP, 1);
  const w = 240, h = 60;
  const pts = plSeries.map((v, i) => {
    const x = (i / (plSeries.length - 1)) * w;
    const y = h - ((v - minP) / yRange) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPath = `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`;
  const lineStroke = positive ? 'oklch(0.62 0.18 145)' : 'oklch(0.62 0.22 28)';
  const areaFill = positive ? 'oklch(0.62 0.18 145 / 0.14)' : 'oklch(0.62 0.22 28 / 0.14)';

  // Bottom "movers" — user-selectable. Defaults to the two biggest movers
  // by absolute unrealized P/L, but each slot is a dropdown so the user can
  // track any holding they care about. Choice persists across reloads.
  const allMovers = React.useMemo(() => [...D.ENRICHED]
    .map(a => ({ ...a, unrealTHB: D.toTHB(a.unrealized, a.ccy) }))
    .sort((a, b) => Math.abs(b.unrealTHB) - Math.abs(a.unrealTHB)), []);
  const defaults = [allMovers[0]?.ticker, allMovers[1]?.ticker];
  const [picks, setPicks] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('netto_pl_movers') || 'null');
      if (Array.isArray(saved) && saved.length === 2 && saved.every(tk => allMovers.some(m => m.ticker === tk))) return saved;
    } catch {}
    return defaults;
  });
  React.useEffect(() => { try { localStorage.setItem('netto_pl_movers', JSON.stringify(picks)); } catch {} }, [picks]);
  const setPick = (idx, ticker) => setPicks(p => { const n = [...p]; n[idx] = ticker; return n; });

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full ${positive ? 'bg-gain' : 'bg-loss'} flex items-center justify-center text-white`}>
            <Icon.TrendUp size={14}/>
          </div>
          <span className="text-ink-900 text-[15px] font-semibold">{lang === 'th' ? 'กำไร/ขาดทุนรวม' : 'Total P/L'}</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 rounded border border-line">{lang === 'th' ? 'ยังไม่รับรู้' : 'Unrealized'}</span>
          <window.InfoTip title={lang === 'th' ? 'กำไร/ขาดทุนรวม' : 'Total P/L'}>
            {lang === 'th'
              ? 'กำไร/ขาดทุน “บนกระดาษ” = มูลค่าปัจจุบัน − ต้นทุนที่ซื้อมา ยังไม่รับรู้จริงจนกว่าจะขาย ตัวเลข % คือผลตอบแทนเทียบต้นทุน • สองช่องด้านล่างกดเลือกสินทรัพย์ที่อยากติดตามเองได้'
              : 'Your “paper” gain/loss = current value − what you paid. It isn’t realized until you sell. The % is your return on cost. • Tap either box at the bottom to pick which asset to track.'}
          </window.InfoTip>
        </div>
        <RangeSelect/>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <div className="num font-bold tracking-tight flex items-baseline">
          <span className={positive ? 'text-gain' : 'text-loss'} style={{ fontSize: '28px', lineHeight: '1' }}>
            {positive ? '+' : '−'}฿{Math.floor(Math.abs(unrealized)).toLocaleString('en-US')}
          </span>
        </div>
        <Pill tone={positive ? 'gain' : 'loss'} size="sm" className="mb-1">
          {positive ? <Icon.ArrowUp size={10}/> : <Icon.ArrowDown size={10}/>}
          {positive ? '+' : ''}{totalReturnPct.toFixed(2)}%
        </Pill>
      </div>

      <div className="mt-3 text-[12px] text-ink-500">
        {lang === 'th' ? `คิดจากต้นทุนรวม ${D.fmtTHB(D.TOTAL_COST_THB, { compact: true })}` : `On cost basis of ${D.fmtTHB(D.TOTAL_COST_THB, { compact: true })}`}
      </div>

      {/* Trend line */}
      <div className="mt-3">
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block" style={{ height: 60 }}>
          <defs>
            <linearGradient id="plGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineStroke} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={lineStroke} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#plGrad)"/>
          <polyline points={pts} fill="none" stroke={lineStroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-3">
        <MoverSlot assets={allMovers} value={picks[0]} exclude={picks[1]} onChange={(tk) => setPick(0, tk)} lang={lang}/>
        <MoverSlot assets={allMovers} value={picks[1]} exclude={picks[0]} onChange={(tk) => setPick(1, tk)} lang={lang}/>
      </div>
    </Card>
  );
}

// ─── 3. Dividend YTD card ────────────────────────────────────────────
function DividendYTDCard() {
  const { lang } = window.useT();
  const divsYTD = D.TOTAL_DIVS_YTD_THB;
  // Mock month-over-month change (positive trend)
  const last = divsYTD * 0.18;
  const prev = divsYTD * 0.13;
  const change = last - prev;
  const changePct = prev > 0 ? ((last - prev) / prev) * 100 : 0;

  // Top contributors by YTD dividend
  const contributors = D.ENRICHED
    .filter(a => (a.dividendsYTD || 0) > 0)
    .map(a => ({
      ticker: a.ticker,
      cls: D.ASSET_CLASSES[a.cls] || { color: 'oklch(0.62 0.015 250)', label: a.cls || 'Other' },
      amountTHB: D.toTHB(a.dividendsYTD, a.ccy),
    }))
    .sort((a, b) => b.amountTHB - a.amountTHB)
    .slice(0, 3);
  const totalTop = contributors.reduce((s, c) => s + c.amountTHB, 0) || 1;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gain flex items-center justify-center text-white">
            <Icon.Coins size={14}/>
          </div>
          <span className="text-ink-900 text-[15px] font-semibold">{lang === 'th' ? 'เงินปันผลสะสมปีนี้' : 'Total Dividend YTD'}</span>
          <window.InfoTip title={lang === 'th' ? 'ปันผลสะสมปีนี้' : 'Dividend YTD'}>
            {lang === 'th'
              ? 'เงินปันผลที่ “รับมาแล้วจริง” ตั้งแต่ 1 ม.ค. ปีนี้ รวมทุกสินทรัพย์เป็นบาท ด้านล่างคือหุ้นที่จ่ายมากที่สุด'
              : 'Dividends you’ve actually received since Jan 1 this year, summed in THB. Below are the holdings that paid the most.'}
          </window.InfoTip>
        </div>
        <MonthSelect/>
      </div>

      <div className="mt-5">
        <MoneyBig value={divsYTD} ccy="THB" size={28}/>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Pill tone="gain" size="sm">
          <Icon.ArrowUp size={10}/>
          +{D.fmtTHB(change, { compact: true })} ({changePct.toFixed(1)}%)
        </Pill>
        <span className="text-[11px] text-ink-500">{lang === 'th' ? 'เทียบเดือนก่อน' : 'vs last month'}</span>
      </div>

      {/* Top contributors */}
      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
          {lang === 'th' ? 'ผู้จ่ายปันผลสูงสุด' : 'Top Payers'}
        </div>
        <div className="space-y-1.5">
          {contributors.map(c => (
            <div key={c.ticker} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.cls.color }}></div>
              <span className="text-[11px] text-ink-800 font-medium num w-16 shrink-0">{c.ticker}</span>
              <div className="flex-1 h-1.5 bg-surface-soft rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(c.amountTHB / totalTop) * 100}%`, background: c.cls.color }}></div>
              </div>
              <span className="text-[11px] text-ink-700 num shrink-0">{D.fmtTHB(c.amountTHB, { compact: true })}</span>
            </div>
          ))}
          {contributors.length === 0 && (
            <div className="text-[12px] text-ink-500">{lang === 'th' ? 'ยังไม่มีปันผล' : 'No dividends yet'}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function MonthSelect() {
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState('MAY 2026');
  const months = ['MAY 2026', 'APR 2026', 'MAR 2026', 'YTD', 'ALL TIME'];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 bg-white border border-line2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-700 hover:bg-surface-soft transition-colors">
        {val}
        <Icon.ChevronDown size={10}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1 z-40 bg-card border border-line2 rounded-xl shadow-pop py-1 min-w-[120px]">
            {months.map(m => (
              <button key={m} onClick={() => { setVal(m); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-soft">{m}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

window.Bento = { Card, Pill, MoneyBig, ChangeBadge, BalanceCard, PLCard, DividendYTDCard, MonthSelect };
