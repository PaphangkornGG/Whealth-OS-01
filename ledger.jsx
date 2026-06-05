// Transaction Ledger — slide-in drawer with full transaction history.
const { TRANSACTIONS, BROKERS, ASSET_CLASSES, fmtTHB, fmtNum, fmtUnits, toTHB } = window.DataLayer;

function TransactionLedger({ open, onClose, onEditTx, onDeleteTx }) {
  const { t } = window.useT();
  const [filter, setFilter] = React.useState('all'); // 'all' | 'buy' | 'sell' | 'dividend'
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const rows = React.useMemo(() => {
    let arr = TRANSACTIONS;
    if (filter !== 'all') arr = arr.filter(tx => tx.type === filter);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(tx => tx.ticker.toLowerCase().includes(q) || tx.name.toLowerCase().includes(q));
    }
    return arr;
  }, [filter, search]);

  // Group rows by date (yyyy-mm-dd) for visual section headers
  const grouped = React.useMemo(() => {
    const map = new Map();
    rows.forEach(tx => {
      const key = tx.date.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tx);
    });
    return [...map.entries()];
  }, [rows]);

  const totalBought = rows.filter(tx => tx.type === 'buy').reduce((s, tx) => s + toTHB(tx.total + (tx.fee || 0), tx.ccy), 0);
  const totalSold   = rows.filter(tx => tx.type === 'sell').reduce((s, tx) => s + toTHB(tx.total, tx.ccy), 0);
  const totalDivs   = rows.filter(tx => tx.type === 'dividend').reduce((s, tx) => s + toTHB(tx.total, tx.ccy), 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink-0/60 backdrop-blur-sm fade-in" onClick={onClose}></div>
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-[640px] bg-ink-50 border-l border-ink-300 shadow-pop flex flex-col" style={{ animation: 'slideIn .25s cubic-bezier(.2,.7,.2,1) both' }}>
        <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
          <div>
            <h3 className="text-ink-800 text-base font-semibold">{t.ledger}</h3>
            <p className="text-ink-500 text-[12px]">{t.ledgerSub(TRANSACTIONS.length)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors">
            <window.Icon.X size={16}/>
          </button>
        </div>

        {/* Filters + Search */}
        <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-ink-100 border border-ink-200 rounded-lg p-0.5 text-[12px]">
            {[
              { id: 'all', label: t.all, count: TRANSACTIONS.length },
              { id: 'buy', label: t.buy, count: TRANSACTIONS.filter(tx => tx.type === 'buy').length },
              { id: 'sell', label: t.sell, count: TRANSACTIONS.filter(tx => tx.type === 'sell').length },
              { id: 'dividend', label: t.dividend, count: TRANSACTIONS.filter(tx => tx.type === 'dividend').length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${filter === f.id ? 'bg-ink-200 text-ink-800 shadow-card' : 'text-ink-500 hover:text-ink-700'}`}
              >
                {f.label}
                <span className="num text-[10px] text-ink-400">{f.count}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <window.Icon.Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500"/>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.ledgerSearch}
              className="w-full bg-ink-100 border border-ink-200 rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Summary strip */}
        <div className="px-5 py-3 border-b border-ink-200 grid grid-cols-3 gap-3 text-[12px]">
          <SumPill label={t.boughtTotal} value={fmtTHB(totalBought, { compact: true })} tone="ink"/>
          <SumPill label={t.soldTotal} value={fmtTHB(totalSold, { compact: true })} tone="ink"/>
          <SumPill label={t.divsTotal} value={fmtTHB(totalDivs, { compact: true })} tone="warn"/>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto scroll-thin">
          {grouped.map(([dateKey, txs]) => (
            <div key={dateKey}>
              <div className="px-5 py-2 bg-ink-0/40 border-b border-ink-200 text-[10px] uppercase tracking-wider text-ink-500 font-medium sticky top-0 backdrop-blur-sm">
                {new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              {txs.map(tx => (
                <LedgerRow key={tx.id} tx={tx} onEdit={() => onEditTx?.(tx)} onDelete={() => onDeleteTx?.(tx.id)} />
              ))}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-5 py-10 text-center text-ink-500 text-[13px]">{t.noTx}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SumPill({ label, value, tone='ink' }) {
  const tc = tone === 'warn' ? 'text-warn' : 'text-ink-800';
  return (
    <div className="bg-ink-100 border border-ink-200 rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`num font-medium text-[13px] mt-0.5 ${tc}`}>{value}</div>
    </div>
  );
}

function LedgerRow({ tx, onEdit, onDelete }) {
  const { t } = window.useT();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const cls = ASSET_CLASSES[tx.cls] || { color: 'oklch(0.62 0.015 250)', label: tx.cls || 'Other' };
  const broker = BROKERS[tx.broker];

  const typeMeta = {
    buy:      { tone: 'gain', icon: <window.Icon.ArrowDown size={12}/>, label: t.buy, sign: '−', op: 'bought' },
    sell:     { tone: 'loss', icon: <window.Icon.ArrowUp size={12}/>,   label: t.sell, sign: '+', op: 'sold' },
    dividend: { tone: 'warn', icon: <window.Icon.Coins size={12}/>,     label: t.dividend, sign: '+', op: 'div' },
  }[tx.type];

  const totalTHB = toTHB(tx.total, tx.ccy);
  const ccySym = tx.ccy === 'USD' ? '$' : '฿';

  return (
    <div className="group px-5 py-3 border-b border-ink-200 hover:bg-ink-100/60 transition-colors flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-${typeMeta.tone} bg-${typeMeta.tone}-soft border border-${typeMeta.tone}/20 shrink-0`}>
        {typeMeta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] uppercase tracking-wider font-medium text-${typeMeta.tone}`}>{typeMeta.label}</span>
          <span className="text-ink-800 font-medium text-[13px] num truncate">{tx.ticker}</span>
          <span className="text-ink-500 text-[11px] truncate">· {tx.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink-500">
          {broker && (
            <span className="flex items-center gap-1">
              <window.BrokerBadge broker={broker} size={12}/>
              <span>{broker.label}</span>
            </span>
          )}
          {tx.units !== null && (
            <>
              <span className="text-ink-400">·</span>
              <span className="num">{fmtUnits(tx.units)} @ {ccySym}{fmtNum(tx.price, tx.price < 10 ? 4 : 2)}</span>
            </>
          )}
          {tx.fee > 0 && (
            <>
              <span className="text-ink-400">·</span>
              <span className="num">fee {ccySym}{fmtNum(tx.fee, 2)}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 flex items-center justify-end gap-3 relative min-w-[80px]">
        <div className="text-right transition-opacity group-hover:opacity-0">
          <div className={`num text-[13px] font-medium ${typeMeta.tone === 'gain' ? 'text-ink-700' : typeMeta.tone === 'loss' ? 'text-gain' : 'text-warn'}`}>
            {typeMeta.sign} {fmtTHB(totalTHB, { compact: true })}
          </div>
          {tx.ccy === 'USD' && (
            <div className="text-[10px] text-ink-500 num">${fmtNum(tx.total, 2)}</div>
          )}
        </div>
        
        {/* Hover Actions (Edit/Delete) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-ink-100/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none px-2 py-1 rounded-md shadow-sm md:shadow-none">
          {isDeleting ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-ink-600 font-medium whitespace-nowrap">{window.localStorage.getItem('wealthos_lang') === 'th' ? 'ยืนยันลบ?' : 'Sure?'}</span>
              <button onClick={() => onDelete()} className="px-2 py-1 rounded text-ink-0 bg-loss hover:bg-red-600 transition-colors font-medium">{t.yes || 'Yes'}</button>
              <button onClick={() => setIsDeleting(false)} className="px-2 py-1 rounded text-ink-600 bg-ink-200 hover:bg-ink-300 transition-colors">{t.no || 'No'}</button>
            </div>
          ) : (
            <>
              <button onClick={() => onEdit()} className="p-1.5 rounded-md text-ink-500 hover:text-ink-800 hover:bg-ink-200 transition-colors" title={t.edit || 'Edit'}>
                <window.Icon.Edit size={14}/>
              </button>
              <button onClick={() => setIsDeleting(true)} className="p-1.5 rounded-md text-ink-500 hover:text-loss hover:bg-loss-soft transition-colors" title={t.delete || 'Delete'}>
                <window.Icon.Trash size={14}/>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.TransactionLedger = TransactionLedger;
