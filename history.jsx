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
    let [set50Hist, sp500Hist, acwiHist] = await Promise.all([
      fetchHistory('^SET.BK', range),
      fetchHistory('^GSPC', range),
      fetchHistory('ACWI', range)
    ]);

    // Fallback if backend API is not available (e.g. GitHub Pages static hosting)
    let isMocking = false;
    let daysToMock = range === '1D' ? 30 : range === '1W' ? 7 : range === '1M' ? 30 : range === '3M' ? 90 : range === '1Y' ? 365 : 730;
    
    if (set50Hist.length === 0) {
      isMocking = true;
      const now = Date.now();
      const intervalMs = range === '1D' ? 900000 : range === '1W' ? 3600000 : 86400000; // 15m, 1h, 1d
      const points = range === '1D' ? 30 : range === '1W' ? 40 : daysToMock;
      
      const genMock = (seed, basePrice, slope) => {
        const raw = D.sparkSeries(seed, points, slope);
        const ratio = basePrice / raw[points - 1];
        return raw.map((v, i) => ({
          date: (now - (points - 1 - i) * intervalMs) / 1000,
          price: v * ratio
        }));
      };
      
      set50Hist = genMock(50, 1000, 0.05);
      sp500Hist = genMock(500, 5000, 0.08);
      acwiHist = genMock(100, 100, 0.06);
    }

    const holdings = D.ENRICHED.filter(a => a.cls !== 'cash');
    const tickerHists = {};
    const fetchPromises = holdings.map(async (a) => {
      let hist = isMocking ? [] : await fetchHistory(a.ticker, range);
      if (hist.length === 0) {
        const currentPrice = a.price || 10;
        if (isMocking) {
          const seed = a.ticker.charCodeAt(0) + a.ticker.charCodeAt(a.ticker.length - 1);
          const raw = D.sparkSeries(seed, set50Hist.length, 0.05);
          const ratio = currentPrice / raw[raw.length - 1];
          hist = set50Hist.map((d, i) => ({
            date: d.date,
            price: raw[i] * ratio
          }));
        } else {
          // Fallback for Thai Mutual Funds or missing data: shape it like SET50
          const lastSet50Price = set50Hist[set50Hist.length - 1]?.price || 100;
          hist = set50Hist.map(d => ({
            date: d.date,
            price: currentPrice * (d.price / lastSet50Price)
          }));
        }
      }
      tickerHists[a.ticker] = hist;
    });
    
    await Promise.all(fetchPromises);

    // Gather all unique timestamps to align the series
    const timeMap = new Set();
    set50Hist.forEach(d => timeMap.add(d.date));
    sp500Hist.forEach(d => timeMap.add(d.date));
    acwiHist.forEach(d => timeMap.add(d.date));
    
    let times = Array.from(timeMap).sort((a, b) => a - b);
    if (times.length === 0) {
      times = Array.from({length: 30}, (_, i) => Date.now()/1000 - (30-i)*86400);
    }

    const set50Vals = [];
    const sp500Vals = [];
    const acwiVals = [];
    const costVals = [];
    const portVals = [];
    const dateVals = [];

    let lastSet50 = set50Hist.length > 0 ? set50Hist[0].price : 100;
    let lastSp500 = sp500Hist.length > 0 ? sp500Hist[0].price : 100;
    let lastAcwi = acwiHist.length > 0 ? acwiHist[0].price : 100;

    let set50Idx = 0;
    let sp500Idx = 0;
    let acwiIdx = 0;

    const histCursors = {};
    const lastPrice = {};
    for (const a of holdings) {
      histCursors[a.ticker] = 0;
      lastPrice[a.ticker] = tickerHists[a.ticker]?.[0]?.price || a.price;
    }

    const txs = [...D.TRANSACTIONS].reverse();
    let currentTxsIdx = 0;
    const inventory = {};
    let costAtTime = 0;
    
    const currentInvested = holdings.reduce((s, a) => s + a.valueTHB, 0);
    const cashBuffer = Math.max(0, D.TOTAL_THB - currentInvested);

    for (const t of times) {
      while (set50Idx < set50Hist.length && set50Hist[set50Idx].date <= t) {
        lastSet50 = set50Hist[set50Idx].price;
        set50Idx++;
      }
      while (sp500Idx < sp500Hist.length && sp500Hist[sp500Idx].date <= t) {
        lastSp500 = sp500Hist[sp500Idx].price;
        sp500Idx++;
      }
      while (acwiIdx < acwiHist.length && acwiHist[acwiIdx].date <= t) {
        lastAcwi = acwiHist[acwiIdx].price;
        acwiIdx++;
      }

      for (const a of holdings) {
        const hist = tickerHists[a.ticker];
        while (histCursors[a.ticker] < hist.length && hist[histCursors[a.ticker]].date <= t) {
          lastPrice[a.ticker] = hist[histCursors[a.ticker]].price;
          histCursors[a.ticker]++;
        }
      }

      while (currentTxsIdx < txs.length && txs[currentTxsIdx].date.getTime() / 1000 <= t) {
        const tx = txs[currentTxsIdx];
        if (tx.type === 'buy') {
          inventory[tx.ticker] = (inventory[tx.ticker] || 0) + tx.units;
          costAtTime += tx.total;
        } else if (tx.type === 'sell') {
          inventory[tx.ticker] = Math.max(0, (inventory[tx.ticker] || 0) - tx.units);
          costAtTime -= tx.total;
        }
        currentTxsIdx++;
      }
      
      let investedValueTHB = 0;
      for (const tck of Object.keys(inventory)) {
        const units = inventory[tck];
        if (units > 0) {
          const price = lastPrice[tck] || 0;
          const a = holdings.find(x => x.ticker === tck);
          const fx = a?.ccy === 'USD' ? D.FX.USD_THB : 1;
          investedValueTHB += (units * price * fx);
        }
      }
      
      const portNav = investedValueTHB + cashBuffer;
      const safeCost = Math.max(0, costAtTime) + cashBuffer;

      set50Vals.push(lastSet50);
      sp500Vals.push(lastSp500);
      acwiVals.push(lastAcwi);
      costVals.push(safeCost);
      portVals.push(portNav);
      dateVals.push(new Date(t * 1000));
    }

    const currentTotal = D.TOTAL_THB || 1;
    const finalSet50 = set50Vals[set50Vals.length - 1] || 1;
    const finalSp500 = sp500Vals[sp500Vals.length - 1] || 1;
    const finalAcwi = acwiVals[acwiVals.length - 1] || 1;
    
    return {
      portfolio: portVals,
      costBasis: costVals,
      set50: set50Vals.map(v => v * (currentTotal / finalSet50)),
      sp500: sp500Vals.map(v => v * (currentTotal / finalSp500)),
      acwi: acwiVals.map(v => v * (currentTotal / finalAcwi)),
      set50Raw: set50Vals,
      sp500Raw: sp500Vals,
      acwiRaw: acwiVals,
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
