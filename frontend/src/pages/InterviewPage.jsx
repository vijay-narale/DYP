import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mic, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, Video, ShieldAlert, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api, { streamFetch } from '../lib/api';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function StrictInterviewRoom({ questions, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleNext();
      return;
    }
    const t = setInterval(() => setTimeLeft(l => l - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, currentIdx]); // Need currentIdx in dep to avoid stale closures if handleNext is called

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => {
        console.error(err);
        toast.error("Camera access is required for a realistic interview!");
      });

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (questions[currentIdx]) {
      window.speechSynthesis.cancel();
      const text = `Question ${currentIdx + 1}. ${questions[currentIdx].question}. You have two minutes.`;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 0.5;
      const voices = window.speechSynthesis.getVoices();
      u.voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Male')) || voices[0];
      window.speechSynthesis.speak(u);
    }
  }, [currentIdx, questions]);

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setTimeLeft(120);
    } else {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Interview terminated. You may now review your performance.");
      window.speechSynthesis.speak(u);
      
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onComplete();
    }
  };

  const timerColor = timeLeft < 30 ? 'var(--error)' : (timeLeft < 60 ? '#f59e0b' : 'white');

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 9999, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldAlert color="var(--error)" />
          <span style={{ color: 'var(--error)', fontWeight: 700, letterSpacing: 2 }}>AI INTERVIEW ACTIVE</span>
        </div>
        <div style={{ color: timerColor, fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold' }}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', gap: 24, padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
           {/* Question display */}
           <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: 32, borderRadius: 12 }}>
              <div style={{ fontSize: 14, color: 'var(--error)', marginBottom: 12, fontWeight: 600 }}>QUESTION {currentIdx + 1} OF {questions.length}</div>
              <div style={{ fontSize: 24, color: 'white', lineHeight: 1.5 }}>
                {questions[currentIdx]?.question}
              </div>
           </div>

           {/* User Camera */}
           <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--error)', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>RECORDING</span>
              </div>
           </div>
        </div>
      </div>

      <div style={{ padding: 24, borderTop: '1px solid rgba(239,68,68,0.2)', display: 'flex', justifyContent: 'flex-end', background: '#111' }}>
        <button onClick={handleNext} style={{ background: 'var(--error)', color: 'white', border: 'none', padding: '16px 32px', fontSize: 16, fontWeight: 'bold', borderRadius: 8, cursor: 'pointer', letterSpacing: 1 }}>
          {currentIdx === questions.length - 1 ? 'FINISH INTERVIEW' : 'NEXT QUESTION'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
}

