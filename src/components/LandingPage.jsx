import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0C3D4A 0%, #1a6b7a 50%, #2d8a9a 100%)',
      color: 'white',
      overflowX: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 60px', maxWidth: '1200px', margin: '0 auto'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>HR-CORE</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => navigate('/about')} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
          }}>About</button>
          <button onClick={() => navigate('/contact')} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
          }}>Contact</button>
          <button onClick={() => navigate('/login')} style={{
            background: 'white', border: 'none', color: '#0C3D4A',
            padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
          }}>Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '80px 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '52px', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
          Smart Human Resource<br />Management System
        </h2>
        <p style={{ fontSize: '18px', opacity: 0.85, maxWidth: '600px', lineHeight: '1.7', marginBottom: '40px' }}>
          Automate and streamline essential HR functions. Manage attendance, payroll, recruitment,
          and performance efficiently with role-based access control.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'white', color: '#0C3D4A', border: 'none',
            padding: '16px 40px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
          }}>Get Started</button>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '0 60px 80px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px'
      }}>
        {[
          { icon: '👥', title: 'Employee Management', desc: 'Add, edit, and manage employee profiles efficiently' },
          { icon: '💰', title: 'Salary & Payroll', desc: 'Automated payroll with overtime calculation' },
          { icon: '🕒', title: 'Attendance Tracking', desc: 'Check-in/check-out with timestamp logging' },
          { icon: '🏖️', title: 'Leave Management', desc: 'Smart leave request and approval system' },
          { icon: '🎯', title: 'Performance Reviews', desc: 'Goal tracking and performance analytics' },
          { icon: '🧾', title: 'Recruitment', desc: 'End-to-end hiring workflow automation' }
        ].map((feature, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{feature.icon}</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{feature.title}</h3>
            <p style={{ fontSize: '14px', opacity: 0.8, lineHeight: '1.5', margin: 0 }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
