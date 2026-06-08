// Mock portfolio data. Prices/values in source currency, value_thb already converted at fxRate.
// FX assumption (display only)
const FX = { USD_THB: 36.4 };

const ASSET_CLASSES = {
  us:      { id: 'us',      label: 'US Stocks',     color: 'oklch(0.78 0.13 230)' }, // brand blue
  th:      { id: 'th',      label: 'Thai Stocks',   color: 'oklch(0.78 0.16 152)' }, // green
  fund:    { id: 'fund',    label: 'Mutual Funds',  color: 'oklch(0.80 0.14 70)' },  // warm amber
  gold:    { id: 'gold',    label: 'Gold',          color: 'oklch(0.82 0.15 90)' },  // gold yellow
  crypto:  { id: 'crypto',  label: 'Crypto',        color: 'oklch(0.74 0.14 295)' }, // violet
  cash:    { id: 'cash',    label: 'Cash',          color: 'oklch(0.62 0.015 250)' },
};

// Brokers / Investment Apps in Thailand
// Color = harmonious oklch hue, NOT a recreation of brand identity
const BROKERS = {
  scb_easy:    { id: 'scb_easy',    label: 'SCB EASY',       short: 'SCB',  kind: 'Thai stocks',  color: 'oklch(0.32 0.10 305)', logo: 'assets/brokers/scb_easy.png' },
  streaming:   { id: 'streaming',   label: 'Streaming',      short: 'STR',  kind: 'Thai stocks',  color: 'oklch(0.32 0.10 250)', logo: 'assets/brokers/streaming.png' },
  finansia:    { id: 'finansia',    label: 'Finansia HERO',  short: 'FNS',  kind: 'Thai stocks',  color: 'oklch(0.98 0.005 60)', logo: 'assets/brokers/finansia.png' },
  innovestx:   { id: 'innovestx',   label: 'InnovestX',      short: 'INV',  kind: 'All-in-one',   color: 'oklch(0.94 0.01 250)', logo: 'assets/brokers/innovestx.png' },
  pi:          { id: 'pi',          label: 'Pi Securities',  short: 'PI',   kind: 'Thai stocks',  color: 'oklch(0.74 0.16 165)', logo: 'assets/brokers/pi.png' },
  liberator:   { id: 'liberator',   label: 'Liberator',      short: 'LIB',  kind: 'TH + US',      color: 'oklch(0.55 0.20 250)', logo: 'assets/brokers/liberator.png' },
  dime:        { id: 'dime',        label: 'Dime!',          short: 'DM',   kind: 'US stocks',    color: 'oklch(0.82 0.18 150)', logo: 'assets/brokers/dime.jpeg' },
  webull:      { id: 'webull',      label: 'Webull',         short: 'WB',   kind: 'US stocks',    color: 'oklch(0.45 0.22 264)', logo: 'assets/brokers/webull.png' },
  jitta:       { id: 'jitta',       label: 'Jitta Wealth',   short: 'JT',   kind: 'Auto-invest',  color: 'oklch(0.78 0.10 195)', logo: 'assets/brokers/jitta.png' },
  finnomena:   { id: 'finnomena',   label: 'FINNOMENA',      short: 'FNM',  kind: 'Mutual funds', color: 'oklch(0.94 0.18 105)', logo: 'assets/brokers/finnomena.png' },
  kplus:       { id: 'kplus',       label: 'K PLUS',         short: 'K+',   kind: 'All-in-one',   color: 'oklch(0.52 0.18 145)', logo: 'assets/brokers/kplus.png' },
  scb_am:      { id: 'scb_am',      label: 'SCBAM Fund Click', short: 'SCBA', kind: 'Mutual funds', color: 'oklch(0.35 0.14 305)', logo: 'assets/brokers/scb_am.png' },
  krungthai_next: { id: 'krungthai_next', label: 'Krungthai NEXT', short: 'KTN', kind: 'All-in-one', color: 'oklch(0.72 0.13 230)', logo: 'assets/brokers/krungthai_next.png' },
  paotang:     { id: 'paotang',     label: 'เป๋าตัง',           short: 'PT',   kind: 'All-in-one',   color: 'oklch(0.72 0.15 230)', logo: 'assets/brokers/paotang.png' },
  mfc:         { id: 'mfc',         label: 'MFC Wealth',     short: 'MFC',  kind: 'Mutual funds', color: 'oklch(0.55 0.22 25)', logo: 'assets/brokers/mfc.png' },
  bitkub:      { id: 'bitkub',      label: 'Bitkub',         short: 'BK',   kind: 'Crypto',       color: 'oklch(0.98 0.005 250)', logo: 'assets/brokers/bitkub.png' },
  binance_th:  { id: 'binance_th',  label: 'Binance TH',     short: 'BN',   kind: 'Crypto',       color: 'oklch(0.22 0.01 80)', logo: 'assets/brokers/binance.png' },
  make:        { id: 'make',        label: 'MAKE by KBank',  short: 'MK',   kind: 'Cash',         color: 'oklch(0.98 0.005 250)', logo: 'assets/brokers/make.png' },
  kept:        { id: 'kept',        label: 'Kept',           short: 'KP',   kind: 'Cash',         color: 'oklch(0.50 0.20 25)', logo: 'assets/brokers/kept.png' },
  kkp_better:  { id: 'kkp_better',  label: 'KKP Better',     short: 'KKP',  kind: 'All-in-one',   color: 'oklch(0.58 0.18 285)', logo: 'assets/brokers/kkp_better.png' },
  cms:         { id: 'cms',         label: 'CMS Mobile',     short: 'CMS',  kind: 'Coop savings', color: 'oklch(0.55 0.22 305)', logo: 'assets/brokers/cms.png' },
  // ── Gold dealers / apps ────────────────────────────────────────────
  hua_seng_heng: { id: 'hua_seng_heng', label: 'GOLD NOW by Hua Seng Heng', short: 'GN', kind: 'Gold', color: 'oklch(0.96 0.005 250)', logo: 'assets/brokers/goldnow.png' },
  mts_gold:      { id: 'mts_gold',      label: 'MTSGoldX',      short: 'MTSX', kind: 'Gold', color: 'oklch(0.28 0.07 264)', logo: 'assets/brokers/mtsgoldx.png' },
};

