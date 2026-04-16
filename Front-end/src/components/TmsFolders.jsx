import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, X, FileText } from 'lucide-react';

const API = 'http://localhost:5000/api/tms';

export default function TmsFolders() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const perms = JSON.parse(localStorage.getItem('tmsPermissions') || '[]');
  const canCreate = perms.includes('CREATE_FOLDER');
  const canDelete = perms.includes('DELETE_FOLDER');

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API}/folders`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch folders');
      setFolders(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFolders(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!folderName.trim()) return setError('Folder name is required');
    try {
      const res = await fetch(`${API}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: folderName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowCreate(false);
      setFolderName('');
      fetchFolders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete folder "${name}"?`)) return;
    try {
      const res = await fetch(`${API}/folders/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchFolders();
    } catch (err) {
      setError(err.message);
    }
  };

  const folderColors = {
    'New': '#3b82f6',
    'Shortlisted': '#f59e0b',
    'Scheduled': '#8b5cf6',
    'Hired': '#10b981',
    'Rejected': '#ef4444',
  };

  if (loading) return <div className="tms-loading">Loading folders...</div>;

  return (
    <div className="tms-page">
      <div className="tms-page-header">
        <h1>Talent Management</h1>
        {canCreate && (
          <button className="tms-btn tms-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Folder
          </button>
        )}
      </div>

      {error && <div className="tms-error-msg">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}

      {/* Create Folder Modal */}
      {showCreate && (
        <div className="tms-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="tms-modal tms-modal-xs" onClick={(e) => e.stopPropagation()}>
            <div className="tms-modal-header">
              <h2>Create Folder</h2>
              <button className="tms-close-btn" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="tms-form-group">
                <label>Folder Name *</label>
                <input value={folderName} onChange={(e) => setFolderName(e.target.value)} required placeholder="Enter folder name" autoFocus />
              </div>
              <div className="tms-form-actions">
                <button type="button" className="tms-btn tms-btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="tms-btn tms-btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tms-folders-grid">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="tms-folder-card"
            onClick={() => navigate(`/tms/folders/${folder.id}`)}
            style={{ borderTopColor: folderColors[folder.name] || '#6b7280' }}
          >
            <div className="tms-folder-icon" style={{ color: folderColors[folder.name] || '#6b7280' }}>
              <FolderOpen size={36} />
            </div>
            <h3>{folder.name}</h3>
            <div className="tms-folder-meta">
              <span><FileText size={14} /> {folder._count?.resumes || 0} resumes</span>
              {folder.isDefault && <span className="tms-badge-default">Default</span>}
            </div>
            {canDelete && !folder.isDefault && (
              <button
                className="tms-folder-delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, folder.name); }}
                title="Delete folder"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
