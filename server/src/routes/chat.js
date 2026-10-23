const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/chatbot');
const { createRateLimiter } = require('../middleware/rateLimit');

const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many chat messages. Please wait a minute and try again.',
});

// POST /api/chat - Send message to chatbot
router.post('/', chatLimiter, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message must be 500 characters or fewer.' });
    }

    const response = await processMessage(message.trim());
    res.json(response);
  } catch {
    res.status(500).json({ error: 'Unable to process that message right now.' });
  }
});

module.exports = router;
