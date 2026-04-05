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
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
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

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const handleFile = (f) => { if (f.type !== 'application/pdf') { toast.error('PDF only'); return; } setFile(f); setParsed(null); };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setProgress(10);
    const tid = toast.loading('Parsing resume with AI...');
    try {
      // Upload to Supabase Storage
      setProgress(20);
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
      if (uploadError) throw uploadError;

      // Since the bucket is private, generate a long-lived signed URL (e.g., 10 years) to store
      const { data: signedData, error: signedError } = await supabase.storage.from('resumes').createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);
      if (signedError) throw signedError;
      
      const secureUrl = signedData.signedUrl;
      setProgress(40);

      // Parse via backend
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/parse-resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProgress(80);

      const parsedJSON = res.data.parsed;
      setParsed(parsedJSON);

      // Save to DB
      const { error: insertError } = await supabase.from('resumes').insert({
        user_id: user.id, name: file.name, nickname: nickname || file.name.replace('.pdf', ''),
        pdf_url: secureUrl, parsed_json: parsedJSON, file_hash: res.data.file_hash
      });
      if (insertError) throw insertError;

      setProgress(100);
      toast.success(res.data.cached ? '⚡ Loaded from cache!' : '✅ Resume parsed!', { id: tid });
      fetchResumes();
    } catch (err) {
      console.error(err);
      let errMsg = err.message;
      if (err.response?.data?.error) {
        errMsg = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : err.response.data.error.message || JSON.stringify(err.response.data.error);
      }
      toast.error(errMsg, { id: tid });
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

      {/* Drop Zone */}
      <motion.div variants={fadeUp}
        className={`card-static ${dragActive ? 'drop-zone-active' : ''}`}
        onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
        style={{ padding: 48, textAlign: 'center', border: '2px dashed', borderColor: dragActive ? 'var(--accent)' : 'var(--border-light)', borderRadius: 16, cursor: 'pointer', transition: 'all 0.3s', marginBottom: 24 }}
        onClick={() => !file && document.getElementById('file-input').click()}
      >
        <input id="file-input" type="file" accept=".pdf" hidden onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

        {!file ? (
          <>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Upload size={24} color="var(--accent)" />
            </div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}><span style={{ color: 'var(--accent)' }}>Click to upload</span> or drag and drop</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF format only (max 10MB)</p>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Progress ring */}
            {loading && (
              <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" strokeWidth="6"
                  strokeDasharray={283} strokeDashoffset={283 - (283 * progress / 100)}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
            )}
            {!loading && parsed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="draw-check">
                  <path d="M5 13l4 4L19 7" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <File size={20} color="var(--accent)" />
              <span style={{ fontWeight: 500 }}>{file.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({(file.size / 1024).toFixed(0)} KB)</span>
              {!loading && <button onClick={(e) => { e.stopPropagation(); setFile(null); setParsed(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>}
            </div>
            {!loading && !parsed && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input className="input-field" placeholder="Resume nickname (optional)" value={nickname} onChange={e => setNickname(e.target.value)} style={{ width: 220 }} onClick={e => e.stopPropagation()} />
                <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleUpload(); }}>Analyze & Save</button>
              </div>
            )}
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
              {(Array.isArray(parsed.skills) ? parsed.skills : (typeof parsed.skills === 'string' ? parsed.skills.split(',') : [])).map((s, i) => {
                const text = typeof s === 'string' ? s : (s && typeof s === 'object' ? (s.name || s.skill || s.title || Object.values(s)[0]) : String(s));
                return <span key={i} className="badge badge-accent">{String(text).trim()}</span>;
              })}
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
                  <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Eye size={16} />
                  </a>
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
