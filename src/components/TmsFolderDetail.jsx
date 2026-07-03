import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Edit3, MessageSquare, FileDown, X, Trash2, Eye, Search } from 'lucide-react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_URL}/api/tms`;

export default function TmsFolderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tmsUser = JSON.parse(localStorage.getItem('tmsUser') || '{}');

  const emptyForm = {
    firstName: '', lastName: '', assigneeId: '', date: '', priority: 'MEDIUM',
    status: '', phone: '', designation: '', description: '', comment: '', file: null,
  };
  const [form, setForm] = useState(emptyForm);
  const [designations, setDesignations] = useState([]);

  // Filters
  const [fSearch, setFSearch] = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fPosition, setFPosition] = useState('');
  const [fFromDate, setFFromDate] = useState('');
  const [fToDate, setFToDate] = useState('');

  const fetchData = async () => {
    try {
      const [folderRes, usersRes, desRes] = await Promise.all([
        fetch(`${API}/folders/${id}/resumes`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' }),
        fetch(`${API}/manage/designations`, { credentials: 'include' }),
      ]);
      if (!folderRes.ok) throw new Error('Failed to fetch folder');
      const folderData = await folderRes.json();
      setFolder(folderData.folder);
      setResumes(folderData.resumes);
      // Pre-select status based on folder name
      const statusMap = { 'New': 'NEW', 'Shortlisted': 'SHORTLISTED', 'Scheduled': 'SCHEDULED', 'Hired': 'HIRED', 'Rejected': 'REJECTED' };
      setForm(prev => ({ ...prev, status: statusMap[folderData.folder.name] || 'NEW' }));
      if (usersRes.ok) setUsers(await usersRes.json());
      
      // Handle designations: use API data or fallback to default list
      if (desRes.ok) {
        setDesignations(await desRes.json());
      } else {
        // Fallback default designations if API fails
        setDesignations([
          'Software Engineer', 'UI/UX Designer', 'Project Manager', 
          'QA Engineer', 'DevOps Engineer', 'Business Analyst', 
          'Data Analyst', 'HR Executive'
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (/[()]/.test(form.firstName) || /[()]/.test(form.lastName)) return setError('First/Last name must not contain parentheses');
    if (!/^\d+$/.test(form.phone)) return setError('Phone must be numbers only');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, v); });

    try {
      const res = await fetch(`${API}/resumes`, { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowForm(false);
      setForm({ ...emptyForm, status: form.status });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getFolderExportData = () => {
    const headers = ['First Name', 'Last Name', 'Position', 'Phone', 'Status', 'Priority', 'Assignee', 'Date'];
    const rows = filteredResumes.map(r => [r.firstName || '', r.lastName || '', r.designation, r.phone, r.status, r.priority, r.assignee?.name, new Date(r.date).toLocaleDateString()]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    if (filteredResumes.length === 0) return;
    const { headers, rows } = getFolderExportData();
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folder?.name || 'folder'}_resumes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (filteredResumes.length === 0) return;
    const { headers, rows } = getFolderExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumes');
    XLSX.writeFile(wb, `${folder?.name || 'folder'}_resumes.xlsx`);
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete resume "${label}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/resumes/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const perms = JSON.parse(localStorage.getItem('tmsPermissions') || '[]');
  const canDelete = perms.includes('DELETE_RESUME');
  const canUpload = perms.includes('UPLOAD_RESUME');

  // Apply filters client-side on the resumes already fetched for this folder
  const filteredResumes = useMemo(() => {
    return resumes.filter(r => {
      if (fSearch) {
        const q = fSearch.toLowerCase();
        const inName = (r.firstName || '').toLowerCase().includes(q)
          || (r.lastName || '').toLowerCase().includes(q)
          || (r.fileName || '').toLowerCase().includes(q);
        const inOther = (r.designation || '').toLowerCase().includes(q)
          || (r.phone || '').toLowerCase().includes(q);
        if (!inName && !inOther) return false;
      }
      if (fPriority && r.priority !== fPriority) return false;
      if (fPosition && r.designation !== fPosition) return false;
      if (fFromDate) {
        const d = new Date(r.date);
        const from = new Date(fFromDate);
        if (d < from) return false;
      }
      if (fToDate) {
        const d = new Date(r.date);
        const to = new Date(fToDate);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [resumes, fSearch, fPriority, fPosition, fFromDate, fToDate]);

  const clearFilters = () => {
    setFSearch(''); setFPriority(''); setFPosition(''); setFFromDate(''); setFToDate('');
  };
  const hasActiveFilters = fSearch || fPriority || fPosition || fFromDate || fToDate;

  const [previewModal, setPreviewModal] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleView = async (resume) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API}/resumes/${resume.id}/view`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load file');
      const ext = (resume.originalName || resume.fileName || '').split('.').pop().toLowerCase();
      const displayName = `${resume.firstName || ''} ${resume.lastName || ''}`.trim() || resume.fileName;
      if (ext === 'pdf') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewModal({ name: displayName, type: 'pdf', url });
      } else {
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewModal({ name: displayName, type: 'docx', html: result.value });
      }
    } catch (err) {
      setError('Could not preview file: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewModal?.url) URL.revokeObjectURL(previewModal.url);
    setPreviewModal(null);
  };

  const statusColors = {
    NEW: '#3b82f6', SHORTLISTED: '#f59e0b', SCHEDULED: '#8b5cf6', HIRED: '#10b981', REJECTED: '#ef4444',
  };

  if (loading) return <div className="tms-loading">Loading...</div>;

  return (
    <div className="tms-page">
      <div className="tms-page-header">
        <div className="tms-header-left">
          <button className="tms-btn tms-btn-ghost" onClick={() => navigate('/tms/folders')}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1>{folder?.name || 'Folder'}</h1>
          <span className="tms-resume-count">{filteredResumes.length} of {resumes.length} resumes</span>
        </div>
        <div className="tms-header-right">
          <button className="tms-btn tms-btn-secondary" onClick={handleExportCSV} disabled={filteredResumes.length === 0}>
            <FileDown size={16} /> CSV
          </button>
          <button className="tms-btn tms-btn-secondary" onClick={handleExportExcel} disabled={filteredResumes.length === 0} style={{ backgroundColor: '#059669', color: 'white', borderColor: '#059669' }}>
            <FileDown size={16} /> Excel
          </button>
          {canUpload && <button className="tms-btn tms-btn-primary" onClick={() => setShowForm(true)}>
            <Upload size={16} /> Upload Resume
          </button>}
        </div>
      </div>

      {/* Filters */}
      <div className="tms-filters">
        <div className="tms-search-box">
          <Search size={16} />
          <input placeholder="Search by name, position, phone..." value={fSearch} onChange={(e) => setFSearch(e.target.value)} />
        </div>
        <select value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select value={fPosition} onChange={(e) => setFPosition(e.target.value)}>
          <option value="">All Positions</option>
          {designations.map((d) => typeof d === 'string'
            ? <option key={d} value={d}>{d}</option>
            : <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <input type="date" value={fFromDate} onChange={(e) => setFFromDate(e.target.value)} title="From date" />
        <input type="date" value={fToDate} onChange={(e) => setFToDate(e.target.value)} title="To date" />
        {hasActiveFilters && (
          <button className="tms-btn tms-btn-ghost" onClick={clearFilters}><X size={14} /> Clear</button>
        )}
      </div>

      {error && <div className="tms-error-msg">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}

      {/* Upload Form Modal */}
      {showForm && (
        <div className="tms-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="tms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>Upload Resume to {folder?.name}</h2>
              <button className="tms-close-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="tms-upload-form">
              <div className="tms-form-grid">
                <div className="tms-form-group">
                  <label>First Name *</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required placeholder="First name" />
                </div>
                <div className="tms-form-group">
                  <label>Last Name *</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required placeholder="Last name" />
                </div>
                <div className="tms-form-group">
                  <label>Assignee *</label>
                  <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} required>
                    <option value="">Select Assignee</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div className="tms-form-group">
                  <label>Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="tms-form-group">
                  <label>Priority *</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} required>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="tms-form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={folder?.isDefault}>
                    <option value="NEW">New</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  {folder?.isDefault && <small>Status is fixed for default folders</small>}
                </div>
                <div className="tms-form-group">
                  <label>Phone Number *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="Numbers only" />
                </div>
                <div className="tms-form-group">
                  <label>Position *</label>
                  <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required>
                    <option value="">Select Position</option>
                    {designations.map((d) => typeof d === 'string' ? <option key={d} value={d}>{d}</option> : <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="tms-form-group">
                  <label>Choose File *</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} required />
                  <small>PDF, DOC, DOCX only. Max 5MB.</small>
                </div>
              </div>
              <div className="tms-form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="tms-form-actions">
                <button type="button" className="tms-btn tms-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="tms-btn tms-btn-primary">Done</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewLoading && (
        <div className="tms-modal-overlay">
          <div className="tms-loading" style={{ color: '#fff', fontSize: '18px' }}>Loading preview...</div>
        </div>
      )}
      {previewModal && (
        <div className="tms-modal-overlay" onClick={closePreview}>
          <div className="tms-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>{previewModal.name || 'Resume Preview'}</h2>
              <button className="tms-close-btn" onClick={closePreview}><X size={20} /></button>
            </div>
            <div className="tms-preview-content">
              {previewModal.type === 'pdf' ? (
                <iframe src={previewModal.url} title="Resume Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
              ) : (
                <div className="tms-docx-preview" dangerouslySetInnerHTML={{ __html: previewModal.html }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resume Table */}
      <div className="tms-table-wrapper">
        <table className="tms-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Position</th>
              <th>Phone</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Assigned By</th>
              <th>Date</th>
              <th>Last Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResumes.length === 0 ? (
              <tr><td colSpan={10} className="tms-empty">{resumes.length === 0 ? 'No resumes in this folder' : 'No resumes match the filters'}</td></tr>
            ) : filteredResumes.map((r) => (
              <tr key={r.id}>
                <td className="tms-filename">{r.firstName || '-'}</td>
                <td className="tms-filename">{r.lastName || '-'}</td>
                <td>{r.designation}</td>
                <td>{r.phone}</td>
                <td><span className={`tms-priority tms-priority-${r.priority.toLowerCase()}`}>{r.priority}</span></td>
                <td>{r.assignee?.name}</td>
                <td>{r.assignedBy?.name}</td>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td className="tms-last-comment">{r.comments?.[0]?.comment || '-'}</td>
                <td className="tms-actions">
                  <button title="View Resume" className="tms-view-btn" onClick={() => handleView(r)}><Eye size={15} /></button>
                  <button title="Download" onClick={() => window.open(`${API}/resumes/${r.id}/download`, '_blank')}><Download size={15} /></button>
                  {canDelete && <button title="Delete" className="tms-delete-btn" onClick={() => handleDelete(r.id, `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fileName)}><Trash2 size={15} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}