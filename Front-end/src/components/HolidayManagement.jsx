import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_URL}/api/holidays`;

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ name: '', date: '', type: 'GLOBAL', departmentIds: [], employeeIds: [] });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?year=${year}`, { credentials: 'include' });
      if (res.ok) setHolidays(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/departments`, { credentials: 'include' });
      if (res.ok) setDepartments(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/employees`, { credentials: 'include' });
      if (res.ok) setEmployees(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchHolidays(); }, [year]);
  useEffect(() => { fetchDepartments(); fetchEmployees(); }, []);

  const resetForm = () => setForm({ name: '', date: '', type: 'GLOBAL', departmentIds: [], employeeIds: [] });

  const save = async () => {
    if (!form.name || !form.date) return alert('Name and date are required');
    if (form.type === 'DEPARTMENT' && form.departmentIds.length === 0) return alert('Select at least one department');
    if (form.type === 'EMPLOYEE' && form.employeeIds.length === 0) return alert('Select at least one employee');
    try {
      const url = editId ? `${API}/${editId}` : API;
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (res.ok) { resetForm(); setEditId(null); fetchHolidays(); }
      else { const d = await res.json(); alert(d.error); }
    } catch (e) { alert('Failed to save'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this holiday?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchHolidays();
  };

  const startEdit = (h) => {
    setEditId(h.id);
    setForm({
      name: h.name,
      date: h.date.split('T')[0],
      type: h.type || 'GLOBAL',
      departmentIds: (h.departments || []).map(d => d.departmentId),
      employeeIds: (h.employees || []).map(e => e.employeeId)
    });
  };

  const toggleDept = (deptId) => {
    setForm(f => ({
      ...f,
      departmentIds: f.departmentIds.includes(deptId)
        ? f.departmentIds.filter(id => id !== deptId)
        : [...f.departmentIds, deptId]
    }));
  };

  const toggleEmp = (empId) => {
    setForm(f => ({
      ...f,
      employeeIds: f.employeeIds.includes(empId)
        ? f.employeeIds.filter(id => id !== empId)
        : [...f.employeeIds, empId]
    }));
  };

  // Filter employees by selected departments when type is EMPLOYEE
  const filteredEmployees = employees;

  const getTypeLabel = (type) => {
    if (type === 'DEPARTMENT') return 'Department';
    if (type === 'EMPLOYEE') return 'Employee';
    return 'Global';
  };

  const getTypeBadge = (type) => {
    const colors = {
      GLOBAL: { bg: '#dbeafe', color: '#1e40af' },
      DEPARTMENT: { bg: '#fef3c7', color: '#92400e' },
      EMPLOYEE: { bg: '#ede9fe', color: '#5b21b6' }
    };
    const c = colors[type] || colors.GLOBAL;
    return { background: c.bg, color: c.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 };
  };

  const getAssignmentText = (h) => {
    if (h.type === 'DEPARTMENT' && h.departments?.length) {
      return h.departments.map(d => d.department?.name).join(', ');
    }
    if (h.type === 'EMPLOYEE' && h.employees?.length) {
      return h.employees.map(e => e.employee?.name).join(', ');
    }
    return 'All Employees';
  };

  const S = {
    page: { padding: '1.5rem', fontFamily: "'Segoe UI', sans-serif", maxWidth: '1000px', margin: '0 auto' },
    card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#fff', background: '#0C3D4A', textTransform: 'uppercase' },
    td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' },
    btn: (bg) => ({ padding: '0.45rem 1rem', background: bg || '#0C3D4A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }),
    input: { padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' },
    select: { padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' },
    label: { fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '3px', color: '#475569' },
  };

  return (
    <div style={S.page}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0C3D4A', marginBottom: '1.25rem' }}>Holiday Management</h1>

      <div style={S.card}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={S.label}>Name</label>
            <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Holiday name" />
          </div>
          <div>
            <label style={S.label}>Date</label>
            <input type="date" style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={S.label}>Type</label>
            <select style={S.select} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, departmentIds: [], employeeIds: [] }))}>
              <option value="GLOBAL">Global (All Employees)</option>
              <option value="DEPARTMENT">Department Wise</option>
              <option value="EMPLOYEE">Employee Wise</option>
            </select>
          </div>
          <button style={S.btn('#059669')} onClick={save}>{editId ? 'Update' : 'Add Holiday'}</button>
          {editId && <button style={S.btn('#64748b')} onClick={() => { setEditId(null); resetForm(); }}>Cancel</button>}
          <div style={{ marginLeft: 'auto' }}>
            <select style={S.select} value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Department selector */}
        {form.type === 'DEPARTMENT' && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={S.label}>Select Departments</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {departments.map(dept => (
                <label key={dept.id} style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  background: form.departmentIds.includes(dept.id) ? '#0C3D4A' : '#e2e8f0',
                  color: form.departmentIds.includes(dept.id) ? '#fff' : '#334155'
                }}>
                  <input
                    type="checkbox"
                    checked={form.departmentIds.includes(dept.id)}
                    onChange={() => toggleDept(dept.id)}
                    style={{ display: 'none' }}
                  />
                  {dept.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Employee selector */}
        {form.type === 'EMPLOYEE' && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={S.label}>Select Employees</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredEmployees.map(emp => (
                <label key={emp.id} style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  background: form.employeeIds.includes(emp.id) ? '#0C3D4A' : '#e2e8f0',
                  color: form.employeeIds.includes(emp.id) ? '#fff' : '#334155'
                }}>
                  <input
                    type="checkbox"
                    checked={form.employeeIds.includes(emp.id)}
                    onChange={() => toggleEmp(emp.id)}
                    style={{ display: 'none' }}
                  />
                  {emp.name} ({emp.department?.name || ''})
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={S.card}>
        {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Holiday Name</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Day</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Assigned To</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr><td colSpan="7" style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }}>No holidays for {year}</td></tr>
              ) : holidays.map((h, i) => {
                const d = new Date(h.date);
                return (
                  <tr key={h.id} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{h.name}</td>
                    <td style={S.td}>{d.toLocaleDateString('en-GB')}</td>
                    <td style={S.td}>{d.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                    <td style={S.td}><span style={getTypeBadge(h.type)}>{getTypeLabel(h.type)}</span></td>
                    <td style={{ ...S.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getAssignmentText(h)}>{getAssignmentText(h)}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ ...S.btn('#0C3D4A'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => startEdit(h)}>Edit</button>
                        <button style={{ ...S.btn('#ef4444'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => remove(h.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
