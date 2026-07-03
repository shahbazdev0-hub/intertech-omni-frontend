import React, { useState, useEffect } from 'react';
import './ViewEmployee.css';
import './MyProfile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  // Form state for editable fields
  const [form, setForm] = useState({ name: '', age: '', experience: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get session info first
        const authRes = await fetch(`${API_URL}/auth/status`, { credentials: 'include' });
        const authData = await authRes.json();

        if (!authData.loggedIn) {
          setError('Not authenticated. Please log in.');
          setLoading(false);
          return;
        }

        setSessionUser(authData.user);

        // TMS-only users don't have an employee record — unless they have page permissions
        const _pp = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
        const _hpp = Object.keys(_pp).length > 0;
        if (authData.user.isTmsUser && authData.user.role !== 'SUPER_ADMIN' && !(_hpp && _pp.my_profile)) {
          setError('Profile is only available for employee accounts.');
          setLoading(false);
          return;
        }

        // For TMS users or custom roles, find their employee record by email
        let employeeId = authData.user.id;
        let foundEmployee = false;
        if (authData.user.isTmsUser || (_hpp && _pp.my_profile)) {
          const empRes = await fetch(`${API_URL}/api/employees`, { credentials: 'include' });
          if (empRes.ok) {
            const emps = await empRes.json();
            const match = emps.find(e => e.email === authData.user.email);
            if (match) { employeeId = match.id; foundEmployee = true; }
          }
          if (!foundEmployee) {
            // No employee record — show basic profile from session
            const basicProfile = { name: authData.user.name, email: authData.user.email, role: authData.user.role, position: authData.user.position || '-' };
            setProfile(basicProfile);
            setForm({ name: basicProfile.name || '', age: '', experience: '' });
            setLoading(false);
            return;
          }
        }

        // Fetch own employee record
        const res = await fetch(`${API_URL}/api/employees/${employeeId}`, { credentials: 'include' });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load profile');
        }

        const data = await res.json();
        setProfile(data);
        setForm({ name: data.name || '', age: data.age || '', experience: data.experience || '' });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      let res;
      if (profile.id) {
        // Employee profile update
        res = await fetch(`${API_URL}/api/employees/${profile.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            age: parseInt(form.age) || profile.age,
            experience: parseInt(form.experience) || profile.experience,
            email: profile.email,
            department: profile.department?.name,
            position: profile.position,
            salary: profile.salary,
            status: profile.status,
            joinDate: profile.joinDate,
            role: profile.role,
            employmentType: profile.employmentType,
          }),
        });
      } else {
        // TMS-only user profile update
        res = await fetch(`${API_URL}/api/tms/manage/profile`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name }),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Failed to save');
      }

      const updated = await res.json();
      if (profile.id) {
        setProfile(updated);
      } else {
        setProfile(prev => ({ ...prev, name: updated.name }));
      }
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      SUPER_ADMIN: '#7c3aed',
      ADMIN: '#2563eb',
      HR: '#0891b2',
      HOD: '#059669',
      GENERAL_USER: '#6b7280',
    };
    return colors[role] || '#6b7280';
  };

  const getEmploymentTypeBadgeColor = (type) => {
    const colors = {
      FTE: '#16a34a',
      PTE: '#ca8a04',
      PROBATION: '#ea580c',
      CONSULTANT: '#7c3aed',
    };
    return colors[type] || '#6b7280';
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your profile...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>{error}</div>;
  if (!profile) return null;

  return (
    <div className="view-employee-container">
      <div className="profile-header">
        <h2 className="view-employee-title">My Profile</h2>
        {!editing ? (
          <button className="profile-edit-btn" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        ) : (
          <div className="profile-action-btns">
            <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="profile-cancel-btn" onClick={() => {
              setEditing(false);
              setForm({ name: profile.name, age: profile.age, experience: profile.experience });
            }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="profile-success-banner">Profile updated successfully.</div>
      )}

      {/* Identity Card */}
      <div className="employee-card basic-info-card">
        <div className="employee-photo-section">
          <div className="employee-photo">
            <div className="default-avatar">
              <svg className="avatar-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <span className="profile-badge" style={{ background: getRoleBadgeColor(profile.role) }}>
              {profile.role?.replace('_', ' ')}
            </span>
          </div>
          <div style={{ marginTop: '0.4rem', textAlign: 'center' }}>
            <span className="profile-badge" style={{ background: getEmploymentTypeBadgeColor(profile.employmentType) }}>
              {profile.employmentType}
            </span>
          </div>
        </div>

        <div className="employee-details">
          <h3 className="card-title">Basic Information</h3>

          <div className="employee-row">
            <span className="label">Full Name:</span>
            {editing ? (
              <input
                className="profile-input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            ) : (
              <span className="value">{profile.name}</span>
            )}
          </div>
          <div className="employee-row">
            <span className="label">Employee ID:</span>
            <span className="value">#{profile.id}</span>
          </div>
          <div className="employee-row">
            <span className="label">Email:</span>
            <span className="value">{profile.email}</span>
          </div>
          <div className="employee-row">
            <span className="label">Department:</span>
            <span className="value">{profile.department?.name || 'N/A'}</span>
          </div>
          <div className="employee-row">
            <span className="label">Position:</span>
            <span className="value">{profile.position}</span>
          </div>
          <div className="employee-row">
            <span className="label">Status:</span>
            <span className="value">
              <span className={`profile-status-dot ${profile.status?.toLowerCase()}`} />
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      {/* Professional Details */}
      <div className="employee-card">
        <h3 className="card-title">Professional Details</h3>

        <div className="employee-row">
          <span className="label">Joining Date:</span>
          <span className="value">{formatDate(profile.joinDate)}</span>
        </div>
        <div className="employee-row">
          <span className="label">Age:</span>
          {editing ? (
            <input
              className="profile-input"
              type="number"
              min="18"
              max="99"
              value={form.age}
              onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
            />
          ) : (
            <span className="value">{profile.age}</span>
          )}
        </div>
        <div className="employee-row">
          <span className="label">Years of Experience:</span>
          {editing ? (
            <input
              className="profile-input"
              type="number"
              min="0"
              max="60"
              value={form.experience}
              onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
            />
          ) : (
            <span className="value">{profile.experience} year{profile.experience !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="employee-row">
          <span className="label">Salary:</span>
          <span className="value">
            {`$${profile.salary?.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Leave Entitlement quick-view */}
      {profile.id && <LeaveBalanceCard employeeId={profile.id} />}
    </div>
  );
};

// Quick leave balance summary card
const LeaveBalanceCard = ({ employeeId }) => {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/leave/balance/${employeeId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setBalance(data))
      .catch(() => {});
  }, [employeeId]);

  if (!balance) return null;

  return (
    <div className="employee-card">
      <h3 className="card-title">Leave Balance ({balance.year})</h3>
      {balance.isProbation && (
        <p style={{ color: '#ea580c', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Probation period — unpaid leave only applies.
        </p>
      )}
      <div className="leave-balance-grid">
        {balance.leaveBalance.map(lb => (
          <div key={lb.type} className="leave-balance-item">
            <span className="leave-type-name">{lb.type}</span>
            <div className="leave-bar-wrap">
              <div
                className="leave-bar-fill"
                style={{
                  width: lb.allocated > 0 ? `${Math.min(100, (lb.used / lb.allocated) * 100)}%` : '0%',
                  background: lb.remaining <= 0 ? '#dc2626' : lb.remaining <= 3 ? '#ea580c' : '#2563eb'
                }}
              />
            </div>
            <span className="leave-remaining">{lb.remaining} / {lb.allocated} days remaining</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyProfile;
