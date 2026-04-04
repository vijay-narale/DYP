import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromPDF, computeFileHash } from '../services/pdfParser.js';
import { parseResume } from '../services/claude.js';
import { verifyAuth } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.post('/parse-resume', verifyAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });

    const fileHash = computeFileHash(req.file.buffer);
    console.log(`📄 Resume upload for user ${req.userId}, hash: ${fileHash.slice(0, 12)}...`);

    // Check cache — skip re-parse if same file was already processed
    const { data: cached } = await supabase
      .from('resumes')
      .select('parsed_json')
      .eq('user_id', req.userId)
      .eq('file_hash', fileHash)
      .not('parsed_json', 'is', null)
      .limit(1)
      .single();

    if (cached?.parsed_json) {
      console.log(`⚡ Cache hit! Returning cached parse for hash ${fileHash.slice(0, 12)}`);
      return res.json({ raw_text: '', parsed: cached.parsed_json, file_name: req.file.originalname, cached: true });
    }

    // Extract text
    const rawText = await extractTextFromPDF(req.file.buffer);
    if (!rawText || rawText.trim().length < 30) {
      return res.status(400).json({ error: 'PDF appears to be empty or unreadable' });
    }

    // AI parse
    const parsedData = await parseResume(rawText);
    console.log(`✅ Resume parsed for ${req.userId}`);

    res.json({ raw_text: rawText, parsed: parsedData, file_name: req.file.originalname, file_hash: fileHash, cached: false });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse resume' });
  }
});

export default router;
