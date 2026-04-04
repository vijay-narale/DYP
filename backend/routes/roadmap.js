import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../middleware/auth.js';
import { generateRoadmap } from '../services/claude.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// SSE streaming endpoint
router.post('/roadmap/stream', verifyAuth, async (req, res) => {
  // Accept both camelCase and snake_case
  const gapAnalysis = req.body.gapAnalysis || req.body.gap_analysis;
  const analysisId = req.body.analysisId || req.body.analysis_id;

  if (!gapAnalysis) return res.status(400).json({ error: 'gapAnalysis required' });

  // Gate check: score >= 85
  if (analysisId) {
    const { data: analysis } = await supabase
      .from('analyses').select('scores_json').eq('id', analysisId).single();
    if (analysis?.scores_json?.overall_score < 85) {
      return res.status(403).json({ error: 'Score must be >= 85 to access roadmap', required: 85, current: analysis.scores_json.overall_score });
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const roadmap = await generateRoadmap(gapAnalysis);
    res.write(`event: roadmap_data\ndata: ${JSON.stringify(roadmap)}\n\n`);
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    console.error('Roadmap stream error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Non-streaming fallback
router.post('/roadmap', verifyAuth, async (req, res) => {
  const gapAnalysis = req.body.gapAnalysis || req.body.gap_analysis;
  if (!gapAnalysis) return res.status(400).json({ error: 'gapAnalysis required' });
  try {
    const roadmap = await generateRoadmap(gapAnalysis);
    res.json({ roadmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
