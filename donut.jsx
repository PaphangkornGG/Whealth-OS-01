const { ALLOCATION, ALLOCATION_BROKER, TOTAL_THB, fmtTHB, fmtPct } = window.DataLayer;
const { Icon } = window;

// --- Donut chart -------------------------------------------------------
function Donut({ size=220, thickness=22, segments, hoveredIdx, setHoveredIdx, centerLabel }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {/* Track */}
      <circle cx={center} cy={center} r={r} fill="none" stroke="oklch(0.90 0.005 250)" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const len = seg.pct * c;
        const gap = c - len;
        const offset = -acc * c + (c * 0.25); // start at top
        acc += seg.pct;
        const hovered = hoveredIdx === i;
        return (
          <circle
            key={seg.id}
            cx={center} cy={center} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={hovered ? thickness + 4 : thickness}
            strokeDasharray={`${Math.max(len - 2, 0)} ${gap + 2}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${center} ${center})`}
            strokeLinecap="butt"
            style={{ transition: 'stroke-width .15s ease, opacity .15s ease', cursor: 'pointer' }}
            opacity={hoveredIdx === null || hovered ? 1 : 0.35}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        );
      })}
      {/* Center label */}
      <g>
        {hoveredIdx !== null ? (
          <>
            <text x={center} y={center - 14} textAnchor="middle" fontSize="11" fill="oklch(0.45 0.012 250)" style={{textTransform:'uppercase', letterSpacing:'0.08em'}}>
              {segments[hoveredIdx].label}
            </text>
            <text x={center} y={center + 10} textAnchor="middle" fontSize="22" fill="oklch(0.15 0.01 250)" fontFamily="Geist Mono" fontWeight="500">
              {(segments[hoveredIdx].pct * 100).toFixed(1)}%
            </text>
            <text x={center} y={center + 28} textAnchor="middle" fontSize="11" fill="oklch(0.45 0.012 250)" fontFamily="Geist Mono">
              {fmtTHB(segments[hoveredIdx].valueTHB, { compact: true })}
            </text>
          </>
        ) : (
          <>
            <text x={center} y={center - 14} textAnchor="middle" fontSize="10" fill="oklch(0.45 0.012 250)" style={{textTransform:'uppercase', letterSpacing:'0.08em'}}>
              {centerLabel || 'Net Worth'}
            </text>
            <text x={center} y={center + 10} textAnchor="middle" fontSize="22" fill="oklch(0.15 0.01 250)" fontFamily="Geist Mono" fontWeight="500">
              {fmtTHB(TOTAL_THB, { compact: true })}
            </text>
            <text x={center} y={center + 28} textAnchor="middle" fontSize="11" fill="oklch(0.45 0.012 250)" fontFamily="Geist Mono">
              THB
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

// --- Allocation card --------------------------------------------------
function AllocationCard() {
  const { t, lang } = window.useT();
  const nav = window.useNav();
  const [hovered, setHovered] = React.useState(null);
  const [view, setView] = React.useState('class'); // 'class' | 'account'

  // Translate class names; broker labels stay as-is (proper nouns)
  const segments = React.useMemo(() => {
    if (view === 'class') {
      return ALLOCATION.map(s => ({ ...s, label: t.classes[s.id] || s.label }));
    }
    // By-account: color each segment by its app's real brand/logo color,
    // tuned to a readable lightness so light brands (Bitkub, InnovestX, MAKE…)
    // don't wash out on the white card. Brand colors on the broker objects stay
    // untouched so the logo badges elsewhere are unaffected.
    const BROKER_CHART_COLOR = {
      scb_easy:       'oklch(0.46 0.17 305)', // SCB purple
      streaming:      'oklch(0.50 0.14 250)', // Settrade blue
      finansia:       'oklch(0.58 0.20 25)',  // Finansia red
      innovestx:      'oklch(0.40 0.03 264)', // InnovestX black
      pi:             'oklch(0.62 0.15 165)', // Pi teal-green
      liberator:      'oklch(0.55 0.20 262)', // Liberator blue
      dime:           'oklch(0.70 0.17 155)', // Dime mint
      webull:         'oklch(0.48 0.22 264)', // Webull blue
      jitta:          'oklch(0.64 0.12 205)', // Jitta cyan
      finnomena:      'oklch(0.76 0.16 88)',  // FINNOMENA yellow
      kplus:          'oklch(0.54 0.18 150)', // KBank green
      scb_am:         'oklch(0.40 0.16 305)', // SCBAM purple
      krungthai_next: 'oklch(0.64 0.15 238)', // KTB sky blue
      paotang:        'oklch(0.56 0.13 225)', // Paotang blue
      mfc:            'oklch(0.56 0.20 28)',  // MFC red-orange
      bitkub:         'oklch(0.68 0.15 168)', // Bitkub green
      binance_th:     'oklch(0.78 0.16 82)',  // Binance gold
      make:           'oklch(0.42 0.05 220)', // MAKE dark
      kept:           'oklch(0.62 0.18 32)',  // Kept coral
      kkp_better:     'oklch(0.55 0.18 292)', // KKP purple
      cms:            'oklch(0.56 0.20 322)', // CMS magenta
      hua_seng_heng:  'oklch(0.44 0.10 255)', // GOLD NOW navy
      mts_gold:       'oklch(0.40 0.11 264)', // MTSGoldX navy
    };
    return ALLOCATION_BROKER.map(s => ({ ...s, color: BROKER_CHART_COLOR[s.id] || s.color }));
  }, [view, t]);

  React.useEffect(() => { setHovered(null); }, [view]);

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-ink-700 text-sm font-semibold">{t.allocation}</h3>
            <window.InfoTip title={lang === 'th' ? 'สัดส่วนสินทรัพย์' : 'Allocation'}>
              {lang === 'th'
                ? 'พอร์ตของคุณกระจายไปในสินทรัพย์แต่ละประเภท (หรือแต่ละบัญชี) คิดเป็นกี่ % ช่วยดูว่ากระจุกตัวเกินไปไหม ชี้ที่วงเพื่อดูรายละเอียด'
                : 'How your portfolio is split across asset classes (or accounts), by %. Helps you spot over-concentration. Hover the ring for details.'}
            </window.InfoTip>
          </div>
          <p className="text-ink-500 text-[12px] mt-0.5">
            {view === 'class' ? t.classSub : t.accountSub(ALLOCATION_BROKER.length)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-ink-100 border border-ink-200 rounded-lg p-0.5 text-[12px]">
            {[
              { id: 'class',   label: t.byClass },
              { id: 'account', label: t.byAccount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${view === tab.id ? 'bg-ink-200 text-ink-800' : 'text-ink-500 hover:text-ink-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => nav.goTo('holdings')} className="text-ink-500 hover:text-ink-700 transition-colors p-1.5 rounded-md hover:bg-ink-100" title="Open Holdings">
            <Icon.ChevronDown size={14} className="-rotate-90"/>
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <div className="shrink-0">
          <Donut
            segments={segments}
            hoveredIdx={hovered}
            setHoveredIdx={setHovered}
            centerLabel={view === 'class' ? t.netWorthCenter : `${ALLOCATION_BROKER.length} ${t.accountsCenter}`}
          />
        </div>
        <div className="flex-1 min-w-0 space-y-3 max-h-[260px] overflow-y-auto scroll-thin pr-1">
          {segments.map((seg, i) => {
            const hov = hovered === i;
            const isClass = view === 'class';
            const driftPct = isClass ? seg.drift * 100 : 0;
            const overTarget = driftPct > 0;
            return (
              <div
                key={seg.id}
                className={`group cursor-pointer transition-opacity ${hovered !== null && !hov ? 'opacity-40' : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{background: seg.color}}></span>
                    <span className="text-ink-700 truncate">{seg.label}</span>
                    {!isClass && (
                      <span className="text-[10px] text-ink-500 num shrink-0">· {seg.count}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isClass && Math.abs(driftPct) >= 1 && (
                      <span className={`text-[10px] num font-medium px-1.5 py-0.5 rounded-full ${overTarget ? 'bg-warn/15 text-warn' : 'bg-brand/12 text-brand'}`}>
                        {driftPct > 0 ? '+' : ''}{driftPct.toFixed(1)}%
                      </span>
                    )}
                    <span className="num text-ink-800 font-semibold tabular-nums">{(seg.pct * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center">
                  <div className="flex-1 relative h-4 flex items-center">
                    <div className="absolute inset-x-0 h-1.5 rounded-full bg-ink-100"></div>
                    {isClass ? (() => {
                      const cur = seg.pct * 100, tgt = seg.targetPct * 100;
                      const lo = Math.min(cur, tgt), hi = Math.max(cur, tgt);
                      return (
                        <>
                          {/* faded band bridging current → target so the gap reads intentionally */}
                          <div className="absolute h-1.5 rounded-full" style={{ left: `${lo}%`, width: `${hi - lo}%`, background: seg.color, opacity: 0.22 }}></div>
                          {/* solid current */}
                          <div className="absolute left-0 h-1.5 rounded-full" style={{ width: `${cur}%`, background: seg.color, transition: 'width .3s ease' }}></div>
                          {/* target marker */}
                          <div className="absolute w-0.5 h-4 rounded-full bg-ink-600 pointer-events-none" style={{ left: `${tgt}%`, transform: 'translateX(-50%)' }} title={`Target ${tgt.toFixed(0)}%`}></div>
                        </>
                      );
                    })() : (
                      <div className="absolute left-0 h-1.5 rounded-full" style={{ width: `${seg.pct * 100}%`, background: seg.color, transition: 'width .3s ease' }}></div>
                    )}
                  </div>
                  {!isClass && (
                    <div className="text-[11px] num w-14 text-right text-ink-500 ml-2 shrink-0">
                      {fmtTHB(seg.valueTHB, { compact: true })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Rebalance Alerts -------------------------------------------------
function RebalanceCard() {
  const { t, lang } = window.useT();
  const nav = window.useNav();
  // Build smart alerts from drift
  const alerts = ALLOCATION
    .map(seg => ({ ...seg, driftPct: seg.drift * 100, classLabel: t.classes[seg.id] || seg.label }))
    .sort((a,b) => Math.abs(b.driftPct) - Math.abs(a.driftPct))
    .map((seg, i) => {
      const abs = Math.abs(seg.driftPct);
      const over = seg.driftPct > 0;
      const amount = Math.abs(seg.drift) * TOTAL_THB;
      let severity = 'info';
      if (abs > 4) severity = 'warn';
      if (abs > 8) severity = 'loss';
      return {
        ...seg,
        severity,
        title: over ? t.overTarget(seg.classLabel, abs.toFixed(1)) : t.underTarget(seg.classLabel, abs.toFixed(1)),
        body: over
          ? t.consider(t.sell, seg.classLabel, fmtTHB(amount, { compact: true }))
          : t.addAmt(fmtTHB(amount, { compact: true }), (seg.targetPct*100).toFixed(0)),
        action: over ? t.sell : t.buy,
      };
    })
    .filter(a => Math.abs(a.driftPct) > 0.5);

  const sevColor = { warn: 'warn', loss: 'loss', info: 'brand' };

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-ink-700 text-sm font-semibold">{t.rebalancer}</h3>
            <span className="text-[10px] uppercase tracking-wider text-brand px-1.5 py-0.5 rounded bg-brand-soft border border-brand/20">{t.live}</span>
            <window.InfoTip title={lang === 'th' ? 'ปรับสมดุลพอร์ต' : 'Rebalancer'} align="right">
              {lang === 'th'
                ? 'แจ้งเตือนเมื่อสัดส่วนจริงเบี่ยงจากเป้าที่ตั้งไว้ พร้อมบอกว่าควรซื้อ/ขายส่วนไหนเพื่อกลับเข้าเป้า'
                : 'Flags when your actual mix drifts from your target weights, and suggests what to buy or trim to get back on target.'}
            </window.InfoTip>
          </div>
          <p className="text-ink-500 text-[12px] mt-0.5">{t.threshold}</p>
        </div>
        <button onClick={() => nav.goTo('settings')} className="text-[12px] text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1">
          <Icon.Settings size={12}/>
          {t.policy}
        </button>
      </div>

      <div className="mt-4 space-y-2.5 flex-1">
        {alerts.slice(0, 3).map((a, i) => {
          const c = sevColor[a.severity];
          return (
            <div key={a.id} className={`relative rounded-xl border border-${c}/20 bg-${c}-soft p-3.5 transition-all hover:border-${c}/40`}>
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-${c} bg-ink-50 border border-${c}/20`}>
                  {a.severity === 'loss' ? <Icon.Alert size={14}/> : <Icon.Scale size={14}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{background: a.color}}></span>
                    <span className="text-[13px] font-medium text-ink-700">{a.title}</span>
                  </div>
                  <p className="text-[12px] text-ink-500 mt-1 leading-relaxed">{a.body}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => nav.openTx({ type: a.action === t.sell ? 'sell' : 'buy' })}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md bg-${c}/15 text-${c} hover:bg-${c}/25 transition-colors`}
                    >
                      {a.action} {a.classLabel}
                    </button>
                    <button className="text-[11px] text-ink-500 hover:text-ink-700 px-2 py-1 transition-colors">
                      {t.dismiss}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gain-soft flex items-center justify-center text-gain">
              <Icon.Check size={20}/>
            </div>
            <div className="text-ink-700 text-sm font-medium mt-3">{t.inBalance}</div>
            <div className="text-ink-500 text-[12px] mt-1">{t.inBalanceSub}</div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-ink-200 flex items-center justify-between text-[11px] text-ink-500">
        <span>{t.lastChecked}</span>
        <button onClick={() => nav.goTo('holdings')} className="hover:text-ink-700 transition-colors flex items-center gap-1">
          {t.viewPlan} <Icon.ChevronDown size={11} className="-rotate-90"/>
        </button>
      </div>
    </div>
  );
}

window.AllocationCard = AllocationCard;
window.RebalanceCard = RebalanceCard;
