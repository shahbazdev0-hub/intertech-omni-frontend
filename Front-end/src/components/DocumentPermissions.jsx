import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_URL}/api/document-permissions`;

const ALL_PERMISSIONS = [
  { key: 'VIEW_OWN_DOCUMENTS', label: 'View Own Documents', group: 'Documents' },
  { key: 'VIEW_ALL_DOCUMENTS', label: 'View All Documents', group: 'Documents' },
  { key: 'VIEW_DEPT_DOCUMENTS', label: 'View Department Documents', group: 'Documents' },
  { key: 'UPLOAD_DOCUMENT', label: 'Upload Document', group: 'Documents' },
  { key: 'DELETE_DOCUMENT', label: 'Delete Document', group: 'Documents' },
  { key: 'DOWNLOAD_DOCUMENT', label: 'Download Document', group: 'Download' },
  { key: 'MANAGE_DOCUMENT_PERMISSIONS', label: 'Manage Document Permissions', group: 'Admin' },
];

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD', 'GENERAL_USER'];
const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  HR: 'HR',
  HOD: 'HOD',
  GENERAL_USER: 'General User',
};

const GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

const Toggle = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
      background: checked ? '#0C3D4A' : '#d1d5db',
      position: 'relative', transition: 'background 0.2s',
      display: 'inline-block',
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      position: 'absolute', top: 3,
      left: checked ? 23 : 3,
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </div>
);

export default function DocumentPermissions() {
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const perms = JSON.parse(localStorage.getItem('documentPermissions') || '[]');
  const _pp = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
  const canManage = perms.includes('MANAGE_DOCUMENT_PERMISSIONS') || (Object.keys(_pp).length > 0 && _pp.document_permissions);

  const fetchPermissions = async () => {
    try {
      const res = await fetch(API, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const data = await res.json();
      const m = {};
      ROLES.forEach(role => { m[role] = {}; });
      data.forEach(p => { if (m[p.role]) m[p.role][p.permission] = p.allowed; });
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
          updates.push({ role, permission: p.key, allowed: !!matrix[role]?.[p.key] });
        });
      });
      const res = await fetch(API, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Permissions saved successfully');

      // Refresh current user's document permissions
      const myRes = await fetch(`${API}/my`, { credentials: 'include' });
      if (myRes.ok) {
        const myPerms = await myRes.json();
        localStorage.setItem('documentPermissions', JSON.stringify(myPerms));
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
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a' }}>Access Denied</h2>
        <p style={{ color: '#64748b' }}>Only users with Manage Document Permissions access can view this page.</p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading permissions...</div>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Document Permission Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchPermissions} disabled={saving} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Reload</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#0C3D4A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {success && <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{success}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 220, color: '#475569' }}>Permission</th>
              {ROLES.map(role => (
                <th key={role} style={{ padding: '10px 12px', textAlign: 'center', minWidth: 110, color: '#475569' }}>{ROLE_LABELS[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map(group => (
              <React.Fragment key={group}>
                <tr>
                  <td colSpan={ROLES.length + 1} style={{ fontWeight: 700, fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '8px 12px', letterSpacing: '0.5px' }}>
                    {group}
                  </td>
                </tr>
                {ALL_PERMISSIONS.filter(p => p.group === group).map(perm => (
                  <tr key={perm.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', paddingLeft: 20 }}>{perm.label}</td>
                    {ROLES.map(role => (
                      <td key={role} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <Toggle
                          checked={!!matrix[role]?.[perm.key]}
                          onChange={() => toggle(role, perm.key)}
                        />
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
