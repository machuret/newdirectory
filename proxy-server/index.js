require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

// Configure CORS
// In a production app, you might want to restrict this to your frontend's origin
app.use(cors()); 

app.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  try {
    console.log(`Proxying request to: ${url}`);
    const response = await axios.get(url, {
      // You can pass through headers or modify them if needed
      // For example, some APIs might require an API key in the header
      headers: {
        'User-Agent': 'MyReactAdminProxy/1.0' // Good practice to set a user-agent
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request:', error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json({ 
        error: 'Error fetching data from external URL',
        details: error.response.data 
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(500).json({ error: 'No response from external URL' });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({ error: 'Internal server error during proxy request' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
  console.log(`Access it via: ${process.env.PROXY_SERVER_BASE_URL || `http://localhost:${PORT}`}`);
});
