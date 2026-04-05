import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Shield, Info, Star, CheckCircle, Video, Mic, MicOff, VideoOff, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LiveInterviewSession() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [marks, setMarks] = useState({ communication: 0, technical: 0, confidence: 0 });
  const [feedback, setFeedback] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchInterview();
    
    const channel = supabase.channel(`interview_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_interviews', filter: `id=eq.${id}` }, (payload) => {
        setInterview(payload.new);
        if (payload.new.status === 'completed') {
          toast.success('Interview session ended');
          navigate(profile.role === 'admin' ? '/admin' : '/dashboard');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchInterview = async () => {
    const { data, error } = await supabase.from('live_interviews')
      .select('*, profiles(full_name, college, branch, year)')
      .eq('id', id)
      .single();
    if (!error) {
      setInterview(data);
      setMessages(data.user_answers || []);
      if (data.admin_marks) {
        setMarks(data.admin_marks.scores || { communication: 0, technical: 0, confidence: 0 });
        setFeedback(data.admin_marks.feedback || '');
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      sender: profile.role,
      text: newMessage,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, msg];
    
    const { error } = await supabase.from('live_interviews')
      .update({ user_answers: updatedMessages })
      .eq('id', id);

    if (!error) {
      setMessages(updatedMessages);
      setNewMessage('');
    }
  };

  const handleUpdateMarks = async () => {
    const { error } = await supabase.from('live_interviews')
      .update({ 
        admin_marks: { scores: marks, feedback } 
      })
      .eq('id', id);
    if (!error) toast.success('Marks updated');
  };

  const endInterview = async () => {
    if (!confirm('End this interview session?')) return;
    const { error } = await supabase.from('live_interviews')
      .update({ status: 'completed' })
      .eq('id', id);
    if (!error) navigate(profile.role === 'admin' ? '/admin' : '/dashboard');
  };

  if (!interview) return <div className="p-20 text-center">Loading Session...</div>;

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-gray-50 flex flex-col md:flex-row">
      {/* Session Header / Info (Sticky or Sidebar) */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            {interview.profiles?.full_name[0]}
          </div>
          <div>
            <h3 className="font-bold">{interview.profiles?.full_name}</h3>
            <p className="text-xs text-gray-500">{interview.profiles?.college}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Interview For</h5>
            <p className="font-semibold text-sm">Fullstack Developer</p>
            <p className="text-xs text-gray-400">Mock Session</p>
          </div>

          {isAdmin && (
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Real-time Marking</h5>
              {['communication', 'technical', 'confidence'].map(skill => (
                <div key={skill} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize">{skill}</span>
                    <span>{marks[skill]}/10</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" 
                    value={marks[skill]} 
                    onChange={e => setMarks({...marks, [skill]: parseInt(e.target.value)})}
                    className="w-full accent-indigo-600"
                  />
                </div>
              ))}
              <textarea 
                className="input-field w-full text-sm min-h-[100px]" 
                placeholder="Overall feedback..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
              <button onClick={handleUpdateMarks} className="w-full btn-primary py-2 text-sm shadow-sm">Save Feedback</button>
            </div>
          )}

          {!isAdmin && interview.status === 'completed' && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h5 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Admin Feedback</h5>
              <p className="text-sm italic">"{interview.admin_marks?.feedback || 'Pending feedback...'}"</p>
            </div>
          )}
        </div>

        <button onClick={endInterview} className="mt-auto flex items-center justify-center gap-2 text-red-500 font-semibold hover:bg-red-50 p-3 rounded-xl transition-colors">
          <LogOut size={18} /> End Interview
        </button>
      </div>

      {/* Main Content (Video + Chat) */}
      <div className="flex-1 flex flex-col">
        {/* Video Placeholder Area */}
        <div className="flex-1 bg-gray-900 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 aspect-video flex items-center justify-center">
             {isVideoOn ? <div className="text-gray-500 italic">User Video Feed</div> : <div className="text-gray-600"><VideoOff size={48} /></div>}
             <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs border border-white/10">
               <User size={14} /> {interview.profiles?.full_name}
             </div>
          </div>
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 aspect-video flex items-center justify-center">
             <div className="text-gray-500 italic">Admin Video Feed</div>
             <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs border border-white/10">
               <Shield size={14} /> {isAdmin ? 'You (Admin)' : 'Interviewer'}
             </div>
          </div>
        </div>

        {/* Video Controls and Chat Footer */}
        <div className="bg-white border-t border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-4 rounded-full transition-all ${!isVideoOn ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {!isVideoOn ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          </div>

          <form onSubmit={sendMessage} className="flex-1 flex gap-2 w-full">
            <input 
              className="input-field flex-1" 
              placeholder="Type a message or answer..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <button type="submit" className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
              <Send size={22} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
