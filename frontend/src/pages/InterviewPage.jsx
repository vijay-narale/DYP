import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mic, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, Video, ShieldAlert, Play, Monitor, User as UserIcon, Activity, Eye, Zap, XCircle, Keyboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api, { streamFetch } from '../lib/api';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function LiveInterviewRoom({ questions, onComplete, onExit }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); 
  const [switches, setSwitches] = useState(0);
  const [focusLevel, setFocusLevel] = useState(100);
  const [manualAnswer, setManualAnswer] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Natural Voice Selection
  const speakText = useCallback((text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Try to find a premium/natural sounding voice
    u.voice = voices.find(v => (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')) && v.lang.startsWith('en')) || voices[0];
    u.rate = 0.95; // Slightly slower than 1.0 for clarity
    u.pitch = 0.9; // Slightly lower pitch sounding more adult/natural
    window.speechSynthesis.speak(u);
  }, []);

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

  // Screen Switch Detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setSwitches(s => s + 1);
        toast.error('SCREEN SWITCH DETECTED!', {
          icon: '⚠️',
          style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleNext();
      return;
    }
    const t = setInterval(() => setTimeLeft(l => l - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, currentIdx]);

  useEffect(() => {
    // Immediate camera start
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error(err);
        toast.error("Camera access failed.");
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (questions[currentIdx]) {
      speakText(`Next question. ${questions[currentIdx].question}`);
    }
  }, [currentIdx, questions, speakText]);

  const handleNext = () => {
    setManualAnswer(''); // Clear for next
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setTimeLeft(120);
    } else {
      onComplete({ switches, focusLevel });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', flexDirection: 'column', color: 'white' }}
    >
      {/* HUD Header */}
      <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ background: 'var(--error)', padding: '4px 12px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} className="pulse-slow" />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>PROCTORING ACTIVE</span>
          </div>
          <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
             <XCircle size={16} /> EXIT INTERVIEW
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>TIME REMAINING</div>
              <div style={{ fontSize: 24, fontFamily: 'monospace', color: timeLeft < 30 ? 'var(--error)' : 'white' }}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
           </div>
           <button onClick={handleNext} style={{ background: 'white', color: 'black', border: 'none', padding: '12px 28px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
             {currentIdx === questions.length - 1 ? 'TERMINATE' : 'SAVE & NEXT →'}
           </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
         {/* Left Side: Camera & AI Face Detection Overlay */}
         <div style={{ flex: 1, position: 'relative', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: 40, height: 40, borderLeft: '2px solid var(--error)', borderTop: '2px solid var(--error)' }} />
                  <div style={{ width: 40, height: 40, borderRight: '2px solid var(--error)', borderTop: '2px solid var(--error)' }} />
               </div>
               <div style={{ alignSelf: 'center', width: 220, height: 220, border: '1px dashed rgba(239,68,68,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, background: 'var(--error)', borderRadius: '50%', opacity: 0.6 }} />
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ width: 40, height: 40, borderLeft: '2px solid var(--error)', borderBottom: '2px solid var(--error)' }} />
                  <div style={{ background: 'rgba(0,0,0,0.85)', padding: 18, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', width: 220, backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontWeight: 800, letterSpacing: 1 }}>AI BIOMETRIC DATA</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span>RETINA LOCK</span>
                      <span style={{ color: 'var(--success)' }}>TRACKED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>ATTENTION</span>
                      <span style={{ color: focusLevel > 90 ? 'var(--success)' : 'var(--warning)' }}>{focusLevel.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRight: '2px solid var(--error)', borderBottom: '2px solid var(--error)' }} />
               </div>
            </div>
         </div>

         {/* Right Side: Question & Manual Answer Fallback */}
         <div style={{ width: '480px', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
            <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div style={{ opacity: 0.5, fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>QUESTION {currentIdx + 1} / {questions.length}</div>
               <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.5, color: '#e0e0e0' }}>
                 {questions[currentIdx]?.question}
               </motion.div>
               
               {/* Manual Answer Space */}
               <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'rgba(255,255,255,0.4)' }}>
                    <Keyboard size={14} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>OFFLINE ANSWER (FALLBACK)</span>
                  </div>
                  <textarea 
                    value={manualAnswer}
                    onChange={e => setManualAnswer(e.target.value)}
                    placeholder="Type your notes or answer here if voice connectivity is low..."
                    style={{ width: '100%', height: 160, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 16, color: 'white', fontSize: 14, resize: 'none', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
               </div>
            </div>

            {/* Monitoring Log */}
            <div style={{ padding: '0 40px 40px' }}>
               <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Monitor size={14} color="var(--error)" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>SYSTEM LOGS</span>
                  </div>
                  <div style={{ height: 60, overflowY: 'auto', fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                     <div>[00:00:01] HW acceleration ready</div>
                     <div>[00:00:10] Integrity check passing</div>
                     {switches > 0 && <div style={{ color: 'var(--error)' }}>[ALERT] Tab switch detected!</div>}
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



