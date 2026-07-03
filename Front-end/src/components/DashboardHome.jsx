import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaTimes, FaTrash, FaBullhorn, FaEdit } from 'react-icons/fa';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard/stats`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="dash-page"><div className="dash-loading">Loading dashboard...</div></div>;
  if (error) return <div className="dash-page"><div className="dash-error">{error}</div></div>;
  if (!data) return null;

  if (data.type === 'employee') return <EmployeeDashboard data={data} />;
  return <AdminDashboard data={data} />;
};

/* ═══════════════════════════════════════════
   EMPLOYEE DASHBOARD
   ═══════════════════════════════════════════ */
const EmployeeDashboard = ({ data }) => {
  const { employee, todayStatus, todayCheckIn, todayCheckOut, monthlyStats, leaves, goals } = data;
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_URL}/api/announcements`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setAnnouncements(json);
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const formatTime = (t) => {
    if (!t) return '--:--';
    const d = new Date(t);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusClass = (s) => {
    if (s === 'PRESENT') return 'present';
    if (s === 'LATE') return 'late';
    if (s === 'ABSENT') return 'absent';
    return 'not-marked';
  };

  const statusLabel = (s) => {
    if (s === 'NOT_MARKED') return 'Not Marked';
    return s.charAt(0) + s.slice(1).toLowerCase();
  };

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div className="dash-page-header-left">
          <div className="dash-header-icon" />
          <div>
            <h1 className="dash-page-title">Welcome, {employee?.name || 'Employee'}</h1>
            <p className="dash-page-subtitle">{employee?.position || ''}{employee?.department ? ` - ${employee.department}` : ''}</p>
          </div>
        </div>
      </div>

      <div className="dash-today-status">
        <span>Today's Status:</span>
        <span className={`dash-status-badge ${statusClass(todayStatus)}`}>{statusLabel(todayStatus)}</span>
        <span className="dash-time-info">
          Check-in: {formatTime(todayCheckIn)} | Check-out: {formatTime(todayCheckOut)}
        </span>
      </div>

      <div className="dash-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{monthlyStats.presentDays}</h3>
            <p>Present Days</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{monthlyStats.absentDays}</h3>
            <p>Absent Days</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{monthlyStats.lateDays}</h3>
            <p>Late Days</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{monthlyStats.totalHours}h</h3>
            <p>Total Hours</p>
          </div>
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="dash-card" style={{ marginBottom: '2.5rem' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">Department Announcements</h2>
          </div>
          <div className="dash-announcement-list">
            {announcements.map((a) => (
              <div key={a.id} className="dash-announcement-item">
                <div className="announcement-header">
                  <h4 className="announcement-title">{a.title}</h4>
                  <span className="announcement-date">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="announcement-message">{a.message}</p>
                <div className="announcement-meta">
                  <span>By: {a.creator?.name || 'Admin'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Leave Summary</h2>
          </div>
          <div className="dash-leave-row">
            <span className="leave-label">Pending Requests</span>
            <span className="leave-value" style={{ color: '#d97706' }}>{leaves.pending}</span>
          </div>
          <div className="dash-leave-row">
            <span className="leave-label">Approved This Month</span>
            <span className="leave-value" style={{ color: '#059669' }}>{leaves.approvedThisMonth}</span>
          </div>
          {leaves.recent && leaves.recent.length > 0 && (
            <>
              <div className="dash-card-header" style={{ marginTop: 16 }}>
                <h2 className="dash-card-title">Recent Leaves</h2>
              </div>
              <div className="dash-leave-list">
                {leaves.recent.map((l) => (
                  <div key={l.id} className="dash-leave-item">
                    <div>
                      <div className="leave-type">{l.leaveType}</div>
                      <div className="leave-dates">
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`leave-status-badge ${l.status}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">My Goals</h2>
          </div>
          <div className="dash-goals-grid" style={{ marginBottom: 20 }}>
            <div className="dash-goal-item">
              <div className="goal-count">{goals.total}</div>
              <div className="goal-label">Total</div>
            </div>
            <div className="dash-goal-item">
              <div className="goal-count" style={{ color: '#059669' }}>{goals.completed}</div>
              <div className="goal-label">Completed</div>
            </div>
            <div className="dash-goal-item">
              <div className="goal-count" style={{ color: '#0C3D4A' }}>{goals.inProgress}</div>
              <div className="goal-label">In Progress</div>
            </div>
          </div>
          {goals.list && goals.list.length > 0 && (
            <div className="dash-emp-goals">
              {goals.list.map((g) => (
                <div key={g.id} className="dash-emp-goal-item">
                  <div className="goal-title">{g.goalTitle}</div>
                  <div className="dash-goal-progress-bar">
                    <div
                      className="dash-goal-progress-fill"
                      style={{
                        width: `${g.progress || 0}%`,
                        background: g.status === 'Completed' ? '#059669' : '#0C3D4A',
                      }}
                    />
                  </div>
                  <div className="dash-goal-meta">
                    <span>{g.status}</span>
                    <span>{g.progress || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   ADMIN / TMS USER DASHBOARD
   ═══════════════════════════════════════════ */
const AdminDashboard = ({ data }) => {
  const { overview, leaves, recentEmployees, departmentStats, goals, weeklyAttendance } = data;
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState('');
  const [annSuccess, setAnnSuccess] = useState('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    fetchDepartments();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_URL}/api/announcements`, { credentials: 'include' });
      if (res.ok) setAnnouncements(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/departments`, { credentials: 'include' });
      if (res.ok) setDepartments(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleDeptToggle = (deptId) => {
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleEditAnnouncement = (a) => {
    setEditingAnnouncement(a);
    setAnnTitle(a.title);
    setAnnMessage(a.message);
    setSelectedDepts(a.departments?.map(d => d.department?.id) || []);
    setAnnError('');
    setAnnSuccess('');
    setShowAnnouncementModal(true);
  };

  const handleSendAnnouncement = async () => {
    if (!annTitle.trim() || !annMessage.trim() || selectedDepts.length === 0) {
      setAnnError('Please fill in title, message and select at least one department');
      return;
    }
    setAnnLoading(true);
    setAnnError('');
    try {
      const url = editingAnnouncement
        ? `${API_URL}/api/announcements/${editingAnnouncement.id}`
        : `${API_URL}/api/announcements`;
      const res = await fetch(url, {
        method: editingAnnouncement ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: annTitle, message: annMessage, departmentIds: selectedDepts })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save announcement');
      }
      setAnnSuccess(editingAnnouncement ? 'Announcement updated successfully!' : 'Announcement sent successfully!');
      setAnnTitle('');
      setAnnMessage('');
      setSelectedDepts([]);
      setEditingAnnouncement(null);
      fetchAnnouncements();
      setTimeout(() => { setShowAnnouncementModal(false); setAnnSuccess(''); }, 1500);
    } catch (err) {
      setAnnError(err.message);
    } finally {
      setAnnLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`${API_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) fetchAnnouncements();
    } catch (err) { console.error(err); }
  };

  const maxAttendance = Math.max(
    ...weeklyAttendance.map((d) => d.present + d.absent + d.late),
    1
  );

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <div className="dash-page-header-left">
          <div className="dash-header-icon" />
          <div>
            <h1 className="dash-page-title">Dashboard</h1>
            <p className="dash-page-subtitle">System overview and analytics</p>
          </div>
        </div>
        <button className="dash-send-announcement-btn" onClick={() => { setEditingAnnouncement(null); setAnnTitle(''); setAnnMessage(''); setSelectedDepts([]); setShowAnnouncementModal(true); setAnnError(''); setAnnSuccess(''); }}>
          <FaBullhorn /> Send Announcement
        </button>
      </div>

      <div className="dash-stats">
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{overview.totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{overview.totalDepartments}</h3>
            <p>Departments</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{overview.presentToday}</h3>
            <p>Present Today</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{overview.absentToday}</h3>
            <p>Absent Today</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{overview.lateToday}</h3>
            <p>Late Today</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-info">
            <h3>{leaves.pending}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="dash-card" style={{ marginBottom: '2.5rem' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">Announcements</h2>
          </div>
          <div className="dash-announcement-list">
            {announcements.map((a) => (
              <div key={a.id} className="dash-announcement-item">
                <div className="announcement-header">
                  <h4 className="announcement-title">{a.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="announcement-date">{new Date(a.createdAt).toLocaleDateString()}</span>
                    <button className="announcement-edit-btn" onClick={() => handleEditAnnouncement(a)} title="Edit">
                      <FaEdit />
                    </button>
                    <button className="announcement-delete-btn" onClick={() => handleDeleteAnnouncement(a.id)} title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <p className="announcement-message">{a.message}</p>
                <div className="announcement-meta">
                  <span>By: {a.creator?.name || 'Admin'}</span>
                  <span>Departments: {a.departments?.map(d => d.department?.name).join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Weekly Attendance</h2>
          </div>
          <div className="dash-chart-container">
            <div className="dash-chart">
              {weeklyAttendance.map((d, i) => (
                <div key={i} className="dash-chart-bar-group">
                  <div className="dash-chart-bars">
                    <div
                      className="dash-chart-bar present"
                      style={{ height: `${(d.present / maxAttendance) * 100}%` }}
                      title={`Present: ${d.present}`}
                    />
                    <div
                      className="dash-chart-bar absent"
                      style={{ height: `${(d.absent / maxAttendance) * 100}%` }}
                      title={`Absent: ${d.absent}`}
                    />
                    <div
                      className="dash-chart-bar late"
                      style={{ height: `${(d.late / maxAttendance) * 100}%` }}
                      title={`Late: ${d.late}`}
                    />
                  </div>
                  <span className="dash-chart-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-chart-legend">
            <span><span className="dash-legend-dot" style={{ background: '#059669' }} /> Present</span>
            <span><span className="dash-legend-dot" style={{ background: '#dc2626' }} /> Absent</span>
            <span><span className="dash-legend-dot" style={{ background: '#d97706' }} /> Late</span>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Departments</h2>
          </div>
          <div className="dash-dept-list">
            {departmentStats.map((d, i) => (
              <div key={i} className="dash-dept-item">
                <span className="dept-name">{d.name}</span>
                <span className="dept-count">{d.employees} employees</span>
              </div>
            ))}
            {departmentStats.length === 0 && (
              <p className="dash-empty">No departments found</p>
            )}
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Goals Overview</h2>
          </div>
          <div className="dash-goals-grid">
            <div className="dash-goal-item">
              <div className="goal-count">{goals.total}</div>
              <div className="goal-label">Total</div>
            </div>
            <div className="dash-goal-item">
              <div className="goal-count" style={{ color: '#059669' }}>{goals.completed}</div>
              <div className="goal-label">Completed</div>
            </div>
            <div className="dash-goal-item">
              <div className="goal-count" style={{ color: '#0C3D4A' }}>{goals.inProgress}</div>
              <div className="goal-label">In Progress</div>
            </div>
            <div className="dash-goal-item">
              <div className="goal-count" style={{ color: '#d97706' }}>{goals.pending}</div>
              <div className="goal-label">Pending</div>
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Leave Overview</h2>
          </div>
          <div className="dash-leave-row">
            <span className="leave-label">Pending Requests</span>
            <span className="leave-value" style={{ color: '#d97706' }}>{leaves.pending}</span>
          </div>
          <div className="dash-leave-row">
            <span className="leave-label">Approved This Month</span>
            <span className="leave-value" style={{ color: '#059669' }}>{leaves.approvedThisMonth}</span>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Recently Added Employees</h2>
        </div>
        {recentEmployees && recentEmployees.length > 0 ? (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.position || '-'}</td>
                    <td>{emp.department?.name || '-'}</td>
                    <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dash-empty">No recent employees</p>
        )}
      </div>

      {/* Send Announcement Modal */}
      {showAnnouncementModal && (
        <div className="dash-modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h2>{editingAnnouncement ? 'Edit Announcement' : 'Send Announcement'}</h2>
              <button className="dash-modal-close" onClick={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); }}><FaTimes /></button>
            </div>
            <div className="dash-modal-body">
              {annError && <div className="dash-modal-error">{annError}</div>}
              {annSuccess && <div className="dash-modal-success">{annSuccess}</div>}
              <div className="dash-modal-field">
                <label>Title *</label>
                <input type="text" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title" />
              </div>
              <div className="dash-modal-field">
                <label>Message *</label>
                <textarea value={annMessage} onChange={(e) => setAnnMessage(e.target.value)} placeholder="Write your announcement message..." rows={4} />
              </div>
              <div className="dash-modal-field">
                <label>Department *</label>
                <div className="dash-custom-dropdown">
                  <div className="dash-custom-dropdown-trigger" onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}>
                    <span className={selectedDepts.length === 0 ? 'dash-dropdown-placeholder' : ''}>
                      {selectedDepts.length === 0
                        ? 'Select Department'
                        : departments.filter(d => selectedDepts.includes(d.id)).map(d => d.name).join(', ')}
                    </span>
                    <span className="dash-dropdown-arrow">&#9662;</span>
                  </div>
                  {deptDropdownOpen && (
                    <div className="dash-custom-dropdown-menu">
                      {departments.map((dept) => (
                        <div
                          key={dept.id}
                          className={`dash-custom-dropdown-item${selectedDepts.includes(dept.id) ? ' selected' : ''}`}
                          onClick={() => handleDeptToggle(dept.id)}
                        >
                          {dept.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="dash-modal-footer">
              <button className="dash-modal-cancel" onClick={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); }}>Cancel</button>
              <button className="dash-modal-send" onClick={handleSendAnnouncement} disabled={annLoading}>
                {annLoading ? (editingAnnouncement ? 'Updating...' : 'Sending...') : <><FaPaperPlane /> {editingAnnouncement ? 'Update' : 'Send'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
