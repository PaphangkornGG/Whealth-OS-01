const { ENRICHED, ASSET_CLASSES, BROKERS, fmtTHB, fmtNum, fmtPct, fmtUnits, toTHB } = window.DataLayer;
const { Icon, Sparkline, BrokerBadge } = window;

const CLASS_ICON = {
  us: <Icon.Globe size={12}/>,
  th: <Icon.Building size={12}/>,
  fund: <Icon.PieChart size={12}/>,
  gold: <Icon.Coins size={12}/>,
  crypto: <Icon.Bitcoin size={12}/>,
  cash: <Icon.Banknote size={12}/>,
};

const COLUMNS_BASE = [
  { id: 'ticker',         tkey: 'asset',         align: 'left',  w: 'w-[22%]' },
  { id: 'cls',            tkey: 'cls',           align: 'left',  w: 'w-[10%]' },
  { id: 'units',          tkey: 'units',         align: 'right', w: 'w-[9%]' },
  { id: 'avgCost',        tkey: 'avgCost',       align: 'right', w: 'w-[10%]' },
  { id: 'price',          tkey: 'price',         align: 'right', w: 'w-[10%]' },
  { id: 'spark',          tkey: 'spark',         align: 'left',  w: 'w-[9%]',  unsortable: true },
  { id: 'valueTHB',       tkey: 'valueTHB',      align: 'right', w: 'w-[12%]' },
  { id: 'unrealizedPct',  tkey: 'unrealized',    align: 'right', w: 'w-[10%]' },
  { id: 'totalReturnPct', tkey: 'totalReturn',   align: 'right', w: 'w-[8%]' },
];

