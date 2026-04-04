import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { analyzeMatch, recommendCompanies, generateGapAnalysis } from '../services/claude.js';

const router = Router();

// SSE streaming endpoint
router.post('/analyze/stream', verifyAuth, async (req, res) => {
  // Accept both camelCase and snake_case
  const resumeJSON = req.body.resumeJSON;
  const jdText = req.body.jdText || req.body.jd_text;

  if (!resumeJSON || !jdText) {
    console.log('❌ Missing params. Body keys:', Object.keys(req.body));
    return res.status(400).json({ error: 'resumeJSON and jdText required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    console.log(`🔍 Analyzing for user ${req.userId}...`);

    const [scores, companies] = await Promise.all([
      analyzeMatch(resumeJSON, jdText),
      recommendCompanies(resumeJSON)
    ]);

    res.write(`event: score_data\ndata: ${JSON.stringify(scores)}\n\n`);
    res.write(`event: companies_data\ndata: ${JSON.stringify(companies)}\n\n`);

    if (scores.missing_skills?.length > 0) {
      const gaps = await generateGapAnalysis(scores.missing_skills, scores.weak_areas || [], jdText);
      res.write(`event: gaps_data\ndata: ${JSON.stringify(gaps)}\n\n`);
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    console.error('Analyze stream error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Non-streaming fallback
router.post('/analyze', verifyAuth, async (req, res) => {
  const resumeJSON = req.body.resumeJSON;
  const jdText = req.body.jdText || req.body.jd_text;
  if (!resumeJSON || !jdText) return res.status(400).json({ error: 'resumeJSON and jdText required' });
  try {
    const [scores, companies] = await Promise.all([
      analyzeMatch(resumeJSON, jdText),
      recommendCompanies(resumeJSON)
    ]);
    let gaps = [];
    if (scores.missing_skills?.length > 0) {
      gaps = await generateGapAnalysis(scores.missing_skills, scores.weak_areas || [], jdText);
    }
    res.json({ scores, companies, gaps });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
