import React, { useState, useEffect } from 'react';
import { Upload, Download, Edit3, MessageSquare, Search, X, Filter, Trash2, Eye, UserPlus } from 'lucide-react';
import mammoth from 'mammoth';

const API = 'http://localhost:5000/api/tms';

export default function TmsUploadResume() {
  const [resumes, setResumes] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [commentModal, setCommentModal] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tmsUser = JSON.parse(localStorage.getItem('tmsUser') || '{}');

  const emptyForm = {
    firstName: '', lastName: '', assigneeId: '', date: '', priority: 'MEDIUM',
    status: 'NEW', phone: '', designation: '', description: '', comment: '', file: null,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchResumes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`${API}/resumes?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      setResumes(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [convertModal, setConvertModal] = useState(null);
  const [convertForm, setConvertForm] = useState({ email: '', salary: '', departmentId: '', joinDate: '', age: '', experience: '', employmentType: 'PROBATION' });
  const [convertResult, setConvertResult] = useState(null);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/departments', { credentials: 'include' });
      if (res.ok) setDepartments(await res.json());
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/auth/users`, { credentials: 'include' });
      if (res.ok) setUsers(await res.json());
    } catch {}
  };

  const fetchDesignations = async () => {
    try {
      const res = await fetch(`${API}/manage/designations`, { credentials: 'include' });
      if (res.ok) setDesignations(await res.json());
    } catch {}
  };

  useEffect(() => { fetchResumes(); fetchUsers(); fetchDesignations(); fetchDepartments(); }, [search, filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (/[()]/.test(form.firstName) || /[()]/.test(form.lastName)) {
      return setError('First/Last name must not contain parentheses ( or )');
    }
    if (!/^\d+$/.test(form.phone)) {
      return setError('Phone number must contain only numbers');
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, v); });

    try {
      const url = editingId ? `${API}/resumes/${editingId}` : `${API}/resumes`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, credentials: 'include', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchResumes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (resume) => {
    setForm({
      firstName: resume.firstName || '',
      lastName: resume.lastName || '',
      assigneeId: String(resume.assigneeId),
      date: resume.date?.split('T')[0] || '',
      priority: resume.priority,
      status: resume.status,
      phone: resume.phone,
      designation: resume.designation,
      description: resume.description || '',
      comment: '',
      file: null,
    });
    setEditingId(resume.id);
    setShowForm(true);
  };

  const handleDownload = (id) => {
    window.open(`${API}/resumes/${id}/download`, '_blank');
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete resume "${label}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/resumes/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchResumes();
    } catch (err) {
      setError(err.message);
    }
  };

  const perms = JSON.parse(localStorage.getItem('tmsPermissions') || '[]');
  const canDelete = perms.includes('DELETE_RESUME');
  const canUpload = perms.includes('UPLOAD_RESUME');
  const canExport = perms.includes('EXPORT_CSV');
  const canConvert = perms.includes('MANAGE_USERS');

  const openConvertModal = (resume) => {
    const name = `${resume.firstName || ''} ${resume.lastName || ''}`.trim();
    const emailSuggestion = name ? `${name.toLowerCase().replace(/ /g, '.')}@hrcore.com` : '';
    setConvertForm({ email: emailSuggestion, salary: '', departmentId: '', joinDate: new Date().toISOString().split('T')[0], age: '', experience: '', employmentType: 'PROBATION' });
    setConvertResult(null);
    setConvertModal(resume);
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/resumes/${convertModal.id}/convert-to-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(convertForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setConvertResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Preview state
  const [previewModal, setPreviewModal] = useState(null); // { name, html, type, url }
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
        // docx/doc — convert to HTML using mammoth
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

  const openComments = async (resume) => {
    setCommentModal(resume);
    try {
      const res = await fetch(`${API}/comments/${resume.id}`, { credentials: 'include' });
      if (res.ok) setComments(await res.json());
    } catch {}
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resumeId: commentModal.id, comment: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        const updated = await fetch(`${API}/comments/${commentModal.id}`, { credentials: 'include' });
        if (updated.ok) setComments(await updated.json());
        fetchResumes();
      }
    } catch {}
  };

  const saveEditComment = async (commentId, text) => {
    try {
      await fetch(`${API}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment: text }),
      });
      setEditingComment(null);
      const updated = await fetch(`${API}/comments/${commentModal.id}`, { credentials: 'include' });
      if (updated.ok) setComments(await updated.json());
      fetchResumes();
    } catch {}
  };

  const statusColors = {
    NEW: '#3b82f6', SHORTLISTED: '#f59e0b', SCHEDULED: '#8b5cf6', HIRED: '#10b981', REJECTED: '#ef4444',
  };

  return (
    <div className="tms-page">
      <div className="tms-page-header">
        <h1>Upload Resume</h1>
        {canUpload && <button className="tms-btn tms-btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
          <Upload size={16} /> Upload File
        </button>}
      </div>

      {error && <div className="tms-error-msg">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}

      <div className="tms-filters">
        <div className="tms-search-box">
          <Search size={16} />
          <input placeholder="Search by name, position, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="HIRED">Hired</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Upload / Edit Form Modal */}
      {showForm && (
        <div className="tms-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="tms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>{editingId ? 'Edit Resume' : 'Upload Resume'}</h2>
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
                  <label>Status *</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                    <option value="NEW">New</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="tms-form-group">
                  <label>Phone Number *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="Numbers only" />
                </div>
                <div className="tms-form-group">
                  <label>Position *</label>
                  <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required>
                    <option value="">Select Position</option>
                    {designations.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="tms-form-group">
                  <label>Choose File {!editingId && '*'}</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} required={!editingId} />
                  <small>PDF, DOC, DOCX only. Max 5MB.</small>
                </div>
              </div>
              <div className="tms-form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description" />
              </div>
              {!editingId && (
                <div className="tms-form-group">
                  <label>Comment</label>
                  <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} placeholder="Optional comment" />
                </div>
              )}
              <div className="tms-form-actions">
                <button type="button" className="tms-btn tms-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="tms-btn tms-btn-primary">{editingId ? 'Update' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {commentModal && (
        <div className="tms-modal-overlay" onClick={() => { setCommentModal(null); setComments([]); }}>
          <div className="tms-modal tms-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>Comments - {`${commentModal.firstName || ''} ${commentModal.lastName || ''}`.trim() || commentModal.fileName}</h2>
              <button className="tms-close-btn" onClick={() => { setCommentModal(null); setComments([]); }}><X size={20} /></button>
            </div>
            <div className="tms-comments-list">
              {comments.length === 0 && <p className="tms-empty">No comments yet</p>}
              {comments.map((c) => (
                <div key={c.id} className="tms-comment-item">
                  <div className="tms-comment-meta">
                    <strong>{c.user.name}</strong>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  {editingComment === c.id ? (
                    <div className="tms-comment-edit">
                      <textarea defaultValue={c.comment} id={`edit-comment-${c.id}`} rows={2} />
                      <div className="tms-comment-edit-actions">
                        <button className="tms-btn tms-btn-sm tms-btn-secondary" onClick={() => setEditingComment(null)}>Cancel</button>
                        <button className="tms-btn tms-btn-sm tms-btn-primary" onClick={() => saveEditComment(c.id, document.getElementById(`edit-comment-${c.id}`).value)}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <p>{c.comment}</p>
                  )}
                  {c.user.id === tmsUser.id && editingComment !== c.id && (
                    <button className="tms-btn tms-btn-sm tms-btn-ghost" onClick={() => setEditingComment(c.id)}>
                      <Edit3 size={12} /> Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="tms-add-comment">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." rows={2} />
              <button className="tms-btn tms-btn-primary tms-btn-sm" onClick={addComment} disabled={!newComment.trim()}>Add Comment</button>
            </div>
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

      {/* Convert to Employee Modal */}
      {convertModal && (
        <div className="tms-modal-overlay" onClick={() => { setConvertModal(null); setConvertResult(null); }}>
          <div className="tms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>Convert to Employee — {`${convertModal.firstName || ''} ${convertModal.lastName || ''}`.trim()}</h2>
              <button className="tms-close-btn" onClick={() => { setConvertModal(null); setConvertResult(null); }}><X size={20} /></button>
            </div>

            {convertResult ? (
              <div style={{ padding: '24px' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                  <h3 style={{ color: '#065f46', margin: '0 0 12px' }}>Employee Created Successfully</h3>
                  <p style={{ margin: '4px 0' }}><strong>Name:</strong> {convertResult.employee.name}</p>
                  <p style={{ margin: '4px 0' }}><strong>Email:</strong> {convertResult.employee.email}</p>
                  <p style={{ margin: '4px 0' }}><strong>Position:</strong> {convertResult.employee.position}</p>
                  <p style={{ margin: '4px 0' }}><strong>Temporary Password:</strong> <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{convertResult.tempPassword}</code></p>
                  <p style={{ color: '#92400e', fontSize: '13px', marginTop: '12px' }}>Please share these credentials with the new employee securely.</p>
                </div>
                <button className="tms-btn tms-btn-primary" onClick={() => { setConvertModal(null); setConvertResult(null); }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleConvert} className="tms-upload-form">
                <div style={{ padding: '12px 20px 0', background: '#f0fdf4', borderRadius: '6px', margin: '0 20px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#166534' }}>
                    <strong>Candidate:</strong> {`${convertModal.firstName || ''} ${convertModal.lastName || ''}`.trim()} | <strong>Position:</strong> {convertModal.designation}
                  </p>
                </div>
                <div className="tms-form-grid">
                  <div className="tms-form-group">
                    <label>Email *</label>
                    <input type="email" value={convertForm.email} onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })} required placeholder="employee@hrcore.com" />
                  </div>
                  <div className="tms-form-group">
                    <label>Salary *</label>
                    <input type="number" value={convertForm.salary} onChange={(e) => setConvertForm({ ...convertForm, salary: e.target.value })} required placeholder="e.g. 50000" />
                  </div>
                  <div className="tms-form-group">
                    <label>Department *</label>
                    <select value={convertForm.departmentId} onChange={(e) => setConvertForm({ ...convertForm, departmentId: e.target.value })} required>
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="tms-form-group">
                    <label>Join Date *</label>
                    <input type="date" value={convertForm.joinDate} onChange={(e) => setConvertForm({ ...convertForm, joinDate: e.target.value })} required />
                  </div>
                  <div className="tms-form-group">
                    <label>Age *</label>
                    <input type="number" value={convertForm.age} onChange={(e) => setConvertForm({ ...convertForm, age: e.target.value })} required placeholder="e.g. 25" min="18" max="70" />
                  </div>
                  <div className="tms-form-group">
                    <label>Experience (years) *</label>
                    <input type="number" value={convertForm.experience} onChange={(e) => setConvertForm({ ...convertForm, experience: e.target.value })} required placeholder="e.g. 3" min="0" />
                  </div>
                  <div className="tms-form-group">
                    <label>Employment Type</label>
                    <select value={convertForm.employmentType} onChange={(e) => setConvertForm({ ...convertForm, employmentType: e.target.value })}>
                      <option value="PROBATION">Probation</option>
                      <option value="FTE">Full-Time (FTE)</option>
                      <option value="PTE">Part-Time (PTE)</option>
                      <option value="CONSULTANT">Consultant</option>
                    </select>
                  </div>
                </div>
                <div className="tms-form-actions">
                  <button type="button" className="tms-btn tms-btn-secondary" onClick={() => setConvertModal(null)}>Cancel</button>
                  <button type="submit" className="tms-btn tms-btn-primary"><UserPlus size={16} /> Create Employee</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Resume Table */}
      {loading ? <div className="tms-loading">Loading...</div> : (
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
                <th>Date</th>
                <th>Last Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resumes.length === 0 ? (
                <tr><td colSpan={11} className="tms-empty">No resumes found</td></tr>
              ) : resumes.map((r) => (
                <tr key={r.id}>
                  <td className="tms-filename">{r.firstName || '-'}</td>
                  <td className="tms-filename">{r.lastName || '-'}</td>
                  <td>{r.designation}</td>
                  <td>{r.phone}</td>
                  <td><span className="tms-badge" style={{ background: statusColors[r.status] }}>{r.status}</span></td>
                  <td><span className={`tms-priority tms-priority-${r.priority.toLowerCase()}`}>{r.priority}</span></td>
                  <td>{r.assignee?.name}</td>
                  <td>{r.assignedBy?.name}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td className="tms-last-comment">{r.comments?.[0]?.comment || '-'}</td>
                  <td className="tms-actions">
                    <button title="View Resume" className="tms-view-btn" onClick={() => handleView(r)}><Eye size={15} /></button>
                    <button title="Download" onClick={() => handleDownload(r.id)}><Download size={15} /></button>
                    <button title="Edit" onClick={() => handleEdit(r)}><Edit3 size={15} /></button>
                    <button title="Comments" onClick={() => openComments(r)}><MessageSquare size={15} /></button>
                    {canDelete && <button title="Delete" className="tms-delete-btn" onClick={() => handleDelete(r.id, `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fileName)}><Trash2 size={15} /></button>}
                    {canConvert && r.status === 'HIRED' && <button title="Convert to Employee" className="tms-convert-btn" style={{ color: '#10b981' }} onClick={() => openConvertModal(r)}><UserPlus size={15} /></button>}
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
