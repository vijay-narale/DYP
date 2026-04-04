import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, CheckCircle, X, File, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function UploadPage() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [nickname, setNickname] = useState('');

  const fetchResumes = useCallback(async () => {
    const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setResumes(data || []);
  }, [user.id]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleUpload = async () => {
    if (!text.trim()) return;
    setLoading(true); setProgress(20);
    const tid = toast.loading('Parsing resume with AI...');
    try {
      // Parse via backend
      const res = await api.post('/parse-text', { text });
      setProgress(80);

      const parsedJSON = res.data.parsed;
      setParsed(parsedJSON);

      // Save to DB
      const { error: insertError } = await supabase.from('resumes').insert({
        user_id: user.id, name: nickname || 'Pasted Resume', nickname: nickname || 'Pasted Resume',
        pdf_url: null, parsed_json: parsedJSON, file_hash: res.data.file_hash
      });
      if (insertError) throw insertError;

      setProgress(100);
      toast.success(res.data.cached ? '⚡ Loaded from cache!' : '✅ Resume parsed!', { id: tid });
      fetchResumes();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message, { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('resumes').delete().eq('id', id);
    toast.success('Deleted');
    setResumes(r => r.filter(x => x.id !== id));
  };

  return (
    <motion.div initial="initial" animate="animate" style={{ maxWidth: 800 }}>
      <motion.div variants={fadeUp}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Upload Resume</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28 }}>Upload your PDF resume and let AI extract your skills, experience, and projects.</p>
      </motion.div>

      {/* Paste Zone */}
      <motion.div variants={fadeUp} className="card-static" style={{ padding: 24, marginBottom: 24 }}>
        <textarea
          className="input-field"
          placeholder="Paste your resume text here..."
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ width: '100%', minHeight: 200, resize: 'vertical', marginBottom: 16, fontFamily: 'inherit' }}
        />
        
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="40" height="40" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" strokeWidth="6"
                strokeDasharray={283} strokeDashoffset={283 - (283 * progress / 100)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
          </div>
        )}

        {!loading && !parsed && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <input className="input-field" placeholder="Resume nickname (optional)" value={nickname} onChange={e => setNickname(e.target.value)} style={{ width: 220 }} />
            <button className="btn-primary" onClick={handleUpload} disabled={!text.trim()}>Analyze & Save</button>
          </div>
        )}
        
        {!loading && parsed && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="draw-check">
                <path d="M5 13l4 4L19 7" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <button className="btn-primary" onClick={() => { setText(''); setParsed(null); }}>Parse Another</button>
          </div>
        )}
      </motion.div>

      {/* Parsed Preview */}
      <AnimatePresence>
        {parsed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card-static" style={{ padding: 24, marginBottom: 28, borderLeft: '3px solid var(--success)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="var(--success)" /> Parsed Resume
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {(parsed.skills || []).map(s => <span key={s} className="badge badge-accent">{s}</span>)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {parsed.experience?.length || 0} experiences • {parsed.projects?.length || 0} projects • {parsed.certifications?.length || 0} certifications
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Resumes */}
      <motion.div variants={fadeUp}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Resumes</h3>
        {resumes.length === 0 ? (
          <div className="card-static" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No resumes yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resumes.map(r => (
              <motion.div key={r.id} layout className="card-static" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{r.nickname || r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="badge badge-success"><CheckCircle size={12} /> Parsed</span>
                  {r.pdf_url && (
                    <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Eye size={16} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--error)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