function FlipCard({ question, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const diffColor = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--error)' };

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -30 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ delay: index * 0.1 }}
      onClick={() => setFlipped(!flipped)}
      style={{ perspective: '1000px', cursor: 'pointer', minHeight: 280 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', minHeight: 280 }}
      >
        {/* Front */}
        <div className="card-static" style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="badge" style={{ background: `${diffColor[question.difficulty]}15`, color: diffColor[question.difficulty], border: `1px solid ${diffColor[question.difficulty]}30` }}>
                {question.difficulty}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{question.category}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.6 }}>{question.question}</p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
            Click to reveal answer
          </div>
        </div>

        {/* Back */}
        <div className="card-static" style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)', padding: 24, overflow: 'auto',
          borderColor: 'var(--accent)', background: 'rgba(59,130,246,0.03)'
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>💡 Model Answer</h4>
          {Array.isArray(question.model_answer_outline) ? (
            <ul style={{ paddingLeft: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {question.model_answer_outline.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{question.model_answer_outline || question.answer_outline}</p>
          )}
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--bg-base)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🎯 What's being tested</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{question.what_interviewer_tests || question.testing}</div>
          </div>
          {question.follow_up_question && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--warning)' }}>🔄 Follow-up</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{question.follow_up_question}</div>
            </div>
          )}
          {question.red_flags_to_avoid?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {question.red_flags_to_avoid.map((f, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
                  <AlertTriangle size={10} style={{ display: 'inline', marginRight: 3 }} />{f}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function InterviewPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [sessionState, setSessionState] = useState('idle'); // idle, generation, ready, active, review

  useEffect(() => {
    supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnalyses(data || []);
        if (data?.length > 0) {
          const best = data.find(a => (a.scores_json?.overall_score || 0) >= 85) || data[0];
          setSelectedAnalysis(best);
          setIsLocked((best.scores_json?.overall_score || 0) < 85);
          if (best.interview_json?.length > 0) {
            setQuestions(best.interview_json);
            setSessionState('ready');
          }
        }
      });
  }, [user.id]);

  const generateNewQuestions = async () => {
    if (!selectedAnalysis) return;
    setLoading(true); 
    setSessionState('generation');
    setStatusMessage('Tailoring new strict questions to your profile...');
    setQuestions([]);
    try {
      const stream = streamFetch('/interview/stream', {
        weakAreas: selectedAnalysis.scores_json?.weak_areas || selectedAnalysis.scores_json?.missing_skills || [],
        jdText: selectedAnalysis.jd_text,
        analysisId: selectedAnalysis.id
      });
      let fetchedQuestions = [];
      for await (const event of stream) {
        if (event.event === 'questions_data') {
          fetchedQuestions = event.data;
          setQuestions(fetchedQuestions);
          await supabase.from('analyses').update({ interview_json: event.data }).eq('id', selectedAnalysis.id);
        } else if (event.event === 'error') {
          throw new Error(event.data.error || 'Interview generation failed');
        }
      }
      toast.success('Interview rules generated. Get ready.');
      setSessionState('ready');
    } catch (err) {
      toast.error(err.message || 'Failed to start interview');
      setSessionState(questions.length > 0 ? 'ready' : 'idle');
    } finally { 
      setLoading(false); 
      setStatusMessage(''); 
    }
  };

  const score = selectedAnalysis?.scores_json?.overall_score || 0;

  if (isLocked) {
    return (
      <motion.div initial="initial" animate="animate" style={{ maxWidth: 800, textAlign: 'center', padding: '80px 0' }}>
        <motion.div variants={fadeUp}>
          <Lock size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Mock Interview Locked</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Score 85% or higher to unlock AI-powered mock interview practice.</p>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', maxWidth: 300, margin: '0 auto', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 4, background: 'var(--error)', width: `${(score / 85) * 100}%`, transition: 'width 1s' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }} className="font-mono">{score}% / 85%</span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {sessionState === 'active' && (
          <StrictInterviewRoom questions={questions} onComplete={() => setSessionState('review')} />
        )}
      </AnimatePresence>

      <motion.div initial="initial" animate="animate" style={{ maxWidth: 900, display: sessionState === 'active' ? 'none' : 'block' }}>
        <motion.div variants={fadeUp}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Mock Interview Room</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>A rigorous, timed AI interview session simulating real pressure.</p>
        </motion.div>

        {sessionState === 'idle' || sessionState === 'generation' ? (
          <motion.div variants={fadeUp} className="card-static" style={{ padding: 40, textAlign: 'center' }}>
            <Video size={40} color="var(--error)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Generate Interview Scenario</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>The AI will act as a strict interviewer. Camera access is required. Prepare yourself.</p>
            <button className="btn-primary" onClick={generateNewQuestions} disabled={loading} style={{ background: 'var(--error)', border: 'none', color: 'white' }}>
              {loading ? statusMessage || 'Initializing...' : 'Generate New Questions'}
            </button>
          </motion.div>
        ) : sessionState === 'ready' ? (
          <motion.div variants={fadeUp} className="card-static" style={{ padding: 40, textAlign: 'center' }}>
             <ShieldAlert size={48} color="var(--error)" style={{ marginBottom: 16 }} />
             <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Interview is Ready</h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px auto' }}>
               You are about to enter a rigorous interview session. Ensure your camera and microphone are working. You will have 2 minutes per question.
             </p>
             <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
               <button className="btn-primary" onClick={() => setSessionState('active')} style={{ background: 'var(--error)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Play size={18} /> ENTER INTERVIEW
               </button>
               <button className="btn-secondary" onClick={generateNewQuestions} disabled={loading}>
                 Regenerate
               </button>
             </div>
             
             <div style={{ marginTop: 24 }}>
               <button onClick={() => setSessionState('review')} style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', fontSize: 14, cursor: 'pointer' }}>
                 Or Review Last Session Answers
               </button>
             </div>
          </motion.div>
        ) : sessionState === 'review' ? (
          <motion.div variants={fadeUp}>
            {/* Progress */}
            <div className="card-static" style={{ padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, display: 'block' }}>Interview Completed - Review Mode</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click cards to reveal the model answers</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" onClick={() => setSessionState('active')} style={{ background: 'var(--error)', color: 'white', border: 'none', padding: '8px 16px', fontSize: 13 }}>
                  <RotateCcw size={14} style={{ marginRight: 6 }} /> Re-take Interview
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {questions.map((q, i) => <FlipCard key={i} question={q} index={i} total={questions.length} />)}
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    </>
  );
}

