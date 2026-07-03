import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeList.css';
import { FaPlus, FaFileExport, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PAGE_SIZE = 10;

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [role, setRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [resetPasswordEmp, setResetPasswordEmp] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/auth/status`, { credentials: 'include' });
        const j = await r.json();
        if (!j.loggedIn) { navigate('/login'); return; }
        setRole(j.user?.role || null);
        setAuthChecked(true);
      } catch { navigate('/login'); }
    })();
  }, [navigate]);

  useEffect(() => {
    if (authChecked) { fetchEmployees(); fetchDepartments(); }
  }, [authChecked]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { credentials: 'include' });
      if (res.ok) setDepartments(await res.json());
    } catch (err) { console.error('Failed to fetch departments:', err); }
  };



  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { credentials: 'include' });
      if (res.status === 401) return navigate('/login');
      if (res.status === 403) return alert('Forbidden');
      setEmployees(await res.json());
    } catch (err) { console.error('Failed to fetch employees:', err); }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return employees.filter(emp => {
      const matchSearch = !term ||
        emp.name?.toLowerCase().includes(term) ||
        String(emp.id).includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term);
      const matchDept = !filterDept || emp.department?.name === filterDept;
      const matchStatus = !filterStatus || emp.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, filterDept, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleDeptChange = (e) => { setFilterDept(e.target.value); setCurrentPage(1); };
  const handleStatusChange = (e) => { setFilterStatus(e.target.value); setCurrentPage(1); };

  const getEmployeeExportData = () => {
    const headers = ['ID', 'Name', 'Email', 'Department', 'Position', 'Status', 'Role', 'Salary', 'Join Date', 'Age', 'Experience'];
    const rows = filtered.map(e => [
      e.id, e.name, e.email,
      e.department?.name || '', e.position, e.status, e.role,
      e.salary, e.joinDate?.split('T')[0] || '', e.age, e.experience
    ]);
    return { headers, rows };
  };

  const exportCSV = () => {
    const { headers, rows } = getEmployeeExportData();
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'employees.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const { headers, rows } = getEmployeeExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees.xlsx');
  };

  const handleView = (id) => navigate(`/employee/${id}`);

  const handleEdit = async (id) => {
    try {
      const res = await fetch(`/api/employees/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setEditingEmployee(await res.json());
      setShowEditModal(true);
    } catch { alert('Failed to load employee for editing.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error || 'Delete failed'); }
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err) { alert(err.message || 'Failed to delete employee.'); }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, department: emp.department?.name, status: newStatus })
      });
      if (!res.ok) throw new Error();
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: newStatus } : e));
    } catch { alert('Failed to update status.'); }
  };

  const handleCloseModal = () => { setShowAddModal(false); setShowEditModal(false); setEditingEmployee(null); };

  const handleCheckPromotions = async () => {
    try {
      const res = await fetch('/api/employees/check-promotions', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.promoted.length === 0) {
        alert('No probation employees are due for promotion yet.');
      } else {
        const names = data.promoted.map(e => e.name).join(', ');
        alert(`${data.promoted.length} employee(s) promoted to FTE:\n${names}`);
        fetchEmployees();
      }
    } catch (err) { alert(err.message || 'Failed to check promotions'); }
  };

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    try {
      const res = await fetch('/api/employees', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, salary: parseFloat(payload.salary), age: parseInt(payload.age), experience: parseInt(payload.experience) })
      });
      const result = await res.json();
      if (!res.ok) { alert(result.error || 'Failed to add employee'); return; }
      await fetchEmployees();
      setShowAddModal(false);
    } catch { alert('An unexpected error occurred while adding employee.'); }
  };

  const handleEditEmployeeSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, salary: parseFloat(payload.salary), age: parseInt(payload.age), experience: parseInt(payload.experience) })
      });
      const result = await res.json();
      if (!res.ok) { alert(result.error || 'Failed to update employee'); return; }
      await fetchEmployees();
      setShowEditModal(false); setEditingEmployee(null);
    } catch { alert('Failed to update employee.'); }
  };

  if (!authChecked) return null;

  const pagePerms = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
  const hasPagePerms = Object.keys(pagePerms).length > 0;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || (hasPagePerms && pagePerms.employees);
  const isHROrAbove = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(role) || (hasPagePerms && pagePerms.employees);
  const isTmsUser = !!localStorage.getItem('tmsUser');

  return (
    <div className="employee-list-container">

      {/* Header */}
      <div className="page-header">
        <h2 className="page-heading">
          Employees
          <span className="page-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </h2>
        <div className="header-actions">
          <button onClick={exportCSV} className="btn btn-outline">
            <FaFileExport /> Export CSV
          </button>
          <button onClick={exportExcel} className="btn btn-outline" style={{ borderColor: '#059669', color: '#059669' }}>
            <FaFileExport /> Export Excel
          </button>
          {/* Check Promotions button removed */}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <FaPlus /> Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="search-field"
          placeholder="Search by name, ID, email, position..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <select className="filter-field" value={filterDept} onChange={handleDeptChange}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select className="filter-field" value={filterStatus} onChange={handleStatusChange}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Position</th>
              <th>Department</th>
              <th>Join Date</th>
              <th>Status</th>
              <th className="action-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr className="empty-row"><td colSpan={7}>No employees found.</td></tr>
            ) : paginated.map(emp => (
              <tr key={emp.id}>
                <td className="td-id">#{emp.id}</td>
                <td className="td-name">{emp.name}</td>
                <td>{emp.position}</td>
                <td>{emp.department?.name || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                <td>{emp.joinDate?.split('T')[0] || '—'}</td>
                <td>
                  <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="action-column">
                  <button className="tbl-btn tbl-btn-view" onClick={() => handleView(emp.id)}>View</button>
                  {isAdmin && (
                    <>
                      <button className="tbl-btn tbl-btn-edit" onClick={() => handleEdit(emp.id)}>Edit</button>
                      <button
                        className={`tbl-btn ${emp.status === 'Active' ? 'tbl-btn-deactivate' : 'tbl-btn-activate'}`}
                        onClick={() => handleToggleStatus(emp)}
                      >
                        {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="tbl-btn tbl-btn-delete" onClick={() => handleDelete(emp.id)}>Delete</button>
                    </>
                  )}
                  {isTmsUser && isAdmin && (
                    <button className="tbl-btn tbl-btn-edit" onClick={() => setResetPasswordEmp(emp)} title="Reset Password">
                      <FaKey size={12} /> Reset Password
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            &laquo; Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`pg-btn${p === currentPage ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>
              {p}
            </button>
          ))}
          <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next &raquo;
          </button>
        </div>
      )}

      {/* Modals */}
      {isAdmin && showAddModal && (
        <ModalForm title="Add New Employee" onSubmit={handleAddEmployeeSubmit} onClose={handleCloseModal} departments={departments} isAdd />
      )}
      {isAdmin && showEditModal && editingEmployee && (
        <ModalForm title="Edit Employee" onSubmit={handleEditEmployeeSubmit} onClose={handleCloseModal} initialData={editingEmployee} departments={departments} />
      )}

      {resetPasswordEmp && (
        <ResetPasswordModal
          employee={resetPasswordEmp}
          onClose={() => setResetPasswordEmp(null)}
        />
      )}
    </div>
  );
};

const ModalForm = ({ title, onSubmit, onClose, initialData, departments = [], isAdd = false }) => {
  const [showAddPassword, setShowAddPassword] = React.useState(false);
  const [roles, setRoles] = React.useState([]);
  const [positions, setPositions] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, posRes] = await Promise.all([
          fetch(`${API_URL}/api/tms/manage/roles`, { credentials: 'include' }),
          fetch(`${API_URL}/api/tms/manage/designations`, { credentials: 'include' }),
        ]);
        if (rolesRes.ok) setRoles(await rolesRes.json());
        if (posRes.ok) setPositions(await posRes.json());
      } catch (err) {
        console.error('Failed to fetch roles/positions:', err);
      }
    };
    fetchData();
  }, []);

  return (
  <div className="modal-backdrop">
    <div className="modal-card">
      <div className="modal-header">
        <h2 className="modal-title">{title}</h2>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>
      <div className="modal-body">
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Full Name *</label>
              <input name="name" required placeholder="e.g. Jane Smith" defaultValue={initialData?.name} className="form-input" autoComplete="off" />
            </div>
            <div className="form-field">
              <label className="form-label">Email *</label>
              <input name="email" required type="email" placeholder="e.g. jane@company.com" defaultValue={initialData?.email} className="form-input" autoComplete="new-email" />
            </div>
          </div>

          {isAdd && (
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input name="password" required type={showAddPassword ? 'text' : 'password'} placeholder="Set a password" className="form-input" style={{ paddingRight: 36, width: '100%', boxSizing: 'border-box' }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowAddPassword(!showAddPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {showAddPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Department *</label>
              <select name="department" required defaultValue={initialData?.department?.name || ''} className="form-input">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Position *</label>
              <select name="position" required defaultValue={initialData?.position || ''} className="form-input">
                <option value="">Select Position</option>
                {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Salary *</label>
              <input name="salary" required type="number" placeholder="e.g. 60000" defaultValue={initialData?.salary} className="form-input" />
            </div>
            <div className="form-field">
              <label className="form-label">Status *</label>
              <select name="status" required defaultValue={initialData?.status || 'Active'} className="form-input">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Employment Type *</label>
              <select name="employmentType" required defaultValue={initialData?.employmentType || 'FTE'} className="form-input">
                <option value="FTE">Full-Time (FTE) — 22 days/yr</option>
                <option value="PTE">Part-Time (PTE) — 11 days/yr</option>
                <option value="PROBATION">Probation — Unpaid only</option>
                <option value="CONSULTANT">Consultant — Fixed salary, no shift rules</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Join Date *</label>
              <input name="joinDate" required type="date" defaultValue={initialData?.joinDate?.split('T')[0]} className="form-input" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Age *</label>
              <input name="age" required type="number" placeholder="e.g. 28" defaultValue={initialData?.age} className="form-input" />
            </div>
            <div className="form-field">
              <label className="form-label">Experience (years) *</label>
              <input name="experience" required type="number" placeholder="e.g. 3" defaultValue={initialData?.experience} className="form-input" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">
              {initialData ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
};

const ResetPasswordModal = ({ employee, onClose }) => {
  const [newPassword, setNewPassword] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/employees/${employee.id}/reset-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setSuccess(`Password reset successfully for ${employee.name}`);
      setNewPassword('');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Reset Password</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 16, color: '#374151', fontSize: '0.9rem' }}>
            Reset password for <strong>{employee.name}</strong> ({employee.email})
          </p>
          {error && <p style={{ color: '#dc2626', marginBottom: 12, fontSize: '0.85rem' }}>{error}</p>}
          {success && <p style={{ color: '#059669', marginBottom: 12, fontSize: '0.85rem' }}>{success}</p>}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-field" style={{ marginBottom: 16 }}>
              <label className="form-label">New Password *</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password (min 6 chars)"
                  className="form-input"
                  style={{ paddingRight: 36, width: '100%', boxSizing: 'border-box' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showPwd ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
