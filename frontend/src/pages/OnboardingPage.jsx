import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, School, BookOpen, Calendar, Upload, CheckCircle, Search, Star, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile
  const [profileForm, setProfileForm] = useState({ full_name: '', college: '', branch: '', year: '' });

  // Step 2: Resume
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeId, setResumeId] = useState(null);

  // Step 3: Companies
  const [searchQuery, setSearchQuery] = useState('');
  const [jdLibrary, setJdLibrary] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({ ...prev, full_name: user.user_metadata?.full_name || '' }));
      api.get('/jd-library').then(res => setJdLibrary(res.data)).catch(() => {});
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFileUpload = async (f) => {
    if (f.type !== 'application/pdf') { toast.error('PDF only'); return; }
    setFile(f);
    setUploading(true);
    const tid = toast.loading('Uploading resume...');
    try {
      const filePath = `${user.id}/onboarding_${Date.now()}_${f.name}`;
      await supabase.storage.from('resumes').upload(filePath, f);
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);

      const formData = new FormData();
      formData.append('resume', f);
      const res = await api.post('/parse-resume', formData);

      const { data: rData, error: rError } = await supabase.from('resumes').insert({
        user_id: user.id, name: f.name, nickname: 'Primary Resume',
        pdf_url: publicUrl, parsed_json: res.data.parsed, file_hash: res.data.file_hash
      }).select().single();

      if (rError) throw rError;
      setResumeId(rData.id);
      toast.success('Resume processed!', { id: tid });
      setStep(3);
    } catch (err) {
      toast.error(err.message, { id: tid });
    } finally {
      setUploading(false);
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: profileForm.full_name,
        college: profileForm.college,
        branch: profileForm.branch,
        year: profileForm.year,
        onboarding_complete: true,
        last_active: new Date().toISOString()
      }).eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Welcome to PlaceIQ!');
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = (id) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredJDs = jdLibrary.filter(j => 
    j.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
      {/* Progress Bar */}
      <div style={{ width: '100%', maxWidth: 600, marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: step >= s ? 1 : 0.4 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step >= s ? 'var(--gradient-accent)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                {step > s ? <CheckCircle size={18} /> : s}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{s === 1 ? 'Profile' : s === 2 ? 'Resume' : 'Dream List'}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, position: 'relative' }}>
          <motion.div initial={{ width: '0%' }} animate={{ width: `${(step - 1) / 2 * 100}%` }} style={{ height: '100%', background: 'var(--gradient-accent)', borderRadius: 2 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Tell us about yourself</h2>
              <p style={{ color: 'var(--text-secondary)' }}>We'll tailor your placement experience</p>
            </div>
            <form onSubmit={handleProfileSubmit} className="card-static" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                <input className="input-field" placeholder="Full Name" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} style={{ paddingLeft: 40 }} required />
              </div>
              <div style={{ position: 'relative' }}>
                <School size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                <input className="input-field" placeholder="College / University" value={profileForm.college} onChange={e => setProfileForm({ ...profileForm, college: e.target.value })} style={{ paddingLeft: 40 }} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <BookOpen size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                  <input className="input-field" placeholder="Branch" value={profileForm.branch} onChange={e => setProfileForm({ ...profileForm, branch: e.target.value })} style={{ paddingLeft: 40 }} required />
                </div>
                <div style={{ position: 'relative', width: 120 }}>
                  <Calendar size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                  <input className="input-field" placeholder="Year" value={profileForm.year} onChange={e => setProfileForm({ ...profileForm, year: e.target.value })} style={{ paddingLeft: 40 }} required />
                </div>
              </div>
              <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '14px 0' }}>
                Continue <ArrowRight size={18} />
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ width: '100%', maxWidth: 520 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Upload your resume</h2>
              <p style={{ color: 'var(--text-secondary)' }}>AI will analyze your current skills and gaps</p>
            </div>
            <div className="card-static" style={{ padding: 48, textAlign: 'center', border: '2px dashed var(--border)', cursor: 'pointer' }}
              onClick={() => !uploading && document.getElementById('on-file').click()}>
              <input id="on-file" type="file" accept=".pdf" hidden onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                {uploading ? (
                  <div className="shimmer" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                ) : <Upload size={32} color="var(--accent)" />}
              </div>
              <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{file ? file.name : 'Choose a PDF file'}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{uploading ? 'Analyzing your profile...' : 'Click to browse or drag and drop'}</p>
            </div>
            <button className="btn-secondary" onClick={() => setStep(3)} style={{ width: '100%', marginTop: 24, border: 'none' }}>Skip for now</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ width: '100%', maxWidth: 800 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pick your dream companies</h2>
              <p style={{ color: 'var(--text-secondary)' }}>We'll notify you when your profile matches their requirements</p>
            </div>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: 13, color: 'var(--text-muted)' }} />
              <input className="input-field" placeholder="Search tech giants..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 44 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxHeight: 360, overflowY: 'auto', padding: 4, marginBottom: 32 }}>
              {filteredJDs.map(jd => (
                <motion.div key={jd.id} className="card-static" style={{ padding: 16, cursor: 'pointer', position: 'relative', borderColor: selectedCompanies.includes(jd.id) ? 'var(--accent)' : 'var(--border)' }}
                  onClick={() => toggleCompany(jd.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {selectedCompanies.includes(jd.id) && (
                    <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--accent)' }}><CheckCircle size={16} /></div>
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
                    {jd.logo_initial || jd.company[0]}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{jd.company}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{jd.role}</div>
                </motion.div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <button className="btn-secondary" onClick={() => setStep(2)}><ArrowLeft size={18} /> Back</button>
              <button className="btn-primary" onClick={finishOnboarding} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Finalizing...' : 'Get Started'} <Rocket size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
