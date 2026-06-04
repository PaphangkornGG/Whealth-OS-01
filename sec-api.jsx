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
    let projData = this.fundMapping[searchTicker];
    
    // Fallback: If not found, it might be a share class (e.g. UGIS-N).
    // Try stripping suffixes after the last hyphen incrementally.
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

    const projId = projData ? projData.id : null;
    
    if (!projId) {
      throw new Error(`Mapping not found for ticker: ${ticker}`);
    }

    // Usually we need to provide a date. If we want the latest, SEC API might not have a "latest" endpoint without date.
    // However, some endpoints return an array of recent NAVs if date is omitted, or we might need to loop back a few days.
    // Wait, let's try calling without date or with today's date and going back up to 5 days.
    let date = new Date();
    
    // We try the last 7 days to find the most recent NAV
    for (let i = 0; i < 7; i++) {
      const dateString = date.toISOString().split('T')[0];
      const url = `${SEC_API_URL.DAILY_INFO}/${projId}/dailynav/${dateString}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.dailyInfoKey
          }
        });

        if (response.status === 200) {
          const data = await response.json();
          if (Array.isArray(data)) {
             // Find specific class like SCBS&P500E
             const specificClass = data.find(d => d.class_abbr_name === ticker);
             if (specificClass) {
                return { price: specificClass.last_val, date: dateString, name: projData.name };
             }
             // Fallback to the first one if ticker isn't exactly the class name
             if (data.length > 0) {
                return { price: data[0].last_val, date: dateString, name: projData.name };
             }
          } else if (data && data.last_val) {
             return { price: data.last_val, date: dateString, name: projData.name };
          }
        }
      } catch (e) {
        console.error("SEC API Error:", e);
      }
      
      // Go back one day
      date.setDate(date.getDate() - 1);
    }
    
    throw new Error('Could not fetch NAV for the past 7 days. Fund might be inactive or API limits reached.');
  }
}

window.SecApi = new SecApi();
