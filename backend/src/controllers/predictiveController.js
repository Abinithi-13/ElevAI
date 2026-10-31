import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { computeRuleBasedInsights, compactForAi } from '../services/predictiveService.js';
import { predictiveAnalysis } from '../services/grokService.js';

const windowFrom = (req) => Math.min(Math.max(Number(req.query.windowDays) || 180, 30), 365);

export const ruleBased = asyncHandler(async (req, res) => {
  res.json(await computeRuleBasedInsights({ windowDays: windowFrom(req) }));
});

export const aiPrediction = asyncHandler(async (req, res) => {
  const insights = await computeRuleBasedInsights({ windowDays: windowFrom(req) });
  if (insights.insufficientData || insights.items.length < 2) {
    throw new ApiError(422, 'Not enough historical records for an AI prediction. At least 5 recorded complaints in the selected window are needed.');
  }
  const result = await predictiveAnalysis(compactForAi(insights));
  res.json({
    method: 'ai-prediction',
    disclaimer: 'AI-generated prediction based only on recorded complaint and maintenance history. It is a decision-support estimate, not a guarantee, and uses no sensor data.',
    generatedAt: new Date(),
    windowDays: insights.windowDays,
    basedOn: insights.dataSummary,
    ...result,
  });
});