// target weights for rebalancer
const DEFAULT_TARGET = { us: 0.30, th: 0.18, fund: 0.14, gold: 0.08, crypto: 0.12, cash: 0.18 };
let TARGET = { ...DEFAULT_TARGET };
try {
  const saved = localStorage.getItem('netto:classTargets');
  if (saved) TARGET = JSON.parse(saved);
} catch {}

// 30-day sparkline series helpers (deterministic pseudo-random)
const rng = (seed) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 8) / 0xffffff; };
};
const sparkSeries = (seed, n, drift) => {
  const r = rng(seed);
  const out = [];
  let v = 100;
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5) * 3 + drift;
    out.push(v);
  }
  return out;
};

const PORTFOLIO_SEED = [
  {
    ticker: 'GOOGL', name: 'Alphabet Inc.', cls: 'us', ccy: 'USD', broker: 'dime',
    units: 28, avgCost: 142.30, price: 184.22, feesLifetime: 4.10,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(11, 30, 0.45),
  },
  {
    ticker: 'AAPL', name: 'Apple Inc.', cls: 'us', ccy: 'USD', broker: 'liberator',
    units: 45, avgCost: 168.50, price: 211.04, feesLifetime: 0,
    dividendsLifetime: 92.00, dividendsYTD: 28.80,
    spark: sparkSeries(7, 30, 0.30),
  },
  {
    ticker: 'NVDA', name: 'NVIDIA Corp.', cls: 'us', ccy: 'USD', broker: 'innovestx',
    units: 18, avgCost: 612.80, price: 1158.40, feesLifetime: 22.50,
    dividendsLifetime: 6.84, dividendsYTD: 4.32,
    spark: sparkSeries(23, 30, 0.65),
  },
  {
    ticker: 'TISCO', name: 'Tisco Financial', cls: 'th', ccy: 'THB', broker: 'scb_easy',
    units: 5200, avgCost: 96.80, price: 108.50, feesLifetime: 850,
    dividendsLifetime: 41600, dividendsYTD: 20800,
    spark: sparkSeries(41, 30, 0.10),
  },
  {
    ticker: 'PTT', name: 'PTT PCL', cls: 'th', ccy: 'THB', broker: 'streaming',
    units: 8000, avgCost: 36.20, price: 34.75, feesLifetime: 520,
    dividendsLifetime: 16000, dividendsYTD: 9600,
    spark: sparkSeries(67, 30, -0.05),
  },
  {
    ticker: 'CPALL', name: 'CP All', cls: 'th', ccy: 'THB', broker: 'finansia',
    units: 1500, avgCost: 58.40, price: 62.25, feesLifetime: 210,
    dividendsLifetime: 2700, dividendsYTD: 1800,
    spark: sparkSeries(53, 30, 0.05),
  },
  {
    ticker: 'K-USA', name: 'K US Equity Fund', cls: 'fund', ccy: 'THB', broker: 'finnomena',
    units: 18500, avgCost: 14.20, price: 16.84, feesLifetime: 420,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(127, 30, 0.32),
  },
  {
    ticker: 'SCBPGF', name: 'SCB Global Equity', cls: 'fund', ccy: 'THB', broker: 'scb_am',
    units: 12000, avgCost: 13.50, price: 14.92, feesLifetime: 360,
    dividendsLifetime: 3600, dividendsYTD: 1800,
    spark: sparkSeries(149, 30, 0.18),
  },
  {
    ticker: 'KFGBRAND-A', name: 'K Global Brand', cls: 'fund', ccy: 'THB', broker: 'finnomena',
    units: 8500, avgCost: 11.80, price: 13.45, feesLifetime: 280,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(163, 30, 0.22),
  },
  // ── Gold ─────────────────────────────────────────────────────────────
  {
    ticker: 'GOLD96.5', name: 'Thai Gold 96.5% (per baht)', cls: 'gold', ccy: 'THB', broker: 'hua_seng_heng',
    units: 8, avgCost: 39800, price: 43250, feesLifetime: 1200,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(211, 30, 0.28),
  },
  {
    ticker: 'K-GOLD', name: 'K Gold Fund', cls: 'gold', ccy: 'THB', broker: 'finnomena',
    units: 12500, avgCost: 8.40, price: 9.62, feesLifetime: 240,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(229, 30, 0.18),
  },
  {
    ticker: 'GOLDSPOT', name: 'Gold Spot (oz)', cls: 'gold', ccy: 'USD', broker: 'mts_gold',
    units: 1.2, avgCost: 2180, price: 2420, feesLifetime: 18.50,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(241, 30, 0.22),
  },
  {
    ticker: 'BTC', name: 'Bitcoin', cls: 'crypto', ccy: 'USD', broker: 'bitkub',
    units: 0.42, avgCost: 38400, price: 68920, feesLifetime: 48.20,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(91, 30, 0.50),
  },
  {
    ticker: 'ETH', name: 'Ethereum', cls: 'crypto', ccy: 'USD', broker: 'bitkub',
    units: 6.8, avgCost: 2280, price: 3742, feesLifetime: 18.40,
    dividendsLifetime: 0, dividendsYTD: 0,
    spark: sparkSeries(109, 30, 0.20),
  },
  {
    ticker: 'CASH-THB', name: 'Cash · THB Savings', cls: 'cash', ccy: 'THB', broker: 'make',
    units: 1, avgCost: 480000, price: 480000, feesLifetime: 0,
    dividendsLifetime: 9600, dividendsYTD: 4800,
    spark: Array.from({length: 30}, (_,i)=> 100 + i*0.05),
  },
];