function AssetTable({ externalFilter, onClearFilter }) {
  const lang = window.localStorage.getItem('wealthos_lang') || 'en';
  const { t } = window.useT();
  const nav = window.useNav();
  const COLUMNS = COLUMNS_BASE.map(c => ({ ...c, label: t.columns[c.tkey] }));
  const [sortBy, setSortBy] = React.useState('valueTHB');
  const [sortDir, setSortDir] = React.useState('desc');
  const [filterCls, setFilterCls] = React.useState('all');
  const [selected, setSelected] = React.useState(null);
  const [search, setSearch] = React.useState('');

  // External (parent-controlled) filter takes precedence over internal class filter
  const activeBroker = externalFilter?.broker || null;
  const activeCls    = externalFilter?.cls || null;

  const toggleSort = (id) => {
    if (id === sortBy) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(id); setSortDir('desc'); }
  };

  const rows = React.useMemo(() => {
    let filtered = ENRICHED;
    if (activeCls) filtered = filtered.filter(a => a.cls === activeCls);
    if (activeBroker) filtered = filtered.filter(a => a.broker === activeBroker);
    if (!activeCls && filterCls !== 'all') filtered = filtered.filter(a => a.cls === filterCls);
    
    // Apply name and symbol search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(a => 
        a.ticker.toLowerCase().includes(q) || 
        a.name.toLowerCase().includes(q)
      );
    }

    const sorted = [...filtered].sort((a,b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'ticker' || sortBy === 'cls') {
        av = String(av); bv = String(bv);
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return sorted;
  }, [sortBy, sortDir, filterCls, activeBroker, activeCls, search]);

  const filters = [
    { id: 'all', label: t.all, count: ENRICHED.length },
    ...Object.values(ASSET_CLASSES).map(c => ({
      id: c.id, label: t.classes[c.id] || c.label, count: ENRICHED.filter(a => a.cls === c.id).length, color: c.color,
    })),
  ];

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
        <div className="flex items-center gap-4 min-w-0">
          <h3 className="text-ink-700 text-sm font-semibold">{t.holdings}</h3>
          <span className="text-[12px] text-ink-500 num">{rows.length} {t.positions}</span>
          {(activeBroker || activeCls) && (
            <button
              onClick={() => onClearFilter && onClearFilter()}
              className="flex items-center gap-1.5 bg-brand-soft border border-brand/30 text-brand text-[11px] px-2 py-0.5 rounded-md hover:bg-brand/20 transition-colors group"
              title="Clear filter"
            >
              {activeBroker && BROKERS[activeBroker] && (
                <>
                  <BrokerBadge broker={BROKERS[activeBroker]} size={14}/>
                  <span className="font-medium">{BROKERS[activeBroker].label}</span>
                </>
              )}
              {activeCls && ASSET_CLASSES[activeCls] && (
                <>
                  <span className="w-1.5 h-1.5 rounded-sm" style={{ background: ASSET_CLASSES[activeCls].color }}></span>
                  <span className="font-medium">{t.classes[activeCls] || ASSET_CLASSES[activeCls].label}</span>
                </>
              )}
              <Icon.X size={11} className="opacity-60 group-hover:opacity-100"/>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-[240px] mx-4">
          <div className="relative w-full">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400">
              <Icon.Search size={12}/>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={window.localStorage.getItem('wealthos_lang') === 'th' ? 'ค้นหาชื่อ/ตัวย่อ...' : 'Search name/symbol...'}
              className="w-full bg-ink-100 border border-ink-200 rounded-lg pl-7 pr-7 py-1.5 text-[12px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand focus:bg-ink-0 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 cursor-pointer"
              >
                <Icon.X size={10}/>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!externalFilter && (
            <div className="flex items-center gap-1 bg-ink-100 rounded-lg p-1">
              {filters.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCls(f.id)}
                  className={`text-[12px] px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${filterCls === f.id ? 'bg-ink-200 text-ink-800 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
                >
                  {f.color && <span className="w-1.5 h-1.5 rounded-full" style={{background: f.color}}></span>}
                  {f.label}
                  <span className={`num text-[10px] ${filterCls === f.id ? 'text-ink-500' : 'text-ink-400'}`}>{f.count}</span>
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => {
              const headers = ['Date', 'Type', 'Asset', 'Broker', 'Units', 'Price', 'Fee', 'Total', 'Currency'];
              const csv = [headers.join(',')];
              D.TRANSACTIONS.forEach(tx => {
                const date = tx.date.toISOString().split('T')[0];
                csv.push([date, tx.type, tx.ticker, tx.broker, tx.units || '', tx.price || '', tx.fee || '', tx.total || '', tx.ccy].join(','));
              });
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `transactions_ledger_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="text-ink-500 hover:text-ink-700 transition-colors p-1.5 rounded-md hover:bg-ink-100" 
            title={lang === 'th' ? 'ส่งออก CSV' : 'Export CSV'}
          >
            <Icon.Download size={14}/>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-[13px] min-w-[920px]">
          <thead>
            <tr className="text-ink-500 text-[11px] uppercase tracking-wider">
              {COLUMNS.map(c => (
                <th
                  key={c.id}
                  className={`px-4 py-2.5 ${c.w} ${c.align === 'right' ? 'text-right' : 'text-left'} font-medium ${c.unsortable ? '' : 'cursor-pointer hover:text-ink-700'} transition-colors select-none`}
                  onClick={() => !c.unsortable && toggleSort(c.id)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.align === 'right' && !c.unsortable && (sortBy === c.id ? (sortDir === 'asc' ? <Icon.ChevronUp size={10}/> : <Icon.ChevronDown size={10}/>) : <Icon.ArrowUpDown size={10} className="opacity-40"/>)}
                    {c.label}
                    {c.align === 'left' && !c.unsortable && (sortBy === c.id ? (sortDir === 'asc' ? <Icon.ChevronUp size={10}/> : <Icon.ChevronDown size={10}/>) : <Icon.ArrowUpDown size={10} className="opacity-40"/>)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const isSel = selected === a.ticker;
              const gainPos = a.unrealizedPct >= 0;
              const totalPos = a.totalReturnPct >= 0;
              const cls = ASSET_CLASSES[a.cls] || { color: 'oklch(0.62 0.015 250)', label: a.cls || 'Other' };
              const sparkUp = a.spark && a.spark.length > 0 ? a.spark[a.spark.length-1] >= a.spark[0] : true;
              return (
                <React.Fragment key={`${a.ticker}-${a.broker}-${i}`}>
                  <tr
                    onClick={() => setSelected(isSel ? null : a.ticker)}
                    className={`border-t border-ink-200 cursor-pointer transition-colors ${isSel ? 'bg-ink-100' : 'hover:bg-ink-100/60'}`}
                  >
                    {/* Asset */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <StockLogo ticker={a.ticker} cls={a.cls} size={32} />
                        <div className="min-w-0">
                          <div className="text-ink-800 font-medium num">{a.ticker.replace('-THB','')}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {BROKERS[a.broker] && <BrokerBadge broker={BROKERS[a.broker]} size={14}/>}
                            <span className="text-ink-500 text-[11px] truncate">{BROKERS[a.broker]?.label || a.name}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Class */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md bg-ink-100 border border-ink-200" style={{ color: cls.color, borderColor: `color-mix(in oklch, ${cls.color} 20%, transparent)`, background: `color-mix(in oklch, ${cls.color} 10%, transparent)` }}>
                        {CLASS_ICON[a.cls]}
                        {t.classesShort[a.cls]}
                      </span>
                    </td>
                    {/* Units */}
                    <td className="px-4 py-3 text-right num text-ink-700">
                      {a.cls === 'cash' ? '—' : fmtUnits(a.units)}
                    </td>
                    {/* Avg cost */}
                    <td className="px-4 py-3 text-right num text-ink-600">
                      {a.cls === 'cash' ? '—' : `${a.ccy === 'USD' ? '$' : '฿'}${fmtNum(a.avgCost, a.avgCost < 10 ? 4 : 2)}`}
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-ink-900 group">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const raw = prompt(`Enter manual price for ${a.ticker}:`, a.price);
                            if (raw !== null) {
                              const num = parseFloat(raw);
                              if (!isNaN(num) && num >= 0) {
                                try {
                                  const manual = JSON.parse(localStorage.getItem('netto:manualPrices') || '{}');
                                  manual[a.ticker] = num;
                                  localStorage.setItem('netto:manualPrices', JSON.stringify(manual));
                                  window.location.reload();
                                } catch(e) {}
                              }
                            }
                          }}
                          className="hover:bg-line px-1 -mx-1 rounded transition-colors cursor-text"
                          title={lang === 'th' ? 'คลิกเพื่อแก้ไขราคาเอง' : 'Click to override price'}
                        >
                          {a.cls === 'cash' ? '—' : `${a.ccy === 'USD' ? '$' : '฿'}${fmtNum(a.price, a.price < 10 ? 4 : 2)}`}
                        </button>
                      </div>
                    </td>
                    {/* Spark */}
                    <td className="px-4 py-3">
                      <Sparkline data={a.spark} w={64} h={22}
                        stroke={sparkUp ? 'oklch(0.78 0.16 152)' : 'oklch(0.72 0.19 28)'} />
                    </td>
                    {/* Value THB */}
                    <td className="px-4 py-3 text-right num text-ink-800 font-medium">
                      {fmtTHB(a.valueTHB)}
                    </td>
                    {/* Unrealized */}
                    <td className="px-4 py-3 text-right">
                      <div className={`num ${gainPos ? 'text-gain' : 'text-loss'} font-medium`}>
                        {fmtPct(a.unrealizedPct)}
                      </div>
                      <div className={`text-[10px] num ${gainPos ? 'text-gain/70' : 'text-loss/70'}`}>
                        {fmtTHB(toTHB(a.unrealized, a.ccy), { sign: true, compact: true })}
                      </div>
                    </td>
                    {/* Total return */}
                    <td className="px-4 py-3 text-right">
                      <div className={`num ${totalPos ? 'text-gain' : 'text-loss'} font-medium`}>
                        {fmtPct(a.totalReturnPct)}
                      </div>
                      {a.dividendsLifetime > 0 && (
                        <div className="text-[10px] num text-warn/80">
                          +div {fmtTHB(toTHB(a.dividendsLifetime, a.ccy), { compact: true })}
                        </div>
                      )}
                    </td>
                  </tr>
                  {isSel && (
                    <tr className="border-t border-ink-200 bg-ink-0/50 fade-in">
                      <td colSpan={COLUMNS.length} className="px-4 py-4">
                        <div className="grid grid-cols-5 gap-6 pl-11">
                          <DetailStat label={t.detail.cost} value={fmtTHB(toTHB(a.cost, a.ccy))} />
                          <DetailStat label={t.detail.value} value={fmtTHB(a.valueTHB)} />
                          <DetailStat label={t.detail.pl} value={fmtTHB(toTHB(a.unrealized, a.ccy), { sign: true })} tone={gainPos ? 'gain' : 'loss'} />
                          <DetailStat label={t.detail.divs} value={fmtTHB(toTHB(a.dividendsLifetime, a.ccy))} tone="warn"/>
                          <DetailStat label={t.detail.fees} value={fmtTHB(toTHB(a.feesLifetime || 0, a.ccy))} tone="ink"/>
                          <div className="col-span-5 flex items-center gap-2 pt-1">
                            <button
                              onClick={() => nav.openTx({ type: 'buy', ticker: a.ticker, broker: a.broker })}
                              className="text-[12px] px-3 py-1.5 rounded-md bg-gain/15 text-gain hover:bg-gain/25 transition-colors font-medium"
                            >{t.detail.buyMore}</button>
                            <button
                              onClick={() => nav.openTx({ type: 'sell', ticker: a.ticker, broker: a.broker })}
                              className="text-[12px] px-3 py-1.5 rounded-md bg-loss/15 text-loss hover:bg-loss/25 transition-colors font-medium"
                            >{t.detail.sellD}</button>
                            <button
                              onClick={() => nav.openTx({ type: 'dividend', ticker: a.ticker, broker: a.broker })}
                              className="text-[12px] px-3 py-1.5 rounded-md bg-ink-100 text-ink-700 hover:bg-ink-200 transition-colors"
                            >{t.detail.logDiv}</button>
                            <div className="flex-1"></div>
                            {BROKERS[a.broker] && (
                              <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
                                <span>{t.detail.heldOn}</span>
                                <BrokerBadge broker={BROKERS[a.broker]} size={16}/>
                                <span className="text-ink-700">{BROKERS[a.broker].label}</span>
                              </div>
                            )}
                            <button onClick={() => nav.openLedger && nav.openLedger()} className="text-[12px] text-ink-500 hover:text-ink-700 transition-colors ml-3">{t.detail.viewTx}</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / totals */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-ink-200 text-[12px] text-ink-500 bg-ink-0/40">
        <span>{t.showingX(rows.length, ENRICHED.length)}</span>
        <div className="flex items-center gap-6 num">
          <span>{t.totalCost} <span className="text-ink-700">{fmtTHB(window.DataLayer.TOTAL_COST_THB)}</span></span>
          <div className="flex items-center gap-4 text-xs font-medium text-ink-700 bg-ink-100/50 px-3 py-2 rounded">
            <span>{t.totalVal}: {fmtTHB(window.DataLayer.TOTAL_THB)}</span>
            <span>{t.PL} <span className={window.DataLayer.TOTAL_THB - window.DataLayer.TOTAL_COST_THB >= 0 ? 'text-gain' : 'text-loss'}>{fmtTHB(window.DataLayer.TOTAL_THB - window.DataLayer.TOTAL_COST_THB, { sign: true })}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, tone='ink' }) {
  const toneCls = tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : tone === 'warn' ? 'text-warn' : 'text-ink-800';
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`num text-base mt-1 ${toneCls}`}>{value}</div>
    </div>
  );
}

window.AssetTable = AssetTable;
