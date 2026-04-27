import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api/tickets';

const STATUS_COLORS = {
  PENDING: '#3b82f6', IN_PROGRESS: '#f59e0b', RESOLVED: '#10b981', CLOSED: '#6b7280', INVALID: '#ef4444',
};
const PRIORITY_COLORS = {
  LOW: '#6b7280', MEDIUM: '#3b82f6', HIGH: '#f59e0b', URGENT: '#ef4444',
};

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const perms = JSON.parse(localStorage.getItem('ticketPermissions') || '[]');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      const res = await fetch(`${API}?${params}`, { credentials: 'include' });
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE', credentials: 'include' });
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete ticket');
    }
  };

  const badge = (text, bg) => (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff', background: bg }}>{text}</span>
  );

  const selectStyle = { padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Tickets</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select style={selectStyle} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {['PENDING', 'IN_PROGRESS', 'RESOLVED', 'INVALID', 'CLOSED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select style={selectStyle} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {perms.includes('SUBMIT_TICKET') && (
            <Link to="/tickets/submit" style={{ padding: '8px 16px', borderRadius: 8, background: '#0C3D4A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              + New Ticket
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No tickets found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Title</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Category</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Submitted By</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>Priority</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>Comments</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Created</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>#{t.id}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <Link to={`/tickets/${t.id}`} style={{ color: '#0C3D4A', fontWeight: 500, textDecoration: 'none' }}>{t.title}</Link>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{t.category?.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500 }}>{t.submittedBy?.name || '—'}</div>
                    {t.submittedBy?.department?.name && <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.submittedBy.department.name}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{badge(t.priority, PRIORITY_COLORS[t.priority])}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{badge(t.status.replace('_', ' '), STATUS_COLORS[t.status])}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{t._count?.comments || 0}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <Link to={`/tickets/${t.id}`} style={{ color: '#0C3D4A', marginRight: 8, fontSize: 12 }}>View</Link>
                    {perms.includes('DELETE_TICKET') && (
                      <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
