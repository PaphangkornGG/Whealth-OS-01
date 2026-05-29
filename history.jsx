// Historical time-series data + benchmarks
// Generates deterministic daily values for portfolio + benchmarks over the past N days.
(function() {
  const D = window.DataLayer;

  // Seeded RNG for stable daily walks
  function makeRng(seed) {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 8) / 0xffffff; };
  }

  function dailyWalk(seed, days, drift, volatility) {
    const r = makeRng(seed);
    const out = [];
    let v = 100;
    for (let i = 0; i < days; i++) {
      v *= 1 + (r() - 0.5) * volatility + drift;
      out.push(v);
    }
    return out;
  }

  const DAYS = 730; // ~2 years of data

  // Portfolio normalized walk (will be scaled to current TOTAL_THB at end)
  const portfolioWalk = dailyWalk(2026, DAYS, 0.0012, 0.018);
  const benchSet50    = dailyWalk(909,  DAYS, 0.0004, 0.014);
  const benchSP500    = dailyWalk(1234, DAYS, 0.0009, 0.012);

  // Scale portfolio so that its end value equals current TOTAL_THB
  const scale = D.TOTAL_THB / portfolioWalk[DAYS - 1];
  const portfolioTHB = portfolioWalk.map(v => v * scale);

  // Cost basis line — simulated linear accumulation up to current TOTAL_COST_THB
  // Real-world it would step up with each Buy; for the demo it's a smooth curve.
  const costBasis = [];
  for (let i = 0; i < DAYS; i++) {
    const t = i / (DAYS - 1);
    // Curve: smooth-ish growth, ending at TOTAL_COST_THB
    const eased = Math.pow(t, 0.7);
    costBasis.push(eased * D.TOTAL_COST_THB);
  }

  // Benchmarks scaled to current portfolio for visual comparison (purely visual baseline)
  const benchScaleSet50 = D.TOTAL_THB / benchSet50[DAYS - 1];
  const benchScaleSP500 = D.TOTAL_THB / benchSP500[DAYS - 1];
  const set50THB = benchSet50.map(v => v * benchScaleSet50 * 0.78); // looks slightly under portfolio
  const sp500THB = benchSP500.map(v => v * benchScaleSP500 * 1.08); // looks slightly above

  // Helpers — get slice for a timeframe
  // Timeframes: '1D' (last 1 day, 24 points), '1W' (7), '1M' (30), '3M' (90), '1Y' (365), 'ALL' (730)
  const RANGES = {
    '1D':  1,
    '1W':  7,
    '1M':  30,
    '3M':  90,
    '1Y':  365,
    'ALL': DAYS,
  };

  function getRangeData(range) {
    const days = RANGES[range] || 30;
    const startIdx = Math.max(0, DAYS - days);
    return {
      portfolio: portfolioTHB.slice(startIdx),
      costBasis: costBasis.slice(startIdx),
      set50: set50THB.slice(startIdx),
      sp500: sp500THB.slice(startIdx),
      days,
    };
  }

  // Generate transaction ledger from holdings — simulate Buys + Dividends
  function genTransactions() {
    const txs = [];
    const now = new Date(2026, 4, 27); // May 27 2026

    D.ENRICHED.forEach((a, idx) => {
      if (a.cls === 'cash') return;

      // 1–3 buy transactions per holding spread over the last 18 months
      const r = makeRng(a.ticker.charCodeAt(0) * 31 + idx);
      const numBuys = 1 + Math.floor(r() * 3);
      const totalUnits = a.units;
      let remaining = totalUnits;

      for (let i = 0; i < numBuys; i++) {
        const isLast = i === numBuys - 1;
        const share = isLast ? remaining : remaining * (0.3 + r() * 0.4);
        remaining -= share;
        const daysAgo = Math.floor(r() * 540) + 7;
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        // Price near avgCost ± 8%
        const priceAtBuy = a.avgCost * (0.92 + r() * 0.16);
        txs.push({
          id: `${a.ticker}-buy-${i}`,
          date,
          type: 'buy',
          ticker: a.ticker,
          name: a.name,
          cls: a.cls,
          broker: a.broker,
          units: share,
          price: priceAtBuy,
          fee: (a.feesLifetime / numBuys) * (0.6 + r() * 0.8),
          ccy: a.ccy,
          total: share * priceAtBuy,
        });
      }

      // Dividend payments: split YTD divs into 1–2 payments + a few from prior periods
      if (a.dividendsYTD > 0) {
        const numDivs = 1 + Math.floor(r() * 2);
        for (let i = 0; i < numDivs; i++) {
          const daysAgo = 7 + Math.floor(r() * 140);
          const date = new Date(now);
          date.setDate(date.getDate() - daysAgo);
          txs.push({
            id: `${a.ticker}-div-${i}`,
            date,
            type: 'dividend',
            ticker: a.ticker,
            name: a.name,
            cls: a.cls,
            broker: a.broker,
            units: null,
            price: null,
            fee: 0,
            ccy: a.ccy,
            total: a.dividendsYTD / numDivs,
          });
        }
      }

      // Occasional sell (about 1/4 of holdings)
      if (idx % 4 === 1) {
        const daysAgo = 30 + Math.floor(r() * 180);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        const sellUnits = a.units * 0.15;
        const sellPrice = a.price * (0.9 + r() * 0.1);
        txs.push({
          id: `${a.ticker}-sell-0`,
          date,
          type: 'sell',
          ticker: a.ticker,
          name: a.name,
          cls: a.cls,
          broker: a.broker,
          units: sellUnits,
          price: sellPrice,
          fee: 0,
          ccy: a.ccy,
          total: sellUnits * sellPrice,
        });
      }
    });

    txs.sort((a, b) => b.date - a.date);
    return txs;
  }

  const TRANSACTIONS = genTransactions();

  // Goals — financial targets
  const GOALS = [
    {
      id: 'retire',
      label: { en: 'Retirement', th: 'เกษียณ' },
      target: 12_000_000,
      // contribution allocated proportionally from current portfolio
      currentTHB: D.TOTAL_THB * 0.62,
      etaYear: 2042,
      icon: 'sparkles',
      accent: 'brand',
    },
    {
      id: 'house',
      label: { en: 'House Down Payment', th: 'ดาวน์บ้าน' },
      target: 2_500_000,
      currentTHB: D.TOTAL_THB * 0.18,
      etaYear: 2028,
      icon: 'building',
      accent: 'gain',
    },
    {
      id: 'emergency',
      label: { en: 'Emergency Fund', th: 'เงินสำรองฉุกเฉิน' },
      target: 600_000,
      currentTHB: 480_000, // == cash position
      etaYear: 2026,
      icon: 'wallet',
      accent: 'warn',
    },
  ];

  window.DataLayer.getRangeData = getRangeData;
  window.DataLayer.RANGES = RANGES;
  window.DataLayer.TRANSACTIONS = TRANSACTIONS;
  window.DataLayer.GOALS = GOALS;
})();
