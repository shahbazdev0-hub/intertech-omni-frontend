import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api/holidays';

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ name: '', date: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?year=${year}`, { credentials: 'include' });
      if (res.ok) setHolidays(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchHolidays(); }, [year]);

  const save = async () => {
    if (!form.name || !form.date) return alert('Name and date are required');
    try {
      const url = editId ? `${API}/${editId}` : API;
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (res.ok) { setForm({ name: '', date: '' }); setEditId(null); fetchHolidays(); }
      else { const d = await res.json(); alert(d.error); }
    } catch (e) { alert('Failed to save'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this holiday?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchHolidays();
  };

  const S = {
    page: { padding: '1.5rem', fontFamily: "'Segoe UI', sans-serif", maxWidth: '900px', margin: '0 auto' },
    card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#fff', background: '#0C3D4A', textTransform: 'uppercase' },
    td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' },
    btn: (bg) => ({ padding: '0.45rem 1rem', background: bg || '#0C3D4A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }),
    input: { padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' },
    select: { padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' },
  };

  return (
    <div style={S.page}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0C3D4A', marginBottom: '1.25rem' }}>Holiday Management</h1>

      <div style={S.card}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '3px', color: '#475569' }}>Name</label>
            <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Holiday name" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '3px', color: '#475569' }}>Date</label>
            <input type="date" style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <button style={S.btn('#059669')} onClick={save}>{editId ? 'Update' : 'Add Holiday'}</button>
          {editId && <button style={S.btn('#64748b')} onClick={() => { setEditId(null); setForm({ name: '', date: '' }); }}>Cancel</button>}
          <div style={{ marginLeft: 'auto' }}>
            <select style={S.select} value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
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
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr><td colSpan="5" style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }}>No holidays for {year}</td></tr>
              ) : holidays.map((h, i) => {
                const d = new Date(h.date);
                return (
                  <tr key={h.id} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{h.name}</td>
                    <td style={S.td}>{d.toLocaleDateString('en-GB')}</td>
                    <td style={S.td}>{d.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ ...S.btn('#0C3D4A'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => { setEditId(h.id); setForm({ name: h.name, date: h.date.split('T')[0] }); }}>Edit</button>
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
