export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { projId, dateString } = req.query;
  if (!projId || !dateString) {
    return res.status(400).json({ error: 'projId and dateString are required' });
  }

  try {
    const response = await fetch(`https://api.sec.or.th/FundDailyInfo/${projId}/dailynav/${dateString}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': '4a07e3a20ba74b71963123b4de0fa965'
      }
    });

    if (response.status === 204) {
      return res.status(204).end();
    }
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `SEC API returned status ${response.status}` });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
