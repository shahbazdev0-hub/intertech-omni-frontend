import React, { useState, useEffect } from 'react';
import { Search, FileDown, X, BarChart3 } from 'lucide-react';

const API = 'http://localhost:5000/api/tms';

export default function TmsReports() {
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const [filters, setFilters] = useState({
    fromDate: '', toDate: '', status: '', priority: '',
    assigneeId: '', assignedById: '', designation: '', folderId: '',
  });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [uRes, fRes, desRes] = await Promise.all([
          fetch(`${API}/auth/users`, { credentials: 'include' }),
          fetch(`${API}/folders`, { credentials: 'include' }),
          fetch(`${API}/manage/designations`, { credentials: 'include' }),
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (fRes.ok) setFolders(await fRes.json());
        if (desRes.ok) setDesignations(await desRes.json());
      } catch {}
    };
    fetchMeta();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!filters.fromDate || !filters.toDate) return setError('From Date and To Date are required');

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`${API}/reports?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch report');
      const data = await res.json();
      setResumes(data.resumes);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    window.open(`${API}/reports/export?${params}`, '_blank');
  };

  const statusColors = {
    NEW: '#3b82f6', SHORTLISTED: '#f59e0b', SCHEDULED: '#8b5cf6', HIRED: '#10b981', REJECTED: '#ef4444',
  };

  return (
    <div className="tms-page">
      <div className="tms-page-header">
        <h1><BarChart3 size={24} /> TMS Reports</h1>
        {searched && resumes.length > 0 && (
          <button className="tms-btn tms-btn-primary" onClick={handleExport}>
            <FileDown size={16} /> Export CSV
          </button>
        )}
      </div>

      {error && <div className="tms-error-msg">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}

      <form onSubmit={handleSubmit} className="tms-report-filters">
        <div className="tms-form-grid tms-form-grid-4">
          <div className="tms-form-group">
            <label>From Date *</label>
            <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} required />
          </div>
          <div className="tms-form-group">
            <label>To Date *</label>
            <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} required />
          </div>
          <div className="tms-form-group">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="NEW">New</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="tms-form-group">
            <label>Priority</label>
            <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="tms-form-group">
            <label>Assignee</label>
            <select value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}>
              <option value="">All</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="tms-form-group">
            <label>Assigned By</label>
            <select value={filters.assignedById} onChange={(e) => setFilters({ ...filters, assignedById: e.target.value })}>
              <option value="">All</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="tms-form-group">
            <label>Position</label>
            <select value={filters.designation} onChange={(e) => setFilters({ ...filters, designation: e.target.value })}>
              <option value="">All</option>
              {designations.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="tms-form-group">
            <label>Folder</label>
            <select value={filters.folderId} onChange={(e) => setFilters({ ...filters, folderId: e.target.value })}>
              <option value="">All</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div className="tms-form-actions">
          <button type="submit" className="tms-btn tms-btn-primary" disabled={loading}>
            <Search size={16} /> {loading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      </form>

      {/* Stats Summary */}
      {stats && (
        <div className="tms-stats-grid">
          <div className="tms-stat-card">
            <h3>{stats.total}</h3>
            <p>Total Resumes</p>
          </div>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="tms-stat-card" style={{ borderTopColor: statusColors[status] }}>
              <h3>{count}</h3>
              <p>{status}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results Table */}
      {searched && (
        <div className="tms-table-wrapper">
          <table className="tms-table">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Position</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Assigned By</th>
                <th>Folder</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {resumes.length === 0 ? (
                <tr><td colSpan={10} className="tms-empty">No resumes match the filters</td></tr>
              ) : resumes.map((r) => (
                <tr key={r.id}>
                  <td>{r.firstName || '-'}</td>
                  <td>{r.lastName || '-'}</td>
                  <td>{r.designation}</td>
                  <td>{r.phone}</td>
                  <td><span className="tms-badge" style={{ background: statusColors[r.status] }}>{r.status}</span></td>
                  <td><span className={`tms-priority tms-priority-${r.priority.toLowerCase()}`}>{r.priority}</span></td>
                  <td>{r.assignee?.name}</td>
                  <td>{r.assignedBy?.name}</td>
                  <td>{r.folder?.name}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
