const fs = require('fs');
const https = require('https');

const API_KEY = '23137ce0651f408697a6d2ddbdb5cf14';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Ocp-Apim-Subscription-Key': API_KEY } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching AMCs...');
  const amcs = await fetchJson('https://api.sec.or.th/FundFactsheet/fund/amc');
  
  const mapping = {};
  
  for (const amc of amcs) {
    console.log(`Fetching funds for AMC: ${amc.unique_id} (${amc.name_en})...`);
    try {
      const funds = await fetchJson(`https://api.sec.or.th/FundFactsheet/fund/amc/${amc.unique_id}`);
      if (Array.isArray(funds)) {
        for (const fund of funds) {
          if (fund.proj_abbr_name && fund.proj_id) {
            mapping[fund.proj_abbr_name.toUpperCase().trim()] = {
              id: fund.proj_id,
              name: fund.proj_name_th || fund.proj_name_en
            };
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching funds for ${amc.unique_id}:`, err.message);
    }
  }
  
  fs.writeFileSync('sec_mapping.json', JSON.stringify(mapping, null, 2));
  console.log(`Successfully mapped ${Object.keys(mapping).length} funds! Saved to sec_mapping.json`);
}

main().catch(console.error);
