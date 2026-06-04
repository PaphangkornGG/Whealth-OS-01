// Watchlist — assets tracked but not currently owned
const { fmtNum, fmtPct } = window.DataLayer;

const WATCHLIST_SEED = [
  { ticker: 'TSLA',         name: 'Tesla Inc.',                 cls: 'us',     ccy: 'USD', price: 348.20,  prev: 339.90,   target: 380,    seed: 88 },
  { ticker: 'META',         name: 'Meta Platforms',             cls: 'us',     ccy: 'USD', price: 588.10,  prev: 597.00,   target: 650,    seed: 47 },
  { ticker: 'AMD',          name: 'Advanced Micro Devices',     cls: 'us',     ccy: 'USD', price: 162.80,  prev: 158.40,   target: 200,    seed: 56 },
  { ticker: 'AOT',          name: 'Airports of Thailand',       cls: 'th',     ccy: 'THB', price: 64.25,   prev: 63.75,    target: 75,     seed: 99 },
  { ticker: 'SCBS&P500E',   name: 'SCB S&P 500 Index',          cls: 'fund',   ccy: 'THB', price: 44.15,   prev: 44.01,    target: 30,     seed: 31 },
  { ticker: 'SOL',          name: 'Solana',                     cls: 'crypto', ccy: 'USD', price: 168.40,  prev: 161.20,   target: 250,    seed: 12 },
];

const WATCH_KEY = 'netto:watchlist';

function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 8) / 0xffffff; };
}
function spark(seed, points=20) {
  const r = rng(seed);
  const out = [];
  let v = 100;
  for (let i = 0; i < points; i++) { v += (r() - 0.45) * 4; out.push(v); }
  return out;
}

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      return stored.map(w => ({ ...w, spark: w.spark || spark((w.ticker.charCodeAt(0) * 31) | 0) }));
    }
  } catch {}
  return WATCHLIST_SEED.map(w => ({ ...w, spark: spark(w.seed) }));
}
function saveWatchlist(arr) {
  try {
    // Don't persist huge spark arrays — they're regenerated from ticker on load
    const lean = arr.map(({ spark, ...rest }) => rest);
    localStorage.setItem(WATCH_KEY, JSON.stringify(lean));
  } catch {}
}

