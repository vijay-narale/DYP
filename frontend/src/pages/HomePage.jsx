import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, GitCompareArrows, Map, Mic, TrendingUp, Users, BarChart3, ArrowRight, CheckCircle, Zap, Target } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };

export default function HomePage() {
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
            <a href="#features" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15, borderRadius: 12 }}>
              Learn More
            </a>
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
        © 2026 PlaceIQ — Built for DYP Pimpri Hackathon
      </footer>
    </div>
  );
}
