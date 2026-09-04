const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/chatbot');

// POST /api/chat - Send message to chatbot
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const response = await processMessage(message);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
