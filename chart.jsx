// Performance chart — portfolio NAV over time, with cost basis + benchmark overlays.
const { fmtTHB, fmtNum, fmtPct } = window.DataLayer;

function PerformanceChart({ range, setRange }) {
  const { t, lang } = window.useT();
  const D = window.DataLayer;
  const [hover, setHover] = React.useState(null);
  const [seriesOn, setSeriesOn] = React.useState({ portfolio: true, cost: true, set50: false, sp500: false });
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    if (D.getRangeDataAsync) {
      D.getRangeDataAsync(range).then(res => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      });
    } else {
      // Fallback for old synchronous version if script not updated
      setData(D.getRangeData(range));
      setLoading(false);
    }
    return () => { active = false; };
  }, [range, D.TRANSACTIONS.length]); // refetch if range or transactions change

  if (loading || !data || data.days === 0) {
    return (
      <div className="bg-ink-50 border border-ink-200 rounded-2xl shadow-card overflow-hidden flex items-center justify-center h-[340px]">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const n = data.portfolio.length;

  // Compute min / max across visible series for chart bounds
  const visible = [];
  if (seriesOn.portfolio) visible.push(...data.portfolio);
  if (seriesOn.cost) visible.push(...data.costBasis);
  if (seriesOn.set50) visible.push(...data.set50);
  if (seriesOn.sp500) visible.push(...data.sp500);
  if (!visible.length) visible.push(...data.portfolio);
  const min = Math.min(...visible);
  const max = Math.max(...visible);
  const pad = (max - min) * 0.08;
  const yMin = min - pad;
  const yMax = max + pad;

  // Chart dimensions
  const W = 980, H = 240;
  const PADL = 56, PADR = 12, PADT = 12, PADB = 28;
  const plotW = W - PADL - PADR;
  const plotH = H - PADT - PADB;

  function xAt(i) { return PADL + (i / Math.max(1, n - 1)) * plotW; }
  function yAt(v) { return PADT + (1 - (v - yMin) / (yMax - yMin)) * plotH; }

  function pathFor(arr) {
    return arr.map((v, i) => (i === 0 ? `M${xAt(i)},${yAt(v)}` : `L${xAt(i)},${yAt(v)}`)).join(' ');
  }
  function areaFor(arr) {
    return `${pathFor(arr)} L${xAt(arr.length - 1)},${yAt(yMin)} L${xAt(0)},${yAt(yMin)} Z`;
  }

  // Y axis ticks
  const yTicks = 4;
  const yTickArr = Array.from({ length: yTicks }, (_, i) => yMin + ((yMax - yMin) * (yTicks - i)) / yTicks);

  // X labels — pick a few date markers based on range
  function dateLabel(i) {
    const d = data.dates && data.dates[i] ? new Date(data.dates[i]) : new Date();
    if (range === '1D') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (range === '1W') return d.toLocaleDateString('en-US', { weekday: 'short' });
    if (range === '1M' || range === '3M') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (range === '1Y') return d.toLocaleDateString('en-US', { month: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  const xTickCount = range === '1D' ? 4 : range === '1W' ? 7 : range === 'ALL' ? 6 : 5;
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) => Math.floor((i / (xTickCount - 1)) * (n - 1)));

  // Current and start values
  const startV = data.portfolio[0];
  const endV = data.portfolio[n - 1];
  const change = endV - startV;
  const changePct = (change / startV) * 100;
  const positive = change >= 0;

  // Hover handler
  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - PADL) / plotW) * (n - 1));
    if (idx >= 0 && idx < n) setHover(idx);
    else setHover(null);
  }

  const SERIES = [
    { id: 'portfolio', label: t.portfolio, color: 'oklch(0.78 0.13 230)', filled: true },
    { id: 'cost',      label: t.costBasis, color: 'oklch(0.62 0.015 250)', dashed: true },
    { id: 'set50',     label: 'SET50',     color: 'oklch(0.78 0.16 152)' },
    { id: 'sp500',     label: 'S&P 500',   color: 'oklch(0.74 0.14 295)' },
  ];

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="text-ink-700 text-sm font-semibold">{t.performance}</h3>
            <span className="text-[11px] text-ink-500 uppercase tracking-wider">{range}</span>
            <window.InfoTip title={lang === 'th' ? 'ผลตอบแทนพอร์ต' : 'Performance'}>
              {lang === 'th'
                ? 'มูลค่าพอร์ตของคุณตามช่วงเวลา เทียบกับต้นทุนที่ลงไปและดัชนีอ้างอิง เปิด/ปิดเส้นได้ที่ปุ่มมุมขวา ชี้ที่กราฟเพื่อดูค่าแต่ละวัน'
                : 'Your portfolio’s value over time, against your cost basis and a benchmark. Toggle the lines top-right; hover the chart to read any point.'}
            </window.InfoTip>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="num text-ink-800 text-[28px] font-medium tracking-tight">
              {fmtTHB(hover !== null ? data.portfolio[hover] : endV)}
            </span>
            <span className={`text-[13px] num inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${positive ? 'bg-gain-soft text-gain' : 'bg-loss-soft text-loss'}`}>
              {positive ? '▲' : '▼'} {fmtPct(changePct, 2)} · {fmtTHB(change, { sign: true, compact: true })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Series toggles */}
          <div className="hidden md:flex items-center gap-2">
            {SERIES.map(s => (
              <button
                key={s.id}
                onClick={() => setSeriesOn(p => ({ ...p, [s.id]: !p[s.id] }))}
                className={`text-[11px] flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${seriesOn[s.id] ? 'border-ink-200 bg-ink-100 text-ink-700' : 'border-ink-200/50 bg-transparent text-ink-500 hover:text-ink-700'}`}
              >
                <span className={`w-2 h-2 rounded-sm transition-opacity ${seriesOn[s.id] ? 'opacity-100' : 'opacity-30'}`} style={{ background: s.color }}></span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG chart */}
      <div className="px-5 pt-3 pb-2 relative" onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full block"
          onMouseMove={onMove}
          preserveAspectRatio="none"
          style={{ height: '260px' }}
        >
          {/* Grid lines */}
          {yTickArr.map((v, i) => (
            <g key={i}>
              <line x1={PADL} x2={W - PADR} y1={yAt(v)} y2={yAt(v)} stroke="oklch(0.255 0.01 250)" strokeDasharray="2 4" />
              <text x={PADL - 6} y={yAt(v) + 4} fontSize="10" fill="oklch(0.62 0.015 250)" textAnchor="end" fontFamily="Geist Mono">
                {fmtTHB(v, { compact: true })}
              </text>
            </g>
          ))}

          {/* Cost basis (dashed) */}
          {seriesOn.cost && (
            <path d={pathFor(data.costBasis)} fill="none" stroke="oklch(0.62 0.015 250)" strokeWidth="1.25" strokeDasharray="4 3" />
          )}

          {/* SET50 */}
          {seriesOn.set50 && (
            <path d={pathFor(data.set50)} fill="none" stroke="oklch(0.78 0.16 152)" strokeWidth="1.5" opacity="0.85" />
          )}
          {/* S&P 500 */}
          {seriesOn.sp500 && (
            <path d={pathFor(data.sp500)} fill="none" stroke="oklch(0.74 0.14 295)" strokeWidth="1.5" opacity="0.85" />
          )}

          {/* Portfolio (filled) */}
          {seriesOn.portfolio && (
            <>
              <defs>
                <linearGradient id="portFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.13 230)" stopOpacity="0.28"/>
                  <stop offset="100%" stopColor="oklch(0.78 0.13 230)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={areaFor(data.portfolio)} fill="url(#portFill)" />
              <path d={pathFor(data.portfolio)} fill="none" stroke="oklch(0.78 0.13 230)" strokeWidth="2" strokeLinejoin="round" />
            </>
          )}

          {/* X labels */}
          {xTickIndices.map((i, k) => (
            <text key={k} x={xAt(i)} y={H - 8} fontSize="10" fill="oklch(0.62 0.015 250)" textAnchor="middle" fontFamily="Geist Mono">
              {dateLabel(i)}
            </text>
          ))}

          {/* Hover crosshair + dot */}
          {hover !== null && seriesOn.portfolio && (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={xAt(hover)} x2={xAt(hover)} y1={PADT} y2={H - PADB} stroke="oklch(0.48 0.015 250)" strokeWidth="1" strokeDasharray="2 3"/>
              <circle cx={xAt(hover)} cy={yAt(data.portfolio[hover])} r="4.5" fill="oklch(0.18 0.008 250)" stroke="oklch(0.78 0.13 230)" strokeWidth="2"/>
              {seriesOn.cost && <circle cx={xAt(hover)} cy={yAt(data.costBasis[hover])} r="3" fill="oklch(0.62 0.015 250)" stroke="oklch(0.18 0.008 250)" strokeWidth="1.5"/>}
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hover !== null && (
          <div className="absolute pointer-events-none top-3 right-5 bg-ink-100 border border-ink-300 rounded-lg shadow-pop px-3 py-2 text-[12px] min-w-[160px]">
            <div className="text-ink-500 text-[10px] uppercase tracking-wider">{dateLabel(hover)}</div>
            <div className="mt-1.5 space-y-0.5 num">
              {seriesOn.portfolio && (
                <Row color="oklch(0.78 0.13 230)" label={t.portfolio} value={fmtTHB(data.portfolio[hover])}/>
              )}
              {seriesOn.cost && (
                <Row color="oklch(0.62 0.015 250)" label={t.costBasis} value={fmtTHB(data.costBasis[hover])}/>
              )}
              {seriesOn.set50 && (
                <Row color="oklch(0.78 0.16 152)" label="SET50" value={fmtTHB(data.set50[hover], { compact: true })}/>
              )}
              {seriesOn.sp500 && (
                <Row color="oklch(0.74 0.14 295)" label="S&P 500" value={fmtTHB(data.sp500[hover], { compact: true })}/>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-ink-600">
        <span className="w-1.5 h-1.5 rounded-sm" style={{ background: color }}></span>
        {label}
      </span>
      <span className="text-ink-800 font-medium">{value}</span>
    </div>
  );
}

window.PerformanceChart = PerformanceChart;
