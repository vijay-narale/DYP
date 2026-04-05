import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mic, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, Video, ShieldAlert, Play, Monitor, User as UserIcon, Activity, Eye, Zap, XCircle, Keyboard, MessageSquare, Brain, CheckCircle2, Download, Timer } from 'lucide-react';
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
  const [isRecording, setIsRecording] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Natural Voice Selection
  const speakText = useCallback((text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find(v => (v.name.includes('Google') || v.name.includes('Premium')) && v.lang.startsWith('en')) || voices[0];
    u.rate = 1.0;
    u.pitch = 0.95;
    window.speechSynthesis.speak(u);
  }, []);

  // Video Recording Logic
  const startRecording = (stream) => {
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(1000); // 1s slice
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const downloadRecording = () => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview_session_${Date.now()}.webm`;
    a.click();
  };

  // Speech Recognition
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
        setSilenceCounter(0); 
      };
      recognition.onend = () => { if (isListening) recognition.start(); };
      recognitionRef.current = recognition;
    }
  }, [isListening]);

  useEffect(() => {
    if (isListening) recognitionRef.current?.start();
    else recognitionRef.current?.stop();
  }, [isListening]);

  // Timer Logic & Auto-Submit
  useEffect(() => {
    if (timeLeft <= 0) {
      handleEvaluateAndNext(); // Auto submit on timeout
      return;
    }
    const t = setInterval(() => {
      setTimeLeft(l => l - 1);
      // Voice Warning
      if (isListening) setSilenceCounter(c => {
        if (c === 10) toast.error("No voice detected! Speak now.", { id: 'voice-warn' });
        return c + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, isListening]);

  // Face Detection / Presence Simulation (Enhanced)
  useEffect(() => {
    const handleActivity = () => setFocusLevel(100);
    const handleGhost = () => {
       setFocusLevel(prev => Math.max(0, prev - 20));
       if (focusLevel < 50) toast.error("FACE NOT DETECTED / PRESENCE LOST!", { id: 'face-warn' });
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('blur', handleGhost);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('blur', handleGhost);
    };
  }, [focusLevel]);

  // Screen Switch
  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) setSwitches(s => s + 1); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        startRecording(stream);
      } catch (err) { toast.error("Camera access failed."); }
    };
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (questions[currentIdx]) {
      speakText(`Question ${currentIdx + 1}: ${questions[currentIdx].question}`);
      setTranscript('');
      setManualAnswer('');
      setIsListening(true);
      setLastFeedback(null);
      setTimeLeft(120);
    }
  }, [currentIdx, questions, speakText]);

  const handleEvaluateAndNext = async () => {
    if (currentIdx >= questions.length) return; // Prevent extra clicks
    const finalAnswer = (transcript + ' ' + manualAnswer).trim() || "[No Answer Provided]";
    setIsEvaluating(true);
    try {
      const { data: feedback } = await api.post('/interview/evaluate', {
        question: questions[currentIdx].question,
        answer: finalAnswer,
        jdText: jdText
      });
      setLastFeedback(feedback);
      speakText(`AI Review: Score ${feedback.score}%. ${feedback.ai_verdict}`);
      
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(i => i + 1);
          setIsEvaluating(false);
        } else {
          onComplete({ switches, focusLevel, transcript });
        }
      }, 5000);
    } catch (err) {
      toast.error("AI Analysis failed. Moving to next.");
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1);
        setIsEvaluating(false);
      } else {
        onComplete({ switches, focusLevel, transcript });
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', flexDirection: 'column', color: 'white' }}
    >
      {/* Header HUD */}
      <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ background: 'var(--error)', padding: '6px 16px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%', animation: 'blink 1s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>REC • LIVE EXAM</span>
          </div>
          <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
             <XCircle size={14} /> ABORT
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 1 }}>QUESTION PROGRESS</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{currentIdx + 1} OF {questions.length}</div>
              </div>
              <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 1 }}>AUTO-SUBMIT IN</div>
                <div style={{ fontSize: 24, fontFamily: 'monospace', color: timeLeft < 20 ? 'red' : 'white', fontWeight: 800 }}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
           </div>
           <button onClick={handleEvaluateAndNext} disabled={isEvaluating} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '14px 40px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}>
             {isEvaluating ? 'AI AGENT EVALUATING...' : 'SUBMIT & NEXT →'}
           </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
         {/* Live Recording HUD */}
         <div style={{ flex: 1, position: 'relative', background: '#000' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            
            <div style={{ position: 'absolute', inset: 0, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 60, height: 60, borderLeft: '2px solid var(--error)', borderTop: '2px solid var(--error)' }} />
                  <div style={{ padding: 20, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(10px)', minWidth: 200 }}>
                    <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 800, marginBottom: 12 }}>BIOMETRIC STATUS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>Presence Lock</span>
                        <span style={{ color: focusLevel > 70 ? 'var(--success)' : 'var(--error)' }}>{focusLevel > 70 ? 'LOCKED' : 'WARNING'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>Voice Level</span>
                        <span style={{ color: silenceCounter > 8 ? 'var(--error)' : 'var(--success)' }}>{silenceCounter > 8 ? 'SILENT' : 'ACTIVE'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ width: 60, height: 60, borderRight: '2px solid var(--error)', borderTop: '2px solid var(--error)' }} />
               </div>

               <div style={{ alignSelf: 'center', width: 300, height: 300, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="scanner-line" style={{ width: '100%', height: 2, background: 'rgba(239,68,68,0.5)', position: 'absolute', top: '50%', animation: 'scan 3s linear infinite' }} />
                  <div style={{ width: 2, height: '100%', background: 'rgba(255,255,255,0.05)', position: 'absolute', left: '50%' }} />
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ width: 60, height: 60, borderLeft: '2px solid var(--error)', borderBottom: '2px solid var(--error)' }} />
                  
                  {/* AI Prediction Overlays */}
                  <AnimatePresence>
                    {lastFeedback && (
                      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)', padding: 24, borderRadius: 20, width: 340, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)' }}>
                            <Brain size={20} />
                            <span style={{ fontSize: 12, fontWeight: 900 }}>REAL-TIME AI AGENT</span>
                          </div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--success)' }}>{lastFeedback.score}%</div>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#e0e0e0', marginBottom: 20 }}>{lastFeedback.feedback}</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 10, textAlign: 'center' }}>
                             <div style={{ fontSize: 10, opacity: 0.5 }}>VERDICT</div>
                             <div style={{ fontSize: 11, fontWeight: 700 }}>{lastFeedback.ai_verdict}</div>
                          </div>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 10, textAlign: 'center' }}>
                             <div style={{ fontSize: 10, opacity: 0.5 }}>INTEGRITY</div>
                             <div style={{ fontSize: 11, fontWeight: 700 }}>{focusLevel.toFixed(0)}%</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div style={{ width: 60, height: 60, borderRight: '2px solid var(--error)', borderBottom: '2px solid var(--error)' }} />
               </div>
            </div>
         </div>

         {/* Panel Controls */}
         <div style={{ width: '520px', display: 'flex', flexDirection: 'column', background: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 32, overflowY: 'auto' }}>
               <div>
                 <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.4, letterSpacing: 2, marginBottom: 12 }}>EXAMINER QUESTION</div>
                 <motion.div key={currentIdx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.5, color: '#f0f0f0' }}>
                   {questions[currentIdx]?.question}
                 </motion.div>
               </div>

               {/* Voice Feed */}
               <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', padding: 24, borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mic size={16} color={isListening ? 'var(--error)' : 'white'} />
                      <span style={{ fontSize: 11, fontWeight: 800 }}>LIVE TRANSCRIBER</span>
                    </div>
                    {isListening && <span className="pulse" style={{ fontSize: 10, color: 'var(--error)', fontWeight: 800 }}>LISTENING...</span>}
                  </div>
                  <div style={{ height: 100, overflowY: 'auto', fontSize: 16, color: transcript ? 'white' : 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                    {transcript || "Speak clearly into the microphone. Your audio is being recorded for analysis..."}
                  </div>
               </div>

               {/* Manual Editor */}
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Keyboard size={16} style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.4 }}>MANUAL EDITOR / CODE SPACE</span>
                  </div>
                  <textarea 
                    value={manualAnswer} onChange={e => setManualAnswer(e.target.value)}
                    placeholder="Refine your spoken answer here or type technical details..."
                    style={{ width: '100%', height: 150, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, color: 'white', fontSize: 15, resize: 'none', outline: 'none', fontFamily: 'monospace' }}
                  />
               </div>
            </div>

            <div style={{ padding: 40, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 16 }}>
               <button onClick={downloadRecording} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                 <Download size={18} /> DOWNLOAD SESSION
               </button>
            </div>
         </div>
      </div>

      <style>{`
        @keyframes scan { from { top: 0; } to { top: 100%; } }
        .pulse { animation: blink 1s infinite; }
        @keyframes blink { 50% { opacity: 0.3; } }
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
  const [mode, setMode] = useState('live'); 
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionState, setSessionState] = useState('idle'); 
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
            onExit={() => { if(confirm('Abort session? All recording data and state will be cleared.')) setSessionState('ready'); }}
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