function WatchlistCard() {
  const { t, lang } = window.useT();
  const I = window.Icon;
  const D = window.DataLayer;
  const nav = window.useNav();
  const [items, setItems] = React.useState(loadWatchlist);
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => { saveWatchlist(items); }, [items]);

  function remove(ticker) {
    setItems(arr => arr.filter(x => x.ticker !== ticker));
  }

  function add(entry) {
    const upper = entry.ticker.toUpperCase().trim();
    if (!upper) return;
    setItems(arr => {
      const existing = arr.findIndex(x => x.ticker === upper);
      const next = {
        ...entry,
        ticker: upper,
        prev: entry.price,
        spark: spark((upper.charCodeAt(0) * 31 + upper.length) | 0),
      };
      if (existing >= 0) {
        const copy = [...arr];
        copy[existing] = { ...copy[existing], ...next };
        return copy;
      }
      return [next, ...arr];
    });
  }

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-ink-700 text-sm font-semibold">{t.watchlist}</h3>
            <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 rounded border border-ink-200">{items.length}</span>
            <window.InfoTip title={lang === 'th' ? 'รายการจับตา' : 'Watchlist'} align="right">
              {lang === 'th'
                ? 'สินทรัพย์ที่คุณติดตามแต่ยังไม่ได้ถือ ดูราคาและการเปลี่ยนแปลงแบบเรียลไทม์ เพิ่มได้จากปุ่มด้านล่าง'
                : 'Assets you’re tracking but don’t own yet, with live price and change. Add more from the button below.'}
            </window.InfoTip>
          </div>
          <p className="text-ink-500 text-[12px] mt-0.5">{t.watchlistSub}</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="text-[12px] text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1">
          <I.Plus size={12}/>
          {t.add}
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-1.5 overflow-y-auto scroll-thin pr-1 max-h-[340px]">
        {items.map(w => {
          const cls = D.ASSET_CLASSES[w.cls];
          const change = w.price - w.prev;
          const changePct = w.prev ? (change / w.prev) * 100 : 0;
          const positive = change >= 0;
          const toTarget = w.target ? ((w.target - w.price) / w.price) * 100 : 0;
          const ccy = w.ccy === 'USD' ? '$' : '฿';
          const sparkUp = w.spark[w.spark.length-1] >= w.spark[0];
          return (
            <div
              key={w.ticker}
              className="group relative bg-ink-100/60 hover:bg-ink-100 border border-ink-200 hover:border-ink-300 rounded-lg p-2.5 transition-all cursor-pointer"
              onClick={() => nav.openTx({ type: 'buy', ticker: w.ticker })}
              title={lang === 'th' ? 'คลิกเพื่อซื้อ' : 'Click to buy'}
            >
              <div className="flex items-center gap-3">
                <StockLogo ticker={w.ticker} cls={w.cls} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12px] text-ink-800 font-medium truncate num">{w.ticker}</span>
                    <span className="text-[10px] text-ink-500 truncate">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] num">
                    <span className="text-ink-700">{ccy}{fmtNum(w.price, w.price < 10 ? 4 : 2)}</span>
                    <span className={positive ? 'text-gain' : 'text-loss'}>
                      {positive ? '▲' : '▼'} {fmtPct(changePct, 2)}
                    </span>
                    {w.target ? (
                      <>
                        <span className="text-ink-400">·</span>
                        <span className="text-ink-500">
                          {t.target} {ccy}{fmtNum(w.target, w.target < 10 ? 4 : 2)}
                          <span className={`ml-1 ${toTarget > 0 ? 'text-gain/70' : 'text-loss/70'}`}>
                            ({toTarget > 0 ? '+' : ''}{toTarget.toFixed(0)}%)
                          </span>
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0">
                  <Mini data={w.spark} color={sparkUp ? 'oklch(0.78 0.16 152)' : 'oklch(0.72 0.19 28)'} />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(w.ticker); }}
                  className="opacity-0 group-hover:opacity-100 text-ink-500 hover:text-loss transition-all p-1 rounded-md hover:bg-ink-200"
                  title={t.removeWatch}
                >
                  <I.X size={12}/>
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center text-ink-500">
              <I.Target size={18}/>
            </div>
            <div className="text-ink-700 text-sm font-medium mt-3">{t.watchlistEmpty}</div>
            <div className="text-ink-500 text-[12px] mt-1">{t.watchlistEmptySub}</div>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md bg-ink-100 hover:bg-ink-200 text-ink-700 transition-colors"
            >
              <I.Plus size={12}/>
              {t.add}
            </button>
          </div>
        )}
      </div>

      <AddToWatchlistModal
        open={addOpen}
        lang={lang}
        existing={items}
        onClose={() => setAddOpen(false)}
        onSave={add}
      />
    </div>
  );
}

// --- Add modal -----------------------------------------------------------
const WATCH_CLASS_META = {
  us:     { label: { en: 'US Stock',   th: 'หุ้นสหรัฐ' }, ccy: 'USD' },
  th:     { label: { en: 'Thai Stock', th: 'หุ้นไทย' },    ccy: 'THB' },
  fund:   { label: { en: 'Fund',       th: 'กองทุน' },    ccy: 'THB' },
  gold:   { label: { en: 'Gold',       th: 'ทองคำ' },    ccy: 'THB' },
  crypto: { label: { en: 'Crypto',     th: 'คริปโต' },    ccy: 'USD' },
};

