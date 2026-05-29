export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker parameter is required' });
  }

  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance returned status ${response.status}` });
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ error: 'Ticker not found' });
    }

    const price = result.meta?.regularMarketPrice;
    const prevClose = result.meta?.previousClose;
    const currency = result.meta?.currency;

    return res.status(200).json({
      ticker,
      price,
      prevClose,
      currency
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
