import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Search, Zap, Lock, ChevronDown, ChevronUp, Star, ExternalLink, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api, { streamFetch } from '../lib/api';
import toast from 'react-hot-toast';
import StreamingText from '../components/ui/StreamingText';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function AnimatedScore({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1500, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(step);
    };
    if (value > 0) requestAnimationFrame(step);
  }, [value]);
  return <span className="font-mono">{count}</span>;
}

function ScoreRing({ score, size = 140 }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * score / 100);
  const color = score >= 85 ? 'var(--success)' : score >= 65 ? 'var(--warning)' : 'var(--error)';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="score-ring" style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
    </svg>
  );
}

function getLevel(score) {
  if (score >= 80) return { label: 'Advanced', className: 'level-advanced' };
  if (score >= 60) return { label: 'Intermediate', className: 'level-intermediate' };
  return { label: 'Beginner', className: 'level-beginner' };
}
const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#8b5cf6'];

export default function AnalyzePage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [jdMode, setJdMode] = useState('library');
  const [jdText, setJdText] = useState('');
  const [jdLibrary, setJdLibrary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJD, setSelectedJD] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [expandedGap, setExpandedGap] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setResumes(data || []);
      if (data?.length > 0) setSelectedResume(data[0]);
    });
    api.get('/jd-library').then(res => setJdLibrary(res.data)).catch(() => {});
  }, [user.id]);

  const filteredJDs = useMemo(() =>
    jdLibrary.filter(j => j.company.toLowerCase().includes(searchQuery.toLowerCase()) || j.role.toLowerCase().includes(searchQuery.toLowerCase())),
    [jdLibrary, searchQuery]);

  const handleAnalyze = async () => {
    if (!selectedResume?.parsed_json) { toast.error('Select a resume first'); return; }
    const jd = jdMode === 'library' ? selectedJD?.jd_text : jdText;
    if (!jd) { toast.error('Provide a JD'); return; }

    setLoading(true); setScores(null); setCompanies(null); setGaps([]); setStatusMessage('Connecting to AI analyzer...');

    // Use local variables to capture streamed data (React state is async)
    let localScores = null;
    let localCompanies = null;
    let localGaps = [];

    try {
      const stream = streamFetch('/analyze/stream', {
        resumeJSON: selectedResume.parsed_json,
        jdText: jd
      });

      for await (const event of stream) {
        if (event.event === 'score_data') {
          localScores = event.data;
          setScores(event.data);
          setStatusMessage('Scores calculated! Loading companies...');
        } else if (event.event === 'companies_data') {
          localCompanies = event.data;
          setCompanies(event.data);
          setStatusMessage('Companies found! Analyzing gaps...');
        } else if (event.event === 'gaps_data') {
          localGaps = event.data;
          setGaps(event.data);
          setStatusMessage('Gap analysis complete!');
        } else if (event.event === 'error') {
          throw new Error(event.data.error || 'Streaming error');
        }
      }

      // Save to DB using local variables (not React state which may be stale)
      if (localScores) {
        await supabase.from('analyses').insert({
          user_id: user.id, resume_id: selectedResume.id,
          jd_text: jd, jd_company: selectedJD?.company || 'Custom',
          scores_json: localScores, gaps_json: localGaps,
          companies_json: localCompanies
        });
      }

      toast.success('Analysis complete!');
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const radarData = scores ? Object.entries(scores.domain_scores || {}).map(([k, v]) => ({
    domain: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), score: v, full: 100
  })) : [];

  const scoreColor = scores ? (scores.overall_score >= 85 ? 'var(--success)' : scores.overall_score >= 65 ? 'var(--warning)' : 'var(--error)') : 'var(--accent)';
  const scoreBadge = scores ? (scores.overall_score >= 85 ? { text: 'ELIGIBLE', cls: 'badge-success' } : scores.overall_score >= 65 ? { text: 'ALMOST THERE', cls: 'badge-warning' } : { text: 'NEEDS WORK', cls: 'badge-error' }) : null;

  return (
    <motion.div initial="initial" animate="animate" style={{ maxWidth: 1000 }}>
      <motion.div variants={fadeUp}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Analyze Match</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28 }}>Compare your resume against a job description with AI-powered precision.</p>
      </motion.div>

      {/* Resume Select */}
      <motion.div variants={fadeUp} className="card-static" style={{ padding: 20, marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Select Resume</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select className="input-field" value={selectedResume?.id || ''} onChange={e => setSelectedResume(resumes.find(r => r.id === e.target.value))} style={{ cursor: 'pointer', flex: 1 }}>
            {resumes.map(r => <option key={r.id} value={r.id}>{r.nickname || r.name}</option>)}
            {resumes.length === 0 && <option>No resumes — upload one first</option>}
          </select>
          {selectedResume?.pdf_url && (
            <a href={selectedResume.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '12px', borderRadius: 'var(--radius-sm)' }} title="View Resume">
              <Eye size={18} />
            </a>
          )}
        </div>
      </motion.div>

      {/* JD Input */}
      <motion.div variants={fadeUp} className="card-static" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: 'var(--bg-base)', borderRadius: 10, padding: 4 }}>
          {['Company Library', 'Paste JD'].map((tab, i) => (
            <button key={tab} onClick={() => setJdMode(i === 0 ? 'library' : 'paste')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: (i === 0 ? jdMode === 'library' : jdMode === 'paste') ? 'var(--bg-card)' : 'transparent',
                color: (i === 0 ? jdMode === 'library' : jdMode === 'paste') ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: (i === 0 ? jdMode === 'library' : jdMode === 'paste') ? 'var(--shadow-card)' : 'none'
              }}>{tab}</button>
          ))}
        </div>

        {jdMode === 'library' ? (
          <>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
              <input className="input-field" placeholder="Search companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 38 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
              {filteredJDs.map(jd => (
                <div key={jd.id} onClick={() => setSelectedJD(jd)}
                  className="card" style={{ padding: 12, cursor: 'pointer', borderColor: selectedJD?.id === jd.id ? 'var(--accent)' : 'var(--border)', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: 'white', flexShrink: 0 }}>
                      {jd.logo_initial || jd.company[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{jd.company}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{jd.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <textarea className="input-field" rows={6} placeholder="Paste the full job description here..." value={jdText} onChange={e => setJdText(e.target.value)} style={{ resize: 'vertical' }} />
        )}

        <button className="btn-primary" onClick={handleAnalyze} disabled={loading} style={{ marginTop: 16, width: '100%', justifyContent: 'center', padding: '14px 0', minHeight: 52 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="shimmer" style={{ width: 20, height: 20, borderRadius: '50%', animation: 'pulsate-glow 1.5s infinite' }} />
              <span>{statusMessage}</span>
            </div>
          ) : (
            <><Zap size={16} /> Analyze Match</>
          )}
        </button>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {scores && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
            {/* Score Hero */}
            <div className={`card-static ${scores.overall_score >= 85 ? 'glow-green glass' : ''}`} style={{ padding: 32, marginBottom: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {scores.overall_score >= 85 && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <ScoreRing score={scores.overall_score} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(0deg)' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor }}><AnimatedScore value={scores.overall_score} /></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>out of 100</div>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span className={`badge ${scoreBadge.cls}`} style={{ marginBottom: 12, display: 'inline-block' }}>
                    {scoreBadge.text}
                  </span>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, minHeight: 40 }}>
                    {scores.one_line_summary || 'Analysis complete.'}
                  </div>
                  {scores.overall_score >= 85 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }}
                      style={{ marginTop: 12, padding: '8px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                      🎉 Elite Status — Roadmap & Interview Unlocked!
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Radar & Proficiency Bars Grid (Team404 Style) */}
            {radarData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, marginBottom: 24 }}>
                {/* Radar Chart */}
                <div className="card-static" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Skill Radar</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Proficiency Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="card-static" style={{ padding: 16, borderColor: 'rgba(16,185,129,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-primary)' }}>
                        <CheckCircle size={16} color="#10b981" /> <span style={{ fontSize: 13, fontWeight: 600 }}>Strong Skills</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', lineHeight: 1 }}>{radarData.filter(d => d.score >= 70).length}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Above 70%</div>
                    </div>
                    <div className="card-static" style={{ padding: 16, borderColor: 'rgba(244,63,94,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-primary)' }}>
                        <AlertTriangle size={16} color="#f43f5e" /> <span style={{ fontSize: 13, fontWeight: 600 }}>Need Work</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#f43f5e', lineHeight: 1 }}>{radarData.filter(d => d.score < 60).length}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Below 60%</div>
                    </div>
                  </div>

                  {/* Bars Card */}
                  <div className="card-static" style={{ padding: 24, flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Skill Proficiency</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {radarData.map((s, i) => {
                        const level = getLevel(s.score);
                        return (
                          <div key={s.domain}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.domain}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className={`level-badge ${level.className}`}>{level.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.score}%</span>
                              </div>
                            </div>
                            <div className="sa-bar-track">
                              <motion.div className="sa-bar-fill" style={{ background: barColors[i % barColors.length] }} initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Companies */}
            {companies && (
              <div className="card-static" style={{ padding: 20, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Company Recommendations</h3>
                {['dream_companies', 'good_fit_companies', 'reach_companies'].map(tier => {
                  const list = companies[tier];
                  if (!list?.length) return null;
                  const label = tier.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const colors = { dream_companies: '#22C55E', good_fit_companies: '#3B82F6', reach_companies: '#F59E0B' };
                  return (
                    <div key={tier} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors[tier], marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                        {list.map((c, i) => (
                          <div key={i} className="card" style={{ padding: 12, minWidth: 180, flexShrink: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{c.role}</div>
                            <div style={{ fontSize: 12, color: colors[tier] }} className="font-mono">{c.match_percent}% match</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gaps */}
            {gaps.length > 0 && (
              <div className="card-static" style={{ padding: 20, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Gap Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {gaps.map((gap, i) => (
                    <div key={i} className="card" style={{ overflow: 'hidden' }}>
                      <div onClick={() => setExpandedGap(expandedGap === i ? null : i)}
                        style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: gap.importance_level >= 4 ? 'var(--error)' : gap.importance_level >= 3 ? 'var(--warning)' : 'var(--success)' }} />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{gap.skill}</span>
                        </div>
                        {expandedGap === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                      <AnimatePresence>
                        {expandedGap === i && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 16px 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                              <p style={{ marginBottom: 8 }}>{gap.what_it_is}</p>
                              <p style={{ marginBottom: 12, color: 'var(--accent)' }}>{gap.why_needed_for_role}</p>
                              {gap.resources?.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {gap.resources.map((r, ri) => (
                                    <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-base)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 12 }}>
                                      <ExternalLink size={12} /> {r.title} <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{r.duration_hint}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Gate Info */}
            {scores.overall_score < 85 && (
              <div className="card-static" style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--border)' }}>
                <Lock size={20} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Score 85%+ to unlock <strong>Learning Roadmap</strong> and <strong>Mock Interview</strong></p>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', maxWidth: 200, margin: '12px auto 0' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: scoreColor, width: `${(scores.overall_score / 85) * 100}%`, transition: 'width 1s' }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
