const express = require('express');
const { asyncHandler } = require('../lib/errors');
const { chatLimiter } = require('../middleware/rateLimit');
const aiService = require('../services/ai.service');

const router = express.Router();

router.post('/chat', chatLimiter, asyncHandler(async (req, res) => {
  const result = await aiService.askHealth(req.body.message);
  res.json({
    reply: result.reply,
    offline: Boolean(result.offline),
    provider: result.provider || null,
  });
}));

module.exports = router;
