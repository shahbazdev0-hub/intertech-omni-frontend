import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api/documents';

const DOCUMENT_TYPE_LABELS = {
  OFFER_LETTER: 'Offer Letter',
  APPOINTMENT_LETTER: 'Appointment Letter',
  PERMANENT_LETTER: 'Permanent Letter',
  PROMOTION_LETTER: 'Promotion Letter',
  TRANSFER_LETTER: 'Transfer Letter',
  INCREMENT_LETTER: 'Increment Letter',
  SALARY_SLIP: 'Salary Slip',
  EXPERIENCE_LETTER: 'Experience Letter',
  RELIEVING_LETTER: 'Relieving Letter',
  RESIGNATION_LETTER: 'Resignation Letter',
  NDA_AGREEMENT: 'NDA/Agreement',
  ID_PROOF: 'ID Proof',
  ADDRESS_PROOF: 'Address Proof',
  EDUCATIONAL_CERTIFICATE: 'Educational Certificate',
  OTHER: 'Other',
};

const DOCUMENT_CATEGORIES = {
  'Joining': ['OFFER_LETTER', 'APPOINTMENT_LETTER', 'NDA_AGREEMENT'],
  'Employment': ['PERMANENT_LETTER', 'PROMOTION_LETTER', 'TRANSFER_LETTER'],
  'Salary': ['SALARY_SLIP', 'INCREMENT_LETTER'],
  'Exit': ['RESIGNATION_LETTER', 'EXPERIENCE_LETTER', 'RELIEVING_LETTER'],
  'Personal': ['ID_PROOF', 'ADDRESS_PROOF', 'EDUCATIONAL_CERTIFICATE', 'OTHER'],
};

