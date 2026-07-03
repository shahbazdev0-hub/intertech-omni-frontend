import React, { useState, useEffect } from 'react';
import { Shield, Save, X, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_URL}/api/tms`;

const ALL_PERMISSIONS = [
  { key: 'UPLOAD_RESUME', label: 'Upload Resume', group: 'Resumes' },
  { key: 'VIEW_ALL_RESUMES', label: 'View All Resumes', group: 'Resumes' },
  { key: 'EDIT_ANY_RESUME', label: 'Edit Any Resume', group: 'Resumes' },
  { key: 'DELETE_RESUME', label: 'Delete Resume', group: 'Resumes' },
  { key: 'VIEW_RESUME_FILE', label: 'View/Download File', group: 'Resumes' },
  { key: 'CREATE_FOLDER', label: 'Create Folder', group: 'Folders' },
  { key: 'DELETE_FOLDER', label: 'Delete Folder', group: 'Folders' },
  { key: 'VIEW_REPORTS', label: 'View Reports', group: 'Reports' },
  { key: 'EXPORT_CSV', label: 'Export CSV', group: 'Reports' },
  { key: 'VIEW_AUDIT_LOG', label: 'View Audit Log', group: 'Audit' },
  { key: 'MANAGE_USERS', label: 'Manage Users', group: 'Admin' },
  { key: 'RESET_PASSWORD', label: 'Reset Password', group: 'Admin' },
  { key: 'MANAGE_DESIGNATIONS', label: 'Manage Positions', group: 'Admin' },
  { key: 'MANAGE_PERMISSIONS', label: 'Manage Permissions', group: 'Admin' },
];

const ROLES = ['HR_EXECUTIVE', 'HR_MANAGER', 'HOD', 'SUPER_ADMIN'];
const ROLE_LABELS = {
  HR_EXECUTIVE: 'HR Executive',
  HR_MANAGER: 'HR Manager',
  HOD: 'HOD',
  SUPER_ADMIN: 'Super Admin',
};

const GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

export default function TmsPermissions() {
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const perms = JSON.parse(localStorage.getItem('tmsPermissions') || '[]');
  const _pp = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
  const canManage = perms.includes('MANAGE_PERMISSIONS') || (Object.keys(_pp).length > 0 && _pp.tms_permissions);

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${API}/permissions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const data = await res.json();
      // Build matrix: { role: { permKey: boolean } }
      const m = {};
      ROLES.forEach(role => { m[role] = {}; });
      data.forEach(p => {
        if (m[p.role]) m[p.role][p.permission] = p.allowed;
      });
      setMatrix(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermissions(); }, []);

  const toggle = (role, permKey) => {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [permKey]: !prev[role]?.[permKey] },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updates = [];
      ROLES.forEach(role => {
        ALL_PERMISSIONS.forEach(p => {
          updates.push({
            role,
            permission: p.key,
            allowed: !!matrix[role]?.[p.key],
          });
        });
      });
      const res = await fetch(`${API}/permissions`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Permissions saved successfully');

      // Refresh current user's permissions in localStorage
      const myRes = await fetch(`${API}/permissions/my`, { credentials: 'include' });
      if (myRes.ok) {
        const myPerms = await myRes.json();
        localStorage.setItem('tmsPermissions', JSON.stringify(myPerms));
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="tms-page">
        <div className="tms-auth-required">
          <h2>Access Denied</h2>
          <p>Only users with Manage Permissions access can view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="tms-loading">Loading permissions...</div>;

  return (
    <div className="tms-page">
      <div className="tms-page-header">
        <h1><Shield size={24} /> Permission Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tms-btn tms-btn-secondary" onClick={fetchPermissions} disabled={saving}>
            <RefreshCw size={16} /> Reload
          </button>
          <button className="tms-btn tms-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="tms-error-msg">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}
      {success && <div className="tms-success-msg">{success}</div>}

      <div className="tms-table-wrapper">
        <table className="tms-table tms-permissions-table">
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>Permission</th>
              {ROLES.map(role => (
                <th key={role} style={{ textAlign: 'center', minWidth: 120 }}>{ROLE_LABELS[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map(group => (
              <React.Fragment key={group}>
                <tr className="tms-permission-group-row">
                  <td colSpan={ROLES.length + 1} style={{ fontWeight: 700, fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '8px 12px', letterSpacing: '0.5px' }}>
                    {group}
                  </td>
                </tr>
                {ALL_PERMISSIONS.filter(p => p.group === group).map(perm => (
                  <tr key={perm.key}>
                    <td style={{ paddingLeft: 20, fontSize: 13 }}>{perm.label}</td>
                    {ROLES.map(role => (
                      <td key={role} style={{ textAlign: 'center' }}>
                        <label className="tms-toggle">
                          <input
                            type="checkbox"
                            checked={!!matrix[role]?.[perm.key]}
                            onChange={() => toggle(role, perm.key)}
                          />
                          <span className="tms-toggle-slider"></span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
        Changes take effect on next login for each user. Your own permissions update immediately after saving.
      </p>
    </div>
  );
}
