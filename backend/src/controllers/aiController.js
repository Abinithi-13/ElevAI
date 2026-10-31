import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';
import { assistantReply, isConfigured } from '../services/grokService.js';

export const aiStatus = asyncHandler(async (_req, res) => {
  res.json({ configured: isConfigured(), model: env.ai.model });
});

export const chat = asyncHandler(async (req, res) => {
  const reply = await assistantReply(req.body.messages);
  res.json({ reply, model: env.ai.model });
});