export default function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ employeeId: '', documentType: '', title: '', file: null });
  const [uploading, setUploading] = useState(false);

  // Employee picker search
  const [empSearchId, setEmpSearchId] = useState('');
  const [empSearchName, setEmpSearchName] = useState('');
  const [empSearchPosition, setEmpSearchPosition] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');

  const filteredEmployees = employees.filter(emp => {
    const matchId = !empSearchId || String(emp.id).includes(empSearchId);
    const matchName = !empSearchName || emp.name?.toLowerCase().includes(empSearchName.toLowerCase());
    const matchPos = !empSearchPosition || emp.position?.toLowerCase().includes(empSearchPosition.toLowerCase());
    return matchId && matchName && matchPos;
  });

  const selectEmployee = (emp) => {
    setUploadData(prev => ({ ...prev, employeeId: String(emp.id) }));
    setSelectedEmpName(`${emp.name} (ID: ${emp.id}) - ${emp.department?.name || 'N/A'}`);
  };

  const clearEmployeeSelection = () => {
    setUploadData(prev => ({ ...prev, employeeId: '' }));
    setSelectedEmpName('');
  };

  // Permissions from localStorage
  const perms = JSON.parse(localStorage.getItem('documentPermissions') || '[]');
  const canUpload = perms.includes('UPLOAD_DOCUMENT');
  const canDelete = perms.includes('DELETE_DOCUMENT');
  const canDownload = perms.includes('DOWNLOAD_DOCUMENT');
  const canViewAll = perms.includes('VIEW_ALL_DOCUMENTS');
  const canManagePerms = perms.includes('MANAGE_DOCUMENT_PERMISSIONS');

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (selectedEmployee) params.append('employeeId', selectedEmployee);
      if (selectedType) params.append('documentType', selectedType);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`${API}?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employees', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : data.employees || []);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    if (canViewAll || canUpload) fetchEmployees();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedEmployee, selectedType, searchTerm]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.employeeId || !uploadData.documentType || !uploadData.title) {
      setError('Please fill all fields and select a file');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('employeeId', uploadData.employeeId);
      formData.append('documentType', uploadData.documentType);
      formData.append('title', uploadData.title);

      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccess('Document uploaded successfully');
      setShowUpload(false);
      setUploadData({ employeeId: '', documentType: '', title: '', file: null });
      setSelectedEmpName(''); setEmpSearchId(''); setEmpSearchName(''); setEmpSearchPosition('');
      fetchDocuments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await fetch(`${API}/download/${doc.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/${doc.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess('Document deleted');
      fetchDocuments(pagination.currentPage);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  if (perms.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a' }}>Access Denied</h2>
        <p style={{ color: '#64748b' }}>You do not have permission to access Document Management.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Document Management</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            {pagination.totalCount} document{pagination.totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#0C3D4A', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + Upload Document
          </button>
        )}
      </div>

      {/* Messages */}
      {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error} <span onClick={() => setError('')} style={{ cursor: 'pointer', float: 'right' }}>x</span></div>}
      {success && <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{success}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by title or employee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, minWidth: 220 }}
        />
        {canViewAll && (
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        )}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">All Document Types</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading documents...</div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>
          <p style={{ fontSize: 16, margin: 0 }}>No documents found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Upload documents to get started</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Title</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Employee</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Type</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>File</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Size</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Uploaded</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{doc.title}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div>{doc.employee?.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{doc.employee?.department?.name}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                      background: '#e0f2fe', color: '#0369a1'
                    }}>
                      {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{doc.fileName}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{formatFileSize(doc.fileSize)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{formatDate(doc.createdAt)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {canDownload && (
                        <button
                          onClick={() => handleDownload(doc)}
                          style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#0369a1' }}
                        >
                          Download
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(doc)}
                          style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #fca5a5', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#dc2626' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1.5rem' }}>
          <button
            onClick={() => fetchDocuments(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: pagination.hasPrev ? 'pointer' : 'not-allowed', opacity: pagination.hasPrev ? 1 : 0.5 }}
          >
            Previous
          </button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: '#475569' }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchDocuments(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: pagination.hasNext ? 'pointer' : 'not-allowed', opacity: pagination.hasNext ? 1 : 0.5 }}
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', color: '#0f172a' }}>Upload Document</h3>
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Employee *</label>

                {/* Selected employee chip */}
                {uploadData.employeeId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#e0f2fe', borderRadius: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#0369a1', fontWeight: 500, flex: 1 }}>{selectedEmpName}</span>
                    <button type="button" onClick={clearEmployeeSelection} style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>x</button>
                  </div>
                ) : (
                  <>
                    {/* Search filters */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input
                        type="text"
                        placeholder="Search ID"
                        value={empSearchId}
                        onChange={(e) => setEmpSearchId(e.target.value)}
                        style={{ width: '25%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
                      />
                      <input
                        type="text"
                        placeholder="Search Name"
                        value={empSearchName}
                        onChange={(e) => setEmpSearchName(e.target.value)}
                        style={{ width: '40%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
                      />
                      <input
                        type="text"
                        placeholder="Search Position"
                        value={empSearchPosition}
                        onChange={(e) => setEmpSearchPosition(e.target.value)}
                        style={{ width: '35%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
                      />
                    </div>

                    {/* Employee list table */}
                    <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>ID</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Name</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Position</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Dept</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmployees.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '12px 8px', textAlign: 'center', color: '#94a3b8' }}>No employees found</td></tr>
                          ) : (
                            filteredEmployees.map(emp => (
                              <tr
                                key={emp.id}
                                onClick={() => selectEmployee(emp)}
                                style={{ cursor: 'pointer', borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '6px 8px', color: '#64748b' }}>{emp.id}</td>
                                <td style={{ padding: '6px 8px', fontWeight: 500 }}>{emp.name}</td>
                                <td style={{ padding: '6px 8px', color: '#64748b' }}>{emp.position || '-'}</td>
                                <td style={{ padding: '6px 8px', color: '#64748b' }}>{emp.department?.name || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>Click a row to select an employee</p>
                  </>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Document Type *</label>
                <select
                  value={uploadData.documentType}
                  onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                  required
                >
                  <option value="">Select Type</option>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([category, types]) => (
                    <optgroup key={category} label={category}>
                      {types.map(type => (
                        <option key={type} value={type}>{DOCUMENT_TYPE_LABELS[type]}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Title *</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="e.g. Offer Letter - John Doe"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>File * (PDF, DOCX, JPG, PNG — max 5MB)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                  style={{ width: '100%', padding: '8px 0', fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowUpload(false); setUploadData({ employeeId: '', documentType: '', title: '', file: null }); setSelectedEmpName(''); setEmpSearchId(''); setEmpSearchName(''); setEmpSearchPosition(''); }}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#0C3D4A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
