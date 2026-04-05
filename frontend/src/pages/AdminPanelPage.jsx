import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Plus, Trash2, Edit3, UserCheck, MessageSquare, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminPanelPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('jds');
  const [jds, setJds] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingJd, setIsAddingJd] = useState(false);
  const [newJd, setNewJd] = useState({ company: '', role: '', domain: 'fullstack', jd_text: '' });

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    fetchJDs();
    fetchLiveInterviews();
    
    // Subscribe to live interviews
    const channel = supabase.channel('live_interviews_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_interviews' }, () => {
        fetchLiveInterviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchJDs = async () => {
    const { data, error } = await supabase.from('jd_library').select('*').order('created_at', { ascending: false });
    if (!error) setJds(data);
    setLoading(false);
  };

  const fetchLiveInterviews = async () => {
    const { data, error } = await supabase.from('live_interviews')
      .select('*, profiles(full_name, college, branch, year)')
      .neq('status', 'completed')
      .order('created_at', { ascending: false });
    if (!error) setInterviews(data);
  };

  const handleAddJd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('jd_library').insert([newJd]);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('JD added successfully!');
      setIsAddingJd(false);
      setNewJd({ company: '', role: '', domain: 'fullstack', jd_text: '' });
      fetchJDs();
    }
  };

  const handleDeleteJd = async (id) => {
    if (!confirm('Are you sure you want to delete this JD?')) return;
    const { error } = await supabase.from('jd_library').delete().eq('id', id);
    if (!error) {
      toast.success('JD deleted');
      fetchJDs();
    }
  };

  const updateInterviewStatus = async (id, status) => {
    const { error } = await supabase.from('live_interviews')
      .update({ status, admin_id: profile.user_id })
      .eq('id', id);
    if (!error) {
      toast.success(`Interview status updated to ${status}`);
      fetchLiveInterviews();
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-500">Manage JD library and conduct live interviews</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('jds')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'jds' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
          >
            JD Library
          </button>
          <button 
            onClick={() => setActiveTab('interviews')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'interviews' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
          >
            Live Interviews {interviews.length > 0 && <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{interviews.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'jds' ? (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="text-blue-500" />
              JD Library ({jds.length})
            </h2>
            <button 
              onClick={() => setIsAddingJd(!isAddingJd)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add New JD
            </button>
          </div>

          {isAddingJd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-static p-6 border-blue-200 border">
              <form onSubmit={handleAddJd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input className="input-field w-full" value={newJd.company} onChange={e => setNewJd({...newJd, company: e.target.value})} required placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <input className="input-field w-full" value={newJd.role} onChange={e => setNewJd({...newJd, role: e.target.value})} required placeholder="e.g. SDE 1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Domain</label>
                    <select className="input-field w-full" value={newJd.domain} onChange={e => setNewJd({...newJd, domain: e.target.value})}>
                      <option value="fullstack">Fullstack</option>
                      <option value="backend">Backend</option>
                      <option value="frontend">Frontend</option>
                      <option value="data">Data Science</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">JD Text</label>
                  <textarea className="input-field w-full min-h-[150px]" value={newJd.jd_text} onChange={e => setNewJd({...newJd, jd_text: e.target.value})} required placeholder="Paste the job description here..." />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="btn-primary">Save JD</button>
                  <button type="button" onClick={() => setIsAddingJd(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jds.map(jd => (
              <div key={jd.id} className="card-static p-6 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {jd.company[0]}
                  </div>
                  <button onClick={() => handleDeleteJd(jd.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="font-bold text-lg">{jd.company}</h3>
                <p className="text-blue-600 font-medium text-sm mb-2">{jd.role}</p>
                <div className="text-xs px-2 py-1 bg-gray-100 rounded-full w-fit mb-4">{jd.domain}</div>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{jd.jd_text}</p>
                <button className="text-blue-600 text-sm font-semibold flex items-center gap-1">
                  <Edit3 size={16} /> Edit JD
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserCheck className="text-green-500" />
            Live Interview Requests
          </h2>

          <div className="space-y-4">
            {interviews.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-500">No active interview requests at the moment.</p>
              </div>
            ) : (
              interviews.map(interview => (
                <div key={interview.id} className="card-static p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {interview.profiles?.full_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{interview.profiles?.full_name}</h4>
                      <p className="text-sm text-gray-500">{interview.profiles?.college} • {interview.profiles?.branch}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${interview.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                          {interview.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">• Requested {new Date(interview.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {interview.status === 'pending' ? (
                      <button 
                        onClick={() => updateInterviewStatus(interview.id, 'active')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-green-200 transition-all"
                      >
                        Accept & Start
                      </button>
                    ) : (
                      <button 
                        onClick={() => window.location.href = `/interview/live/${interview.id}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                      >
                        <MessageSquare size={18} /> Join Session
                      </button>
                    )}
                    <button 
                      onClick={() => updateInterviewStatus(interview.id, 'completed')}
                      className="px-6 py-2 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                      End Session
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
