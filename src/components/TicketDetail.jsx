import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_URL}/api/tickets`;
const COMMENT_API = `${API_URL}/api/ticket-comments`;

const STATUS_COLORS = {
  PENDING: '#3b82f6', IN_PROGRESS: '#f59e0b', RESOLVED: '#10b981', CLOSED: '#6b7280', INVALID: '#ef4444',
};
const PRIORITY_COLORS = {
  LOW: '#6b7280', MEDIUM: '#3b82f6', HIGH: '#f59e0b', URGENT: '#ef4444',
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [employees, setEmployees] = useState([]);
  const [sending, setSending] = useState(false);
  const perms = JSON.parse(localStorage.getItem('ticketPermissions') || '[]');

  const fetchTicket = async () => {
    try {
      const res = await fetch(`${API}/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Not found');
      setTicket(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    if (perms.includes('ASSIGN_TICKET')) {
      fetch(`${API_URL}/api/employees`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setEmployees(data); })
        .catch(() => {});
    }
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchTicket();
    } catch (err) { alert('Failed to update status'); }
  };

  const handleAssign = async (assignedToId) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: assignedToId || null }),
      });
      if (res.ok) fetchTicket();
    } catch (err) { alert('Failed to assign'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${COMMENT_API}/${id}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });
      if (res.ok) {
        setComment('');
        fetchTicket();
      }
    } catch (err) { alert('Failed to add comment'); }
    finally { setSending(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await fetch(`${COMMENT_API}/comment/${commentId}`, { method: 'DELETE', credentials: 'include' });
      fetchTicket();
    } catch (err) { alert('Failed to delete comment'); }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
  if (!ticket) return <div style={{ padding: '2rem', color: '#dc2626' }}>Ticket not found</div>;

  const badge = (text, bg) => (
    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: bg }}>{text}</span>
  );

  const cardStyle = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1rem' };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 };
  const valueStyle = { fontSize: 14, color: '#1e293b' };
  const selectStyle = { padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <button onClick={() => navigate('/tickets')} style={{ background: 'none', border: 'none', color: '#0C3D4A', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
        &larr; Back to Tickets
      </button>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.3rem', color: '#0f172a' }}>#{ticket.id} — {ticket.title}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {badge(ticket.status.replace('_', ' '), STATUS_COLORS[ticket.status])}
              {badge(ticket.priority, PRIORITY_COLORS[ticket.priority])}
              {badge(ticket.category?.name, '#6366f1')}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div><div style={labelStyle}>Submitted By</div><div style={valueStyle}>{ticket.submittedBy?.name || '—'}</div></div>
          <div><div style={labelStyle}>Department</div><div style={valueStyle}>{ticket.submittedBy?.department?.name || 'N/A'}</div></div>
          <div><div style={labelStyle}>Assigned To</div><div style={valueStyle}>{ticket.assignedTo?.name || 'Unassigned'}</div></div>
          <div><div style={labelStyle}>Created</div><div style={valueStyle}>{new Date(ticket.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
          {ticket.resolvedBy && (
            <div><div style={labelStyle}>Resolved By</div><div style={{ ...valueStyle, color: '#10b981', fontWeight: 600 }}>{ticket.resolvedBy.name}</div></div>
          )}
          {ticket.resolvedAt && <div><div style={labelStyle}>Resolved Date</div><div style={valueStyle}>{new Date(ticket.resolvedAt).toLocaleDateString('en-GB')}</div></div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Description</div>
          <div style={{ ...valueStyle, whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 8 }}>{ticket.description}</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          {perms.includes('UPDATE_TICKET_STATUS') && (
            <div>
              <label style={{ fontSize: 12, color: '#64748b', marginRight: 6 }}>Status:</label>
              <select style={selectStyle} value={ticket.status} onChange={e => handleStatusChange(e.target.value)}>
                {['PENDING', 'IN_PROGRESS', 'RESOLVED', 'INVALID', 'CLOSED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          )}
          {perms.includes('ASSIGN_TICKET') && (
            <div>
              <label style={{ fontSize: 12, color: '#64748b', marginRight: 6 }}>Assign:</label>
              <select style={selectStyle} value={ticket.assignedToId || ''} onChange={e => handleAssign(e.target.value)}>
                <option value="">Unassigned</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Comments ({ticket.comments?.length || 0})</h3>

        {ticket.comments?.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13 }}>No comments yet.</p>}

        {ticket.comments?.map(c => (
          <div key={c.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 10, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{c.author?.name}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleString('en-GB')}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap' }}>{c.content}</p>
            <button onClick={() => handleDeleteComment(c.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}>
              &times;
            </button>
          </div>
        ))}

        {perms.includes('ADD_COMMENT') && (
          <form onSubmit={handleAddComment} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
              placeholder="Add a comment..." value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button type="submit" disabled={sending} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0C3D4A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
              {sending ? '...' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
