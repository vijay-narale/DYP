import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Upload, GitCompareArrows, Map, Mic, User, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Resume' },
  { to: '/analyze', icon: GitCompareArrows, label: 'Analyze' },
  { to: '/roadmap', icon: Map, label: 'Roadmap' },
  { to: '/interview', icon: Mic, label: 'Mock Interview' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        width: 240,
        minHeight: '100vh',
        background: '#0d0d0d',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 36 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--gradient-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: 'white'
        }}>P</div>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em' }}>
          Place<span className="text-gradient">IQ</span>
        </span>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              fontSize: 14, fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 8,
          fontSize: 14, color: 'var(--text-secondary)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          transition: 'color 0.15s',
          width: '100%',
        }}
        onMouseEnter={e => e.target.style.color = 'var(--error)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
      >
        <LogOut size={18} />
        Logout
      </button>
    </motion.aside>
  );
}
