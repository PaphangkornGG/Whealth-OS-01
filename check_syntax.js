const fs = require('fs');
const https = require('https');
https.get('https://unpkg.com/@babel/standalone@7.29.0/babel.min.js', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const sandbox = { window: {}, setTimeout, clearTimeout, console };
      require('vm').createContext(sandbox);
      require('vm').runInContext(body, sandbox);
      const Babel = sandbox.Babel || sandbox.window.Babel;
      const files = ['data.jsx', 'history.jsx', 'pages.jsx', 'bento-app.jsx'];
      for (const f of files) {
        try {
          Babel.transform(fs.readFileSync(f, 'utf8'), { presets: ['react'], filename: f });
          console.log(f, 'OK');
        } catch (e) {
          console.error(f, 'ERROR:', e.message);
        }
      }
    } catch(e) { console.error('Babel load error', e); }
  });
});
