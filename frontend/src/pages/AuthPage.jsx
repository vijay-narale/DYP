import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '', branch: '', year: '', role: 'user' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        if (form.password !== form.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        await signup(form.email, form.password, form.fullName, form.role);
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key, val) => setForm({ ...form, [key]: val });

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-base)',
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? 'login' : 'register'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="card-static"
          style={{
            width: '100%',
            maxWidth: 440,
            padding: 40,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Full Name (Register only) */}
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: 40 }}
                    placeholder="Enter your name"
                    value={form.fullName}
                    onChange={e => update('fullName', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 40 }}
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 40 }}
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Confirm Password</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={e => update('confirmPassword', e.target.value)}
                    required
                  />
                </div>

                {/* Branch & Year Row */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <select className="input-field" value={form.branch} onChange={e => update('branch', e.target.value)} style={{ flex: 1 }}>
                    <option value="">Branch</option>
                    <option>CSE</option>
                    <option>IT</option>
                    <option>ECE</option>
                    <option>Mechanical</option>
                    <option>Civil</option>
                    <option>ENTC</option>
                  </select>
                  <select className="input-field" value={form.year} onChange={e => update('year', e.target.value)} style={{ flex: 1 }}>
                    <option value="">Year</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </div>
              </>
            )}

            {/* Role selection (Register only) */}
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Sign up as</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => update('role', 'user')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${form.role === 'user' ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.role === 'user' ? 'var(--accent-light)' : 'transparent',
                      color: form.role === 'user' ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: '0.2s',
                    }}
                  >
                    🚀 User
                  </button>
                  <button
                    type="button"
                    onClick={() => update('role', 'admin')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${form.role === 'admin' ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.role === 'admin' ? 'var(--accent-light)' : 'transparent',
                      color: form.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: '0.2s',
                    }}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px 0', marginTop: 8, fontSize: 15 }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In to Dashboard →' : 'Sign Up →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => setIsLogin(!isLogin)}
              style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
