import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.get('/jd-library', async (req, res) => {
  try {
    // Select all v2 columns including domain and logo_initial
    const { data, error } = await supabase
      .from('jd_library')
      .select('id, company, role, jd_text, logo_initial, domain, created_at')
      .order('company', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('JD Library error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
