import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, GitCompareArrows, Map, Mic, TrendingUp, FileText, Target, Flame, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } } };

function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const duration = 1200;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span className="font-mono">{count}{suffix}</span>;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ analyses: 0, bestScore: 0, resumes: 0 });
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    const [analysesRes, resumesRes] = await Promise.all([
      supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('resumes').select('id').eq('user_id', user.id)
    ]);
    setRecentAnalyses(analysesRes.data || []);
    const analyses = analysesRes.data || [];
    const best = analyses.reduce((max, a) => Math.max(max, a.scores_json?.overall_score || 0), 0);
    setStats({ analyses: analyses.length, bestScore: best, resumes: (resumesRes.data || []).length });
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Candidate';

  const quickActions = [
    { to: '/upload', icon: Upload, label: 'Upload Resume', desc: 'Parse your latest CV', color: '#3b82f6' },
    { to: '/analyze', icon: GitCompareArrows, label: 'Analyze JD', desc: 'Match against a role', color: '#4f46e5' },
    { to: '/roadmap', icon: Map, label: 'View Roadmap', desc: 'Step-by-step path', color: '#10b981' },
    { to: '/interview', icon: Mic, label: 'Mock Interview', desc: 'Practice with AI', color: '#f59e0b' },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">

      {/* Welcome Banner (Team404 style) */}
      <motion.div
        variants={fadeUp}
        style={{
          background: 'var(--gradient-accent)',
          borderRadius: 20,
          padding: '36px 40px',
          marginBottom: 32,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, position: 'relative' }}>
          {greeting}, {displayName} 👋
        </h1>
        <p style={{ opacity: 0.85, fontSize: 15, marginBottom: 20, position: 'relative' }}>
          Here is your placement readiness overview
        </p>
        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
          <Link to="/analyze" style={{
            background: 'white', color: 'var(--accent)', fontWeight: 600,
            padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontSize: 14,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Analyze <ArrowRight size={16} />
          </Link>
          <Link to="/upload" style={{
            background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 500,
            padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontSize: 14,
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            Upload Resume
          </Link>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { icon: FileText, label: 'Resumes', value: stats.resumes, color: '#3b82f6' },
          { icon: Target, label: 'Analyses', value: stats.analyses, color: '#4f46e5' },
          { icon: TrendingUp, label: 'Best Score', value: stats.bestScore, suffix: '%', color: '#10b981' },
          { icon: Flame, label: 'Streak', value: profile?.streak_days || 0, suffix: 'd', color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, suffix, color }) => (
          <div key={label} className="card-static" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}><AnimatedCounter value={value} suffix={suffix || ''} /></div>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {quickActions.map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <motion.div className="card" style={{ padding: '20px', cursor: 'pointer', height: '100%' }} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={22} color={color} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Analyses */}
      <motion.div variants={fadeUp}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Analyses</h3>
        {recentAnalyses.length === 0 ? (
          <div className="card-static" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No analyses yet. <Link to="/analyze" style={{ color: 'var(--accent)', fontWeight: 600 }}>Start your first one →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentAnalyses.map(a => {
              const score = a.scores_json?.overall_score || 0;
              const badgeClass = score >= 85 ? 'badge-success' : score >= 65 ? 'badge-warning' : 'badge-error';
              const isElite = score >= 85;
              return (
                <div key={a.id} className={`card-static ${isElite ? 'glow-green' : ''}`} style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.3s', borderLeft: `4px solid ${isElite ? '#10b981' : score >= 65 ? '#f59e0b' : '#ef4444'}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.jd_company || 'Custom JD'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isElite && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="badge badge-success" style={{ fontSize: 10, letterSpacing: '0.05em' }}>
                        ELITE
                      </motion.div>
                    )}
                    <span className={`badge ${badgeClass}`} style={{ minWidth: 60, textAlign: 'center' }}>
                      <span className="font-mono">{score}%</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
