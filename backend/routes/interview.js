import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../middleware/auth.js';
import { generateInterviewQuestions } from '../services/claude.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// SSE streaming endpoint
router.post('/interview/stream', verifyAuth, async (req, res) => {
  // Accept both camelCase and snake_case
  const weakAreas = req.body.weakAreas || req.body.weak_areas;
  const jdText = req.body.jdText || req.body.jd_text || '';
  const analysisId = req.body.analysisId || req.body.analysis_id;

  if (!weakAreas) return res.status(400).json({ error: 'weakAreas required' });

  // Gate check
  if (analysisId) {
    const { data: analysis } = await supabase
      .from('analyses').select('scores_json').eq('id', analysisId).single();
    if (analysis?.scores_json?.overall_score < 85) {
      return res.status(403).json({ error: 'Score must be >= 85 for mock interview', required: 85, current: analysis.scores_json.overall_score });
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const questions = await generateInterviewQuestions(weakAreas, jdText);
    res.write(`event: questions_data\ndata: ${JSON.stringify(questions)}\n\n`);
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    console.error('Interview stream error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Non-streaming fallback
router.post('/mock-interview', verifyAuth, async (req, res) => {
  const weakAreas = req.body.weakAreas || req.body.weak_areas;
  const jdText = req.body.jdText || req.body.jd_text || '';
  if (!weakAreas) return res.status(400).json({ error: 'weakAreas required' });
  try {
    const questions = await generateInterviewQuestions(weakAreas, jdText);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import { evaluateInterviewAnswer } from '../services/claude.js';

// Evaluate a single answer
router.post('/evaluate', verifyAuth, async (req, res) => {
  const { question, answer, jdText } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });
  try {
    const feedback = await evaluateInterviewAnswer(question, answer, jdText);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
