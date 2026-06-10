// <StockLogo> — fetches a real logo where we can, falls back to a tinted
// letter mark otherwise. Sources used:
//   • Stocks (US + Thai)  → https://www.google.com/s2/favicons?sz=128&domain=X
//   • Crypto             → spothq/cryptocurrency-icons (GitHub CDN, 128px PNG)
//   • Funds / Cash       → letter fallback (tinted by ASSET_CLASSES color)
//
// All sources are free, no API key. If a fetch fails the <img> onError
// flips to the letter fallback so we never show a broken icon.

const TICKER_DOMAIN = {
  // ── US stocks ─────────────────────────────────────────────────────
  AAPL: 'apple.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  MSFT: 'microsoft.com',
  NVDA: 'nvidia.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  TSLA: 'tesla.com',
  NFLX: 'netflix.com',
  AMD: 'amd.com',
  INTC: 'intel.com',
  ORCL: 'oracle.com',
  CRM: 'salesforce.com',
  ADBE: 'adobe.com',
  PYPL: 'paypal.com',
  DIS: 'disney.com',
  NKE: 'nike.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  MCD: 'mcdonalds.com',
  SBUX: 'starbucks.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  JPM: 'jpmorganchase.com',
  BAC: 'bankofamerica.com',
  WMT: 'walmart.com',
  COST: 'costco.com',
  // ETFs
  SPY: 'spdrs.com',
  QQQ: 'invesco.com',
  VOO: 'vanguard.com',
  VTI: 'vanguard.com',

  // ── Thai stocks (SET) ────────────────────────────────────────────
  PTT: 'pttplc.com',
  PTTEP: 'pttep.com',
  PTTGC: 'pttgcgroup.com',
  CPALL: 'cpall.co.th',
  CPF: 'cpfworldwide.com',
  CPN: 'centralpattana.co.th',
  TISCO: 'tisco.co.th',
  SCB: 'scb.co.th',
  KBANK: 'kasikornbank.com',
  BBL: 'bangkokbank.com',
  KTB: 'krungthai.com',
  TMB: 'ttbbank.com',
  TTB: 'ttbbank.com',
  KKP: 'kkpfg.com',
  ADVANC: 'ais.th',
  TRUE: 'truecorp.co.th',
  AIS: 'ais.th',
  AOT: 'airportthai.co.th',
  BDMS: 'bangkokhospital.com',
  BH: 'bumrungrad.com',
  GULF: 'gulf.co.th',
  EA: 'energyabsolute.co.th',
  DELTA: 'deltathailand.com',
  IVL: 'indoramaventures.com',
  SCC: 'scg.com',
  MINT: 'minor.com',
  CRC: 'centralretail.com',
  BJC: 'bjc.co.th',
  HMPRO: 'homepro.co.th',
  GLOBAL: 'globalhouse.co.th',
  OSP: 'osotspa.com',
  TU: 'thaiunion.com',

  // ── Thai mutual fund houses (use the AMC's site) ─────────────────
  'K-USA': 'kasikornasset.com',
  'K-CHINA': 'kasikornasset.com',
  'K-GLOBE': 'kasikornasset.com',
  'KFGBRAND-A': 'kasikornasset.com',
  'KFGG-A': 'kasikornasset.com',
  SCBPGF: 'scbam.com',
  SCBROBO: 'scbam.com',
  'SCBS&P500': 'scbam.com',
  'SCBS&P500E': 'scbam.com',
  'B-INNOTECH': 'bblam.co.th',
  'TMBGQG': 'eastspring.co.th',
  'ASP-DIGIBLOC': 'assetfund.co.th',

  // ── Gold (Thai funds + dealers) ──────────────────────────────────
  'GOLD96.5':  'huasengheng.com',
  GOLD965:     'huasengheng.com',
  GOLDSPOT:    'goldtraders.or.th',
  'K-GOLD':    'kasikornasset.com',
  KFGOLD:      'kasikornasset.com',
  SCBGOLD:     'scbam.com',
  SCBGOLDH:    'scbam.com',
  TMBGOLD:     'eastspring.co.th',
  BBASICGOLD:  'bblam.co.th',
};

// Crypto symbols available in spothq/cryptocurrency-icons (lowercase)
const CRYPTO_SYMBOLS = new Set([
  'btc','eth','sol','bnb','xrp','ada','doge','dot','matic','avax','ltc','link',
  'uni','atom','xlm','etc','bch','near','algo','fil','trx','vet','usdt','usdc',
  'busd','dai','shib','aave','sand','mana','axs','ftm','hbar','icp','egld','xtz',
]);