const PORTFOLIO = (typeof localStorage !== 'undefined' && localStorage.getItem('netto:useMockData') === 'true') ? PORTFOLIO_SEED : [];

// Derived helpers
function toTHB(amount, ccy) {
  if (ccy === 'THB') return amount;
  if (ccy === 'USD') return amount * FX.USD_THB;
  return amount;
}

function enrich(a) {
  const value = a.units * a.price;
  const cost = a.units * a.avgCost;
  const unrealized = value - cost;
  const unrealizedPct = cost > 0 ? (unrealized / cost) * 100 : 0;
  const totalReturn = unrealized + a.dividendsLifetime;
  const totalReturnPct = cost > 0 ? (totalReturn / cost) * 100 : 0;
  const valueTHB = toTHB(value, a.ccy);
  const dayChangePct = a.spark && a.spark.length >= 2 && a.spark[a.spark.length-2] > 0
    ? (a.spark[a.spark.length-1] - a.spark[a.spark.length-2]) / a.spark[a.spark.length-2] * 100
    : 0;
  return { ...a, value, cost, unrealized, unrealizedPct, totalReturn, totalReturnPct, valueTHB, dayChangePct };
}

const ENRICHED = PORTFOLIO.map(enrich);
const TOTAL_THB = ENRICHED.reduce((s,a) => s + a.valueTHB, 0);
const TOTAL_COST_THB = ENRICHED.reduce((s,a) => s + toTHB(a.cost, a.ccy), 0);
const TOTAL_DIVS_YTD_THB = ENRICHED.reduce((s,a) => s + toTHB(a.dividendsYTD, a.ccy), 0);
const TOTAL_DIVS_LIFE_THB = ENRICHED.reduce((s,a) => s + toTHB(a.dividendsLifetime, a.ccy), 0);
const TRUE_RETURN_PCT = TOTAL_COST_THB > 0 ? ((TOTAL_THB - TOTAL_COST_THB + TOTAL_DIVS_LIFE_THB) / TOTAL_COST_THB) * 100 : 0;

