export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { ticker, range = '1mo', interval = '1d' } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker parameter is required' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance returned status ${response.status}` });
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ error: 'Ticker not found' });
    }

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    // Filter out nulls
    const history = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null) {
        history.push({
          date: timestamps[i],
          price: closes[i]
        });
      }
    }

    return res.status(200).json({
      ticker,
      history
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
