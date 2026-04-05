import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FREE_MODELS = [
  'google/gemma-3-4b-it:free',
  'google/gemma-3-12b-it:free',
  'qwen/qwen3.6-plus:free',
  'google/gemma-3-27b-it:free'
];

function cleanJSON(text) {
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

export async function callLLM(prompt, maxTokens = 4096) {
  let lastError = null;
  for (const model of FREE_MODELS) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'PlaceIQ'
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] })
      });
      const data = await res.json();
      if (res.ok && data.choices?.[0]) {
        console.log(`  ✅ LLM OK: ${model}`);
        return data.choices[0].message.content;
      }
      lastError = data.error?.message || `${res.status}`;
      console.log(`  ⚠️ ${model}: ${lastError}`);
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error(`All models failed: ${lastError}`);
}

export async function callLLMParallel(prompts) {
  return Promise.all(prompts.map(p => callLLM(p.prompt, p.maxTokens || 4096)));
}

function extractJSON(text, type = 'object') {
  const cleaned = cleanJSON(text);
  const regex = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = cleaned.match(regex);
  if (!match) throw new Error('No JSON found in LLM response');
  return JSON.parse(match[0]);
}

export async function parseResume(rawText) {
  const prompt = `You are a resume parser. Extract and return ONLY valid JSON (no markdown, no explanation, no code fences):
{"name":"","email":"","skills":[],"projects":[{"name":"","description":"","tech_stack":[],"impact":""}],"experience":[{"company":"","role":"","duration":"","description":""}],"education":{"degree":"","institution":"","year":"","gpa":""},"certifications":[],"soft_skills":[],"years_of_experience":0}

Resume text:
${rawText}`;
  return extractJSON(await callLLM(prompt));
}

export async function analyzeMatch(resumeJSON, jdText) {
  const prompt = `You are a placement expert. Given resume and JD, return ONLY valid JSON (no markdown):
{"overall_score":<0-100>,"domain_scores":{"frontend":<0-100>,"backend":<0-100>,"devops":<0-100>,"system_design":<0-100>,"dsa":<0-100>,"soft_skills":<0-100>,"communication":<0-100>,"problem_solving":<0-100>},"matched_skills":[],"missing_skills":[],"weak_areas":[],"strong_areas":[],"verdict":"strong_match|moderate_match|weak_match","one_line_summary":""}

Resume: ${JSON.stringify(resumeJSON)}
JD: ${jdText}`;
  return extractJSON(await callLLM(prompt));
}

export async function recommendCompanies(resumeJSON) {
  const prompt = `Given this resume, recommend companies the candidate can apply to RIGHT NOW. Return ONLY valid JSON (no markdown):
{"dream_companies":[{"name":"","role":"","match_percent":0,"why":""}],"good_fit_companies":[{"name":"","role":"","match_percent":0,"why":""}],"reach_companies":[{"name":"","role":"","match_percent":0,"why":""}],"avoid_for_now":[{"name":"","reason":""}]}

Resume: ${JSON.stringify(resumeJSON)}`;
  return extractJSON(await callLLM(prompt, 2048));
}

export async function generateGapAnalysis(missingSkills, weakAreas, jdText) {
  const prompt = `For each missing skill, provide gap analysis. Return ONLY valid JSON array (no markdown):
[{"skill":"","importance_level":<1-5>,"what_it_is":"","why_needed_for_role":"","resources":[{"title":"","url":"","type":"video|article|course","duration_hint":""}],"estimated_hours_to_learn":<number>}]
Sort by importance descending. Missing: ${JSON.stringify(missingSkills)} Weak: ${JSON.stringify(weakAreas)} JD: ${jdText}`;
  return extractJSON(await callLLM(prompt), 'array');
}

export async function generateRoadmap(gapAnalysis) {
  const prompt = `Create a 4-week learning roadmap for these gaps. Return ONLY valid JSON (no markdown):
{"week1":{"theme":"","goal":"","days":[{"day_name":"Mon","tasks":[{"id":"w1d1t1","title":"","resource_url":"","type":"video|article|course|practice","duration_mins":<number>,"priority":"high|medium|low"}]}]},"week2":{...},"week3":{...},"week4":{...}}
Each week: 4-5 days, 2-3 tasks per day. Gaps: ${JSON.stringify(gapAnalysis)}`;
  return extractJSON(await callLLM(prompt));
}

export async function generateInterviewQuestions(weakAreas, jdText) {
  const prompt = `Generate 8 mock interview questions targeting weak areas. Return ONLY valid JSON array (no markdown):
[{"id":1,"question":"","difficulty":"easy|medium|hard","category":"","what_interviewer_tests":"","model_answer_outline":["point1","point2"],"follow_up_question":"","red_flags_to_avoid":["flag1"]}]
Weak: ${JSON.stringify(weakAreas)} JD: ${jdText}`;
  return extractJSON(await callLLM(prompt), 'array');
}
