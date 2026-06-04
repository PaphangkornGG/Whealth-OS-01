const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jsx': 'text/babel', // Serve JSX with a custom header so babel can fetch and parse it
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // 1) API Route: Yahoo Finance Proxy
  if (pathname.startsWith('/api/price')) {
    const ticker = parsedUrl.query.ticker;
    if (!ticker) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: 'Ticker parameter is required' }));
    }

    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
      if (!response.ok) {
        res.writeHead(response.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: `Yahoo Finance returned status ${response.status}` }));
      }
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (!result) {
        res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'Ticker not found' }));
      }

            const price = result.meta?.regularMarketPrice;
      const prevClose = result.meta?.previousClose;
      const currency = result.meta?.currency;
      const name = result.meta?.longName || result.meta?.shortName || result.meta?.symbol || ticker;

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({
        ticker,
        price,
        prevClose,
        currency,
        name
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: error.message }));
    }
  }

  // 2) API Route: SEC API Proxy (to bypass CORS)
  if (pathname.startsWith('/api/sec')) {
    const projId = parsedUrl.query.projId;
    const dateString = parsedUrl.query.dateString;
    if (!projId || !dateString) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: 'projId and dateString are required' }));
    }

    try {
      const response = await fetch(`https://api.sec.or.th/FundDailyInfo/${projId}/dailynav/${dateString}`, {
        headers: { 'Ocp-Apim-Subscription-Key': '4a07e3a20ba74b71963123b4de0fa965' }
      });
      if (response.status === 204) {
         res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
         return res.end();
      }
      if (!response.ok) {
        res.writeHead(response.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: `SEC API returned status ${response.status}` }));
      }
      const data = await response.json();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(data));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: error.message }));
    }
  }

  // 3) Static Files Server
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Decode URL pathname (e.g. %20 -> space)
  pathname = decodeURIComponent(pathname);

  const filePath = path.join(PUBLIC_DIR, pathname);
  
  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('403 Forbidden');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Wealth OS Server] Running at http://localhost:${PORT}/`);
  console.log(`[Wealth OS Server] API Endpoint: http://localhost:${PORT}/api/price?ticker=TSLA`);
});