function logoUrl(ticker) {
  if (!ticker) return null;
  const upper = ticker.toUpperCase().trim();
  // Strip the "-THB" / "-A" suffix used for Thai-listed share classes
  const base = upper.replace(/-THB$/, '');

  // Crypto first
  const lower = base.toLowerCase();
  if (CRYPTO_SYMBOLS.has(lower)) {
    return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${lower}.png`;
  }

  // Stocks / funds via Google Favicon
  const domain = TICKER_DOMAIN[base] || TICKER_DOMAIN[upper];
  if (domain) {
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  }
  // Fund-house prefix fallback (Thai AMCs use systematic naming)
  let prefixDomain = null;
  if (/^K-/.test(base) || /^KF/.test(base))   prefixDomain = 'kasikornasset.com';
  else if (/^SCB/.test(base))                 prefixDomain = 'scbam.com';
  else if (/^TMB/.test(base))                 prefixDomain = 'eastspring.co.th';
  else if (/^B-/.test(base) || /^BCAP/.test(base)) prefixDomain = 'bblam.co.th';
  else if (/^TISCO/.test(base))               prefixDomain = 'tiscoasset.com';
  else if (/^ASP-/.test(base))                prefixDomain = 'assetfund.co.th';
  else if (/^PRINCIPAL/.test(base) || /^PRIN/.test(base)) prefixDomain = 'principal.th';
  if (prefixDomain) {
    return `https://www.google.com/s2/favicons?sz=128&domain=${prefixDomain}`;
  }
  return null;
}

function StockLogo({
  ticker,
  cls,               // asset-class id (us / th / fund / crypto / cash) — used for fallback tint
  size = 32,
  radius,            // px; defaults to size * 0.25
  className = '',
  showFallbackBorder = true,
}) {
  const [errored, setErrored] = React.useState(false);
  const upper = (ticker || '').toUpperCase();
  const isCash = upper.startsWith('CASH');
  const src = (!errored && !isCash) ? logoUrl(upper) : null;
  const r = radius != null ? radius : Math.max(4, Math.round(size * 0.25));
  const baseStyle = { width: size, height: size, borderRadius: r };

  if (src) {
    return (
      <div
        className={`shrink-0 bg-white flex items-center justify-center overflow-hidden ${showFallbackBorder ? 'border border-ink-200' : ''} ${className}`}
        style={{ ...baseStyle }}
      >
        <img
          src={src}
          alt={upper}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          style={{
            width:  size - (size >= 28 ? 6 : 4),
            height: size - (size >= 28 ? 6 : 4),
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
      </div>
    );
  }

  // ── Letter fallback ──────────────────────────────────────────────
  // Use the asset-class color (or a neutral) so the avatar still reads
  // as belonging to its bucket.
  const D = window.DataLayer;
  const clsMeta = (cls && D?.ASSET_CLASSES?.[cls]) || null;
  const tint = clsMeta?.color || 'oklch(0.62 0.015 250)';
  const initials = isCash
    ? '฿'
    : upper.replace(/[^A-Z0-9]/g, '').slice(0, upper.length > 6 ? 3 : 2) || '•';

  return (
    <div
      className={`shrink-0 flex items-center justify-center font-mono font-bold ${className}`}
      style={{
        ...baseStyle,
        fontSize: Math.max(9, Math.round(size * 0.34)),
        color: tint,
        background: `color-mix(in oklch, ${tint} 14%, transparent)`,
        border: showFallbackBorder ? `1px solid color-mix(in oklch, ${tint} 26%, transparent)` : 'none',
      }}
    >
      {initials}
    </div>
  );
}

window.StockLogo = StockLogo;
window.logoUrl = logoUrl;

// --- Avatar image helper -----------------------------------------------
// Resize a user-picked File to a square data URL (default 256px). Keeps
// localStorage small while still looking crisp at every avatar size in
// the app (16px → 64px). Returns a Promise<string | null>.
window.fileToAvatarDataUrl = function (file, target = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) return resolve(null);
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image decode failed'));
      img.onload = () => {
        // Center-crop to a square, then scale to `target`.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);
        // JPEG keeps things under ~30KB for a 256px portrait.
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};
