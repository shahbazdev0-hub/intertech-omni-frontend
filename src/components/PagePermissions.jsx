import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_URL}/api/page-permissions`;

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

export default function PagePermissions() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [structure, setStructure] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Employee portal roles (from Role enum)
  const EMPLOYEE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD', 'GENERAL_USER', 'TEAM_LEAD', 'EMPLOYEE'];

  // Fetch TMS roles and page structure on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [rolesRes, structRes] = await Promise.all([
          fetch(`${API_URL}/api/tms/manage/roles`, { credentials: 'include' }),
          fetch(`${API}/structure`, { credentials: 'include' }),
        ]);
        const tmsRolesData = await rolesRes.json();
        const structData = await structRes.json();

        // Combine employee roles + TMS roles (deduplicate)
        const tmsRoleNames = tmsRolesData.map(r => r.name);
        const allRoleNames = [...new Set([...EMPLOYEE_ROLES, ...tmsRoleNames])];
        const combinedRoles = allRoleNames.map(name => ({ name }));

        setRoles(combinedRoles);
        setStructure(structData);
        if (combinedRoles.length > 0) {
          setSelectedRole(combinedRoles[0].name);
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch permissions when role changes
  useEffect(() => {
    if (!selectedRole) return;
    const fetchPerms = async () => {
      try {
        const res = await fetch(`${API}/${selectedRole}`, { credentials: 'include' });
        const data = await res.json();
        setPermissions(data);
      } catch (err) {
        setError('Failed to load permissions');
      }
    };
    fetchPerms();
  }, [selectedRole]);

  const togglePage = (pageKey) => {
    setPermissions(prev => ({ ...prev, [pageKey]: !prev[pageKey] }));
  };

  const toggleModule = (module) => {
    const pages = module.pages;
    const allOn = pages.every(p => permissions[p.key]);
    const updated = { ...permissions };
    pages.forEach(p => { updated[p.key] = !allOn; });
    setPermissions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/${selectedRole}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Permissions saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Centralized Permission Management</h2>
        <button onClick={handleSave} disabled={saving || !selectedRole} style={{
          padding: '8px 18px', borderRadius: 6, border: 'none',
          background: '#0C3D4A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {success && <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{success}</div>}

      {/* Role selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, fontSize: 14, color: '#334155', marginRight: 12 }}>Select Role:</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db',
            fontSize: 14, minWidth: 200, outline: 'none',
          }}
        >
          {roles.map(r => (
            <option key={r.name} value={r.name}>{r.name.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Modules & Pages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {structure.map(module => {
          const allOn = module.pages.every(p => permissions[p.key]);
          return (
            <div key={module.module} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* Module header row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 20px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0',
              }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{module.module}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Select All</span>
                  <Toggle checked={allOn} onChange={() => toggleModule(module)} />
                </div>
              </div>
              {/* Pages row — horizontal with spacing */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 20,
                padding: '16px 20px',
              }}>
                {module.pages.map(page => (
                  <div key={page.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    minWidth: 180,
                  }}>
                    <Toggle checked={!!permissions[page.key]} onChange={() => togglePage(page.key)} />
                    <span style={{ fontSize: 13, color: '#334155', whiteSpace: 'nowrap' }}>{page.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
        Changes take effect on next login for each user.
      </p>
    </div>
  );
}
