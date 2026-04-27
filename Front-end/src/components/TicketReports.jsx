import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api/tickets';

const STATUS_COLORS = {
  pending: '#3b82f6', inProgress: '#f59e0b', resolved: '#10b981', invalid: '#ef4444', closed: '#6b7280',
};

const selectStyle = {
  padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db',
  fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer',
};

export default function TicketReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', categoryId: '' });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      const res = await fetch(`${API}/stats?${params}`, { credentials: 'include' });
      const data = await res.json();
      setStats(data);
      if (data.categories) setCategories(data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [filters]);

  const clearFilters = () => setFilters({ status: '', priority: '', categoryId: '' });
  const hasFilters = filters.status || filters.priority || filters.categoryId;

  if (loading && !stats) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading reports...</div>;
  if (!stats) return <div style={{ padding: '2rem', color: '#dc2626' }}>Failed to load reports</div>;

  const cardStyle = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', textAlign: 'center' };
  const statCard = (label, value, color) => (
    <div style={cardStyle}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Ticket Reports</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={selectStyle} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {['PENDING', 'IN_PROGRESS', 'RESOLVED', 'INVALID', 'CLOSED'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select style={selectStyle} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select style={selectStyle} value={filters.categoryId} onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#ef4444' }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: '2rem' }}>
        {statCard('Total Tickets', stats.total, '#0f172a')}
        {statCard('Pending', stats.pending, STATUS_COLORS.pending)}
        {statCard('In Progress', stats.inProgress, STATUS_COLORS.inProgress)}
        {statCard('Resolved', stats.resolved, STATUS_COLORS.resolved)}
        {statCard('Invalid', stats.invalid, STATUS_COLORS.invalid)}
        {statCard('Closed', stats.closed, STATUS_COLORS.closed)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>By Priority</h3>
          {stats.byPriority.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No data</p> :
            stats.byPriority.map(p => (
              <div key={p.priority} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{p.priority}</span>
                <span style={{ color: '#64748b' }}>{p.count}</span>
              </div>
            ))
          }
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>By Category</h3>
          {stats.byCategory.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No data</p> :
            stats.byCategory.map(c => (
              <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{c.category}</span>
                <span style={{ color: '#64748b' }}>{c.count}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