function AddToWatchlistModal({ open, lang, existing, onClose, onSave }) {
  const I = window.Icon;
  const empty = () => ({
    ticker: '',
    name: '',
    cls: 'us',
    ccy: 'USD',
    price: '',
    target: '',
  });
  const [form, setForm] = React.useState(empty);
  const firstRef = React.useRef(null);

  const [fetching, setFetching] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(empty());
      setFetching(false);
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = (patch) => setForm(f => {
    const next = { ...f, ...patch };
    // Sync currency to class
    if (patch.cls && WATCH_CLASS_META[patch.cls]) next.ccy = WATCH_CLASS_META[patch.cls].ccy;
    return next;
  });

  const fetchTickerData = async () => {
    if (!form.ticker) return;
    setFetching(true);
    try {
      let queryTicker = form.ticker.toUpperCase().trim();
      if (form.cls === 'th' && !queryTicker.endsWith('.BK')) queryTicker += '.BK';
      if (form.cls === 'crypto' && !queryTicker.endsWith('-USD')) queryTicker += '-USD';
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${queryTicker}?interval=1d&range=1d`;
      const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      
      const res = await fetch(proxiedUrl);
      if (res.ok) {
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta) {
          update({ 
            name: meta.shortName || meta.longName || form.name,
            price: (meta.regularMarketPrice || '').toString()
          });
        }
      }
    } catch (e) {
      console.warn("Failed to sync ticker data", e);
    } finally {
      setFetching(false);
    }
  };

  const upper = form.ticker.toUpperCase().trim();
  const priceN = parseFloat(form.price) || 0;
  const targetN = parseFloat(form.target) || 0;
  const duplicate = existing.some(x => x.ticker === upper);
  const valid = upper.length > 0 && priceN > 0;

  function commit() {
    if (!valid) return;
    onSave({
      ticker: upper,
      name: form.name.trim() || upper,
      cls: form.cls,
      ccy: form.ccy,
      price: priceN,
      target: targetN || priceN * 1.15,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"></div>
      <div
        className="relative w-full max-w-[420px] bg-card border border-line rounded-2xl shadow-pop scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-soft border border-brand/20 flex items-center justify-center text-brand">
              <I.Eye size={16}/>
            </div>
            <div>
              <div className="text-ink-900 font-semibold text-[14px]">
                {lang === 'th' ? 'เพิ่มในรายการจับตา' : 'Add to watchlist'}
              </div>
              <div className="text-ink-500 text-[11px]">
                {lang === 'th' ? 'ติดตามราคา ไม่ใช่บันทึกธุรกรรม' : 'Just track — not a transaction'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-500 transition-colors">
            <I.X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5">
          {/* Class */}
          <WlField label={lang === 'th' ? 'ประเภท' : 'Type'}>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(WATCH_CLASS_META).map(([k, meta]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => update({ cls: k })}
                  className={`text-[11px] py-2 rounded-md border transition-colors ${form.cls === k ? 'bg-brand-soft border-brand/40 text-brand font-medium' : 'bg-surface-soft border-line text-ink-700 hover:border-ink-300'}`}
                >
                  {meta.label[lang] || meta.label.en}
                </button>
              ))}
            </div>
          </WlField>

          {/* Ticker + name */}
          <div className="grid grid-cols-3 gap-2.5">
            <WlField label={lang === 'th' ? 'ตัวย่อ' : 'Ticker'} className="col-span-1 relative">
              <div className="relative">
                <input
                  ref={firstRef}
                  value={form.ticker}
                  onChange={(e) => update({ ticker: e.target.value.toUpperCase().replace(/[^A-Z0-9.\-&]/g, '') })}
                  onBlur={fetchTickerData}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchTickerData(); } }}
                  placeholder="AAPL"
                  className="w-full bg-surface-soft border border-line rounded-md pl-2.5 pr-7 py-1.5 text-[13px] text-ink-900 num font-medium uppercase focus:outline-none focus:border-brand"
                />
                {fetching && <div className="absolute right-2 top-2 w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>}
              </div>
            </WlField>
            <WlField label={lang === 'th' ? 'ชื่อ' : 'Name'} className="col-span-2">
              <input
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={lang === 'th' ? 'Apple Inc.' : 'Apple Inc.'}
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 focus:outline-none focus:border-brand"
              />
            </WlField>
          </div>

          {/* Price + target */}
          <div className="grid grid-cols-2 gap-2.5">
            <WlField label={lang === 'th' ? `ราคาปัจจุบัน (${form.ccy === 'USD' ? '$' : '฿'})` : `Current price (${form.ccy === 'USD' ? '$' : '฿'})`}>
              <input
                value={form.price}
                onChange={(e) => update({ price: e.target.value.replace(/[^\d.]/g, '') })}
                placeholder="0.00"
                inputMode="decimal"
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 num focus:outline-none focus:border-brand"
              />
            </WlField>
            <WlField label={lang === 'th' ? `เป้าราคา (${form.ccy === 'USD' ? '$' : '฿'})` : `Target price (${form.ccy === 'USD' ? '$' : '฿'})`} hint={lang === 'th' ? 'ไม่ใส่ก็ได้' : 'optional'}>
              <input
                value={form.target}
                onChange={(e) => update({ target: e.target.value.replace(/[^\d.]/g, '') })}
                placeholder="—"
                inputMode="decimal"
                className="w-full bg-surface-soft border border-line rounded-md px-2.5 py-1.5 text-[13px] text-ink-900 num focus:outline-none focus:border-brand"
              />
            </WlField>
          </div>

          {/* Preview */}
          {upper && priceN > 0 && (
            <div className="bg-surface-soft border border-line rounded-lg p-3 flex items-center gap-3">
              <StockLogo ticker={upper} cls={form.cls} size={32}/>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink-900 font-medium num">{upper}</div>
                <div className="text-[11px] text-ink-500 truncate">{form.name || (lang === 'th' ? '— ไม่มีชื่อ —' : '— No name —')}</div>
              </div>
              <div className="text-right num">
                <div className="text-[13px] text-ink-900">{form.ccy === 'USD' ? '$' : '฿'}{fmtNum(priceN, priceN < 10 ? 4 : 2)}</div>
                {targetN > 0 && (
                  <div className="text-[10px] text-ink-500">
                    {lang === 'th' ? 'เป้า ' : 'target '}{form.ccy === 'USD' ? '$' : '฿'}{fmtNum(targetN, targetN < 10 ? 4 : 2)}
                  </div>
                )}
              </div>
            </div>
          )}

          {duplicate && (
            <div className="rounded-lg border border-warn/20 bg-warn-soft px-3 py-2 flex items-center gap-2">
              <I.Alert size={12} className="text-warn shrink-0"/>
              <span className="text-[11px] text-warn">
                {lang === 'th' ? 'มี ' + upper + ' อยู่แล้ว — กดบันทึกจะอัปเดตข้อมูล' : `${upper} is already in your watchlist — saving will update it`}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line">
          <button onClick={onClose} className="text-[13px] px-3 py-1.5 rounded-md text-ink-700 hover:bg-ink-100 transition-colors">
            {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            onClick={commit}
            disabled={!valid}
            className={`text-[13px] font-medium px-3.5 py-1.5 rounded-md transition-colors ${valid ? 'bg-ink-800 text-ink-0 hover:bg-ink-900' : 'bg-ink-100 text-ink-400 cursor-not-allowed'}`}
          >
            {lang === 'th' ? (duplicate ? 'อัปเดต' : 'เพิ่ม') : (duplicate ? 'Update' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}

function WlField({ label, hint, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
        {hint && <div className="text-[9px] text-ink-400">{hint}</div>}
      </div>
      {children}
    </label>
  );
}

function Mini({ data, color, w=60, h=18 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 2) - 1]);
  const d = pts.map((p, i) => (i===0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

window.WatchlistCard = WatchlistCard;
