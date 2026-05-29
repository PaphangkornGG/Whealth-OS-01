const { Icon } = window;
const { BROKERS, ENRICHED } = window.DataLayer;

// Lookup live (latest) price for a ticker from current portfolio data.
function getLivePrice(tickerInput) {
  if (!tickerInput) return null;
  const upper = tickerInput.toUpperCase().trim();
  const found = ENRICHED.find(a => a.ticker === upper || a.ticker.startsWith(upper + '-'));
  if (found) return { price: found.price, ccy: found.ccy, name: found.name, broker: found.broker };
  // Fallback: synthesized market prices for common Thai-investor tickers
  // (mock — gives the demo live behaviour for tickers not currently held)
  const fallback = {
    // US
    'TSLA':  { price: 348.20, ccy: 'USD' },
    'MSFT':  { price: 428.50, ccy: 'USD' },
    'AMZN':  { price: 195.40, ccy: 'USD' },
    'META':  { price: 588.10, ccy: 'USD' },
    'AMD':   { price: 162.80, ccy: 'USD' },
    'SPY':   { price: 568.20, ccy: 'USD' },
    'QQQ':   { price: 495.30, ccy: 'USD' },
    'VOO':   { price: 521.40, ccy: 'USD' },
    'VTI':   { price: 282.10, ccy: 'USD' },
    // Thai stocks
    'AOT':    { price: 64.25,  ccy: 'THB' },
    'KBANK':  { price: 152.50, ccy: 'THB' },
    'SCB':    { price: 110.00, ccy: 'THB' },
    'BBL':    { price: 158.50, ccy: 'THB' },
    'ADVANC': { price: 287.00, ccy: 'THB' },
    // Thai mutual funds (NAV)
    'SCBS&P500E':    { price: 26.4521, ccy: 'THB', broker: 'scb_am' },
    'SCBS&P500':     { price: 19.8420, ccy: 'THB', broker: 'scb_am' },
    'SCBGOLDH':      { price: 14.8210, ccy: 'THB', broker: 'scb_am' },
    'SCBCHEQA':      { price: 8.6240,  ccy: 'THB', broker: 'scb_am' },
    'K-USXNDQ-A(A)': { price: 17.2840, ccy: 'THB', broker: 'kasset' },
    'K-CHINA-A':     { price: 9.4520,  ccy: 'THB', broker: 'kasset' },
    'K-VIETNAM':     { price: 11.6240, ccy: 'THB', broker: 'kasset' },
    'K-FIXED':       { price: 12.0480, ccy: 'THB', broker: 'kasset' },
    'KFLTGOVRMF':    { price: 13.4150, ccy: 'THB', broker: 'finnomena' },
    'KFHTECH-A':     { price: 11.8420, ccy: 'THB', broker: 'finnomena' },
    'KT-WTAI':       { price: 14.2810, ccy: 'THB', broker: 'ktam' },
    'B-INNOTECH':    { price: 16.4820, ccy: 'THB', broker: 'bbl_am' },
    'ONE-UGG':       { price: 18.6240, ccy: 'THB', broker: 'finnomena' },
    'TMBGQG':        { price: 13.2420, ccy: 'THB', broker: 'finnomena' },
    'M-S50':         { price: 24.8420, ccy: 'THB', broker: 'finnomena' },
    'ASP-DIGIBLOC':  { price: 12.5042, ccy: 'THB', broker: 'finnomena' },
    // Crypto
    'SOL':  { price: 168.40, ccy: 'USD', broker: 'bitkub' },
    'BNB':  { price: 632.20, ccy: 'USD', broker: 'binance_th' },
    'XRP':  { price: 2.42,   ccy: 'USD', broker: 'bitkub' },
    'ADA':  { price: 0.864,  ccy: 'USD', broker: 'bitkub' },
    'DOGE': { price: 0.385,  ccy: 'USD', broker: 'bitazza' },
  };
  return fallback[upper] || null;
}

const TX_TYPES_BASE = [
  { id: 'buy',      tkey: 'buy',      tone: 'gain', icon: <Icon.ArrowDown size={14}/> },
  { id: 'sell',     tkey: 'sell',     tone: 'loss', icon: <Icon.ArrowUp size={14}/> },
  { id: 'dividend', tkey: 'dividend', tone: 'warn', icon: <Icon.Coins size={14}/> },
];

