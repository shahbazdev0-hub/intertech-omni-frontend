import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('http://localhost:5000/auth/status', { credentials: 'include' });
        const j = await r.json();
        if (!j.loggedIn) { navigate('/login'); return; }
        setRole(j.user?.role);
        fetchDepartments();
      } catch { navigate('/login'); }
    })();
  }, [navigate]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/departments', { credentials: 'include' });
      if (res.ok) setDepartments(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to delete'); return; }
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch { alert('Failed to delete department.'); }
  };

  const openAdd = () => { setEditingDept(null); setError(''); setShowModal(true); };
  const openEdit = (dept) => { setEditingDept(dept); setError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingDept(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
    const method = editingDept ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      await fetchDepartments();
      closeModal();
    } catch { setError('An unexpected error occurred.'); }
  };

  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0',
    borderRadius: '6px', fontSize: '0.875rem', color: '#1e293b',
    boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0C3D4A' }}>
          Departments{' '}
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>({departments.length})</span>
        </h2>
        {isAdmin && (
          <button onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: 'linear-gradient(135deg, #0C3D4A, #1a4f5e)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(12,61,74,0.25)' }}>
            <FaPlus /> Add Department
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: '#64748b', padding: '1rem 0' }}>Loading departments...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0C3D4A' }}>
                {['#', 'Name', 'Head of Dept', 'Email', 'Phone', 'Address', 'Employees', ...(isAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>No departments found.</td></tr>
              ) : departments.map((dept, i) => (
                <tr key={dept.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '0.875rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#0C3D4A', fontSize: '0.875rem' }}>{dept.name}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{dept.hod || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{dept.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{dept.phone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.address || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                      {dept._count?.employees ?? 0}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <button onClick={() => openEdit(dept)} style={{ padding: '4px 10px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, marginRight: '6px', transition: 'opacity 0.15s' }}>Edit</button>
                      <button onClick={() => handleDelete(dept.id, dept.name)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, transition: 'opacity 0.15s' }}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '520px', maxWidth: '96vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.4rem 1.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0C3D4A' }}>
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '1.25rem 1.75rem 1.5rem' }}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.65rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                {[
                  { name: 'name', label: 'Department Name *', required: true, placeholder: 'e.g. Engineering' },
                  { name: 'hod', label: 'Head of Department', placeholder: 'e.g. John Smith' },
                  { name: 'email', label: 'Department Email', type: 'email', placeholder: 'e.g. engineering@company.com' },
                  { name: 'phone', label: 'Department Phone', placeholder: 'e.g. +1 234 567 8900' },
                  { name: 'address', label: 'Department Address', placeholder: 'e.g. Floor 3, Building A' },
                ].map(field => (
                  <div key={field.name} style={{ marginBottom: '0.9rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      required={field.required}
                      placeholder={field.placeholder}
                      defaultValue={editingDept?.[field.name] || ''}
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#0C3D4A'; e.target.style.boxShadow = '0 0 0 3px rgba(12,61,74,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" onClick={closeModal} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #0C3D4A, #1a4f5e)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    {editingDept ? 'Save Changes' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
