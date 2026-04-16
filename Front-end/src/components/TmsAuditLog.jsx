import React, { useState, useEffect } from 'react';
import { Shield, Search, X } from 'lucide-react';

const API = 'http://localhost:5000/api/tms';

export default function TmsAuditLog() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ fromDate: '', toDate: '', userId: '', action: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API}/auth/users`, { credentials: 'include' });
        if (res.ok) setUsers(await res.json());
      } catch {}
    };
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`${API}/audit?${params}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setLogs(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const actionColors = {
    LOGIN: '#3b82f6', LOGOUT: '#6b7280',
    RESUME_UPLOADED: '#10b981', RESUME_EDITED: '#f59e0b', RESUME_DELETED: '#ef4444', RESUME_DOWNLOADED: '#8b5cf6',
    COMMENT_ADDED: '#06b6d4', COMMENT_EDITED: '#f59e0b',
    FOLDER_CREATED: '#10b981', FOLDER_DELETED: '#ef4444',
    REPORT_EXPORTED: '#8b5cf6',
  };

  const actions = ['LOGIN', 'LOGOUT', 'RESUME_UPLOADED', 'RESUME_EDITED', 'RESUME_DELETED', 'RESUME_DOWNLOADED',
    'COMMENT_ADDED', 'COMMENT_EDITED', 'FOLDER_CREATED', 'FOLDER_DELETED', 'REPORT_EXPORTED'];

  return (
    <div className="tms-page">
      <div className="tms-page-header">
        <h1><Shield size={24} /> Audit Log</h1>
      </div>

      {error && <div className="tms-error-msg">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}

      <form onSubmit={handleSubmit} className="tms-report-filters">
        <div className="tms-form-grid tms-form-grid-4">
          <div className="tms-form-group">
            <label>From Date</label>
            <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
          </div>
          <div className="tms-form-group">
            <label>To Date</label>
            <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
          </div>
          <div className="tms-form-group">
            <label>User</label>
            <select value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })}>
              <option value="">All Users</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div className="tms-form-group">
            <label>Action</label>
            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
              <option value="">All Actions</option>
              {actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="tms-form-actions">
          <button type="submit" className="tms-btn tms-btn-primary" disabled={loading}>
            <Search size={16} /> {loading ? 'Loading...' : 'Filter'}
          </button>
        </div>
      </form>

      <div className="tms-table-wrapper">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="tms-empty">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} className="tms-empty">No audit logs found</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.user?.name}</td>
                <td><span className="tms-badge-role">{log.role}</span></td>
                <td>
                  <span className="tms-badge" style={{ background: actionColors[log.action] || '#6b7280' }}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>{log.entityType}{log.entityId ? ` #${log.entityId}` : ''}</td>
                <td className="tms-audit-details">
                  {log.oldValue && <div><small>Old:</small> {typeof log.oldValue === 'string' ? log.oldValue.substring(0, 50) : ''}</div>}
                  {log.newValue && <div><small>New:</small> {typeof log.newValue === 'string' ? log.newValue.substring(0, 50) : ''}</div>}
                </td>
                <td>{log.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
