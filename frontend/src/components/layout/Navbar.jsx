import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Upload, GitCompareArrows, Map, Mic, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/analyze', label: 'Analyze' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/upload', label: 'Upload' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/interview', label: 'Interview' },
];

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const linkStyle = (isActive) => ({
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    padding: '8px 0',
    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 40px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--gradient-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: 'white'
        }}>P</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Place<span className="text-gradient">IQ</span>
        </span>
      </Link>

      {/* Nav Links (Desktop) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {navItems.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => linkStyle(isActive)}>
            {label}
          </NavLink>
        ))}
      </div>

      {/* Auth Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <>
            <Link to="/profile" style={{ textDecoration: 'none', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {profile?.full_name || user.email?.split('@')[0]}
            </Link>
            <button onClick={handleLogout} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 8,
              padding: '6px 14px', fontSize: 13, color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}>
              <LogOut size={14} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/auth" style={{ textDecoration: 'none', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Login
            </Link>
            <Link to="/auth" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13, borderRadius: 20 }}>
              Join Now
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
