import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios'; 
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

// API key used to fetch data
const ALPHA_VANTAGE_API_KEY = '17PO7BG4SUFRVG45'; 

// Helper function to convert ratio to percentage string (Added this because I was getting results like 1.35% instead of 135%)
function parseRatioToPercentage(ratio) {
  if (!ratio || isNaN(ratio)) {
    return 'N/A';
  }

  let value = parseFloat(ratio);

  // If the value is less than or equal to 1, we assume it's a decimal fraction (e.g., 0.0136 = 1.36%)
  if (value <= 1) {
    value = value * 100;
  }

  return `${value.toFixed(2)}%`;
}


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API endpoint to fetch stock data
app.post('/api/stock-data', async (req, res) => {
  const { ticker } = req.body;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol is required' });
  }

  try {
    console.log(`Fetching data for ticker: ${ticker}`);

    // Fetch stock quote (includes price info)
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const data = response.data;

    // Handle invalid symbols or empty data
    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: 'No data found for this ticker symbol' });
    }

    // Example fields from Alpha Vantage Overview endpoint
    const stockName = data.Name;
    const roe = parseRatioToPercentage(data.ReturnOnEquityTTM);
    const roa = parseRatioToPercentage(data.ReturnOnAssetsTTM);
    const sharePriceResponse = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const sharePriceData = sharePriceResponse.data['Global Quote'];
    const sharePrice = sharePriceData ? `$${parseFloat(sharePriceData['05. price']).toFixed(2)}` : 'N/A';

    res.json({
      stockName,
      roe,
      roa,
      sharePrice
    });

  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
