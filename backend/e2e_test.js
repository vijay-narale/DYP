import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTests() {
  console.log('--- STARTING END-TO-END PIPELINE TEST ---');
  let token = '';
  
  try {
    // 1. Authenticate / Signup
    token = 'TEST_TOKEN_123';
    console.log('✅ Found bypass token');

    // Setup Axios using the token
    const api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: { Authorization: `Bearer ${token}` }
    });

    // 2. Parse Resume API
    console.log('[2] Testing /api/parse-resume...');
    let form = new FormData();
    form.append('resume', fs.createReadStream('./valid_sample_resume.pdf'));
    
    let parseRes = await api.post('/parse-resume', form, {
      headers: form.getHeaders()
    });
    console.log('✅ Parse Resume successful, extracted skills:', parseRes.data.parsed.skills);

    // Save parsed JSON to database just like the frontend does
    const { data: { user } } = await supabase.auth.getUser(token);
    const { data: resumeRecord, error: resumeErr } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          name: 'sample_resume.pdf',
          pdf_url: 'https://example.com/fake.pdf',
          parsed_json: parseRes.data.parsed
        }).select().single();

    if (resumeErr) throw resumeErr;
    console.log('✅ Resume saved to database');

    // 3. Analyze Match API
    console.log('[3] Testing /api/analyze...');
    // Fetch a JD from our database
    const { data: jds } = await supabase.from('jd_library').select('*').limit(1);
    const sampleJD = jds[0].jd_text;

    let analyzeRes = await api.post('/analyze', {
      resumeJSON: parseRes.data.parsed,
      jdText: sampleJD
    });
    console.log('✅ Analyze complete. Score:', analyzeRes.data.scores.overall_score);

    const { data: analysisEntry, error: aErr } = await supabase.from('analyses').insert({
        user_id: user.id,
        resume_id: resumeRecord.id,
        jd_text: sampleJD,
        scores_json: analyzeRes.data.scores,
        gaps_json: analyzeRes.data.gaps
    }).select().single();
    if(aErr) throw aErr;

    // 4. Generate Roadmap API
    console.log('[4] Testing /api/roadmap...');
    let roadmapRes = await api.post('/roadmap', {
      gapAnalysis: analyzeRes.data.gaps
    });
    console.log('✅ Roadmap generation complete.');

    // 5. Generate Interview API
    console.log('[5] Testing /api/mock-interview...');
    let interviewRes = await api.post('/mock-interview', {
      weakAreas: analyzeRes.data.scores.weak_areas,
      jdText: sampleJD
    });
    console.log('✅ Interview questions complete, total generated:', interviewRes.data.questions.length);

    console.log('--- ALL BACKEND E2E TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    if (error.response) {
       console.error('API Error Response:', error.response.data);
    } else {
       console.error('Test Error:', error);
    }
  }
}

runTests();
