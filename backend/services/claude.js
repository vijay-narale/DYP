import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'mixtral-8x7b-32768'
];

const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'mistralai/mistral-7b-instruct:free'
];

function cleanJSON(text) {
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

export async function callLLM(prompt, maxTokens = 4096) {
  let lastError = null;
  
  // 1. Try Groq Primary Models First
  for (const model of GROQ_MODELS) {
    try {
      console.log(`  🚀 Calling LLM (Groq): ${model}...`);
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] })
      });
      const data = await res.json();
      if (res.ok && data.choices?.[0]) {
        console.log(`  ✅ LLM OK: ${model}`);
        return data.choices[0].message.content;
      }
      lastError = data.error?.message || data.error || `${res.status}`;
      console.log(`  ⚠️ ${model}: ${lastError}`);
    } catch (err) {
      lastError = err.message;
      console.log(`  ❌ ${model} Connection Error: ${err.message}`);
    }
  }

  // 2. Fallback to OpenRouter Free Models
  for (const model of FREE_MODELS) {
    try {
      console.log(`  🚀 Calling LLM (OpenRouter): ${model}...`);
      const res = await fetch(OPENROUTER_API_URL, {
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
      lastError = data.error?.message || data.error || `${res.status}`;
      console.log(`  ⚠️ ${model}: ${lastError}`);
    } catch (err) {
      lastError = err.message;
      console.log(`  ❌ ${model} Connection Error: ${err.message}`);
    }
  }
  
  throw new Error(`All models failed. Last error: ${lastError}`);
}

export async function callLLMParallel(prompts) {
  return Promise.all(prompts.map(p => callLLM(p.prompt, p.maxTokens || 4096)));
}

function extractJSON(text, type = 'object') {
  const cleaned = cleanJSON(text);
  const regex = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = cleaned.match(regex);
  if (!match) {
    console.error('Failed to find JSON in:', text);
    throw new Error('No JSON found in LLM response');
  }
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('JSON Parse Error:', e, 'Content:', match[0]);
    throw new Error('Invalid JSON structure from LLM');
  }
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

export async function evaluateInterviewAnswer(question, answer, jdText, modelAnswer) {
  const prompt = `You are a technical interviewer. Evaluate this candidate's answer against the expected key points. 
  Return ONLY valid JSON (no markdown):
  {"score":<0-100>,"feedback":"","is_correct":<boolean>,"strong_points":[],"missed_points":[],"model_answer_snippet":"","improvement_tips":[],"ai_verdict":"Hireable|Borderline|Needs_Improvement"}

  Question: ${question}
  User Answer: ${answer}
  Expected Key Points: ${JSON.stringify(modelAnswer)}
  Context: ${jdText}`;
  return extractJSON(await callLLM(prompt, 1024));
}

