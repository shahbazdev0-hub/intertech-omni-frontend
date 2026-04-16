import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Download, Clock, Users, Search, CheckCircle } from 'lucide-react';

const API = 'http://localhost:5000/api/shifts';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD'];

// ─── Shift Templates Tab ─────────────────────────────────────────────────────
const ShiftsTab = ({ isManager }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', startTime: '09:00', endTime: '17:00', days: ['Mon','Tue','Wed','Thu','Fri'] });
  const [formError, setFormError] = useState('');

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/shifts`, { credentials: 'include' });
      if (r.ok) setShifts(await r.json());
      else setError('Failed to load shifts');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchShifts(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', startTime: '09:00', endTime: '17:00', days: ['Mon','Tue','Wed','Thu','Fri'] }); setFormError(''); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, startTime: s.startTime, endTime: s.endTime, days: Array.isArray(s.days) ? s.days : JSON.parse(s.days) }); setFormError(''); setShowModal(true); };

  const toggleDay = (day) => setForm(p => ({ ...p, days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Shift name is required'); return; }
    if (!form.days.length) { setFormError('Select at least one working day'); return; }
    if (form.startTime >= form.endTime) { setFormError('End time must be after start time'); return; }

    const url = editing ? `${API}/shifts/${editing.id}` : `${API}/shifts`;
    const method = editing ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) { setFormError(data.error || 'Failed to save shift'); return; }
      setShowModal(false);
      await fetchShifts();
    } catch { setFormError('Network error'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete shift "${name}"? All assignments for this shift will also be removed.`)) return;
    try {
      const r = await fetch(`${API}/shifts/${id}`, { method: 'DELETE', credentials: 'include' });
      if (r.ok) setShifts(p => p.filter(s => s.id !== id));
      else { const d = await r.json(); setError(d.error || 'Failed to delete'); }
    } catch { setError('Network error'); }
  };

  const getDuration = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`;
  };

  return (
    <div>
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#0C3D4A', fontWeight: 700 }}>Shift Templates</h3>
          <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{shifts.length} shifts</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchShifts} style={{ padding: '0.4rem 0.75rem', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.875rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {isManager && (
            <button onClick={openAdd} style={{ padding: '0.4rem 1rem', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
              <Plus size={14} /> New Shift
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <Clock size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No shifts defined yet</div>
          {isManager && <div style={{ fontSize: '0.875rem' }}>Create your first shift template above.</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {shifts.map(s => {
            const days = Array.isArray(s.days) ? s.days : JSON.parse(s.days);
            return (
              <div key={s.id} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0C3D4A', fontSize: '1rem', marginBottom: '2px' }}>{s.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                      <Clock size={13} />
                      {s.startTime} – {s.endTime}
                      <span style={{ color: '#94a3b8' }}>({getDuration(s.startTime, s.endTime)})</span>
                    </div>
                  </div>
                  {isManager && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => openEdit(s)} style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(s.id, s.name)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {DAYS.map(d => (
                    <span key={d} style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: days.includes(d) ? '#0C3D4A' : '#f1f5f9', color: days.includes(d) ? 'white' : '#94a3b8' }}>{d}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.8rem' }}>
                  <Users size={12} />
                  {s._count?.assignments ?? 0} assignment{s._count?.assignments !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shift Form Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '480px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#0C3D4A', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>{editing ? 'Edit Shift' : 'New Shift Template'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem' }}>
              {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.625rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{formError}</div>}

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Shift Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Morning Shift" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={labelStyle}>Start Time *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Time *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} required style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Working Days *</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {DAYS.map(d => (
                    <button type="button" key={d} onClick={() => toggleDay(d)}
                      style={{ padding: '5px 12px', borderRadius: '6px', border: `2px solid ${form.days.includes(d) ? '#0C3D4A' : '#e2e8f0'}`, background: form.days.includes(d) ? '#0C3D4A' : 'white', color: form.days.includes(d) ? 'white' : '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  {editing ? 'Save Changes' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Assignments Tab ──────────────────────────────────────────────────────────
const AssignmentsTab = ({ isManager, sessionUser }) => {
  const [assignments, setAssignments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState({ employeeId: '', shiftId: '', effectiveFrom: '', effectiveTo: '' });
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        fetch(`${API}/assignments`, { credentials: 'include' }),
        fetch(`${API}/shifts`, { credentials: 'include' })
      ]);
      if (aRes.ok) setAssignments(await aRes.json());
      if (sRes.ok) setShifts(await sRes.json());

      if (isManager) {
        const eRes = await fetch('http://localhost:5000/api/employees', { credentials: 'include' });
        if (eRes.ok) setEmployees(await eRes.json());
      }
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAssign = (existing = null) => {
    setEditingAssignment(existing);
    setForm(existing ? {
      employeeId: String(existing.employeeId),
      shiftId: String(existing.shiftId),
      effectiveFrom: existing.effectiveFrom?.split('T')[0] || '',
      effectiveTo: existing.effectiveTo?.split('T')[0] || ''
    } : { employeeId: '', shiftId: '', effectiveFrom: '', effectiveTo: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.employeeId || !form.shiftId || !form.effectiveFrom) { setFormError('Employee, shift, and effective from date are required'); return; }
    if (form.effectiveTo && new Date(form.effectiveTo) < new Date(form.effectiveFrom)) { setFormError('Effective to must be after effective from'); return; }

    const url = editingAssignment ? `${API}/assignments/${editingAssignment.id}` : `${API}/assignments`;
    const method = editingAssignment ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) { setFormError(data.error || 'Failed to save'); return; }
      setShowModal(false);
      await fetchData();
    } catch { setFormError('Network error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this shift assignment?')) return;
    try {
      const r = await fetch(`${API}/assignments/${id}`, { method: 'DELETE', credentials: 'include' });
      if (r.ok) setAssignments(p => p.filter(a => a.id !== id));
      else { const d = await r.json(); setError(d.error || 'Failed to remove'); }
    } catch { setError('Network error'); }
  };

  const exportCSV = () => {
    const headers = ['Employee', 'Department', 'Position', 'Shift', 'Start Time', 'End Time', 'Days', 'Effective From', 'Effective To'];
    const rows = filtered.map(a => {
      const days = Array.isArray(a.shift.days) ? a.shift.days : JSON.parse(a.shift.days);
      return [a.employee?.name, a.employee?.department?.name, a.employee?.position, a.shift.name, a.shift.startTime, a.shift.endTime, days.join('/'), a.effectiveFrom?.split('T')[0], a.effectiveTo?.split('T')[0] || 'Ongoing'];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `shift_assignments_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isActive = (a) => {
    const from = new Date(a.effectiveFrom);
    const to = a.effectiveTo ? new Date(a.effectiveTo) : null;
    return from <= today && (!to || to >= today);
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return assignments;
    const t = searchTerm.toLowerCase();
    return assignments.filter(a => (a.employee?.name || '').toLowerCase().includes(t) || (a.shift?.name || '').toLowerCase().includes(t) || (a.employee?.department?.name || '').toLowerCase().includes(t));
  }, [assignments, searchTerm]);

  return (
    <div>
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>{error}</span><button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button></div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#0C3D4A', fontWeight: 700 }}>Shift Assignments</h3>
          <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{assignments.length} total</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '0.3rem 0.6rem' }}>
            <Search size={14} color="#94a3b8" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." style={{ border: 'none', outline: 'none', fontSize: '0.875rem', width: '160px' }} />
          </div>
          <button onClick={exportCSV} style={{ padding: '0.4rem 0.75rem', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.875rem' }}>
            <Download size={14} /> Export
          </button>
          {isManager && (
            <button onClick={() => openAssign()} style={{ padding: '0.4rem 1rem', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
              <Plus size={14} /> Assign Shift
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading assignments...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <Users size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No assignments found</div>
          {isManager && <div style={{ fontSize: '0.875rem' }}>Assign shifts to employees using the button above.</div>}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0C3D4A' }}>
                {['Employee', 'Department', 'Shift', 'Time', 'Days', 'Effective From', 'Effective To', 'Status', ...(isManager ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const days = Array.isArray(a.shift.days) ? a.shift.days : JSON.parse(a.shift.days);
                const active = isActive(a);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#0C3D4A', fontSize: '0.875rem' }}>{a.employee?.name}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{a.employee?.department?.name || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{a.shift.name}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} color="#64748b" />{a.shift.startTime} – {a.shift.endTime}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {DAYS.map(d => <span key={d} style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 600, background: days.includes(d) ? '#0C3D4A20' : 'transparent', color: days.includes(d) ? '#0C3D4A' : '#cbd5e1' }}>{d}</span>)}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{a.effectiveFrom?.split('T')[0]}</td>
                    <td style={{ padding: '0.875rem 1rem', color: a.effectiveTo ? '#374151' : '#94a3b8', fontSize: '0.875rem', fontStyle: a.effectiveTo ? 'normal' : 'italic' }}>{a.effectiveTo?.split('T')[0] || 'Ongoing'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: active ? '#dcfce7' : '#f1f5f9', color: active ? '#166534' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        {active && <CheckCircle size={10} />}{active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isManager && (
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <button onClick={() => openAssign(a)} style={{ padding: '3px 10px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, marginRight: '6px' }}>Edit</button>
                        <button onClick={() => handleDelete(a.id)} style={{ padding: '3px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>Remove</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Shift Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '480px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#0C3D4A', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>{editingAssignment ? 'Edit Assignment' : 'Assign Shift to Employee'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem' }}>
              {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.625rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{formError}</div>}

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Employee *</label>
                <select value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))} required style={inputStyle} disabled={!!editingAssignment}>
                  <option value="">Select employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.department?.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={labelStyle}>Shift *</label>
                <select value={form.shiftId} onChange={e => setForm(p => ({ ...p, shiftId: e.target.value }))} required style={inputStyle}>
                  <option value="">Select shift...</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Effective From *</label>
                  <input type="date" required value={form.effectiveFrom} onChange={e => setForm(p => ({ ...p, effectiveFrom: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Effective To <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
                  <input type="date" value={form.effectiveTo} min={form.effectiveFrom} onChange={e => setForm(p => ({ ...p, effectiveTo: e.target.value }))} style={{ ...inputStyle, borderColor: form.effectiveTo && form.effectiveFrom && new Date(form.effectiveTo) < new Date(form.effectiveFrom) ? '#ef4444' : '#e2e8f0' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  {editingAssignment ? 'Save Changes' : 'Assign Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const labelStyle = { display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', color: '#1e293b', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

// ─── Main Component ───────────────────────────────────────────────────────────
const ShiftManagement = () => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.loggedIn) setSessionUser(d.user); })
      .catch(() => {});
  }, []);

  const isManager = sessionUser && MANAGER_ROLES.includes(sessionUser.role);

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 700, color: '#0C3D4A' }}>Shift Management</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Define shift templates and assign weekly schedules to employees.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        {[
          { id: 'assignments', label: 'Assignments' },
          { id: 'shifts', label: 'Shift Templates' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: activeTab === tab.id ? '#0C3D4A' : '#64748b', borderBottom: activeTab === tab.id ? '3px solid #0C3D4A' : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'assignments' && <AssignmentsTab isManager={isManager} sessionUser={sessionUser} />}
      {activeTab === 'shifts' && <ShiftsTab isManager={isManager} />}
    </div>
  );
};

export default ShiftManagement;
