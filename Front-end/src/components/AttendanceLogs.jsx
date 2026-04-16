import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Calendar, Filter, Clock, Users, TrendingUp, Eye, AlertTriangle } from 'lucide-react';
import AttendanceTracker from './AttendanceTracker';
import './AttendanceLogs.css';

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD'];

const AttendanceLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Backend data states
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState(['all']);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });
  const [role, setRole] = useState(null);

  // Key for forcing re-render of AttendanceTracker
  const [trackerKey, setTrackerKey] = useState(0);

  // NCNS/UA modal state
  const [markModal, setMarkModal] = useState({
    open: false,
    employeeId: '',
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'NCNS',
    notes: ''
  });
  const [markLoading, setMarkLoading] = useState(false);
  const [markResult, setMarkResult] = useState(null); // { type: 'success'|'error', message }

  // Fetch current user role
  useEffect(() => {
    fetch('http://localhost:5000/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.loggedIn) setRole(data.user?.role); })
      .catch(() => {});
  }, []);

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        const depts = ['all', ...new Set(data.map(emp => emp.department?.name).filter(Boolean))];
        setDepartments(depts);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch attendance logs
  const fetchAttendanceLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') params.append('department', selectedDepartment);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const today = new Date();
      if (dateRange === 'today') {
        params.append('startDate', today.toISOString().split('T')[0]);
        params.append('endDate', today.toISOString().split('T')[0]);
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        params.append('startDate', yesterday.toISOString().split('T')[0]);
        params.append('endDate', yesterday.toISOString().split('T')[0]);
      } else if (dateRange === 'this_week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        params.append('startDate', weekStart.toISOString().split('T')[0]);
        params.append('endDate', today.toISOString().split('T')[0]);
      }

      const response = await fetch(`http://localhost:5000/api/attendance/logs?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.logs || []);
        setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0 });
        setPagination(data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchAttendanceLogs(); }, [selectedDepartment, selectedStatus, dateRange]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return attendanceData;
    return attendanceData.filter(record => {
      const employeeName = record.employee?.name?.toLowerCase() || '';
      const employeeEmail = record.employee?.email?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return employeeName.includes(search) || employeeEmail.includes(search);
    });
  }, [attendanceData, searchTerm]);

  const getStatusBadge = (status) => {
    const statusMap = {
      PRESENT:        { cls: 'attendance-status-present',   label: 'Present' },
      LATE:           { cls: 'attendance-status-late',       label: 'Late' },
      ABSENT:         { cls: 'attendance-status-absent',     label: 'Absent' },
      EARLY_DEPARTURE:{ cls: 'attendance-status-early',      label: 'Early Out' },
      OVERTIME:       { cls: 'attendance-status-overtime',   label: 'Overtime' },
      HALF_DAY:       { cls: 'attendance-status-half-day',   label: 'Half Day' },
      ON_BREAK:       { cls: 'attendance-status-on-break',   label: 'On Break' },
      PENDING:        { cls: 'attendance-status-pending',    label: 'Pending' },
      NCNS:           { cls: 'attendance-status-ncns',       label: 'NCNS' },
      UA:             { cls: 'attendance-status-ua',         label: 'Unauth. Absent' },
    };
    const s = statusMap[status] || { cls: 'attendance-status-present', label: status };
    return <span className={`attendance-status-badge ${s.cls}`}>{s.label}</span>;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours) => {
    if (!hours) return '--';
    return `${hours.toFixed(1)}h`;
  };

  const handleExport = () => {
    const headers = ['Date', 'Employee', 'Check In', 'Check Out', 'Total Hours', 'Break (mins)', 'Break Type', 'Overrun', 'Status', 'Location', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.employee?.name || '',
        formatTime(record.checkInTime),
        formatTime(record.checkOutTime),
        formatHours(record.totalHours),
        record.breakMinutes || 0,
        record.breakType || '',
        record.breakOverrun ? 'Yes' : 'No',
        record.status,
        record.location || 'Office',
        record.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAttendanceUpdate = () => {
    fetchAttendanceLogs();
    setTrackerKey(prev => prev + 1);
  };

  // Open mark-absence modal
  const openMarkModal = (emp, date, defaultStatus = 'NCNS') => {
    setMarkResult(null);
    setMarkModal({
      open: true,
      employeeId: emp.id,
      employeeName: emp.employee?.name || emp.name || `Employee #${emp.id}`,
      date: date || new Date().toISOString().split('T')[0],
      status: defaultStatus,
      notes: ''
    });
  };

  const closeMarkModal = () => {
    setMarkModal(prev => ({ ...prev, open: false }));
    setMarkResult(null);
  };

  const handleMarkAbsence = async () => {
    setMarkLoading(true);
    setMarkResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/attendance/mark-absence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: markModal.employeeId,
          date: markModal.date,
          status: markModal.status,
          notes: markModal.notes || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark absence');
      setMarkResult({ type: 'success', message: data.message });
      fetchAttendanceLogs();
      setTimeout(() => closeMarkModal(), 1500);
    } catch (err) {
      setMarkResult({ type: 'error', message: err.message });
    } finally {
      setMarkLoading(false);
    }
  };

  const isManager = MANAGER_ROLES.includes(role);

  return (
    <div className="attendance-logs-layout">
      <div className="attendance-logs-main-content">
        <div className="attendance-logs-container">

          {/* Attendance Tracker Section */}
          <div className="attendance-tracker-section" style={{ marginBottom: '24px' }}>
            <div className="attendance-employee-selector" style={{ marginBottom: '16px' }}>
              <label htmlFor="employee-select" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0C3D4A' }}>
                Select Employee for Attendance Tracking:
              </label>
              <select
                id="employee-select"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="attendance-filter-select"
                style={{ minWidth: '300px' }}
              >
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            <AttendanceTracker
              key={trackerKey}
              employeeId={selectedEmployee}
              onAttendanceUpdate={handleAttendanceUpdate}
            />
          </div>

          {/* NCNS/UA Quick Mark (manager only) */}
          {isManager && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <AlertTriangle size={18} style={{ color: '#856404', flexShrink: 0 }} />
              <span style={{ color: '#856404', fontWeight: 500, fontSize: '0.9rem' }}>
                Manager Action:
              </span>
              <span style={{ color: '#856404', fontSize: '0.85rem' }}>
                Select an employee from the table rows below to mark as NCNS or Unauthorized Absence.
              </span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="attendance-stats-grid">
            <div className="attendance-stat-card attendance-stat-blue">
              <div className="attendance-stat-content">
                <div className="attendance-stat-info">
                  <Users className="attendance-stat-icon-main" />
                  <div className="attendance-stat-details">
                    <p className="attendance-stat-title">Total Employees</p>
                    <p className="attendance-stat-value">{stats.total}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="attendance-stat-card attendance-stat-green">
              <div className="attendance-stat-content">
                <div className="attendance-stat-info">
                  <Clock className="attendance-stat-icon-main" />
                  <div className="attendance-stat-details">
                    <p className="attendance-stat-title">Present</p>
                    <p className="attendance-stat-value">{stats.present}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="attendance-stat-card attendance-stat-yellow">
              <div className="attendance-stat-content">
                <div className="attendance-stat-info">
                  <TrendingUp className="attendance-stat-icon-main" />
                  <div className="attendance-stat-details">
                    <p className="attendance-stat-title">Late Arrivals</p>
                    <p className="attendance-stat-value">{stats.late}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="attendance-stat-card attendance-stat-red">
              <div className="attendance-stat-content">
                <div className="attendance-stat-info">
                  <Eye className="attendance-stat-icon-main" />
                  <div className="attendance-stat-details">
                    <p className="attendance-stat-title">Absent</p>
                    <p className="attendance-stat-value">{stats.absent}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="attendance-filters-container">
            <div className="attendance-filters-row">
              <div className="attendance-search-filters">
                <div className="attendance-search-box">
                  <Search className="attendance-search-icon" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    className="attendance-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="attendance-filter-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                </select>
                <select
                  className="attendance-filter-select"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>
                <select
                  className="attendance-filter-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="EARLY_DEPARTURE">Early Out</option>
                  <option value="OVERTIME">Overtime</option>
                  <option value="NCNS">NCNS</option>
                  <option value="UA">Unauthorized Absence</option>
                </select>
              </div>
              <button onClick={handleExport} className="attendance-export-btn" disabled={loading}>
                <Download className="attendance-btn-icon" />
                Export
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="attendance-table-container">
            <div className="attendance-table-wrapper">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  Loading attendance data...
                </div>
              ) : (
                <table className="attendance-table">
                  <thead className="attendance-table-header">
                    <tr>
                      <th className="attendance-table-th">Employee</th>
                      <th className="attendance-table-th">Date</th>
                      <th className="attendance-table-th">Clock In</th>
                      <th className="attendance-table-th">Clock Out</th>
                      <th className="attendance-table-th">Total Hours</th>
                      <th className="attendance-table-th">Break / Type</th>
                      <th className="attendance-table-th">Status</th>
                      <th className="attendance-table-th">Location</th>
                      {isManager && <th className="attendance-table-th">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="attendance-table-body">
                    {filteredData.map(record => (
                      <tr key={record.id} className="attendance-table-row">
                        <td className="attendance-table-td">
                          <div className="attendance-employee-info">
                            <div className="attendance-employee-avatar">
                              <span className="attendance-avatar-text">
                                {record.employee?.name?.split(' ').map(n => n[0]).join('') || 'NA'}
                              </span>
                            </div>
                            <div className="attendance-employee-details">
                              <div className="attendance-employee-name">{record.employee?.name || 'Unknown'}</div>
                              <div className="attendance-employee-meta">
                                {record.employee?.email} • {record.employee?.department?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="attendance-table-td">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="attendance-table-td attendance-table-time">{formatTime(record.checkInTime)}</td>
                        <td className="attendance-table-td attendance-table-time">{formatTime(record.checkOutTime)}</td>
                        <td className="attendance-table-td attendance-table-hours">{formatHours(record.totalHours)}</td>
                        <td className="attendance-table-td attendance-table-break">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{record.breakMinutes || 0}m</span>
                            {record.breakType && (
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                                {record.breakType === 'SHORT' ? 'Short (15m)' :
                                 record.breakType === 'LONG' ? 'Long (30m)' :
                                 record.breakType === 'FULL' ? 'Full (1h)' :
                                 record.breakType === 'EMERGENCY' ? 'Emergency' : record.breakType}
                              </span>
                            )}
                            {record.breakOverrun && (
                              <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>⚠ Overrun</span>
                            )}
                          </div>
                        </td>
                        <td className="attendance-table-td">
                          {getStatusBadge(record.status)}
                          {record.notes && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }} title={record.notes}>
                              📝 {record.notes.length > 20 ? record.notes.slice(0, 20) + '…' : record.notes}
                            </div>
                          )}
                        </td>
                        <td className="attendance-table-td attendance-table-location">{record.location || '—'}</td>
                        {isManager && (
                          <td className="attendance-table-td">
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => openMarkModal(
                                  { id: record.employeeId, employee: record.employee },
                                  new Date(record.date).toISOString().split('T')[0],
                                  'NCNS'
                                )}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Mark as No Call No Show"
                              >
                                NCNS
                              </button>
                              <button
                                onClick={() => openMarkModal(
                                  { id: record.employeeId, employee: record.employee },
                                  new Date(record.date).toISOString().split('T')[0],
                                  'UA'
                                )}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fcd34d',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Mark as Unauthorized Absence"
                              >
                                UA
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {!loading && filteredData.length === 0 && (
              <div className="attendance-empty-state">
                <div className="attendance-empty-title">No attendance records found</div>
                <div className="attendance-empty-subtitle">Try adjusting your search or filter criteria</div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="attendance-pagination-container">
              <div className="attendance-pagination-info">
                Showing <span className="attendance-pagination-highlight">1</span> to{' '}
                <span className="attendance-pagination-highlight">{filteredData.length}</span> of{' '}
                <span className="attendance-pagination-highlight">{pagination.total || filteredData.length}</span> results
              </div>
              <div className="attendance-pagination-controls">
                <button className="attendance-pagination-btn attendance-pagination-btn-disabled" disabled>Previous</button>
                <button className="attendance-pagination-btn attendance-pagination-btn-active">1</button>
                <button className="attendance-pagination-btn attendance-pagination-btn-disabled" disabled>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NCNS / UA Mark Absence Modal */}
      {markModal.open && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '28px',
            width: '420px',
            maxWidth: '95vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <AlertTriangle size={20} style={{ color: '#b91c1c' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Mark Absence</h3>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>Employee</label>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{markModal.employeeName}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>Date</label>
              <input
                type="date"
                value={markModal.date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setMarkModal(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '6px',
                  border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>Absence Type</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { value: 'NCNS', label: 'NCNS', desc: 'No Call No Show', color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
                  { value: 'UA',   label: 'UA',   desc: 'Unauthorized Absence', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMarkModal(prev => ({ ...prev, status: opt.value }))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                      border: `2px solid ${markModal.status === opt.value ? opt.color : opt.border}`,
                      background: markModal.status === opt.value ? opt.bg : '#f8fafc',
                      color: opt.color,
                      fontWeight: markModal.status === opt.value ? 700 : 400,
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{opt.label}</div>
                    <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>
                Notes <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={markModal.notes}
                onChange={e => setMarkModal(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add context or reason..."
                rows={2}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '6px',
                  border: '1px solid #cbd5e1', fontSize: '0.9rem',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            </div>

            {markResult && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '14px',
                background: markResult.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: markResult.type === 'success' ? '#166534' : '#b91c1c',
                fontSize: '0.87rem',
                fontWeight: 500
              }}>
                {markResult.type === 'success' ? '✓ ' : '✗ '}{markResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeMarkModal}
                disabled={markLoading}
                style={{
                  padding: '9px 20px', borderRadius: '6px',
                  border: '1px solid #cbd5e1', background: '#f8fafc',
                  color: '#475569', cursor: 'pointer', fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAbsence}
                disabled={markLoading || !markModal.date}
                style={{
                  padding: '9px 20px', borderRadius: '6px',
                  border: 'none',
                  background: markLoading ? '#94a3b8' : '#b91c1c',
                  color: '#fff', cursor: markLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {markLoading ? 'Saving…' : `Mark as ${markModal.status}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceLogs;
