import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios'; 
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '17PO7BG4SUFRVG45';

// Helper: Convert ratios to percentages
function parseRatioToPercentage(ratio) {
  if (!ratio || isNaN(ratio)) {
    return 'N/A';
  }

  let value = parseFloat(ratio);
  value = value * 100;

  return `${value.toFixed(2)}%`;
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API endpoint
app.post('/api/stock-data', async (req, res) => {
  const { ticker } = req.body;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol is required' });
  }

  try {
    console.log(`Fetching data for ticker: ${ticker}`);

    // Fetch Overview Data
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const data = response.data;

    console.log('Alpha Vantage Overview:', data);

    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: 'No data found for this ticker symbol' });
    }

    const stockName = data.Name || 'Name not available';
    const roe = parseRatioToPercentage(data.ReturnOnEquityTTM);
    const roa = parseRatioToPercentage(data.ReturnOnAssetsTTM);

    // Fetch Share Price
    const sharePriceResponse = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const sharePriceData = sharePriceResponse.data['Global Quote'];
    console.log('Alpha Vantage Global Quote:', sharePriceData);

    const sharePrice = sharePriceData && sharePriceData['05. price']
      ? `$${parseFloat(sharePriceData['05. price']).toFixed(2)}`
      : 'N/A';

    res.json({
      stockName,
      roe,
      roa,
      sharePrice
    });

  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


