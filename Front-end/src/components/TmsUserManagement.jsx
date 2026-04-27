import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Key, Edit3, X, Shield } from 'lucide-react';

const API = 'http://localhost:5000/api/tms';

export default function TmsUserManagement() {
  const tmsUser = JSON.parse(localStorage.getItem('tmsUser') || '{}');
  const [users, setUsers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const emptyUserForm = { name: '', email: '', password: '', role: 'HR_EXECUTIVE' };
  const [userForm, setUserForm] = useState(emptyUserForm);

  // Reset password form
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Designation form
  const [showDesForm, setShowDesForm] = useState(false);
  const [desName, setDesName] = useState('');
  const [editingDes, setEditingDes] = useState(null);

  // Active tab
  const [tab, setTab] = useState('users');

  const fetchData = async () => {
    try {
      const [uRes, dRes] = await Promise.all([
        fetch(`${API}/manage/users`, { credentials: 'include' }),
        fetch(`${API}/manage/designations`, { credentials: 'include' }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (dRes.ok) setDesignations(await dRes.json());
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  // --- User CRUD ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/manage/users`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg('User created successfully');
      setShowUserForm(false);
      setUserForm(emptyUserForm);
      fetchData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/manage/users/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg('User deleted');
      fetchData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return showMsg('Password must be at least 6 characters', true);
    try {
      const res = await fetch(`${API}/manage/users/${resetTarget.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg('Password reset successfully');
      setShowResetForm(false);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  // --- Designation CRUD ---
  const handleDesSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingDes ? `${API}/manage/designations/${editingDes.id}` : `${API}/manage/designations`;
      const method = editingDes ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: desName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg(editingDes ? 'Position updated' : 'Position created');
      setShowDesForm(false);
      setDesName('');
      setEditingDes(null);
      fetchData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDeleteDes = async (id, name) => {
    if (!window.confirm(`Delete position "${name}"?`)) return;
    try {
      const res = await fetch(`${API}/manage/designations/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showMsg('Position deleted');
      fetchData();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const roleLabels = {
    HR_EXECUTIVE: 'HR Executive',
    HR_MANAGER: 'HR Manager',
    HOD: 'HOD',
    SUPER_ADMIN: 'Super Admin',
    IT_SUPPORT: 'IT Support',
  };

  if (loading) return <div className="tms-loading">Loading...</div>;

  const perms = JSON.parse(localStorage.getItem('tmsPermissions') || '[]');
  const canManageUsers = perms.includes('MANAGE_USERS');
  const canResetPassword = perms.includes('RESET_PASSWORD');
  const canManageDesignations = perms.includes('MANAGE_DESIGNATIONS');

  if (!canManageUsers && !canResetPassword && !canManageDesignations) {
    return (
      <div className="tms-page">
        <div className="tms-auth-required">
          <h2>Access Denied</h2>
          <p>Only Super Admin and HR Manager can access User Management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tms-page">
      <div className="tms-page-header">
        <h1><Users size={24} /> User Management</h1>
      </div>

      {error && <div className="tms-error-msg">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}
      {success && <div className="tms-success-msg">{success}</div>}

      {/* Tabs */}
      <div className="tms-tabs">
        <button className={`tms-tab ${tab === 'users' ? 'tms-tab-active' : ''}`} onClick={() => setTab('users')}>
          <Users size={16} /> TMS Users
        </button>
        {canManageDesignations && (
          <button className={`tms-tab ${tab === 'designations' ? 'tms-tab-active' : ''}`} onClick={() => setTab('designations')}>
            <Shield size={16} /> Positions
          </button>
        )}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <>
          {canManageUsers && (
            <div style={{ marginBottom: 16 }}>
              <button className="tms-btn tms-btn-primary" onClick={() => setShowUserForm(true)}>
                <Plus size={16} /> Add User
              </button>
            </div>
          )}

          <div className="tms-table-wrapper">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="tms-empty">No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td className="tms-filename">{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="tms-badge-role">{roleLabels[u.role] || u.role}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="tms-actions">
                      <button title="Reset Password" onClick={() => { setResetTarget(u); setShowResetForm(true); setNewPassword(''); }}>
                        <Key size={15} />
                      </button>
                      {canManageUsers && u.id !== tmsUser.id && (
                        <button title="Delete User" onClick={() => handleDeleteUser(u.id, u.name)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Designations Tab */}
      {tab === 'designations' && canManageDesignations && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button className="tms-btn tms-btn-primary" onClick={() => { setShowDesForm(true); setEditingDes(null); setDesName(''); }}>
              <Plus size={16} /> Add Position
            </button>
          </div>

          <div className="tms-table-wrapper">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Position Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {designations.length === 0 ? (
                  <tr><td colSpan={2} className="tms-empty">No positions found</td></tr>
                ) : designations.map((d) => (
                  <tr key={d.id}>
                    <td className="tms-filename">{d.name}</td>
                    <td className="tms-actions">
                      <button title="Edit" onClick={() => { setEditingDes(d); setDesName(d.name); setShowDesForm(true); }}>
                        <Edit3 size={15} />
                      </button>
                      <button title="Delete" onClick={() => handleDeleteDes(d.id, d.name)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showUserForm && (
        <div className="tms-modal-overlay" onClick={() => setShowUserForm(false)}>
          <div className="tms-modal tms-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>Create TMS User</h2>
              <button className="tms-close-btn" onClick={() => setShowUserForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="tms-form-group" style={{ marginBottom: 14 }}>
                <label>Full Name *</label>
                <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
              </div>
              <div className="tms-form-group" style={{ marginBottom: 14 }}>
                <label>Email *</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
              </div>
              <div className="tms-form-group" style={{ marginBottom: 14 }}>
                <label>Password *</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={6} />
                <small>Minimum 6 characters</small>
              </div>
              <div className="tms-form-group" style={{ marginBottom: 14 }}>
                <label>Role *</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} required>
                  <option value="HR_EXECUTIVE">HR Executive</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="HOD">HOD</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="IT_SUPPORT">IT Support</option>
                </select>
              </div>
              <div className="tms-form-actions">
                <button type="button" className="tms-btn tms-btn-secondary" onClick={() => setShowUserForm(false)}>Cancel</button>
                <button type="submit" className="tms-btn tms-btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetForm && resetTarget && (
        <div className="tms-modal-overlay" onClick={() => setShowResetForm(false)}>
          <div className="tms-modal tms-modal-xs" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>Reset Password</h2>
              <button className="tms-close-btn" onClick={() => setShowResetForm(false)}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>
              Reset password for <strong>{resetTarget.name}</strong> ({resetTarget.email})
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="tms-form-group" style={{ marginBottom: 14 }}>
                <label>New Password *</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                <small>Minimum 6 characters</small>
              </div>
              <div className="tms-form-actions">
                <button type="button" className="tms-btn tms-btn-secondary" onClick={() => setShowResetForm(false)}>Cancel</button>
                <button type="submit" className="tms-btn tms-btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Form Modal */}
      {showDesForm && (
        <div className="tms-modal-overlay" onClick={() => setShowDesForm(false)}>
          <div className="tms-modal tms-modal-xs" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>{editingDes ? 'Edit Position' : 'Add Position'}</h2>
              <button className="tms-close-btn" onClick={() => setShowDesForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleDesSubmit}>
              <div className="tms-form-group" style={{ marginBottom: 14 }}>
                <label>Position Name *</label>
                <input value={desName} onChange={(e) => setDesName(e.target.value)} required />
              </div>
              <div className="tms-form-actions">
                <button type="button" className="tms-btn tms-btn-secondary" onClick={() => setShowDesForm(false)}>Cancel</button>
                <button type="submit" className="tms-btn tms-btn-primary">{editingDes ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
