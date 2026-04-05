import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Circle, ChevronRight, Trophy, Sparkles, Building2, BookOpen, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api, { streamFetch } from '../lib/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const RoadmapSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[1, 2, 3].map(i => (
      <div key={i} className="card-static" style={{ padding: 24, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="shimmer" style={{ width: 120, height: 20, borderRadius: 4 }} />
          <div className="shimmer" style={{ width: 80, height: 20, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="shimmer" style={{ width: '100%', height: 40, borderRadius: 8 }} />
          <div className="shimmer" style={{ width: '90%', height: 40, borderRadius: 8 }} />
        </div>
      </div>
    ))}
  </div>
);

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
    setLoading(true); setStatusMessage('Analyzing skill gaps...');
    setTimeout(() => setStatusMessage('Structuring 4-week learning path...'), 2000);
    setTimeout(() => setStatusMessage('Curating specific resource links...'), 5000);
    
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
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" style={{ maxWidth: 900 }}>
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Learning Roadmap</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Step-by-step path tailored to your specific JD targets.</p>
        </div>
        {roadmap && (
           <button onClick={generateRoadmap} className="btn-secondary" style={{ fontSize: 12, padding: '8px 16px' }}>
              <RotateCcw size={14} style={{ marginRight: 6 }} /> Reset Path
           </button>
        )}
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
           <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Sparkles className="pulse-slow" size={32} color="var(--accent)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{statusMessage}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>We are using AI to find the best tutorials and documents for your gap skills.</p>
           </div>
           <RoadmapSkeleton />
        </div>
      ) : !roadmap ? (
        <motion.div variants={fadeUp} className="card-static" style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Target size={32} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Bridge the Gap</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            Transform your missing skills into strengths. Generate a curated 4-week learning path now.
          </p>
          <button className="btn-primary" onClick={generateRoadmap} style={{ padding: '14px 40px', fontSize: 15 }}>
            BUILD MY ROADMAP
          </button>
        </motion.div>
      ) : (
        <>
          <motion.div variants={fadeUp} className="card-static" style={{ padding: 24, marginBottom: 32, borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Mission Progress</span>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{Math.round(progressPct)}% Completed</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{completedCount}</span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}> / {totalTasks} Tasks</span>
              </div>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, ease: 'circOut' }}
                style={{ height: '100%', background: 'var(--gradient-accent)' }} />
            </div>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['week1', 'week2', 'week3', 'week4'].map((wk, wi) => {
              const week = roadmap[wk];
              if (!week) return null;
              const isExpanded = expandedWeek === wk;
              const tasks = week.days ? week.days.flatMap(d => d.tasks || []) : week.tasks || [];
              const weekCompleted = tasks.every(t => completedTasks.has(t.id || `${wk}-${tasks.indexOf(t)}`));

              return (
                <motion.div key={wk} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: wi * 0.1 }}
                  className="card-static" style={{ overflow: 'hidden', borderLeft: isExpanded ? '3px solid var(--accent)' : '1px solid var(--border)' }}>
                  <div onClick={() => setExpandedWeek(isExpanded ? null : wk)}
                    style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(59,130,246,0.02)' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: weekCompleted ? 'var(--success)' : 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: weekCompleted ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {weekCompleted ? <CheckCircle size={20} /> : <span style={{ fontWeight: 800 }}>{wi + 1}</span>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>Week {wi + 1}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{week.theme || week.goal}</div>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'all 0.3s', color: 'var(--text-muted)' }} />
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {tasks.map((t, ti) => {
                            const tid = t.id || `${wk}-${ti}`;
                            const done = completedTasks.has(tid);
                            return (
                              <div key={tid} onClick={(e) => { e.stopPropagation(); toggleTask(wk, tid); }}
                                className="roadmap-task"
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', cursor: 'pointer', opacity: done ? 0.6 : 1 }}>
                                <div style={{ color: done ? 'var(--success)' : 'var(--text-muted)' }}>
                                  {done ? <CheckCircle size={20} /> : <Circle size={20} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, textDecoration: done ? 'line-through' : 'none' }}>{t.title || t.task}</div>
                                  {t.type && <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>{t.type}</span>}
                                </div>
                                {t.duration_mins && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>{t.duration_mins}m</span>}
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
      <style>{`
        .pulse-slow { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.95); } }
        .roadmap-task:hover { border-color: var(--accent) !important; transform: translateX(4px); }
      `}</style>
    </motion.div>
  );
}