// Allocation by asset class
const ALLOCATION = Object.values(ASSET_CLASSES).map(c => {
  const sum = ENRICHED.filter(a => a.cls === c.id).reduce((s,a)=> s + a.valueTHB, 0);
  const pct = TOTAL_THB > 0 ? sum / TOTAL_THB : 0;
  return { ...c, valueTHB: sum, pct, targetPct: TARGET[c.id] || 0, drift: pct - (TARGET[c.id] || 0) };
});

// Allocation by broker / app account — only those actually used
let ALLOCATION_BROKER = Object.values(BROKERS)
  .map(b => {
    const positions = ENRICHED.filter(a => a.broker === b.id);
    const sum = positions.reduce((s,a) => s + a.valueTHB, 0);
    return { ...b, valueTHB: sum, pct: TOTAL_THB > 0 ? sum / TOTAL_THB : 0, count: positions.length };
  })
  .filter(b => b.count > 0)
  .sort((a,b) => b.valueTHB - a.valueTHB);

// Total fees paid (THB) across portfolio
const TOTAL_FEES_THB = ENRICHED.reduce((s,a) => s + toTHB(a.feesLifetime || 0, a.ccy), 0);

// Daily change (weighted by value)
const DAILY_CHANGE_PCT = TOTAL_THB > 0 ? ENRICHED.reduce((s,a) => s + (a.dayChangePct * a.valueTHB), 0) / TOTAL_THB : 0;
const DAILY_CHANGE_THB = TOTAL_THB * (DAILY_CHANGE_PCT / 100);

// 30d portfolio sparkline (weighted)
const PORTFOLIO_SPARK = (() => {
  const n = 30;
  const out = new Array(n).fill(0);
  if (TOTAL_THB > 0) {
    ENRICHED.forEach(a => {
      const norm = a.spark.map(v => a.spark[0] > 0 ? v / a.spark[0] : 0);
      for (let i=0;i<n;i++) out[i] += norm[i] * a.valueTHB;
    });
  }
  return out;
})();

