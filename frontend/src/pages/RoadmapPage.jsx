import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Circle, ChevronRight, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api, { streamFetch } from '../lib/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function RoadmapPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [expandedWeek, setExpandedWeek] = useState('week1');
  const [isLocked, setIsLocked] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnalyses(data || []);
        if (data?.length > 0) {
          const best = data.find(a => (a.scores_json?.overall_score || 0) >= 85) || data[0];
          setSelectedAnalysis(best);
          setIsLocked((best.scores_json?.overall_score || 0) < 85);
          if (best.roadmap_json) setRoadmap(best.roadmap_json);
        }
      });
  }, [user.id]);

  useEffect(() => {
    if (!selectedAnalysis) return;
    supabase.from('roadmap_progress').select('*').eq('user_id', user.id).eq('analysis_id', selectedAnalysis.id)
      .then(({ data }) => {
        const set = new Set((data || []).filter(d => d.completed).map(d => d.task_id));
        setCompletedTasks(set);
      });
  }, [selectedAnalysis, user.id]);

  const generateRoadmap = async () => {
    if (!selectedAnalysis?.gaps_json) { toast.error('No gap analysis found'); return; }
    setLoading(true); setStatusMessage('Preparing your learning path...');
    try {
      const stream = streamFetch('/roadmap/stream', { gapAnalysis: selectedAnalysis.gaps_json });
      for await (const event of stream) {
        if (event.event === 'roadmap_data') {
          setRoadmap(event.data);
          await supabase.from('analyses').update({ roadmap_json: event.data }).eq('id', selectedAnalysis.id);
        } else if (event.event === 'error') {
          throw new Error(event.data.error || 'Roadmap generation failed');
        }
      }
      toast.success('Your personalized roadmap is ready!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate roadmap');
    } finally { setLoading(false); setStatusMessage(''); }
  };

  const toggleTask = async (weekKey, taskId) => {
    const isCompleting = !completedTasks.has(taskId);
    const newSet = new Set(completedTasks);
    if (isCompleting) { newSet.add(taskId); confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } }); }
    else newSet.delete(taskId);
    setCompletedTasks(newSet);

    await supabase.from('roadmap_progress').upsert({
      user_id: user.id, analysis_id: selectedAnalysis.id,
      week: parseInt(weekKey.replace('week', '')), day: 1, task_id: taskId, completed: isCompleting
    }, { onConflict: 'user_id,analysis_id,week,day,task_id' });
  };

  const totalTasks = roadmap ? Object.values(roadmap).reduce((sum, w) => sum + (w.days || w.tasks || []).reduce((s, d) => s + (d.tasks || [d]).length, 0), 0) : 0;
  const completedCount = completedTasks.size;
  const progressPct = totalTasks > 0 ? (completedCount / totalTasks * 100) : 0;

  const score = selectedAnalysis?.scores_json?.overall_score || 0;

  if (isLocked) {
    return (
      <motion.div initial="initial" animate="animate" style={{ maxWidth: 800, textAlign: 'center', padding: '80px 0' }}>
        <motion.div variants={fadeUp}>
          <Lock size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Roadmap Locked</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Score 85% or higher on a JD analysis to unlock your personalized learning roadmap.</p>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', maxWidth: 300, margin: '0 auto', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 4, background: 'var(--error)', width: `${(score / 85) * 100}%`, transition: 'width 1s' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }} className="font-mono">{score}% / 85%</span>
          <div className="locked-content" style={{ marginTop: 40, maxWidth: 600, margin: '40px auto' }}>
            <div className="card-static" style={{ padding: 24, height: 200 }} />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" style={{ maxWidth: 900 }}>
      <motion.div variants={fadeUp}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Learning Roadmap</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>Your personalized 4-week plan to bridge skill gaps.</p>
      </motion.div>

      {!roadmap ? (
        <motion.div variants={fadeUp} className="card-static" style={{ padding: 40, textAlign: 'center' }}>
          <Trophy size={40} color="var(--accent)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Generate Your Roadmap</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>AI will create a personalized 4-week plan based on your gap analysis.</p>
          <button className="btn-primary" onClick={generateRoadmap} disabled={loading}>
            {loading ? statusMessage || 'Generating...' : 'Generate Roadmap'}
          </button>
        </motion.div>
      ) : (
        <>
          {/* Progress */}
          <motion.div variants={fadeUp} className="card-static" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Overall Progress</span>
              <span className="font-mono" style={{ fontSize: 14, color: 'var(--accent)' }}>{completedCount}/{totalTasks}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--border)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 4, background: 'var(--gradient-accent)' }} />
            </div>
          </motion.div>

          {/* Week Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['week1','week2','week3','week4'].map((wk, wi) => {
              const week = roadmap[wk];
              if (!week) return null;
              const isExpanded = expandedWeek === wk;
              const tasks = week.days ? week.days.flatMap(d => d.tasks || []) : week.tasks || [];
              return (
                <motion.div key={wk} variants={fadeUp} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.15 }}
                  className="card-static" style={{ overflow: 'hidden' }}>
                  <div onClick={() => setExpandedWeek(isExpanded ? null : wk)}
                    style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Week {wi + 1}</span>
                      <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-secondary)' }}>{week.theme || week.goal}</span>
                    </div>
                    <ChevronRight size={16} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {tasks.map((t, ti) => {
                            const tid = t.id || `${wk}-${ti}`;
                            const done = completedTasks.has(tid);
                            return (
                              <div key={tid} onClick={() => toggleTask(wk, tid)}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-base)', cursor: 'pointer', transition: 'all 0.15s' }}>
                                {done ? <CheckCircle size={18} color="var(--success)" /> : <Circle size={18} color="var(--text-muted)" />}
                                <span style={{ fontSize: 13, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>
                                  {t.title || t.task}
                                </span>
                                {t.duration_mins && <span style={{ fontSize: 11, color: 'var(--text-muted)' }} className="font-mono">{t.duration_mins}m</span>}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
