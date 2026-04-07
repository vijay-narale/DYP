import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, GitCompareArrows, Map, Mic, TrendingUp, Users, BarChart3, ArrowRight, CheckCircle, Zap, Target, Search, FileText, X, Play } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };

export default function HomePage() {
  const [showSimulation, setShowSimulation] = useState(false);
  const [simStep, setSimStep] = useState(0);

  useEffect(() => {
    if (showSimulation) {
      setSimStep(0);
      const t1 = setTimeout(() => setSimStep(1), 1000); // UI init
      const t2 = setTimeout(() => setSimStep(2), 2500); // Uploading
      const t3 = setTimeout(() => setSimStep(3), 4500); // Scanning
      const t4 = setTimeout(() => setSimStep(4), 7000); // Done
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [showSimulation]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '60px 40px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{ maxWidth: 520 }}
        >
          <span className="tag">KNOW YOUR POTENTIAL</span>

          <h1 style={{ fontSize: 52, fontWeight: 700, marginTop: 20, lineHeight: 1.15, letterSpacing: '-1.5px' }}>
            Analyze Resume<br />
            <span style={{ color: 'var(--accent)' }}>Upgrade Yourself</span>
          </h1>

          <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 450 }}>
            Upload your resume, choose your dream role, and instantly get a personalized analysis of your strengths, missing skills, and readiness score.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
            <Link to="/analyze" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15, borderRadius: 12 }}>
              Analyze Now <ArrowRight size={18} />
            </Link>
            <button onClick={() => setShowSimulation(true)} className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={18} /> Learn More
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40, rotate: 3 }}
          animate={{ opacity: 1, x: 0, rotate: 5 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ position: 'relative' }}
        >
          <div style={{
            width: 420, height: 320, borderRadius: 20,
            background: 'var(--gradient-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(79,70,229,0.25)',
            transform: 'rotate(3deg)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Mock dashboard inside the hero card */}
            <div style={{ width: '90%', height: '85%', background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 40, borderRadius: 8, background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>92%</div>
                <div style={{ flex: 1, height: 40, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, color: '#10b981' }}>ELITE</div>
              </div>
              {[85, 72, 60, 90].map((v, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${v}%`, background: i % 2 === 0 ? '#4f46e5' : '#10b981' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section style={{
        background: 'var(--bg-elevated)',
        padding: '60px 40px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <motion.div
          variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }}
          style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
        >
          {[
            { value: '500+', label: 'Analyses Done', icon: BarChart3 },
            { value: '50+', label: 'Target Companies', icon: Users },
            { value: '85%', label: 'Avg Match Score', icon: TrendingUp },
          ].map(({ value, label, icon: Icon }) => (
            <motion.div key={label} variants={fadeUp} className="card-static" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon size={24} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="tag">FEATURES</span>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginTop: 16 }}>Everything You Need to <span style={{ color: 'var(--accent)' }}>Get Placed</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12, maxWidth: 500, margin: '12px auto 0' }}>
            AI-powered tools to analyze, learn, and practice for your dream role
          </p>
        </motion.div>

        <motion.div
          variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}
        >
          {[
            { icon: Upload, title: 'Resume Parser', desc: 'Upload your PDF resume and our AI extracts skills, experience, and education instantly.', color: '#3b82f6' },
            { icon: GitCompareArrows, title: 'JD Match Analysis', desc: 'Compare your resume against any job description and see exact skill gaps with a match score.', color: '#4f46e5' },
            { icon: Map, title: 'AI Roadmap', desc: 'Get a personalized 4-week learning roadmap to close your skill gaps.', color: '#10b981' },
            { icon: Mic, title: 'Mock Interview', desc: 'Practice with AI-generated interview questions tailored to your target role.', color: '#f59e0b' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <motion.div key={title} variants={fadeUp} className="card-static" style={{ padding: 28, display: 'flex', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ padding: '60px 40px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            maxWidth: 700, margin: '0 auto', padding: '48px 40px', borderRadius: 24,
            background: 'var(--gradient-accent)', color: 'white',
            boxShadow: '0 20px 60px rgba(79,70,229,0.3)',
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to Find Your Gaps?</h2>
          <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 28 }}>Start your free analysis today and discover exactly what you need to land your dream placement.</p>
          <Link to="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'white', color: 'var(--accent)', fontWeight: 700,
            padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontSize: 15,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        padding: '32px 40px', borderTop: '1px solid var(--border)',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
      }}>
        © 2026 PlaceIQ
      </footer>

      {/* ===== SIMULATION MODAL ===== */}
      <AnimatePresence>
        {showSimulation && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24, padding: 0, width: '90%', maxWidth: 800, overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.5)', position: 'relative' }}
            >
              <button 
                onClick={() => setShowSimulation(false)} 
                style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={18} />
              </button>

              <div style={{ background: 'var(--bg-base)', padding: '24px 32px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                 <h2 style={{ fontSize: 20, fontWeight: 700 }}>Project Interactive Simulation</h2>
                 <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>See how our proprietary AI transforms a raw resume into a personalized roadmap</p>
              </div>

              <div style={{ padding: 40, background: 'var(--bg-elevated)', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {simStep === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                    <div className="shimmer" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: 'var(--accent)' }} />
                    <h3 style={{ fontSize: 24, fontWeight: 700 }}>Initializing Simulation Engine...</h3>
                  </motion.div>
                )}
                {simStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                    <Upload size={64} color="var(--text-secondary)" style={{ margin: '0 auto 24px' }} />
                    <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Step 1: Resume Parsed</h3>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, width: 400, border: '1px dashed var(--border)' }}>
                      <FileText size={32} color="var(--accent)" style={{ marginBottom: 16 }} />
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, width: '80%', marginBottom: 10 }} />
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, width: '60%', marginBottom: 10 }} />
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, width: '40%' }} />
                    </div>
                  </motion.div>
                )}
                {simStep === 2 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                    <Search size={64} color="var(--accent)" style={{ margin: '0 auto 24px', animation: 'spin 3s linear infinite' }} />
                    <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Step 2: AI Scanning for JD Match</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Cross-referencing keywords and experience against 50,000+ data points...</p>
                    <div style={{ width: 400, background: 'var(--bg-base)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2 }} style={{ height: '100%', background: 'var(--accent)' }} />
                    </div>
                  </motion.div>
                )}
                {simStep >= 3 && (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', width: '100%', maxWidth: 500 }}>
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 32 }}>
                       <div style={{ padding: 24, background: 'rgba(16,185,129,0.1)', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)', flex: 1 }}>
                          <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 12px' }} />
                          <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>87%</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 1 }}>MATCH SCORE</div>
                       </div>
                       <div style={{ padding: 24, background: 'var(--bg-base)', borderRadius: 20, border: '1px solid var(--border)', flex: 1 }}>
                          <Map size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>4 Wk</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>ROADMAP BUILT</div>
                       </div>
                    </div>
                    {simStep === 4 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Ready for the Mock Interview?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Our real-time AI Agent has queued 5 technical questions based on your weak areas.</p>
                        <button onClick={() => setShowSimulation(false)} className="btn-primary" style={{ padding: '14px 40px', fontSize: 16 }}>Complete Simulation</button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