const TICKER_SUGGESTIONS = [
  // US Stocks
  { t: 'GOOGL', n: 'Alphabet Inc.',         cls: 'US Stock' },
  { t: 'AAPL',  n: 'Apple Inc.',            cls: 'US Stock' },
  { t: 'NVDA',  n: 'NVIDIA Corp.',          cls: 'US Stock' },
  { t: 'TSLA',  n: 'Tesla Inc.',            cls: 'US Stock' },
  { t: 'MSFT',  n: 'Microsoft Corp.',       cls: 'US Stock' },
  { t: 'AMZN',  n: 'Amazon.com Inc.',       cls: 'US Stock' },
  { t: 'META',  n: 'Meta Platforms',        cls: 'US Stock' },
  { t: 'AMD',   n: 'Advanced Micro Devices',cls: 'US Stock' },
  { t: 'SPY',   n: 'SPDR S&P 500 ETF',      cls: 'US ETF' },
  { t: 'QQQ',   n: 'Invesco QQQ Trust',     cls: 'US ETF' },
  { t: 'VOO',   n: 'Vanguard S&P 500 ETF',  cls: 'US ETF' },
  { t: 'VTI',   n: 'Vanguard Total Market', cls: 'US ETF' },
  // Thai Stocks
  { t: 'TISCO', n: 'Tisco Financial',       cls: 'Thai Stock' },
  { t: 'PTT',   n: 'PTT PCL',               cls: 'Thai Stock' },
  { t: 'CPALL', n: 'CP All',                cls: 'Thai Stock' },
  { t: 'AOT',   n: 'Airports of Thailand',  cls: 'Thai Stock' },
  { t: 'KBANK', n: 'Kasikornbank',          cls: 'Thai Stock' },
  { t: 'SCB',   n: 'SCB X PCL',             cls: 'Thai Stock' },
  { t: 'BBL',   n: 'Bangkok Bank',          cls: 'Thai Stock' },
  { t: 'ADVANC',n: 'Advanced Info Service', cls: 'Thai Stock' },
  // Thai Mutual Funds — SCB
  { t: 'SCBS&P500E', n: 'SCB S&P 500 Index (Equity)', cls: 'Fund' },
  { t: 'SCBS&P500',  n: 'SCB S&P 500 Index',          cls: 'Fund' },
  { t: 'SCBPGF',     n: 'SCB Global Equity',          cls: 'Fund' },
  { t: 'SCBGOLDH',   n: 'SCB Gold Hedged',            cls: 'Fund' },
  { t: 'SCBCHEQA',   n: 'SCB China A-Shares Equity',  cls: 'Fund' },
  // Thai Mutual Funds — K-Asset
  { t: 'K-USA',      n: 'K US Equity Fund',           cls: 'Fund' },
  { t: 'K-USXNDQ-A(A)', n: 'K US Nasdaq 100',         cls: 'Fund' },
  { t: 'KFGBRAND-A', n: 'K Global Brand',             cls: 'Fund' },
  { t: 'K-CHINA-A',  n: 'K China Equity',             cls: 'Fund' },
  { t: 'K-VIETNAM',  n: 'K Vietnam Equity',           cls: 'Fund' },
  { t: 'K-FIXED',    n: 'K Fixed Income',             cls: 'Fund' },
  // Thai Mutual Funds — Krungsri / Krungthai / others
  { t: 'KFLTGOVRMF',  n: 'Krungsri LT Government Bond RMF', cls: 'Fund' },
  { t: 'KFHTECH-A',   n: 'Krungsri Hawkish Tech',     cls: 'Fund' },
  { t: 'KT-WTAI',     n: 'Krungthai World Tech AI',   cls: 'Fund' },
  { t: 'B-INNOTECH',  n: 'BBL Innovative Tech',       cls: 'Fund' },
  { t: 'ONE-UGG',     n: 'One US Growth',             cls: 'Fund' },
  { t: 'TMBGQG',      n: 'TMB Global Quality Growth', cls: 'Fund' },
  { t: 'M-S50',       n: 'MFC SET50',                 cls: 'Fund' },
  { t: 'ASP-DIGIBLOC', n: 'ASP Digital Blockchain',   cls: 'Fund' },
  // Crypto
  { t: 'BTC',   n: 'Bitcoin',               cls: 'Crypto' },
  { t: 'ETH',   n: 'Ethereum',              cls: 'Crypto' },
  { t: 'SOL',   n: 'Solana',                cls: 'Crypto' },
  { t: 'BNB',   n: 'Binance Coin',          cls: 'Crypto' },
  { t: 'XRP',   n: 'Ripple',                cls: 'Crypto' },
  { t: 'ADA',   n: 'Cardano',               cls: 'Crypto' },
  { t: 'DOGE',  n: 'Dogecoin',              cls: 'Crypto' },
];

