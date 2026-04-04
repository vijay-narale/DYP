import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Target, TrendingUp, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState({ total: 0, avg: 0, best: 0 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', college: '', branch: '', year: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [pRes, rRes, aRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('analyses').select('scores_json').eq('user_id', user.id)
    ]);
    setProfile(pRes.data);
    setForm({ full_name: pRes.data?.full_name || '', college: pRes.data?.college || '', branch: pRes.data?.branch || '', year: pRes.data?.year || '' });
    setResumes(rRes.data || []);
    const scores = (aRes.data || []).map(a => a.scores_json?.overall_score || 0).filter(s => s > 0);
    setStats({
      total: scores.length,
      avg: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      best: scores.length > 0 ? Math.max(...scores) : 0
    });
  }

  const handleSave = async () => {
    await supabase.from('profiles').update(form).eq('user_id', user.id);
    setProfile({ ...profile, ...form });
    setEditing(false);
    toast.success('Profile updated');
  };

  const handleDeleteResume = async (id) => {
    await supabase.from('resumes').delete().eq('id', id);
    setResumes(r => r.filter(x => x.id !== id));
    toast.success('Resume deleted');
  };

  const initials = (form.full_name || user?.email || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div initial="initial" animate="animate" style={{ maxWidth: 800 }}>
      <motion.div variants={fadeUp}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Profile</h1>
      </motion.div>

      {/* Avatar + Info */}
      <motion.div variants={fadeUp} className="card-static" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: 'var(--gradient-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 24, color: 'white', flexShrink: 0
        }}>{initials}</div>
        {!editing ? (
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{form.full_name || 'No name set'}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</div>
            {form.college && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{form.college} • {form.branch} • {form.year}</div>}
            <button className="btn-secondary" onClick={() => setEditing(true)} style={{ marginTop: 12, padding: '6px 16px', fontSize: 12 }}>Edit Profile</button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input-field" placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            <input className="input-field" placeholder="College" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input-field" placeholder="Branch" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
              <input className="input-field" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} style={{ maxWidth: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={handleSave} style={{ padding: '8px 20px', fontSize: 13 }}>Save</button>
              <button className="btn-secondary" onClick={() => setEditing(false)} style={{ padding: '8px 20px', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: Target, label: 'Total Analyses', value: stats.total, color: '#8B5CF6' },
          { icon: TrendingUp, label: 'Average Score', value: `${stats.avg}%`, color: '#3B82F6' },
          { icon: TrendingUp, label: 'Best Score', value: `${stats.best}%`, color: '#22C55E' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card-static" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <div className="font-mono" style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </motion.div>

      {/* Resume Versions */}
      <motion.div variants={fadeUp}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Resume Versions</h3>
        {resumes.length === 0 ? (
          <div className="card-static" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>No resumes yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resumes.map(r => (
              <div key={r.id} className="card-static" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={16} color="var(--accent)" />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{r.nickname || r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <button onClick={() => handleDeleteResume(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
