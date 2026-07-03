import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Calendar, Filter, Clock, Users, TrendingUp, Eye, AlertTriangle, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import AttendanceTracker from './AttendanceTracker';
import './AttendanceLogs.css';

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD'];

// Format date from UTC (Prisma returns UTC midnight) — avoids timezone shift
const formatUTCDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
};

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

  // Admin edit attendance modal state
  const [editModal, setEditModal] = useState({
    open: false,
    employeeId: '',
    employeeName: '',
    date: '',
    checkInTime: '',
    checkOutTime: '',
    notes: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch current user role and auto-set employee for non-managers
  useEffect(() => {
    fetch(`${API_URL}/auth/status`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.loggedIn) {
          setRole(data.user?.role);
          // Auto-set employeeId for regular employees so they can check in/out
          if (!['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD'].includes(data.user?.role)) {
            setSelectedEmployee(String(data.user?.id));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/departments`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDepartments(['all', ...data.map(d => d.name)]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
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
      if (selectedEmployee) params.append('employeeId', selectedEmployee);
      if (selectedDepartment !== 'all') params.append('department', selectedDepartment);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const today = new Date();
      const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth()+1).padStart(2,'0')}-${String(today.getUTCDate()).padStart(2,'0')}`;
      if (dateRange === 'today') {
        params.append('startDate', todayStr);
        params.append('endDate', todayStr);
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
        const yStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth()+1).padStart(2,'0')}-${String(yesterday.getUTCDate()).padStart(2,'0')}`;
        params.append('startDate', yStr);
        params.append('endDate', yStr);
      } else if (dateRange === 'this_week') {
        const dow = today.getUTCDay();
        const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dow));
        const wStr = `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth()+1).padStart(2,'0')}-${String(weekStart.getUTCDate()).padStart(2,'0')}`;
        params.append('startDate', wStr);
        params.append('endDate', todayStr);
      } else if (dateRange === 'last_week') {
        const dow = today.getUTCDay();
        const lastWeekEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dow - 1));
        const lastWeekStart = new Date(Date.UTC(lastWeekEnd.getUTCFullYear(), lastWeekEnd.getUTCMonth(), lastWeekEnd.getUTCDate() - 6));
        const lwsStr = `${lastWeekStart.getUTCFullYear()}-${String(lastWeekStart.getUTCMonth()+1).padStart(2,'0')}-${String(lastWeekStart.getUTCDate()).padStart(2,'0')}`;
        const lweStr = `${lastWeekEnd.getUTCFullYear()}-${String(lastWeekEnd.getUTCMonth()+1).padStart(2,'0')}-${String(lastWeekEnd.getUTCDate()).padStart(2,'0')}`;
        params.append('startDate', lwsStr);
        params.append('endDate', lweStr);
      } else if (dateRange === 'this_month') {
        const monthStart = `${today.getUTCFullYear()}-${String(today.getUTCMonth()+1).padStart(2,'0')}-01`;
        params.append('startDate', monthStart);
        params.append('endDate', todayStr);
      }

      params.append('limit', '100');

      const response = await fetch(`${API_URL}/api/attendance/logs?${params}`, {
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

  useEffect(() => { fetchDepartments(); fetchEmployees(); }, []);
  useEffect(() => { fetchAttendanceLogs(); }, [selectedDepartment, selectedStatus, dateRange, selectedEmployee]);

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

  const getExportRows = () => {
    const headers = ['Date', 'Employee', 'Check In', 'Check Out', 'Total Hours', 'Break (mins)', 'Break Type', 'Overrun', 'Status', 'Location', 'Notes'];
    const rows = filteredData.map(record => [
      formatUTCDate(record.date),
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
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportRows();
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportRows();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Logs');
    XLSX.writeFile(wb, `attendance_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      const res = await fetch(`${API_URL}/api/attendance/mark-absence`, {
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

  // Open edit attendance modal
  const openEditModal = (record) => {
    setEditResult(null);
    const dateStr = new Date(record.date).toISOString().split('T')[0];
    const formatTimeForInput = (dt) => {
      if (!dt) return '';
      const d = new Date(dt);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    setEditModal({
      open: true,
      employeeId: record.employeeId || record.employee?.id || '',
      employeeName: record.employee?.name || 'Unknown',
      date: dateStr,
      checkInTime: formatTimeForInput(record.checkInTime),
      checkOutTime: formatTimeForInput(record.checkOutTime),
      notes: record.notes || ''
    });
  };

  // Open edit modal for new record (no existing record)
  const openNewEditModal = () => {
    setEditResult(null);
    setEditModal({
      open: true,
      employeeId: '',
      employeeName: '',
      date: new Date().toISOString().split('T')[0],
      checkInTime: '',
      checkOutTime: '',
      notes: ''
    });
  };

  const closeEditModal = () => {
    setEditModal(prev => ({ ...prev, open: false }));
    setEditResult(null);
  };

  const handleEditAttendance = async () => {
    if (!editModal.employeeId || !editModal.date || !editModal.checkInTime) {
      setEditResult({ type: 'error', message: 'Employee, date, and check-in time are required' });
      return;
    }
    setEditLoading(true);
    setEditResult(null);
    try {
      const res = await fetch(`${API_URL}/api/attendance/admin-edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: parseInt(editModal.employeeId),
          date: editModal.date,
          checkInTime: editModal.checkInTime,
          checkOutTime: editModal.checkOutTime || undefined,
          notes: editModal.notes || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit attendance');
      setEditResult({ type: 'success', message: data.message });
      fetchAttendanceLogs();
      setTimeout(() => closeEditModal(), 1500);
    } catch (err) {
      setEditResult({ type: 'error', message: err.message });
    } finally {
      setEditLoading(false);
    }
  };

  const pp = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
  const hpp = Object.keys(pp).length > 0;
  const isSuperAdmin = role === 'SUPER_ADMIN' || (hpp && pp.attendance_logs);
  const isManager = MANAGER_ROLES.includes(role) || (hpp && pp.attendance_logs);

  return (
    <div className="attendance-logs-layout">
      <div className="attendance-logs-main-content">
        <div className="attendance-logs-container">

          {/* Attendance Tracker Section */}
          <div className="attendance-tracker-section" style={{ marginBottom: '24px' }}>
            {isManager && (
            <div className="attendance-employee-selector" style={{ marginBottom: '16px' }}>
              <label htmlFor="employee-select" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0C3D4A' }}>
                Select Employee for Attendance Tracking:
              </label>
              <select
                id="employee-select"
                value={selectedEmployee}
                onChange={(e) => {
                  const empId = e.target.value;
                  setSelectedEmployee(empId);
                  if (empId) {
                    const emp = employees.find(em => String(em.id) === String(empId));
                    if (emp?.department?.name) {
                      setSelectedDepartment(emp.department.name);
                    }
                  }
                }}
                className="attendance-filter-select"
                style={{ minWidth: '300px' }}
              >
                <option value="">-- Select Employee --</option>
                {(selectedDepartment === 'all' ? employees : employees.filter(emp => emp.department?.name === selectedDepartment)).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            )}
            <AttendanceTracker
              key={trackerKey}
              employeeId={selectedEmployee}
              onAttendanceUpdate={handleAttendanceUpdate}
            />
          </div>

          {/* Stats Cards — only visible to managers */}
          {isManager && (
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
          )}

          {/* Filters and Controls */}
          <div className="attendance-filters-container">
            <div className="attendance-filters-row">
              <div className="attendance-search-filters">
                {isManager && (
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
                )}
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
                {isManager && (
                <select
                  className="attendance-filter-select"
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    // Clear selected employee if they don't belong to the new department
                    if (selectedEmployee && e.target.value !== 'all') {
                      const emp = employees.find(em => String(em.id) === String(selectedEmployee));
                      if (emp && emp.department?.name !== e.target.value) {
                        setSelectedEmployee('');
                      }
                    }
                  }}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>
                )}
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
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isSuperAdmin && (
                  <button onClick={openNewEditModal} className="attendance-export-btn" style={{ backgroundColor: '#059669' }}>
                    <Edit2 className="attendance-btn-icon" />
                    Edit Attendance
                  </button>
                )}
                <button onClick={handleExportCSV} className="attendance-export-btn" disabled={loading}>
                  <Download className="attendance-btn-icon" />
                  CSV
                </button>
                <button onClick={handleExportExcel} className="attendance-export-btn" disabled={loading} style={{ backgroundColor: '#059669' }}>
                  <Download className="attendance-btn-icon" />
                  Excel
                </button>
              </div>
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
                      {isSuperAdmin && <th className="attendance-table-th">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="attendance-table-body">
                    {filteredData.map(record => {
                      const isAbsent = record.status === 'ABSENT';
                      return (
                      <tr key={record.id} className={`attendance-table-row${isAbsent ? ' attendance-table-row-absent' : ''}`}>
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
                        <td className="attendance-table-td">{formatUTCDate(record.date)}</td>
                        <td className="attendance-table-td attendance-table-time">{isAbsent ? '—' : formatTime(record.checkInTime)}</td>
                        <td className="attendance-table-td attendance-table-time">{isAbsent ? '—' : formatTime(record.checkOutTime)}</td>
                        <td className="attendance-table-td attendance-table-hours">{isAbsent ? '—' : formatHours(record.totalHours)}</td>
                        <td className="attendance-table-td attendance-table-break">
                          {isAbsent ? '—' : (
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
                              <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Overrun</span>
                            )}
                          </div>
                          )}
                        </td>
                        <td className="attendance-table-td">
                          {getStatusBadge(record.status)}
                          {record.notes && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }} title={record.notes}>
                              {record.notes.length > 20 ? record.notes.slice(0, 20) + '…' : record.notes}
                            </div>
                          )}
                        </td>
                        <td className="attendance-table-td attendance-table-location">{isAbsent ? '—' : (record.location || '—')}</td>
                        {isSuperAdmin && (
                          <td className="attendance-table-td">
                            <button onClick={() => openEditModal(record)}
                              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0C3D4A', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Edit2 size={12} /> Edit
                            </button>
                          </td>
                        )}
                      </tr>
                      );
                    })}
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

      {/* Admin Edit Attendance Modal */}
      {editModal.open && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '480px',
            maxWidth: '95vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{ background: '#0C3D4A', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>
                <Edit2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {editModal.employeeName ? 'Edit Attendance' : 'Create Attendance'}
              </h3>
              <button onClick={closeEditModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              {/* Employee select (only for new records) */}
              {!editModal.employeeName && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Employee *</label>
                  <select
                    value={editModal.employeeId}
                    onChange={e => setEditModal(prev => ({ ...prev, employeeId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Employee name (for editing existing) */}
              {editModal.employeeName && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>Employee</label>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{editModal.employeeName}</div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Date *</label>
                <input
                  type="date"
                  value={editModal.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setEditModal(prev => ({ ...prev, date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Check-in Time *</label>
                  <input
                    type="time"
                    value={editModal.checkInTime}
                    onChange={e => setEditModal(prev => ({ ...prev, checkInTime: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Check-out Time</label>
                  <input
                    type="time"
                    value={editModal.checkOutTime}
                    onChange={e => setEditModal(prev => ({ ...prev, checkOutTime: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                  Notes <span style={{ fontWeight: 400 }}>(reason for edit)</span>
                </label>
                <textarea
                  value={editModal.notes}
                  onChange={e => setEditModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reason for editing attendance..."
                  rows={2}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: '14px', fontSize: '0.78rem', color: '#0369a1' }}>
                Status, late minutes, total hours, and overtime will be auto-calculated based on the employee's department shift timings.
              </div>

              {editResult && (
                <div style={{
                  padding: '10px 14px', borderRadius: '6px', marginBottom: '14px',
                  background: editResult.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: editResult.type === 'success' ? '#166534' : '#b91c1c',
                  fontSize: '0.87rem', fontWeight: 500
                }}>
                  {editResult.type === 'success' ? '✓ ' : '✗ '}{editResult.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={closeEditModal} disabled={editLoading}
                  style={{ padding: '9px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
                  Cancel
                </button>
                <button onClick={handleEditAttendance} disabled={editLoading || !editModal.employeeId || !editModal.date || !editModal.checkInTime}
                  style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: editLoading ? '#94a3b8' : '#0C3D4A', color: '#fff', cursor: editLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {editLoading ? 'Saving…' : 'Save Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceLogs;
