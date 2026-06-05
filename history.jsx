// Historical time-series data + benchmarks
// Generates deterministic daily values for portfolio + benchmarks over the past N days.
(function() {
  const D = window.DataLayer;

  async function fetchHistory(ticker, range) {
    let yfRange = '1mo';
    let interval = '1d';
    if (range === '1D') { yfRange = '1d'; interval = '15m'; }
    else if (range === '1W') { yfRange = '5d'; interval = '1h'; }
    else if (range === '1M') { yfRange = '1mo'; interval = '1d'; }
    else if (range === '3M') { yfRange = '3mo'; interval = '1d'; }
    else if (range === '1Y') { yfRange = '1y'; interval = '1d'; }
    else if (range === 'ALL') { yfRange = '2y'; interval = '1d'; } // fallback to 2y for ALL for now

    try {
      const res = await fetch(`/api/history?ticker=${encodeURIComponent(ticker)}&range=${yfRange}&interval=${interval}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.history || [];
    } catch {
      return [];
    }
  }

  D.getRangeDataAsync = async function(range) {
    const [set50Hist, sp500Hist] = await Promise.all([
      fetchHistory('^SET.BK', range),
      fetchHistory('^GSPC', range)
    ]);

    // Gather all unique timestamps to align the series
    const timeMap = new Set();
    set50Hist.forEach(d => timeMap.add(d.date));
    sp500Hist.forEach(d => timeMap.add(d.date));
    
    let times = Array.from(timeMap).sort((a, b) => a - b);
    if (times.length === 0) {
      // Fallback if APIs fail
      times = Array.from({length: 30}, (_, i) => Date.now()/1000 - (30-i)*86400);
    }

    const set50Vals = [];
    const sp500Vals = [];
    const costVals = [];
    const portVals = [];
    const dateVals = [];

    let lastSet50 = set50Hist.length > 0 ? set50Hist[0].price : 100;
    let lastSp500 = sp500Hist.length > 0 ? sp500Hist[0].price : 100;

    let set50Idx = 0;
    let sp500Idx = 0;

    // Calculate overall return ratio to scale the cost basis for the portfolio line
    const totalCost = D.TOTAL_COST_THB || 1;
    const currentTotal = D.TOTAL_THB || 1;
    const returnRatio = currentTotal / totalCost;

    // For cost basis, we must replay transactions chronologically
    // D.TRANSACTIONS is sorted newest first (b.date - a.date)
    // We reverse it to process oldest first
    const txs = [...D.TRANSACTIONS].reverse();

    for (const t of times) {
      // Find latest benchmark values up to this timestamp
      while (set50Idx < set50Hist.length && set50Hist[set50Idx].date <= t) {
        lastSet50 = set50Hist[set50Idx].price;
        set50Idx++;
      }
      while (sp500Idx < sp500Hist.length && sp500Hist[sp500Idx].date <= t) {
        lastSp500 = sp500Hist[sp500Idx].price;
        sp500Idx++;
      }

      // Calculate cost basis up to this timestamp
      let costAtTime = 0;
      for (const tx of txs) {
        if (tx.date.getTime() / 1000 <= t) {
          if (tx.type === 'buy') costAtTime += tx.total;
          if (tx.type === 'sell') {
            // Approximate cost reduction by average cost, but we only have total sale value.
            // For a simple visualization, subtract the sale value.
            costAtTime -= tx.total;
          }
        } else {
          break; // Since txs are chronological, we can stop early
        }
      }
      
      if (costAtTime < 0) costAtTime = 0;
      // If mock data is used, just use a placeholder cost to make it look decent if there are no txs
      if (costAtTime === 0 && D.TRANSACTIONS.length === 0) costAtTime = D.TOTAL_COST_THB;

      set50Vals.push(lastSet50);
      sp500Vals.push(lastSp500);
      costVals.push(costAtTime);
      portVals.push(costAtTime * returnRatio);
      dateVals.push(new Date(t * 1000));
    }

    // Scale benchmarks to match TOTAL_THB at the end for visual comparison
    const finalSet50 = set50Vals[set50Vals.length - 1] || 1;
    const finalSp500 = sp500Vals[sp500Vals.length - 1] || 1;
    
    return {
      portfolio: portVals,
      costBasis: costVals,
      set50: set50Vals.map(v => v * (currentTotal / finalSet50)),
      sp500: sp500Vals.map(v => v * (currentTotal / finalSp500)),
      set50Raw: set50Vals,
      sp500Raw: sp500Vals,
      dates: dateVals,
      days: times.length,
    };
  };

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
  const useMock = typeof localStorage !== 'undefined' && localStorage.getItem('netto:useMockData') === 'true';
  const TRANSACTIONS = useMock ? genTransactions() : [];

  // Goals — financial targets
  const GOALS = [
    {
      id: 'retire',
      label: { en: 'Retirement', th: 'เกษียณ' },
      target: 12_000_000,
      // contribution allocated proportionally from current portfolio
      currentTHB: useMock ? D.TOTAL_THB * 0.62 : 0,
      etaYear: 2042,
      icon: 'sparkles',
      accent: 'brand',
    },
    {
      id: 'house',
      label: { en: 'House Down Payment', th: 'ดาวน์บ้าน' },
      target: 2_500_000,
      currentTHB: useMock ? D.TOTAL_THB * 0.18 : 0,
      etaYear: 2028,
      icon: 'building',
      accent: 'gain',
    },
    {
      id: 'emergency',
      label: { en: 'Emergency Fund', th: 'เงินสำรองฉุกเฉิน' },
      target: 600_000,
      currentTHB: useMock ? 480_000 : 0, // == cash position
      etaYear: 2026,
      icon: 'wallet',
      accent: 'warn',
    },
  ];

  window.DataLayer.TRANSACTIONS = TRANSACTIONS;
  window.DataLayer.GOALS = GOALS;
})();
