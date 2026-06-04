// SEC API Integration Helper

const SEC_API_URL = {
  DAILY_INFO: 'https://api.sec.or.th/FundDailyInfo',
  FACTSHEET: 'https://api.sec.or.th/FundFactsheet'
};

// We create a static mapping for the funds currently supported by Wealth OS
// to save on expensive AMC and profile fetching loops.
// This can be expanded later or made dynamic.
const FUND_MAPPING = {
  'SCBS&P500E': 'M0643_2555',
  'SCBS&P500': 'M0643_2555',
  'SCBPGF': 'M0101_2557',     // Example, needs real mapping if heavily used
  'SCBGOLDH': 'M0502_2554',   // Example, needs real mapping if heavily used
};

class SecApi {
  constructor() {
    this.dailyInfoKey = localStorage.getItem('sec:dailyInfoKey') || '';
    this.factsheetKey = localStorage.getItem('sec:factsheetKey') || '';
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

    const projId = FUND_MAPPING[ticker];
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
             if (specificClass && specificClass.last_val) {
                return { price: specificClass.last_val, date: dateString };
             }
             // Fallback to the first one if ticker isn't exactly the class name
             if (data.length > 0 && data[0].last_val) {
                return { price: data[0].last_val, date: dateString };
             }
          } else if (data && data.last_val) {
             return { price: data.last_val, date: dateString };
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
