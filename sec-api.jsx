// SEC API Integration Helper

const SEC_API_URL = {
  DAILY_INFO: 'https://api.sec.or.th/FundDailyInfo',
  FACTSHEET: 'https://api.sec.or.th/FundFactsheet'
};

class SecApi {
  constructor() {
    this.dailyInfoKey = localStorage.getItem('sec:dailyInfoKey') || '4a07e3a20ba74b71963123b4de0fa965';
    this.factsheetKey = localStorage.getItem('sec:factsheetKey') || '23137ce0651f408697a6d2ddbdb5cf14';
    this.fundMapping = null;
  }

  async ensureMapping() {
    if (!this.fundMapping) {
      try {
        const res = await fetch('/sec_mapping.json');
        if (res.ok) {
          this.fundMapping = await res.json();
        } else {
          this.fundMapping = {};
        }
      } catch (e) {
        console.error("Failed to load SEC mapping", e);
        this.fundMapping = {};
      }
    }
  }

  isConfigured() {
    return this.dailyInfoKey.length > 0;
  }

  setKeys(daily, fact) {
    this.dailyInfoKey = daily;
    this.factsheetKey = fact;
    localStorage.setItem('sec:dailyInfoKey', daily);
    localStorage.setItem('sec:factsheetKey', fact);
  }

  // Get NAV for a specific ticker
  async getLatestNAV(ticker) {
    if (!this.isConfigured()) {
      throw new Error('SEC API is not configured. Please enter your API keys in Settings.');
    }

    await this.ensureMapping();
    let searchTicker = ticker.toUpperCase().trim();
    
    // 1) Known aliases where SEC project ID differs from popular broker tickers
    const ALIAS_MAPPING = {
      'SCBS&P500E': 'M0643_2555',
      'SCBS&P500A': 'M0643_2555',
      'SCBS&P500':  'M0643_2555',
      'SCBGOLDH':   'M0502_2554',
      'SCBPGF':     'M0101_2557',
      // KKP funds: SEC stores them as "KKP S-PLUS FUND" etc.
      'KKP S-PLUS': 'M0058_2565',
    };

    let projId = ALIAS_MAPPING[searchTicker];
    let projName = null;

    if (projId) {
      // Find the project name from the ID
      for (const key of Object.keys(this.fundMapping)) {
        if (this.fundMapping[key].id === projId) {
          projName = this.fundMapping[key].name;
          break;
        }
      }
    } else {
      let projData = this.fundMapping[searchTicker];
      
      // 2) Fallback: SEC often appends "FUND" to the project abbreviation (e.g. SCBGOLDHFUND)
      if (!projData && this.fundMapping[searchTicker + 'FUND']) {
        projData = this.fundMapping[searchTicker + 'FUND'];
      }
      
      // 2b) Fallback: SEC stores some funds as "TICKER FUND" (with space) e.g. "KKP S-PLUS FUND"
      if (!projData && this.fundMapping[searchTicker + ' FUND']) {
        projData = this.fundMapping[searchTicker + ' FUND'];
      }
      
      // 3) Fallback: Share class suffixes with hyphens (e.g. UGIS-N -> UGIS)
      if (!projData && searchTicker.includes('-')) {
        const parts = searchTicker.split('-');
        for (let i = parts.length - 1; i > 0; i--) {
          const fallbackTicker = parts.slice(0, i).join('-');
          if (this.fundMapping[fallbackTicker]) {
            projData = this.fundMapping[fallbackTicker];
            break;
          }
        }
      }
      
      // 4) Fallback: Share class suffixes with hyphens + "FUND" (e.g. SCBSET-A -> SCBSETFUND)
      if (!projData && searchTicker.includes('-')) {
        const parts = searchTicker.split('-');
        for (let i = parts.length - 1; i > 0; i--) {
          const fallbackTicker = parts.slice(0, i).join('-') + 'FUND';
          if (this.fundMapping[fallbackTicker]) {
            projData = this.fundMapping[fallbackTicker];
            break;
          }
        }
      }

      // 5) Fallback: Strip parentheses suffixes (e.g. SCBEV(E) -> SCBEV)
      if (!projData && searchTicker.includes('(')) {
        let stripped = searchTicker.replace(/\([A-Z]\)/g, '');
        if (this.fundMapping[stripped]) {
          projData = this.fundMapping[stripped];
        }
      }
      
      // 6) Fallback: Strip E, A, D if it matches SCB or similar pattern (e.g. SCBCHAE -> SCBCHA)
      if (!projData) {
        let stripped = searchTicker.replace(/[EAD]$/, '');
        if (this.fundMapping[stripped]) {
          projData = this.fundMapping[stripped];
        } else if (this.fundMapping[stripped + 'FUND']) {
          projData = this.fundMapping[stripped + 'FUND'];
        }
      }

      projId = projData ? projData.id : null;
      projName = projData ? projData.name : null;
    }
    
    if (!projId) {
      throw new Error(`Mapping not found for ticker: ${ticker}`);
    }

    const today = new Date();
    const fetchPromises = [];
    
    // We try the last 15 days in parallel to find the most recent NAV quickly
    for (let i = 0; i < 15; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const url = `/api/sec?projId=${projId}&dateString=${dateString}`;
      
      fetchPromises.push(
        fetch(url)
          .then(res => res.status === 200 ? res.json() : null)
          .then(data => ({ dateString, data, i }))
          .catch(e => null)
      );
    }
    
    const results = await Promise.all(fetchPromises);
    
    // Sort by most recent (i = 0 is today, so sort by i ascending)
    const validResults = results
      .filter(r => r && r.data)
      .sort((a, b) => a.i - b.i);
      
    if (validResults.length > 0) {
      const { data, dateString } = validResults[0];
      if (Array.isArray(data)) {
        const specificClass = data.find(d => d.class_abbr_name === searchTicker);
        if (specificClass) {
          return { price: specificClass.last_val, date: dateString, name: projName };
        }
        if (data.length > 0) {
          return { price: data[0].last_val, date: dateString, name: projName };
        }
      } else if (data && data.last_val) {
        return { price: data.last_val, date: dateString, name: projName };
      }
    }
    
    throw new Error('Could not fetch NAV for the past 15 days. Fund might be inactive or API limits reached.');
  }
}

window.SecApi = new SecApi();
