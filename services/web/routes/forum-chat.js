const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy POST /api/forum-chat to auth service
router.post('/', async (req, res) => {
  try {
    const { message, username, userId } = req.body;
    // Forward to auth service
    const response = await axios.post(
      process.env.AUTH_SERVICE_URL + '/forum-chat',
      { message, username, userId },
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error', details: error.message });
    }
  }
});

// Proxy GET /api/forum-chat to auth service
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    console.log(`[Forum Chat] Fetching messages with limit ${limit}...`);
    const response = await axios.get(
      process.env.AUTH_SERVICE_URL + '/forum-chat',
      { params: { limit } }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error', details: error.message });
    }
  }
});

module.exports = router;