function QuickTxModal({ open, onClose, onSave, prefill }) {
  const { t } = window.useT();
  const TX_TYPES = TX_TYPES_BASE.map(tx => ({ ...tx, label: t[tx.tkey] }));
  const [ticker, setTicker] = React.useState('');
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('buy');
  const [amount, setAmount] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [broker, setBroker] = React.useState('');
  const [brokerQuery, setBrokerQuery] = React.useState('');
  const [showBrokerList, setShowBrokerList] = React.useState(false);
  const [fee, setFee] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [showSuggest, setShowSuggest] = React.useState(false);
  const [priceSynced, setPriceSynced] = React.useState(false);
  // Dividend WHT (withholding tax). Mode 'auto' uses the class-default rate,
  // 'none' explicitly zeros it (e.g. BOI-exempt dividends), 'custom' lets the
  // user type the exact baht/dollar amount that was withheld.
  const [whtMode, setWhtMode] = React.useState('auto');
  const [whtCustom, setWhtCustom] = React.useState('');
  const tickerRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setTicker(prefill?.ticker || '');
      setName(prefill?.name || '');
      setType(prefill?.type || 'buy');
      setAmount('');
      setPrice('');
      setBroker(prefill?.broker || '');
      setBrokerQuery('');
      setFee('');
      setDate(new Date().toISOString().slice(0, 10));
      setShowBrokerList(false);
      setShowSuggest(false);
      setPriceSynced(false);
      setWhtMode('auto');
      setWhtCustom('');
      // If we have a prefill ticker, sync its price after mount
      if (prefill?.ticker) {
        const lp = getLivePrice(prefill.ticker);
        if (lp && (prefill.type || 'buy') !== 'dividend') {
          setPrice(String(lp.price));
          setPriceSynced(true);
          if (lp.name) setName(lp.name);
          if (!prefill.broker && lp.broker) setBroker(lp.broker);
        }
      }
      setTimeout(() => tickerRef.current?.focus(), 30);
    }
  }, [open, prefill]);

  // Debounced auto-fetch for stock/crypto price and company name when ticker is entered
  React.useEffect(() => {
    if (!open || !ticker || ticker.length < 2) return;
    
    const upper = ticker.toUpperCase().trim();
    
    // 1) First check if it's already in the portfolio or seeds to save requests
    const lp = getLivePrice(upper);
    if (lp) {
      setName(lp.name || lp.ticker || '');
      if (type !== 'dividend') {
        setPrice(String(lp.price));
        setPriceSynced(true);
      }
      return;
    }

    // 2) Perform debounced fetch from Yahoo Finance proxy server
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        let queryTicker = upper;
        const isCrypto = ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE'].includes(upper);
        const isThai = ['PTT','AOT','KBANK','SCB','BBL','ADVANC','CPALL','TISCO','EPG'].includes(upper) || /^[A-Z]{1,5}$/.test(upper);
        
        if (isCrypto) {
          queryTicker = `${upper}-USD`;
        } else if (isThai && !upper.includes('.') && !/^[A-Z]{1,5}$/.test(upper)) {
          queryTicker = `${upper}.BK`;
        } else if (/^[A-Z]{1,5}$/.test(upper)) {
          // Default guess for general tickers: Thai stock first, then fall back to US
          queryTicker = `${upper}.BK`;
        }

        const res = await fetch(`/api/price?ticker=${encodeURIComponent(queryTicker)}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.price) {
            setPrice(String(data.price));
            setPriceSynced(true);
            if (data.name) setName(data.name);
          }
        } else if (queryTicker.endsWith('.BK')) {
          // Fallback to US stock if .BK query failed
          const rawTicker = queryTicker.replace('.BK', '');
          const res2 = await fetch(`/api/price?ticker=${encodeURIComponent(rawTicker)}`, { signal: controller.signal });
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.price) {
              setPrice(String(data2.price));
              setPriceSynced(true);
              if (data2.name) setName(data2.name);
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      }
    }, 600); // 600ms debounce
    
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [ticker, open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const brokerList = React.useMemo(() => {
    const q = brokerQuery.toLowerCase().trim();
    let all = Object.values(BROKERS);
    // When selling (or logging a dividend) a specific ticker, restrict the
    // dropdown to ONLY the brokers/apps where the user actually holds it.
    // For Buy, every broker is fair game.
    if ((type === 'sell' || type === 'dividend') && ticker) {
      const upper = ticker.toUpperCase().trim();
      const holderIds = new Set(
        ENRICHED.filter(a => a.ticker === upper).map(a => a.broker)
      );
      if (holderIds.size > 0) all = all.filter(b => holderIds.has(b.id));
    }
    if (!q) return all;
    return all.filter(b => b.label.toLowerCase().includes(q) || b.kind.toLowerCase().includes(q));
  }, [brokerQuery, type, ticker]);

  // All positions for this ticker (may exist in multiple broker accounts).
  const heldPositions = React.useMemo(() => {
    if (!ticker) return [];
    const upper = ticker.toUpperCase().trim();
    return ENRICHED.filter(a => a.ticker === upper);
  }, [ticker]);

  // Single resolved position used by the "You hold" panel and quick-fill.
  // - If user picked a broker → that specific (ticker, broker) lot
  // - Else if only one holding → use it
  // - Else null (we render a chooser below)
  const heldPosition = React.useMemo(() => {
    if (heldPositions.length === 0) return null;
    if (broker) {
      return heldPositions.find(a => a.broker === broker) || null;
    }
    return heldPositions.length === 1 ? heldPositions[0] : null;
  }, [heldPositions, broker]);

  // Auto-pick the broker if there's exactly ONE holding of this ticker and the
  // user hasn't chosen one yet. Saves a click in the common case.
  React.useEffect(() => {
    if ((type === 'sell' || type === 'dividend') && !broker && heldPositions.length === 1) {
      setBroker(heldPositions[0].broker);
    }
  }, [type, heldPositions, broker]);

  if (!open) return null;

  const livePrice = getLivePrice(ticker);
  // Currency hint shown next to "Price per unit" — prefer held position, then
  // any sibling lot of the same ticker, then the live-price fallback.
  const ccyForTicker = heldPosition?.ccy
    || heldPositions[0]?.ccy
    || livePrice?.ccy
    || null;
  // Asset class hint for the WHT default — Thai stocks/funds → 10%, US → 15%,
  // crypto/gold → 0 (no Thai WHT on those). Falls back to 10% for unknown.
  const clsForTicker = heldPosition?.cls
    || heldPositions[0]?.cls
    || null;
  const whtAutoRate = clsForTicker === 'us' ? 0.15
                    : clsForTicker === 'th' ? 0.10
                    : clsForTicker === 'fund' ? 0.10
                    : (clsForTicker === 'crypto' || clsForTicker === 'gold' || clsForTicker === 'cash') ? 0
                    : 0.10; // unknown → assume Thai 10%
  const netDividendN = type === 'dividend' ? (parseFloat(amount) || 0) : 0;
  const whtCustomN   = parseFloat(whtCustom) || 0;
  // For 'auto', the user typed the NET amount; we back-solve gross so that
  //   gross * (1 - rate) = net  →  gross = net / (1 - rate)  →  wht = gross - net
  const whtN = whtMode === 'none'   ? 0
             : whtMode === 'custom' ? whtCustomN
             : (netDividendN > 0 && whtAutoRate > 0
                  ? netDividendN / (1 - whtAutoRate) - netDividendN
                  : 0);
  const grossDividendN = netDividendN + whtN;
  const effectiveWhtRate = grossDividendN > 0 ? (whtN / grossDividendN) : 0;
  const suggestions = ticker
    ? TICKER_SUGGESTIONS.filter(s => s.t.toLowerCase().includes(ticker.toLowerCase()) || s.n.toLowerCase().includes(ticker.toLowerCase()))
    : TICKER_SUGGESTIONS.slice(0, 6);

  function syncPrice() {
    if (!livePrice) return;
    setPrice(String(livePrice.price));
    setPriceSynced(true);
    if (livePrice.name) setName(livePrice.name);
    // If broker is empty and the held position has one, pre-fill that too
    if (!broker && livePrice.broker) setBroker(livePrice.broker);
  }

  function pickSuggestion(s) {
    setTicker(s.t);
    setName(s.n);
    setShowSuggest(false);
    const lp = getLivePrice(s.t);
    if (lp && type !== 'dividend') {
      setPrice(String(lp.price));
      setPriceSynced(true);
      if (!broker && lp.broker) setBroker(lp.broker);
    }
  }

  const canSave = type === 'dividend'
    ? !!(ticker && amount && parseFloat(amount) > 0)
    : !!(ticker && amount && price && parseFloat(amount) > 0 && parseFloat(price) > 0);
  const subtotal = type === 'dividend'
    ? (parseFloat(amount) || 0)
    : (parseFloat(amount) || 0) * (parseFloat(price) || 0);
  const feeNum = parseFloat(fee) || 0;
  const total = type === 'sell' ? subtotal - feeNum : type === 'dividend' ? subtotal : subtotal + feeNum;
  const selectedType = TX_TYPES.find(t => t.id === type);
  const selectedBroker = broker && BROKERS[broker] ? BROKERS[broker] : null;
  const customBrokerLabel = broker && !BROKERS[broker] ? broker : null;

  function handleSave() {
    if (!canSave) return;
    const payload = {
      ticker: ticker.toUpperCase(),
      name: name.trim() || ticker.toUpperCase(),
      type,
      amount: parseFloat(amount),
      price: parseFloat(price),
      broker: selectedBroker?.label || customBrokerLabel || null,
      fee: feeNum,
      date,
    };
    if (type === 'dividend') {
      payload.netDividend   = netDividendN;
      payload.wht           = whtN;
      payload.grossDividend = grossDividendN;
      payload.whtRate       = effectiveWhtRate;
      payload.whtMode       = whtMode;
    }
    onSave(payload);
  }

  function autoFee() {
    if (type === 'dividend' || !subtotal) return;
    const isCrypto = ['BTC','ETH','SOL','XRP','DOGE','BNB','ADA'].some(t => ticker.toUpperCase().includes(t));
    const rate = isCrypto ? 0.0025 : 0.00157;
    setFee((subtotal * rate).toFixed(2));
  }

  return (
    <div className="fixed inset-0 z-50 fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-0/70 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative h-full flex items-start justify-center pt-[6vh] px-4 overflow-y-auto scroll-thin">
        <div className="w-full max-w-[460px] bg-ink-50 border border-ink-300 rounded-2xl shadow-pop scale-in overflow-hidden mb-10">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center text-${selectedType.tone} bg-${selectedType.tone}-soft border border-${selectedType.tone}/20`}>
                {selectedType.icon}
              </div>
              <div>
                <div className="text-ink-800 text-sm font-semibold">{t.quickTx}</div>
                <div className="text-ink-500 text-[11px]">{t.quickTxSub(selectedType.label.toLowerCase())}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors">
              <Icon.X size={16}/>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-4">
            {/* Type */}
            <Field label={t.txType}>
              <div className="grid grid-cols-3 gap-1.5">
                {TX_TYPES.map(tx => (
                  <button
                    key={tx.id}
                    onClick={() => setType(tx.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                      type === tx.id
                        ? `bg-${tx.tone}-soft text-${tx.tone} border-${tx.tone}/30`
                        : 'bg-ink-100 text-ink-600 border-ink-200 hover:text-ink-700 hover:border-ink-300'
                    }`}
                  >
                    {tx.icon}
                    {tx.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Ticker */}
            <Field label={t.ticker} hint={t.tickerHint}>
              <div className="relative">
                <input
                  ref={tickerRef}
                  type="text"
                  value={ticker}
                  onChange={(e) => { setTicker(e.target.value.toUpperCase()); setShowSuggest(true); setPriceSynced(false); }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                  placeholder={t.tickerPlaceholder}
                  className="w-full bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 text-ink-800 placeholder:text-ink-400 num text-[14px] focus:outline-none focus:border-brand focus:bg-ink-0 transition-colors"
                />
                {showSuggest && suggestions.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1.5 bg-ink-100 border border-ink-300 rounded-lg shadow-pop max-h-56 overflow-y-auto scroll-thin">
                    {suggestions.map(s => {
                      const lp = getLivePrice(s.t);
                      return (
                        <button
                          key={s.t}
                          onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-ink-200 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="num text-[13px] text-ink-800 font-medium w-20 shrink-0 truncate">{s.t}</span>
                            <span className="text-[12px] text-ink-500 truncate">{s.n}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pl-2">
                            {lp ? (
                              <span className="num text-[11px] text-ink-700 font-medium">
                                {lp.ccy === 'USD' ? '$' : '฿'}{lp.price.toLocaleString('en-US', { maximumFractionDigits: lp.price < 10 ? 4 : 2 })}
                              </span>
                            ) : (
                              <span className="text-[10px] text-ink-500 uppercase tracking-wider">{s.cls}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Field>

            {/* Asset Name */}
            <Field label={t.assetName || (window.localStorage.getItem('wealthos_lang') === 'th' ? 'ชื่อสินทรัพย์' : 'Asset Name')}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={window.localStorage.getItem('wealthos_lang') === 'th' ? 'เช่น Apple Inc. (ดึงข้อมูลอัตโนมัติ)' : 'e.g. Apple Inc. (auto-filled)'}
                className="w-full bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 text-ink-800 placeholder:text-ink-400 text-[13px] focus:outline-none focus:border-brand focus:bg-ink-0 transition-colors"
              />
            </Field>

            {/* Multi-broker chooser — when selling/dividend and the same ticker
                lives in more than one account, force the user to pick which
                lot they're acting on. */}
            {(type === 'sell' || type === 'dividend') && heldPositions.length > 1 && !heldPosition && (
              <div className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-700 mb-2 flex items-center gap-1.5">
                  <Icon.Wallet size={11}/>
                  {t.heldInAccounts || 'Held in multiple accounts — pick one'}
                </div>
                <div className="space-y-1.5">
                  {heldPositions.map(p => {
                    const br = BROKERS[p.broker];
                    return (
                      <button
                        key={p.broker}
                        type="button"
                        onClick={() => setBroker(p.broker)}
                        className="w-full flex items-center justify-between gap-3 bg-card border border-ink-200 rounded-lg px-3 py-2 hover:border-brand hover:bg-brand-soft cursor-pointer transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {br && <BrokerBadge broker={br} size={20}/>}
                          <div className="min-w-0">
                            <div className="text-[13px] text-ink-800 truncate">{br?.label || p.broker || '—'}</div>
                            <div className="text-[10px] text-ink-500 num">
                              {p.units.toLocaleString('en-US', { maximumFractionDigits: p.units < 1 ? 6 : 4 })}
                              {' '}{p.cls === 'crypto' ? p.ticker : p.cls === 'fund' ? (t.units || 'units') : (t.shares || 'shares')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="num text-[12px] text-ink-800 font-semibold">฿{Math.round(p.valueTHB).toLocaleString('en-US')}</div>
                          <div className={`text-[10px] num ${p.unrealized >= 0 ? 'text-gain' : 'text-loss'}`}>
                            {p.unrealized >= 0 ? '+' : '−'}{Math.abs(p.unrealizedPct).toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current holding panel — show whenever a known ticker is entered */}
            {heldPosition && (
              <div className={`rounded-lg border px-3.5 py-3 ${type === 'sell' ? 'bg-loss-soft border-loss/20' : 'bg-brand-soft border-brand/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-700 flex items-center gap-1.5">
                    <Icon.Wallet size={11}/>
                    {t.youHold || 'You hold'}
                  </div>
                  <div className="text-[10px] text-ink-500">
                    {t.avgCost || 'Avg cost'}: <span className="num text-ink-700 font-medium">
                      {heldPosition.ccy === 'USD' ? '$' : '฿'}
                      {heldPosition.avgCost.toLocaleString('en-US', { maximumFractionDigits: heldPosition.avgCost < 10 ? 4 : 2 })}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <div className="num text-ink-900 text-[18px] font-semibold leading-none">
                      {heldPosition.units.toLocaleString('en-US', { maximumFractionDigits: heldPosition.units < 1 ? 6 : 4 })}
                    </div>
                    <div className="text-[10px] text-ink-500 mt-0.5">
                      {heldPosition.cls === 'crypto' ? heldPosition.ticker : heldPosition.cls === 'fund' ? (t.units || 'units') : (t.shares || 'shares')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-ink-900 text-[15px] font-semibold leading-none">
                      ฿{Math.round(heldPosition.valueTHB).toLocaleString('en-US')}
                    </div>
                    <div className={`text-[10px] mt-0.5 num ${heldPosition.unrealized >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {heldPosition.unrealized >= 0 ? '+' : '−'}{Math.abs(heldPosition.unrealizedPct).toFixed(2)}% · {heldPosition.unrealized >= 0 ? '+' : '−'}
                      {heldPosition.ccy === 'USD' ? '$' : '฿'}
                      {Math.abs(heldPosition.unrealized).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
                {type === 'sell' && (
                  <div className="mt-2.5 pt-2.5 border-t border-loss/15 flex items-center gap-1.5">
                    <span className="text-[10px] text-ink-500 mr-auto">{t.quickFill || 'Quick'}</span>
                    {[0.25, 0.5, 1].map(frac => (
                      <button
                        key={frac}
                        type="button"
                        onClick={() => setAmount((heldPosition.units * frac).toFixed(heldPosition.units < 1 ? 6 : 4))}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-card text-loss border border-loss/30 hover:bg-loss-soft cursor-pointer transition-colors"
                      >
                        {frac === 1 ? (t.all || 'All') : `${frac * 100}%`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!heldPosition && ticker && type === 'sell' && (
              <div className="rounded-lg border border-warn/20 bg-warn-soft px-3.5 py-2.5 flex items-center gap-2">
                <Icon.Alert size={14} className="text-warn shrink-0"/>
                <div className="text-[12px] text-ink-700">
                  {t.notHeld || 'You don\'t hold this ticker yet — selling will create a short position.'}
                </div>
              </div>
            )}

            {/* Broker / Account */}
            <Field label={t.broker} hint={t.brokerHint}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBrokerList(s => !s)}
                  className={`w-full flex items-center justify-between bg-ink-100 border rounded-lg px-3 py-2.5 transition-colors ${showBrokerList ? 'border-brand bg-ink-0' : 'border-ink-200 hover:border-ink-300'}`}
                >
                  {selectedBroker ? (
                    <div className="flex items-center gap-2.5">
                      <BrokerBadge broker={selectedBroker} size={24}/>
                      <div className="text-left">
                        <div className="text-[13px] text-ink-800">{selectedBroker.label}</div>
                        <div className="text-[10px] text-ink-500 uppercase tracking-wider">{selectedBroker.kind}</div>
                      </div>
                    </div>
                  ) : customBrokerLabel ? (
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-semibold bg-ink-200 text-ink-700 border border-ink-300">
                        {customBrokerLabel.slice(0,2).toUpperCase()}
                      </span>
                      <div className="text-left">
                        <div className="text-[13px] text-ink-800">{customBrokerLabel}</div>
                        <div className="text-[10px] text-ink-500 uppercase tracking-wider">{t.custom}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[13px] text-ink-400">{t.brokerPlaceholder}</span>
                  )}
                  <Icon.ChevronDown size={14} className={`text-ink-500 transition-transform ${showBrokerList ? 'rotate-180' : ''}`}/>
                </button>
                {showBrokerList && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 bg-ink-100 border border-ink-300 rounded-lg shadow-pop overflow-hidden">
                    <div className="px-2.5 py-2 border-b border-ink-200 flex items-center gap-2">
                      <Icon.Search size={12} className="text-ink-500"/>
                      <input
                        autoFocus
                        value={brokerQuery}
                        onChange={(e) => setBrokerQuery(e.target.value)}
                        placeholder={t.brokerSearch}
                        className="flex-1 bg-transparent text-[12px] text-ink-800 placeholder:text-ink-400 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto scroll-thin">
                      {brokerList.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => { setBroker(b.id); setShowBrokerList(false); setBrokerQuery(''); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ink-200 transition-colors text-left ${broker === b.id ? 'bg-ink-200' : ''}`}
                        >
                          <BrokerBadge broker={b} size={24}/>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-ink-800 truncate">{b.label}</div>
                            <div className="text-[10px] text-ink-500 uppercase tracking-wider">{b.kind}</div>
                          </div>
                          {broker === b.id && <Icon.Check size={13} className="text-brand"/>}
                        </button>
                      ))}
                      {brokerList.length === 0 && brokerQuery && (
                        <button
                          type="button"
                          onClick={() => { setBroker(brokerQuery); setShowBrokerList(false); }}
                          className="w-full px-3 py-3 text-left hover:bg-ink-200 transition-colors"
                        >
                          <div className="text-[12px] text-ink-500">{t.noMatches}</div>
                          <div className="text-[13px] text-brand font-medium mt-0.5">{t.addCustom(brokerQuery)}</div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Field>

            {/* Date — lets you backdate or log a missed transaction */}
            <Field label={t.txDate} hint={t.txDateHint}>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 pr-20 text-ink-800 num text-[14px] focus:outline-none focus:border-brand focus:bg-ink-0 transition-colors"
                />
                {date !== new Date().toISOString().slice(0, 10) && (
                  <button
                    type="button"
                    onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand hover:text-brand/80 transition-colors px-1.5 py-0.5 rounded border border-brand/30 bg-brand-soft"
                  >
                    {t.txDateToday}
                  </button>
                )}
              </div>
            </Field>

            {/* Amount + Price (or just Amount for dividends) */}
            {type === 'dividend' ? (
              <>
                <Field label={t.totalReceived} hint={t.dividendHint}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 num text-[14px] pointer-events-none">
                      {ccyForTicker === 'USD' ? '$' : '฿'}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-ink-100 border border-ink-200 rounded-lg pl-7 pr-3 py-2.5 text-ink-800 placeholder:text-ink-400 num text-[14px] focus:outline-none focus:border-brand focus:bg-ink-0 transition-colors"
                    />
                  </div>
                </Field>

                {/* Withholding-tax selector — compact, lives in the same visual
                    rhythm as Fee. Auto rate keys off the asset class. */}
                <div className="rounded-lg border border-ink-200 bg-ink-100/60 px-3.5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-500">
                      {t.whtLabel}
                    </div>
                    {netDividendN > 0 && (
                      <div className="text-[10px] text-ink-500 num">
                        {t.whtGrossLabel}{' '}
                        <span className="text-ink-700 font-medium">
                          {ccyForTicker === 'USD' ? '$' : '฿'}
                          {grossDividendN.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </span>
                        {whtN > 0 && (
                          <span className="text-warn">
                            {' · −'}{ccyForTicker === 'USD' ? '$' : '฿'}
                            {whtN.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <WhtOption
                      active={whtMode === 'auto'}
                      onClick={() => setWhtMode('auto')}
                      label={`${t.whtAuto} · ${(whtAutoRate * 100).toFixed(0)}%`}
                    />
                    <WhtOption
                      active={whtMode === 'none'}
                      onClick={() => setWhtMode('none')}
                      label={t.whtNoTax}
                    />
                    <WhtOption
                      active={whtMode === 'custom'}
                      onClick={() => setWhtMode('custom')}
                      label={t.whtCustom}
                    />
                    {whtMode === 'custom' && (
                      <div className="relative flex-1 ml-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500 num text-[12px] pointer-events-none">
                          {ccyForTicker === 'USD' ? '$' : '฿'}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={whtCustom}
                          onChange={(e) => setWhtCustom(e.target.value)}
                          placeholder={t.whtCustomPlaceholder}
                          className="w-full bg-card border border-ink-200 rounded-md pl-6 pr-2 py-1.5 text-ink-800 placeholder:text-ink-400 num text-[12px] focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.units}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 text-ink-800 placeholder:text-ink-400 num text-[14px] focus:outline-none focus:border-brand focus:bg-ink-0 transition-colors"
                  />
                </Field>
                <Field label={`${t.pricePerUnit}${ccyForTicker ? ` (${ccyForTicker})` : ''}`}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 num text-[14px] pointer-events-none">
                      {ccyForTicker === 'USD' ? '$' : '฿'}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => { setPrice(e.target.value); setPriceSynced(false); }}
                      placeholder="0.00"
                      className={`w-full bg-ink-100 border rounded-lg pl-7 pr-3 py-2.5 text-ink-800 placeholder:text-ink-400 num text-[14px] focus:outline-none focus:bg-ink-0 transition-colors ${priceSynced ? 'border-brand/50 pr-16' : 'border-ink-200 focus:border-brand'} ${livePrice && !priceSynced ? 'pr-16' : ''}`}
                    />
                    {livePrice && !priceSynced && (
                      <button
                        type="button"
                        onClick={syncPrice}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-brand hover:text-brand/80 transition-colors px-1.5 py-1 rounded border border-brand/30 bg-brand-soft flex items-center gap-1"
                        title={`${t.livePrice}: ${livePrice.ccy === 'USD' ? '$' : '฿'}${livePrice.price.toLocaleString('en-US', { maximumFractionDigits: livePrice.price < 10 ? 4 : 2 })}`}
                      >
                        <Icon.Refresh size={10}/>
                        {t.syncBtn}
                      </button>
                    )}
                    {priceSynced && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-brand flex items-center gap-1 pointer-events-none">
                        <Icon.Check size={10}/>
                        {t.synced}
                      </span>
                    )}
                  </div>
                  {livePrice && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink-500 num">
                      <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse"></span>
                      <span>{t.livePrice}</span>
                      <span className="text-ink-700 font-medium">
                        {livePrice.ccy === 'USD' ? '$' : '฿'}{livePrice.price.toLocaleString('en-US', { maximumFractionDigits: livePrice.price < 10 ? 4 : 2 })}
                      </span>
                      <span className="text-ink-400">·</span>
                      <span>15-min delayed</span>
                    </div>
                  )}
                </Field>
              </div>
            )}

            {/* Fee */}
            {type !== 'dividend' && (
              <Field label={t.fee} hint={t.feeHint}>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-ink-100 border border-ink-200 rounded-lg px-3 py-2.5 pr-20 text-ink-800 placeholder:text-ink-400 num text-[14px] focus:outline-none focus:border-brand focus:bg-ink-0 transition-colors"
                  />
                  {subtotal > 0 && !fee && (
                    <button
                      type="button"
                      onClick={autoFee}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand hover:text-brand/80 transition-colors px-1.5 py-0.5 rounded border border-brand/30 bg-brand-soft"
                      title="Estimate broker default (stocks 0.157%, crypto 0.25%)"
                    >
                      {t.auto}
                    </button>
                  )}
                </div>
              </Field>
            )}

            {/* Total preview */}
            <div className="bg-ink-0 border border-ink-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-500 uppercase tracking-wider">
                  {type === 'sell' ? t.netProceeds : type === 'dividend' ? t.totalReceived : t.totalCost2}
                </span>
                <span className="num text-ink-800 text-base font-medium">
                  {total > 0 ? total.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}
                </span>
              </div>
              {(subtotal > 0 && feeNum > 0) && (
                <div className="mt-1.5 pt-1.5 border-t border-ink-200 flex items-center justify-between text-[11px] text-ink-500 num">
                  <span>
                    {subtotal.toLocaleString('en-US', { maximumFractionDigits: 2 })} {type === 'sell' ? '−' : '+'} {feeNum.toFixed(2)} {t.fee.toLowerCase()}
                  </span>
                  <span>{((feeNum/subtotal)*100).toFixed(2)}% {t.percentOfTrade}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-ink-200 flex items-center justify-between bg-ink-0/40">
            <div className="text-[11px] text-ink-500 flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-ink-100 border border-ink-200 rounded text-[10px] font-mono">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-ink-100 border border-ink-200 rounded text-[10px] font-mono">↵</kbd>
              <span>{t.toSave}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="text-[13px] px-3 py-1.5 rounded-md text-ink-600 hover:text-ink-800 hover:bg-ink-100 transition-colors">
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`text-[13px] px-4 py-1.5 rounded-md font-medium transition-all ${
                  canSave
                    ? 'bg-ink-800 text-ink-0 hover:bg-ink-700'
                    : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                }`}
              >
                {t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrokerBadge({ broker, size=22 }) {
  const s = `${size}px`;
  // If a logo image is available, render it inside a rounded tile coloured to the brand.
  if (broker.logo) {
    return (
      <span
        className="rounded-md overflow-hidden shrink-0 flex items-center justify-center"
        style={{ width: s, height: s, background: broker.color, border: `1px solid color-mix(in oklch, ${broker.color} 40%, transparent)` }}
      >
        <img src={broker.logo} alt={broker.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
      </span>
    );
  }
  return (
    <span
      className="rounded-md flex items-center justify-center font-mono font-semibold shrink-0"
      style={{
        width: s, height: s,
        fontSize: size <= 18 ? '9px' : '10px',
        background: `color-mix(in oklch, ${broker.color} 16%, transparent)`,
        color: broker.color,
        border: `1px solid color-mix(in oklch, ${broker.color} 28%, transparent)`,
      }}
    >
      {broker.short}
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">{label}</span>
        {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

// Pill button used in the dividend WHT selector.
function WhtOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
        active
          ? 'bg-warn-soft text-warn border border-warn/30'
          : 'bg-card text-ink-700 border border-ink-200 hover:bg-ink-100'
      }`}
    >
      {label}
    </button>
  );
}

window.QuickTxModal = QuickTxModal;
window.BrokerBadge = BrokerBadge;
