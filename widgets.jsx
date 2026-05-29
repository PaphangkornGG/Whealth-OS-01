const { fmtTHB, fmtPct, fmtNum } = window.DataLayer;
const { Icon } = window;

// --- Sparkline ----------------------------------------------------------
function Sparkline({ data, w=120, h=32, stroke='currentColor', fill=null }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 4) - 2]);
  const d = points.map((p,i) => (i===0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = fill ? `${d} L${w},${h} L0,${h} Z` : null;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {fill && <path d={area} fill={fill} opacity="0.18" />}
      <path d={d} className="spark" stroke={stroke} />
    </svg>
  );
}

// --- Metric Widget -----------------------------------------------------
function Widget({ label, value, sub, accent='ink', icon, spark, sparkColor, footer, kbd, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card relative overflow-hidden group text-left w-full ${onClick ? 'hover:border-ink-300 transition-colors cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-ink-500 text-[12px] font-medium uppercase tracking-[0.08em]">
          <span className={`w-1.5 h-1.5 rounded-full bg-${accent}`}></span>
          {label}
        </div>
        <div className="flex items-center gap-1">
          {icon && <div className={`text-${accent}`}>{icon}</div>}
          {onClick && <Icon.ChevronDown size={12} className="text-ink-500 opacity-0 group-hover:opacity-100 -rotate-90 transition-opacity"/>}
        </div>
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="num text-ink-800 text-[34px] leading-none font-medium tracking-tight">
          {value}
        </div>
      </div>
      {sub && <div className="mt-2 text-[13px] flex items-center gap-2 num">{sub}</div>}
      {spark && (
        <div className="mt-4 -mx-1">
          <Sparkline data={spark} w={300} h={44} stroke={sparkColor} fill={sparkColor} />
        </div>
      )}
      {footer && <div className="mt-3 pt-3 border-t border-ink-200 text-[12px] text-ink-500">{footer}</div>}
    </Comp>
  );
}

// --- Top widgets row ---------------------------------------------------
function TopWidgets() {
  const D = window.DataLayer;
  const { t } = window.useT();
  const nav = window.useNav();
  const dailyPositive = D.DAILY_CHANGE_PCT >= 0;
  const truePositive = D.TRUE_RETURN_PCT >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Widget
        label={t.netWorth}
        accent="brand"
        icon={<Icon.Wallet size={16} />}
        onClick={() => nav.goTo('holdings')}
        value={fmtTHB(D.TOTAL_THB)}
        sub={
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${dailyPositive ? 'bg-gain-soft text-gain' : 'bg-loss-soft text-loss'}`}>
            {dailyPositive ? <Icon.ArrowUp size={12}/> : <Icon.ArrowDown size={12}/>}
            {fmtPct(D.DAILY_CHANGE_PCT)} · {fmtTHB(D.DAILY_CHANGE_THB, { sign: true })}
            <span className="text-ink-500 ml-1 font-normal">{t.today}</span>
          </span>
        }
        spark={D.PORTFOLIO_SPARK}
        sparkColor={dailyPositive ? 'oklch(0.78 0.16 152)' : 'oklch(0.72 0.19 28)'}
        footer={<span>{t.acrossPositions(D.ENRICHED.length, D.ALLOCATION.filter(a => a.pct > 0).length, D.FX.USD_THB.toFixed(2))}</span>}
      />
      <Widget
        label={t.trueReturn}
        accent={truePositive ? 'gain' : 'loss'}
        icon={truePositive ? <Icon.TrendUp size={16}/> : <Icon.TrendDown size={16}/>}
        onClick={() => nav.goTo('holdings')}
        value={fmtPct(D.TRUE_RETURN_PCT, 2)}
        sub={
          <>
            <span className="text-ink-600">{t.capital}</span>
            <span className="text-ink-700">{fmtTHB(D.TOTAL_THB - D.TOTAL_COST_THB, { sign: true })}</span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-600">{t.divs}</span>
            <span className="text-ink-700">{fmtTHB(D.TOTAL_DIVS_LIFE_THB, { sign: true })}</span>
          </>
        }
        footer={
          <div className="flex items-center justify-between">
            <span>{t.allTime}</span>
            <span className="text-ink-700 num">{t.cost} ฿{fmtNum(D.TOTAL_COST_THB/1_000_000, 2)}M</span>
          </div>
        }
      />
      <Widget
        label={t.dividends}
        accent="warn"
        icon={<Icon.Coins size={16}/>}
        onClick={() => nav.goTo('cashflow')}
        value={fmtTHB(D.TOTAL_DIVS_YTD_THB)}
        sub={
          <>
            <span className="text-ink-600">{t.runRate}</span>
            <span className="text-ink-700">{fmtTHB(D.TOTAL_DIVS_YTD_THB * 2.4, { compact: true })}</span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-600">{t.yieldOnCost}</span>
            <span className="text-warn">{fmtPct((D.TOTAL_DIVS_LIFE_THB / D.TOTAL_COST_THB)*100, 2, false)}</span>
          </>
        }
        footer={
          <DivBar />
        }
      />
    </div>
  );
}

// Tiny monthly bar chart for dividend cashflow
function DivBar() {
  // simulated monthly distribution (THB)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const D = window.DataLayer;
  const total = D.TOTAL_DIVS_YTD_THB;
  // distribute heavier on q2/q4
  const weights = [0.04,0.05,0.18,0.06,0.22,0.05, 0.03,0.04,0.18, 0,0,0];
  // current month (May = idx 4)
  const currentMonth = 4;
  const bars = weights.map(w => w * total / 0.83); // normalize for shown months
  const max = Math.max(...bars);
  return (
    <div className="flex items-end gap-[3px] h-7 -mb-1">
      {bars.map((v, i) => {
        const h = max ? (v / max) * 100 : 0;
        const future = i > currentMonth;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-sm ${future ? 'bg-ink-200' : (v ? 'bg-warn' : 'bg-ink-200')}`}
              style={{ height: `${Math.max(h, 4)}%`, opacity: future ? 0.4 : (v ? 1 : 0.25) }}
              title={`${months[i]}: ฿${Math.round(v).toLocaleString()}`}
            />
            <span className={`text-[9px] ${i===currentMonth ? 'text-warn' : 'text-ink-400'} uppercase tracking-wider`}>{months[i][0]}</span>
          </div>
        );
      })}
    </div>
  );
}

window.TopWidgets = TopWidgets;
window.Sparkline = Sparkline;
