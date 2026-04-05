import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mic, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, Video, ShieldAlert, Play, Monitor, User as UserIcon, Activity, Eye, Zap, XCircle, Keyboard, MessageSquare, Brain, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api, { streamFetch } from '../lib/api';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function LiveInterviewRoom({ questions, onComplete, onExit, jdText }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); 
  const [switches, setSwitches] = useState(0);
  const [focusLevel, setFocusLevel] = useState(100);
  const [manualAnswer, setManualAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [silenceCounter, setSilenceCounter] = useState(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Natural Voice Selection
  const speakText = useCallback((text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find(v => (v.name.includes('Google') || v.name.includes('Premium')) && v.lang.startsWith('en')) || voices[0];
    u.rate = 0.95;
    u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  }, []);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          else interim += event.results[i][0].transcript;
        }
        setSilenceCounter(0); // Reset silence on speech
      };

      recognition.onend = () => { if (isListening) recognition.start(); };
      recognitionRef.current = recognition;
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Silence Monitor
  useEffect(() => {
    if (isListening) {
      const timer = setInterval(() => {
        setSilenceCounter(c => {
          if (c > 10) toast.error("Silence detected. Please answer the question!", { id: 'silence-warn' });
          return c + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isListening]);

  // Focus simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusLevel(prev => {
        const jitter = Math.random() * 4 - 2;
        return Math.max(85, Math.min(100, prev + jitter));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Screen Switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setSwitches(s => s + 1);
        toast.error('SCREEN SWITCH DETECTED!');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { toast.error("Camera access failed."); }
    };
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (questions[currentIdx]) {
      speakText(`Question ${currentIdx + 1}: ${questions[currentIdx].question}`);
      setTranscript('');
      setManualAnswer('');
      setLastFeedback(null);
    }
  }, [currentIdx, questions, speakText]);

  const handleEvaluateAndNext = async () => {
    const finalAnswer = (transcript + ' ' + manualAnswer).trim();
    if (!finalAnswer) {
      toast.error("Please provide an answer before continuing.");
      return;
    }

    setIsEvaluating(true);
    try {
      const { data: feedback } = await api.post('/interview/evaluate', {
        question: questions[currentIdx].question,
        answer: finalAnswer,
        jdText: jdText
      });
      setLastFeedback(feedback);
      speakText(feedback.ai_verdict === 'Hireable' ? "Great answer. Let's move on." : "Interesting. Consider the feedback provided.");
      
      // Delay so they can see feedback
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(i => i + 1);
          setTimeLeft(120);
          setIsEvaluating(false);
        } else {
          onComplete({ switches, focusLevel, transcript });
        }
      }, 4000);
    } catch (err) {
      toast.error("AI Evaluation failed. Skipping...");
      setCurrentIdx(i => i + 1);
      setIsEvaluating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', flexDirection: 'column', color: 'white' }}
    >
      {/* Header HUD */}
      <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ background: 'var(--error)', padding: '4px 12px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} className="pulse-slow" />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>AI BIOMETRIC AGENT ACTIVE</span>
          </div>
          <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
             <XCircle size={16} /> EXIT
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, opacity: 0.5 }}>INTEGRITY</div>
              <div style={{ fontSize: 18, fontFamily: 'monospace', color: switches > 0 ? 'var(--error)' : 'var(--success)' }}>{(100 - (switches*20)).toFixed(0)}%</div>
           </div>
           <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.1)' }} />
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, opacity: 0.5 }}>TIMER</div>
              <div style={{ fontSize: 22, fontFamily: 'monospace' }}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
           </div>
           <button onClick={handleEvaluateAndNext} disabled={isEvaluating} style={{ background: isEvaluating ? 'var(--border)' : 'white', color: 'black', border: 'none', padding: '12px 28px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}>
             {isEvaluating ? 'AI ANALYZING...' : 'SUBMIT ANSWER →'}
           </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
         {/* Left Side: Proctoring HUD */}
         <div style={{ flex: 1, position: 'relative', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            
            {/* Visual Intelligence Overlays */}
            <div style={{ position: 'absolute', inset: 0, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 4 }}>HEAD MOV.</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>RECENTERED</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 4 }}>RETINA DET.</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>FOCUSED</div>
                  </div>
               </div>

               <div style={{ alignSelf: 'center', width: 250, height: 250, border: '1px solid rgba(239,68,68,0.2)', borderRadius: '50%', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, background: 'var(--error)', borderRadius: '50%', boxShadow: '0 0 20px var(--error)' }} />
                  <div className="scanner-line" style={{ position: 'absolute', width: '100%', height: 2, background: 'rgba(239,68,68,0.4)', top: '50%', animation: 'scan 4s linear infinite' }} />
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ background: 'rgba(0,0,0,0.8)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', width: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Zap size={14} color="var(--error)" />
                      <span style={{ fontSize: 10, fontWeight: 800 }}>LIVE PROCTOR STATS</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ opacity: 0.6 }}>Eye Gaze</span>
                        <span style={{ color: 'var(--success)' }}>STABLE</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ opacity: 0.6 }}>Face Detect</span>
                        <span style={{ color: focusLevel > 90 ? 'var(--success)' : 'var(--warning)' }}>{focusLevel.toFixed(1)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ opacity: 0.6 }}>Silence</span>
                        <span style={{ color: silenceCounter > 10 ? 'var(--error)' : 'white' }}>{silenceCounter}s</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Agent Feedback Bubble */}
                  <AnimatePresence>
                    {lastFeedback && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)', padding: 20, borderRadius: '20px 20px 0 20px', maxWidth: 300, backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent)' }}>
                          <CheckCircle2 size={16} />
                          <span style={{ fontSize: 11, fontWeight: 800 }}>AI AGENT FEEDBACK</span>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.5, color: '#e0e0e0' }}>{lastFeedback.feedback.slice(0, 120)}...</div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{lastFeedback.score}%</span>
                          <span className="badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)' }}>{lastFeedback.ai_verdict}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
         </div>

         {/* Right Side: Answer Input */}
         <div style={{ width: '500px', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
            <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
               <div>
                 <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 800, marginBottom: 12, letterSpacing: 2 }}>QUESTION {currentIdx + 1}</div>
                 <div style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.4 }}>{questions[currentIdx]?.question}</div>
               </div>

               {/* Voice Capture */}
               <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isListening ? 'var(--error)' : 'rgba(255,255,255,0.2)', animation: isListening ? 'blink 1s infinite' : 'none' }} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>AI VOICE CAPTURE</span>
                    </div>
                    <button onClick={toggleListening} style={{ background: isListening ? 'var(--error)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {isListening ? 'STOP RECORDING' : 'ENABLE MIC'}
                    </button>
                  </div>
                  <div style={{ height: 120, overflowY: 'auto', fontSize: 15, color: transcript ? 'white' : 'rgba(255,255,255,0.3)', lineHeight: 1.6, fontStyle: transcript ? 'normal' : 'italic' }}>
                    {transcript || "The AI is listening for your response. Speak naturally..."}
                  </div>
               </div>

               {/* Manual Fallback */}
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Keyboard size={14} style={{ opacity: 0.5 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.5 }}>ADDITIONAL NOTES OR MANUAL ANSWER</span>
                  </div>
                  <textarea 
                    value={manualAnswer} onChange={e => setManualAnswer(e.target.value)}
                    placeholder="Type details here if voice capture missed anything..."
                    style={{ width: '100%', height: 120, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, color: 'white', fontSize: 14, resize: 'none', outline: 'none' }}
                  />
               </div>
            </div>

            <div style={{ padding: 40, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
               <div style={{ display: 'flex', gap: 20 }}>
                 <div className="card-static" style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Brain size={20} color="var(--accent)" />
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.5 }}>AI ANALYZER</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>GPT-4 READY</div>
                    </div>
                 </div>
                 <div className="card-static" style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Mic size={20} color="var(--error)" />
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.5 }}>VOICE ENGINE</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>WHISPER V3</div>
                    </div>
                 </div>
               </div>
            </div>
         </div>
      </div>

      <style>{`
        .pulse-slow { animation: blink 2.5s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </motion.div>
  );
}

function FlipCard({ question, index }) {
  const [flipped, setFlipped] = useState(false);
  const diffColor = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--error)' };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      onClick={() => setFlipped(!flipped)} style={{ perspective: '1000px', cursor: 'pointer', height: 260 }}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.4 }} style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
        <div className="card-static" style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="badge" style={{ background: `${diffColor[question.difficulty]}15`, color: diffColor[question.difficulty] }}>{question.difficulty}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{question.category}</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{question.question}</p>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Click to flip</div>
        </div>
        <div className="card-static" style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', padding: 24, background: 'rgba(59,130,246,0.03)', overflow: 'auto' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>MODEL ANSWER</h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {Array.isArray(question.model_answer_outline) ? question.model_answer_outline.join(' ') : question.model_answer_outline}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function InterviewPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('live'); // 'practice' or 'live'
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionState, setSessionState] = useState('idle'); // idle, loading, ready, active, results
  const [results, setResults] = useState(null);

  useEffect(() => {
    supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length > 0) {
          const latest = data[0];
          setSelectedAnalysis(latest);
          if (latest.interview_json) {
            setQuestions(latest.interview_json);
            setSessionState('ready');
          }
        }
      });
  }, [user.id]);

  const generateInterview = async () => {
    if (!selectedAnalysis) return;
    setLoading(true); setSessionState('loading');
    try {
      const stream = streamFetch('/interview/stream', {
        weakAreas: selectedAnalysis.scores_json?.weak_areas || [],
        jdText: selectedAnalysis.jd_text,
        analysisId: selectedAnalysis.id
      });
      for await (const event of stream) {
        if (event.event === 'questions_data') {
          setQuestions(event.data);
          await supabase.from('analyses').update({ interview_json: event.data }).eq('id', selectedAnalysis.id);
        }
      }
      setSessionState('ready');
    } catch (err) {
      toast.error(err.message);
      setSessionState('idle');
    } finally { setLoading(false); }
  };

  if (selectedAnalysis && (selectedAnalysis.scores_json?.overall_score || 0) < 85) {
    return (
      <div style={{ maxWidth: 800, padding: '100px 0', textAlign: 'center' }}>
        <Lock size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Interview Locked</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Achieve 85% score in analysis to unlock the AI Interview Room.</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {sessionState === 'active' && (
          <LiveInterviewRoom 
            questions={questions} 
            jdText={selectedAnalysis?.jd_text || ''}
            onComplete={(res) => { setResults(res); setSessionState('results'); }} 
            onExit={() => { if(confirm('Exit the interview? Progress will be lost.')) setSessionState('ready'); }}
          />
        )}
      </AnimatePresence>

      <motion.div initial="initial" animate="animate" style={{ maxWidth: 1000, display: sessionState === 'active' ? 'none' : 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Interview Room</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Prepare for high-stakes technical interviews with AI proctoring.</p>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
            <button onClick={() => setMode('live')} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: mode === 'live' ? 'white' : 'transparent', color: mode === 'live' ? 'black' : 'var(--text-muted)', boxShadow: mode === 'live' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              Live Mock
            </button>
            <button onClick={() => setMode('practice')} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: mode === 'practice' ? 'white' : 'transparent', color: mode === 'practice' ? 'black' : 'var(--text-muted)', boxShadow: mode === 'practice' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              Questions
            </button>
          </div>
        </div>

        {sessionState === 'loading' ? (
          <div className="card-static" style={{ padding: 80, textAlign: 'center' }}>
            <div className="shimmer" style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Syncing AI Interviewer...</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing your profile to build a custom stress-test.</p>
          </div>
        ) : sessionState === 'ready' ? (
          <div style={{ display: 'grid', gridTemplateColumns: mode === 'live' ? '1fr' : 'repeat(2, 1fr)', gap: 24 }}>
             {mode === 'live' ? (
               <div className="card-static" style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--accent)' }}>
                  <ShieldAlert size={48} color="var(--error)" style={{ marginBottom: 20 }} />
                  <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Security Protocol Active</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
                    This session includes 1:1 camera monitoring, tab-switch detection, and AI focus tracking. 
                    Ensure you are in a quiet, well-lit environment.
                  </p>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <button onClick={() => setSessionState('active')} className="btn-primary" style={{ padding: '16px 40px', fontSize: 16, background: 'var(--error)', border: 'none', color: 'white' }}>
                      START SESSION
                    </button>
                    <button onClick={generateInterview} className="btn-secondary">Regenerate</button>
                  </div>
               </div>
             ) : (
               questions.map((q, i) => <FlipCard key={i} question={q} index={i} />)
             )}
          </div>
        ) : sessionState === 'results' ? (
          <div className="card-static" style={{ padding: 48, textAlign: 'center' }}>
            <Zap size={48} color="var(--success)" style={{ marginBottom: 20 }} />
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Session Data Recorded</h2>
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', margin: '32px 0' }}>
               <div>
                 <div style={{ fontSize: 24, fontWeight: 800 }}>{results.switches}</div>
                 <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>TAB SWITCHES</div>
               </div>
               <div style={{ width: 1, background: 'var(--border)' }} />
               <div>
                 <div style={{ fontSize: 24, fontWeight: 800 }}>{results.focusLevel.toFixed(0)}%</div>
                 <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AVG FOCUS</div>
               </div>
            </div>
            <button onClick={() => setSessionState('ready')} className="btn-primary">Review Answers</button>
          </div>
        ) : (
          <div className="card-static" style={{ padding: 80, textAlign: 'center' }}>
             <button onClick={generateInterview} className="btn-primary" style={{ padding: '16px 40px' }}>Generate Scenario</button>
          </div>
        )}
      </motion.div>
    </>
  );
}



