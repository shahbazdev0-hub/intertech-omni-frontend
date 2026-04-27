import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api/ticket-categories';

export default function TicketCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetch(API, { credentials: 'include' });
      setCategories(await res.json());
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Name is required'); return; }
    try {
      const url = editId ? `${API}/${editId}` : API;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(editId ? 'Category updated' : 'Category created');
      setForm({ name: '', description: '' });
      setEditId(null);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (cat) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description || '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle = { padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' };
  const btnStyle = { padding: '8px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Ticket Categories</h2>

      {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {success && <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Name</label>
          <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Description</label>
          <input style={{ ...inputStyle, width: 250 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
        </div>
        <button type="submit" style={{ ...btnStyle, background: '#0C3D4A', color: '#fff' }}>{editId ? 'Update' : 'Add Category'}</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: '', description: '' }); }} style={{ ...btnStyle, background: '#e2e8f0', color: '#475569' }}>Cancel</button>}
      </form>

      {loading ? <p style={{ color: '#94a3b8' }}>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Name</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Description</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>Tickets</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{cat.name}</td>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>{cat.description || '—'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>{cat._count?.tickets || 0}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(cat)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
