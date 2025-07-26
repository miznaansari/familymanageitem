// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// POST endpoint to send notification
app.post('/send-notification', async (req, res) => {
  const { toUID, fromUID, message } = req.body;

  if (!toUID || !fromUID || !message) {
    return res.status(400).json({ success: false, error: 'Missing toUID, fromUID or message' });
  }

  const url = 'https://api.onesignal.com/notifications?c=push';

  const data = {
    app_id: process.env.ONESIGNAL_APP_ID,
    include_aliases: {
      external_id: [toUID] // Target by external user ID
    },
    target_channel: 'push',
    contents: {
      en: message
    },
    headings: {
      en: 'Family Request'
    },
    data: {
      from: fromUID
    },
    external_id: `${fromUID}-${toUID}`, // Optional tracking ID.
      idempotency_key: uuidv4(),
  };

  const headers = {
    Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`, // OneSignal REST API key
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('✅ Notification sent:', response.data);
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error('❌ OneSignal error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});


// GET endpoint to fetch user identity from OneSignal using subscription_id
app.get('/onesignal/user-identity/:subscription_id', async (req, res) => {
  const { subscription_id } = req.params;

  if (!subscription_id) {
    return res.status(400).json({ success: false, error: 'Missing subscription_id' });
  }

  const url = `https://onesignal.com/api/v1/apps/${process.env.ONESIGNAL_APP_ID}/subscriptions/${subscription_id}/user/identity`;

  const headers = {
    Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`, // OneSignal REST API Key
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.get(url, { headers });
    console.log('✅ User identity fetched:', response.data);
    res.json({ success: true, identity: response.data });
  } catch (error) {
    console.error('❌ Failed to fetch identity:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
