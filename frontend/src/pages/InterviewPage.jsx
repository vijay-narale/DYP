import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mic, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api, { streamFetch } from '../lib/api';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

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
  const [completed, setCompleted] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnalyses(data || []);
        if (data?.length > 0) {
          const best = data.find(a => (a.scores_json?.overall_score || 0) >= 85) || data[0];
          setSelectedAnalysis(best);
          setIsLocked((best.scores_json?.overall_score || 0) < 85);
          if (best.interview_json) setQuestions(best.interview_json);
        }
      });
  }, [user.id]);

  const startInterview = async () => {
    if (!selectedAnalysis) return;
    setLoading(true); setStatusMessage('Tailoring questions to your profile...');
    try {
      const stream = streamFetch('/interview/stream', {
        weakAreas: selectedAnalysis.scores_json?.weak_areas || selectedAnalysis.scores_json?.missing_skills || [],
        jdText: selectedAnalysis.jd_text,
        analysisId: selectedAnalysis.id
      });
      for await (const event of stream) {
        if (event.event === 'questions_data') {
          setQuestions(event.data);
          await supabase.from('analyses').update({ interview_json: event.data }).eq('id', selectedAnalysis.id);
        } else if (event.event === 'error') {
          throw new Error(event.data.error || 'Interview generation failed');
        }
      }
      toast.success('Interview questions are ready!');
    } catch (err) {
      toast.error(err.message || 'Failed to start interview');
    } finally { setLoading(false); setStatusMessage(''); }
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
    <motion.div initial="initial" animate="animate" style={{ maxWidth: 900 }}>
      <motion.div variants={fadeUp}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Mock Interview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>Practice with AI-generated questions targeting your weak areas.</p>
      </motion.div>

      {questions.length === 0 ? (
        <motion.div variants={fadeUp} className="card-static" style={{ padding: 40, textAlign: 'center' }}>
          <Mic size={40} color="var(--accent)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Start Interview Session</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>AI will generate 8 interview questions tailored to your weak areas.</p>
          <button className="btn-primary" onClick={startInterview} disabled={loading}>
            {loading ? statusMessage || 'Generating...' : 'Start Interview'}
          </button>
        </motion.div>
      ) : (
        <>
          {/* Progress */}
          <motion.div variants={fadeUp} className="card-static" style={{ padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Click cards to flip and reveal answers</span>
            <button className="btn-secondary" onClick={() => { setQuestions([]); startInterview(); }} style={{ padding: '6px 12px', fontSize: 12 }}>
              <RotateCcw size={14} /> New Session
            </button>
          </motion.div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {questions.map((q, i) => <FlipCard key={i} question={q} index={i} total={questions.length} />)}
          </div>
        </>
      )}
    </motion.div>
  );
}