function recomputeDerived() {
  const D = window.DataLayer || {};
  window.DataLayer.sparkSeries = sparkSeries;
  
  try {
    const manual = JSON.parse(localStorage.getItem('netto:manualPrices') || '{}');
    if (D.ENRICHED) {
      D.ENRICHED.forEach(a => {
        if (manual[a.ticker] !== undefined) {
          a.price = manual[a.ticker];
          a.value = (a.units || 0) * a.price;
          a.valueTHB = D.toTHB(a.value, a.ccy);
          a.unrealized = a.value - (a.cost || 0);
          a.unrealizedPct = a.cost > 0 ? (a.unrealized / a.cost) * 100 : 0;
        }
      });
    }
  } catch(e) {}
  D.TOTAL_THB = D.ENRICHED.reduce((s, a) => s + (a.valueTHB || 0), 0);
  D.TOTAL_COST_THB = D.ENRICHED.reduce((s, a) => s + D.toTHB(a.cost || 0, a.ccy), 0);
  D.TOTAL_DIVS_YTD_THB = D.ENRICHED.reduce((s, a) => s + D.toTHB(a.dividendsYTD || 0, a.ccy), 0);
  D.TOTAL_DIVS_LIFE_THB = D.ENRICHED.reduce((s, a) => s + D.toTHB(a.dividendsLifetime || 0, a.ccy), 0);
  D.TRUE_RETURN_PCT = D.TOTAL_COST_THB > 0 ? ((D.TOTAL_THB - D.TOTAL_COST_THB + D.TOTAL_DIVS_LIFE_THB) / D.TOTAL_COST_THB) * 100 : 0;
  D.TOTAL_FEES_THB = D.ENRICHED.reduce((s, a) => s + D.toTHB(a.feesLifetime || 0, a.ccy), 0);

  D.ALLOCATION.forEach(c => {
    const sum = D.ENRICHED.filter(a => a.cls === c.id).reduce((s, a) => s + (a.valueTHB || 0), 0);
    c.valueTHB = sum;
    c.pct = D.TOTAL_THB > 0 ? sum / D.TOTAL_THB : 0;
    c.drift = c.pct - c.targetPct;
  });

  D.ALLOCATION_BROKER = Object.values(D.BROKERS)
    .map(b => {
      const positions = D.ENRICHED.filter(a => a.broker === b.id);
      const sum = positions.reduce((s, a) => s + (a.valueTHB || 0), 0);
      return { ...b, valueTHB: sum, pct: D.TOTAL_THB > 0 ? sum / D.TOTAL_THB : 0, count: positions.length };
    })
    .filter(b => b.count > 0)
    .sort((a, b) => b.valueTHB - a.valueTHB);

  D.DAILY_CHANGE_PCT = D.TOTAL_THB > 0 ? D.ENRICHED.reduce((s, a) => s + (((a.dayChangePct || 0) * a.valueTHB) || 0), 0) / D.TOTAL_THB : 0;
  D.DAILY_CHANGE_THB = D.TOTAL_THB * (D.DAILY_CHANGE_PCT / 100);

  D.PORTFOLIO_SPARK = (() => {
    const n = 30;
    const out = new Array(n).fill(0);
    if (D.TOTAL_THB > 0) {
      D.ENRICHED.forEach(a => {
        if (a.spark && a.spark.length >= n) {
          const norm = a.spark.map(v => a.spark[0] > 0 ? v / a.spark[0] : 0);
          for (let i = 0; i < n; i++) out[i] += norm[i] * (a.valueTHB || 0);
        }
      });
    }
    return out;
  })();
}

// Formatters
const fmtTHB = (n, opts={}) => {
  const { compact=false, sign=false } = opts;
  const v = Math.abs(n);
  let str;
  if (compact && v >= 1_000_000) str = (n/1_000_000).toFixed(2) + 'M';
  else if (compact && v >= 1_000) str = (n/1_000).toFixed(1) + 'K';
  else str = n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return (sign && n > 0 ? '+' : '') + '฿' + (n<0 ? '-' : '') + str.replace('-','');
};
const fmtNum = (n, d=2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (n, d=2, sign=true) => (sign && n>0 ? '+' : '') + n.toFixed(d) + '%';
const fmtUnits = (n) => {
  if (n < 1) return n.toFixed(4);
  if (n < 100) return n.toFixed(2);
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

window.DataLayer = {
  FX, ASSET_CLASSES, BROKERS, TARGET, ENRICHED, ALLOCATION, ALLOCATION_BROKER,
  TOTAL_THB, TOTAL_COST_THB, TOTAL_DIVS_YTD_THB, TOTAL_DIVS_LIFE_THB, TRUE_RETURN_PCT,
  TOTAL_FEES_THB,
  DAILY_CHANGE_PCT, DAILY_CHANGE_THB, PORTFOLIO_SPARK,
  fmtTHB, fmtNum, fmtPct, fmtUnits, toTHB,
  recomputeDerived,
  sparkSeries,
};
