import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: email, password })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        localStorage.setItem('valid', true);
        // TMS users go to TMS module, others go to Employee List
        if (data.user.isTmsUser) {
          localStorage.setItem('tmsUser', JSON.stringify(data.user));
          localStorage.setItem('tmsPermissions', JSON.stringify(data.user.permissions || []));
          localStorage.setItem('ticketPermissions', JSON.stringify(data.user.ticketPermissions || []));
          localStorage.setItem('payrollPermissions', JSON.stringify(data.user.payrollPermissions || []));
          localStorage.setItem('documentPermissions', JSON.stringify(data.user.documentPermissions || []));
          // IT Support goes to Ticket System, other TMS users go to TMS module
          if (data.user.isItSupport) {
            navigate('/tickets');
          } else {
            navigate('/tms/upload-resume');
          }
        } else {
          // Store ticket permissions for employee users
          localStorage.setItem('ticketPermissions', JSON.stringify(data.user.ticketPermissions || []));
          localStorage.setItem('payrollPermissions', JSON.stringify(data.user.payrollPermissions || []));
          localStorage.setItem('documentPermissions', JSON.stringify(data.user.documentPermissions || []));
          navigate('/EmployeeList');
        }
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0C3D4A 0%, #1a6b7a 100%)'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '48px', width: '400px',
        maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', color: '#0C3D4A', margin: '0 0 8px' }}>HR-CORE</h1>
          <p style={{ color: '#666', margin: 0 }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', background: '#fee2e2', color: '#991b1b',
            borderRadius: '8px', marginBottom: '20px', fontSize: '14px'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
              Email Address
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hrcore.com" required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd',
                fontSize: '15px', boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd',
                fontSize: '15px', boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '14px', borderRadius: '10px', border: 'none', fontSize: '16px', fontWeight: '600',
            background: loading ? '#999' : '#0C3D4A', color: 'white', cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#999' }}>
          <p>Default credentials:</p>
          <p>Admin: admin@hrcore.com / securepassword123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
