import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { generateGapAnalysis } from '../services/claude.js';

const router = Router();

router.post('/gaps/stream', verifyAuth, async (req, res) => {
  // Accept both camelCase and snake_case
  const missingSkills = req.body.missingSkills || req.body.missing_skills;
  const weakAreas = req.body.weakAreas || req.body.weak_areas || [];
  const jdText = req.body.jdText || req.body.jd_text || '';

  if (!missingSkills) return res.status(400).json({ error: 'missingSkills required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const gaps = await generateGapAnalysis(missingSkills, weakAreas, jdText);
    res.write(`event: gaps_data\ndata: ${JSON.stringify(gaps)}\n\n`);
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    console.error('Gaps stream error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
