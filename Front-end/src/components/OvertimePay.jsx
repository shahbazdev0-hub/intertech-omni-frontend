import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Calendar, Filter, Clock, Users, TrendingUp, DollarSign, Plus, CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import './OvertimePay.css';

// Per spec §3.6: OT is on a weekly basis; 40h/week threshold before OT applies.
// OT is paid at the employee's regular hourly rate (1x, not 1.5x).
const OVERTIME_CONFIG = {
  WEEKLY_THRESHOLD: 40,       // hours/week before OT kicks in
  STANDARD_DAILY_HOURS: 8,    // used only for display/regular-hours split
  OVERTIME_RATE_MULTIPLIER: 1, // spec: "OT paid at regular hourly rate"
};

// ─── OT Records Tab ──────────────────────────────────────────────────────────
const OTRecordsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('this_month');
  const [overtimeData, setOvertimeData] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [departments, setDepartments] = useState(['all']);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalEmployees: 0, eligibleForOvertime: 0, totalOvertimeHours: '0.0', totalOvertimePay: '0.00' });

  // OT is stored per-day in the `overtime` field by the backend (weekly threshold logic)
  // Here we use the backend-computed overtime field directly.
  const calculateOvertimeData = (rec, salaries) => {
    const { totalHours = 0, overtime = 0, employeeId } = rec;
    const empSalary = salaries.find(s => s.employeeId === employeeId);
    const baseSalary = empSalary ? parseFloat(empSalary.baseSalary) : 0;
    const hourlyRate = baseSalary / (52 * OVERTIME_CONFIG.WEEKLY_THRESHOLD); // annual → hourly (52 weeks × 40h)
    const regularHours = Math.max(0, totalHours - overtime);
    const overtimeHours = overtime;
    const regularPay = (regularHours * hourlyRate).toFixed(2);
    // Spec: OT paid at regular hourly rate (multiplier = 1)
    const overtimePay = (overtimeHours * hourlyRate * OVERTIME_CONFIG.OVERTIME_RATE_MULTIPLIER).toFixed(2);
    return {
      ...rec,
      regularHours: regularHours.toFixed(1),
      overtimeHours: overtimeHours.toFixed(1),
      regularPay, overtimePay,
      totalPay: (parseFloat(regularPay) + parseFloat(overtimePay)).toFixed(2),
      hourlyRate: hourlyRate.toFixed(2),
      baseSalary: baseSalary.toFixed(2)
    };
  };

  const fetchDepartments = async () => {
    try {
      const r = await fetch('http://localhost:5000/api/salaries/dropdown/departments', { credentials: 'include' });
      if (r.ok) { const d = await r.json(); if (d.success) setDepartments(['all', ...d.data.map(dep => dep.name)]); }
    } catch {}
  };

  const fetchSalaryData = async () => {
    try {
      const r = await fetch('http://localhost:5000/api/salaries/current/all', { credentials: 'include' });
      if (r.ok) { const d = await r.json(); if (d.success) setSalaryData(d.data); }
    } catch {}
  };

  const fetchOvertimeData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') params.append('department', selectedDepartment);
      const today = new Date();
      if (dateRange === 'today') { params.append('startDate', today.toISOString().split('T')[0]); params.append('endDate', today.toISOString().split('T')[0]); }
      else if (dateRange === 'this_week') { const ws = new Date(today); ws.setDate(today.getDate() - today.getDay()); params.append('startDate', ws.toISOString().split('T')[0]); params.append('endDate', today.toISOString().split('T')[0]); }
      else if (dateRange === 'this_month') { const ms = new Date(today.getFullYear(), today.getMonth(), 1); params.append('startDate', ms.toISOString().split('T')[0]); params.append('endDate', today.toISOString().split('T')[0]); }

      const r = await fetch(`http://localhost:5000/api/attendance/logs?${params}`, { credentials: 'include' });
      if (r.ok) {
        const result = await r.json();
        // Only show records where the backend recorded actual overtime (weekly threshold enforced server-side)
        const withOT = (result.logs || []).filter(rec => (rec.overtime || 0) > 0);
        const processed = withOT.map(rec => calculateOvertimeData(rec, salaryData));
        setOvertimeData(processed);
        const totalOTH = processed.reduce((s, r) => s + parseFloat(r.overtimeHours), 0);
        const totalOTP = processed.reduce((s, r) => s + parseFloat(r.overtimePay), 0);
        setStats({ totalEmployees: processed.length, eligibleForOvertime: processed.filter(r => parseFloat(r.overtimeHours) > 0).length, totalOvertimeHours: totalOTH.toFixed(1), totalOvertimePay: totalOTP.toFixed(2) });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDepartments(); fetchSalaryData(); }, []);
  useEffect(() => { if (salaryData.length > 0) fetchOvertimeData(); }, [selectedDepartment, dateRange, salaryData]);

  const filteredData = useMemo(() => {
    let data = overtimeData;
    if (searchTerm) data = data.filter(r => (r.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedStatus !== 'all') {
      data = data.filter(r => {
        const h = parseFloat(r.overtimeHours);
        if (selectedStatus === 'high') return h > 2;
        if (selectedStatus === 'medium') return h > 1 && h <= 2;
        if (selectedStatus === 'low') return h > 0 && h <= 1;
        return false;
      });
    }
    return data;
  }, [overtimeData, searchTerm, selectedStatus]);

  const getStatusBadge = (hours) => {
    const h = parseFloat(hours);
    if (h > 2) return <span className="overtime-status-badge overtime-status-high">High OT</span>;
    if (h > 1) return <span className="overtime-status-badge overtime-status-medium">Medium OT</span>;
    if (h > 0) return <span className="overtime-status-badge overtime-status-low">Low OT</span>;
    return <span className="overtime-status-badge overtime-status-none">No OT</span>;
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '--';

  const handleExport = () => {
    const headers = ['Date', 'Employee', 'Dept', 'Clock In', 'Clock Out', 'Regular Hrs', 'OT Hrs', 'Hourly Rate', 'Regular Pay', 'OT Pay'];
    const rows = filteredData.map(r => [formatDate(r.date), r.employee?.name, r.employee?.department?.name, formatTime(r.checkInTime), formatTime(r.checkOutTime), r.regularHours, r.overtimeHours, r.hourlyRate, r.regularPay, r.overtimePay]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ot_records_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Stats */}
      <div className="overtime-stats-grid">
        {[
          { icon: <Users className="overtime-stat-icon-main" />, label: 'Total Records', value: stats.totalEmployees, cls: 'stat-blue' },
          { icon: <Clock className="overtime-stat-icon-main" />, label: 'Employees with OT', value: stats.eligibleForOvertime, cls: 'stat-green' },
          { icon: <TrendingUp className="overtime-stat-icon-main" />, label: 'Total OT Hours', value: stats.totalOvertimeHours + 'h', cls: 'stat-yellow' },
          { icon: <DollarSign className="overtime-stat-icon-main" />, label: 'Total OT Pay', value: '$' + stats.totalOvertimePay, cls: 'stat-red' },
        ].map(card => (
          <div key={card.label} className={`overtime-stat-card ${card.cls}`}>
            <div className="overtime-stat-content">
              <div className="overtime-stat-info">
                {card.icon}
                <div className="overtime-stat-details">
                  <p className="overtime-stat-title">{card.label}</p>
                  <p className="overtime-stat-value">{card.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="overtime-filters-container">
        <div className="overtime-filters-row">
          <div className="overtime-search-filters">
            <div className="overtime-search-box">
              <Search className="overtime-search-icon" />
              <input type="text" placeholder="Search employees..." className="overtime-search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="overtime-filter-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <select className="overtime-filter-select" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
              {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
            </select>
            <select className="overtime-filter-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="high">High OT (&gt;2h)</option>
              <option value="medium">Medium OT (1–2h)</option>
              <option value="low">Low OT (&lt;1h)</option>
            </select>
          </div>
          <button onClick={handleExport} className="overtime-export-btn" disabled={loading}>
            <Download className="overtime-btn-icon" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overtime-table-container">
        <div className="overtime-table-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading overtime data...</div>
          ) : (
            <table className="overtime-table">
              <thead className="overtime-table-header">
                <tr>
                  <th className="overtime-table-th">Employee</th>
                  <th className="overtime-table-th">Date</th>
                  <th className="overtime-table-th">Clock In</th>
                  <th className="overtime-table-th">Clock Out</th>
                  <th className="overtime-table-th">Regular Hrs</th>
                  <th className="overtime-table-th">OT Hrs</th>
                  <th className="overtime-table-th">Hourly Rate</th>
                  <th className="overtime-table-th">OT Pay</th>
                  <th className="overtime-table-th">Status</th>
                </tr>
              </thead>
              <tbody className="overtime-table-body">
                {filteredData.map(record => (
                  <tr key={record.id} className="overtime-table-row">
                    <td className="overtime-table-td">
                      <div className="overtime-employee-info">
                        <div className="overtime-employee-avatar">
                          <span className="overtime-avatar-text">{record.employee?.name?.split(' ').map(n => n[0]).join('') || 'NA'}</span>
                        </div>
                        <div className="overtime-employee-details">
                          <div className="overtime-employee-name">{record.employee?.name}</div>
                          <div className="overtime-employee-meta">{record.employee?.position} • {record.employee?.department?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="overtime-table-td">{formatDate(record.date)}</td>
                    <td className="overtime-table-td overtime-table-time">{formatTime(record.checkInTime)}</td>
                    <td className="overtime-table-td overtime-table-time">{formatTime(record.checkOutTime)}</td>
                    <td className="overtime-table-td overtime-table-hours">{record.regularHours}h</td>
                    <td className="overtime-table-td overtime-table-overtime">{record.overtimeHours}h</td>
                    <td className="overtime-table-td overtime-table-pay">${record.hourlyRate}/hr</td>
                    <td className="overtime-table-td overtime-table-overtime-pay">${record.overtimePay}</td>
                    <td className="overtime-table-td">{getStatusBadge(record.overtimeHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filteredData.length === 0 && (
          <div className="overtime-empty-state">
            <div className="overtime-empty-title">No overtime records found</div>
            <div className="overtime-empty-subtitle">Try adjusting your search or filter criteria</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── OT Requests Tab ─────────────────────────────────────────────────────────
const OTRequestsTab = ({ sessionUser }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');

  // New request form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', requestedHours: '', reason: '', amName: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Action modal (approve/decline)
  const [actionModal, setActionModal] = useState(null); // { action, id, employeeName }
  const [actionComment, setActionComment] = useState('');

  const isManager = sessionUser && ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD'].includes(sessionUser.role);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const r = await fetch('http://localhost:5000/api/overtime-requests', { credentials: 'include' });
      if (r.ok) setRequests(await r.json());
      else setError('Failed to load overtime requests');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const { date, requestedHours, reason, amName } = form;
    if (!date || !requestedHours || !reason || !amName) { setFormError('All fields are required.'); return; }
    if (parseFloat(requestedHours) <= 0 || parseFloat(requestedHours) > 4) { setFormError('Requested hours must be between 0.5 and 4.'); return; }

    setFormLoading(true);
    try {
      const r = await fetch('http://localhost:5000/api/overtime-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await r.json();
      if (!r.ok) { setFormError(data.error || 'Failed to submit request'); return; }
      setShowForm(false);
      setForm({ date: '', requestedHours: '', reason: '', amName: '' });
      await fetchRequests();
    } catch { setFormError('An error occurred. Please try again.'); }
    finally { setFormLoading(false); }
  };

  const confirmAction = async () => {
    if (!actionModal) return;
    const { action, id } = actionModal;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const r = await fetch(`http://localhost:5000/api/overtime-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: action === 'approve' ? 'Approved' : 'Declined', comment: actionComment || null })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || `Failed to ${action}`); }
      else { await fetchRequests(); }
    } catch { setError('Network error'); }
    finally {
      setActionLoading(prev => ({ ...prev, [actionModal.id]: false }));
      setActionModal(null);
      setActionComment('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this overtime request?')) return;
    try {
      const r = await fetch(`http://localhost:5000/api/overtime-requests/${id}`, { method: 'DELETE', credentials: 'include' });
      if (r.ok) setRequests(prev => prev.filter(req => req.id !== id));
      else { const d = await r.json(); setError(d.error || 'Failed to cancel'); }
    } catch { setError('Network error'); }
  };

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return requests;
    return requests.filter(r => r.status === filterStatus);
  }, [requests, filterStatus]);

  const statusBadge = (status) => {
    const map = {
      Pending:  { bg: '#fef3c7', color: '#92400e' },
      Approved: { bg: '#dcfce7', color: '#166534' },
      Declined: { bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || map.Pending;
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>{status}</span>;
  };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  return (
    <div>
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#0C3D4A', fontWeight: 700 }}>OT Requests</h3>
          {isManager && pendingCount > 0 && (
            <span style={{ background: '#ef4444', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{pendingCount} pending</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '0.4rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem' }}>
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
          <button onClick={fetchRequests} style={{ padding: '0.4rem 0.75rem', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.875rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {!isManager && (
            <button onClick={() => setShowForm(true)} style={{ padding: '0.4rem 1rem', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
              <Plus size={14} /> New OT Request
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overtime-table-container">
        <div className="overtime-table-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <Loader2 size={32} style={{ margin: '0 auto 8px', color: '#0C3D4A' }} className="animate-spin" />
              <div>Loading requests...</div>
            </div>
          ) : (
            <table className="overtime-table">
              <thead className="overtime-table-header">
                <tr>
                  {isManager && <th className="overtime-table-th">Employee</th>}
                  <th className="overtime-table-th">Date</th>
                  <th className="overtime-table-th">Requested Hrs</th>
                  <th className="overtime-table-th">AM Name</th>
                  <th className="overtime-table-th">Reason</th>
                  <th className="overtime-table-th">Status</th>
                  <th className="overtime-table-th">48h Window</th>
                  <th className="overtime-table-th">Comment</th>
                  <th className="overtime-table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="overtime-table-body">
                {filtered.map(req => (
                  <tr key={req.id} className="overtime-table-row">
                    {isManager && (
                      <td className="overtime-table-td">
                        <div className="overtime-employee-info">
                          <div className="overtime-employee-avatar">
                            <span className="overtime-avatar-text">{req.employee?.name?.split(' ').map(n => n[0]).join('') || 'NA'}</span>
                          </div>
                          <div className="overtime-employee-details">
                            <div className="overtime-employee-name">{req.employee?.name}</div>
                            <div className="overtime-employee-meta">{req.employee?.department?.name}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="overtime-table-td">{new Date(req.date).toLocaleDateString()}</td>
                    <td className="overtime-table-td overtime-table-overtime" style={{ fontWeight: 700 }}>{req.requestedHours}h</td>
                    <td className="overtime-table-td">{req.amName}</td>
                    <td className="overtime-table-td" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>{req.reason}</td>
                    <td className="overtime-table-td">{statusBadge(req.status)}</td>
                    <td className="overtime-table-td">
                      {req.status === 'Pending' ? (
                        req.windowExpired ? (
                          <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> Expired
                          </span>
                        ) : (
                          <span style={{ color: req.hoursRemaining < 6 ? '#f59e0b' : '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                            {req.hoursRemaining}h left
                          </span>
                        )
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td className="overtime-table-td" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: req.comment ? '#374151' : '#94a3b8', fontStyle: req.comment ? 'normal' : 'italic' }} title={req.comment}>
                      {req.comment || '—'}
                    </td>
                    <td className="overtime-table-td">
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {isManager && req.status === 'Pending' && !req.windowExpired && (
                          <>
                            <button onClick={() => { setActionModal({ action: 'approve', id: req.id, employeeName: req.employee?.name }); setActionComment(''); }}
                              disabled={actionLoading[req.id]}
                              style={{ padding: '3px 10px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button onClick={() => { setActionModal({ action: 'decline', id: req.id, employeeName: req.employee?.name }); setActionComment(''); }}
                              disabled={actionLoading[req.id]}
                              style={{ padding: '3px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <XCircle size={12} /> Decline
                            </button>
                          </>
                        )}
                        {!isManager && req.status === 'Pending' && (
                          <button onClick={() => handleDelete(req.id)}
                            style={{ padding: '3px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filtered.length === 0 && (
          <div className="overtime-empty-state">
            <div className="overtime-empty-title">No overtime requests found</div>
            <div className="overtime-empty-subtitle">{filterStatus !== 'all' ? 'Try changing the status filter.' : !isManager ? 'Submit your first OT request using the button above.' : 'No requests to action.'}</div>
          </div>
        )}
      </div>

      {/* Approve / Decline Modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '440px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: actionModal.action === 'approve' ? '#059669' : '#dc2626', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>
                {actionModal.action === 'approve' ? 'Approve' : 'Decline'} OT Request
              </h3>
              <button onClick={() => setActionModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ margin: '0 0 1rem', color: '#374151', fontSize: '0.875rem' }}>
                {actionModal.action === 'approve' ? 'Approving' : 'Declining'} OT request for <strong>{actionModal.employeeName}</strong>.
              </p>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Comment {actionModal.action === 'decline' ? '(required)' : '(optional)'}
                </label>
                <textarea value={actionComment} onChange={e => setActionComment(e.target.value)} rows={3}
                  placeholder={actionModal.action === 'approve' ? 'Add an optional note...' : 'Reason for declining...'}
                  style={{ width: '100%', padding: '0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setActionModal(null)} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button onClick={confirmAction}
                  disabled={actionModal.action === 'decline' && !actionComment.trim()}
                  style={{ padding: '0.5rem 1.25rem', background: actionModal.action === 'approve' ? '#059669' : '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: (actionModal.action === 'decline' && !actionComment.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: (actionModal.action === 'decline' && !actionComment.trim()) ? 0.6 : 1 }}>
                  Confirm {actionModal.action === 'approve' ? 'Approval' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New OT Request Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '460px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#0C3D4A', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>New Overtime Request</h3>
              <button onClick={() => { setShowForm(false); setFormError(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem' }}>
              {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.625rem 0.875rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{formError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requested Hours * <span style={{ color: '#94a3b8', textTransform: 'none' }}>(max 4)</span></label>
                  <input type="number" step="0.5" min="0.5" max="4" required value={form.requestedHours} onChange={e => setForm(p => ({ ...p, requestedHours: e.target.value }))}
                    placeholder="e.g. 2"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Manager (AM) Name *</label>
                <input type="text" required value={form.amName} onChange={e => setForm(p => ({ ...p, amName: e.target.value }))}
                  placeholder="Your direct supervisor / account manager"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason *</label>
                <textarea required rows={3} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Describe the business need for overtime..."
                  style={{ width: '100%', padding: '0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#166534' }}>
                ⓘ Your request will be reviewed within <strong>48 hours</strong>. Requests not actioned within this window will expire.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button type="submit" disabled={formLoading} style={{ padding: '0.5rem 1.25rem', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: '6px', cursor: formLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  {formLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const OvertimePay = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.loggedIn) setSessionUser(d.user); })
      .catch(() => {});
  }, []);

  return (
    <div className="overtime-main-content">
      {/* Header */}
      <div className="overtime-page-header">
        <h1 className="overtime-page-title">Overtime Pay Management</h1>
        <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>
          Standard: 8h work day | Max OT: 4h/day | Rate: 1.5× regular pay | Approval window: 48h
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', gap: '0' }}>
        {[
          { id: 'records', label: 'OT Records' },
          { id: 'requests', label: 'OT Requests' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: activeTab === tab.id ? '#0C3D4A' : '#64748b', borderBottom: activeTab === tab.id ? '3px solid #0C3D4A' : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overtime-container">
        {activeTab === 'records' && <OTRecordsTab />}
        {activeTab === 'requests' && <OTRequestsTab sessionUser={sessionUser} />}
      </div>
    </div>
  );
};

export default OvertimePay;
