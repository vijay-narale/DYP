# 🚀 PlaceIQ: AI Career Co-Pilot

## 💡 The Core Idea
The recruitment process often leaves candidates guessing what skills they lack. They apply without knowing their true fit and often fail interviews due to lack of high-pressure practice.

**PlaceIQ** solves this by acting as a highly intelligent, personalized AI Career Consultant. The platform:
1. **Ingests & Analyzes**: Takes a candidate's resume and compares it against specific Job Descriptions (JDs).
2. **Scores & Maps**: Calculates a definitive "Match Score" highlighting exact skill gaps and builds a week-by-week learning roadmap.
3. **Simulates & Evaluates**: Throws the candidate into a high-pressure, live-proctored Mock Interview with an AI agent that speaks, transcibes voice answers, and grades performance globally.

---

## 🛠️ Technology Stack
The platform is built on a modern, high-performance web stack designed for real-time interactions:

### **Frontend Architecture**
- **Framework**: React.js bundled via Vite for lightning-fast HMR and compilation.
- **Styling & UI**: Tailwind CSS for rapid styling, coupled with **Framer Motion** for premium, fluid animations and interactive modals.
- **Web APIs**: Heavy usage of native browser capabilities:
  - `SpeechRecognition` (Web Speech API) for real-time voice-to-text.
  - `SpeechSynthesis` for the dynamic AI interviewer voice.
  - `MediaRecorder` for capturing biometric and visual data.

### **Backend & APIs**
- **Server**: Node.js & Express REST architecture.
- **File Processing**: `multer` and `pdf-parse` for robust local extraction of text from PDF resumes.
- **AI/LLM Core**: Deep integration with **Anthropic (Claude-3)** and **GPT** via APIs for context-heavy NLP tasks (resume grading, intelligent roadmap generation, and conversational interview understanding).

### **Database & Auth**
- **Supabase**: PostgreSQL database handling user states, roadmap persistence, auth schemas, and interview session logs securely.

---

## ✨ Key Features

1. **Resume Parser & AI Matcher**: Users upload their PDF. The system parses it flawlessly and the LLM cross-references it against market JDs to calculate a fit percentage.
2. **Actionable Roadmaps**: Based on the candidate's weakest parameters, the AI outputs a personalized, week-by-week learning timeline.
3. **Live Proctored Interview Room**:
   - **Real-Time Voice Agent**: An AI avatar acts as the examiner, speaking questions fluidly and reacting to the user's voice inputs.
   - **Anti-Cheat Monitoring**: Tab-switching listeners and hardware-level silence/focus tracking.
   - **Immediate Grading**: Instant feedback comparing what the user said versus the ideal model answer.
4. **Interactive Simulation Engine**: A high-fidelity animated walkthrough on the homepage that demonstrates the entire product flow (upload ➡️ scan ➡️ score ➡️ roadmap) to guests visually before they even create an account.

---

## 🚀 Future Scope
This platform has immense potential to pivot from a B2C student tool to a massive B2B recruitment engine:

1. **Computer Vision & Hardware Integration**: Replace simulated biometrics with `face-api.js` for true eye-tracking, blink-rate analysis, and micro-expression detection during interviews.
2. **Algorithmic Code Space**: Integrate a Monaco Editor (VS Code core) directly into the interview room so candidates can type algorithms while speaking to the AI agent.
3. **Automated Corporate Funnels (B2B)**: Companies can define their ideal JD parameters. PlaceIQ conducts round 1 interviews globally simultaneously and auto-forwards passing candidates straight to human HRs.
4. **Multi-Lingual Capabilities**: Localize the AI voice agent to interview candidates in global and regional languages, tearing down geographical recruitment barriers.
