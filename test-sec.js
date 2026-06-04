const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Ocp-Apim-Subscription-Key': '4a07e3a20ba74b71963123b4de0fa965' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 204) resolve(null);
          else resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Try 7 days backwards from June 4, 2026
  for (let i = 0; i < 15; i++) {
    const d = new Date('2026-06-04');
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    console.log('Trying', dateStr);
    const data = await fetchJson(`https://api.sec.or.th/FundDailyInfo/M0484_2559/dailynav/${dateStr}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
      break;
    }
  }
}

main();
