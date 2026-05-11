import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api/event-tickers';

export default function EventTickerManagement() {
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTickers = async () => {
    try {
      const res = await fetch(API, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      setTickers(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickers(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setError(''); setCreating(true);
    try {
      const res = await fetch(API, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      if (!res.ok) throw new Error('Failed to create');
      setNewMessage('');
      showSuccess('Ticker message created successfully');
      fetchTickers();
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleToggle = async (ticker) => {
    try {
      await fetch(`${API}/${ticker.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ticker.isActive })
      });
      fetchTickers();
    } catch (err) { setError('Failed to toggle'); }
  };

  const handleUpdate = async (id) => {
    if (!editMessage.trim()) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editMessage })
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditingId(null); setEditMessage('');
      showSuccess('Ticker message updated');
      fetchTickers();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticker message permanently?')) return;
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE', credentials: 'include' });
      showSuccess('Ticker message deleted');
      fetchTickers();
    } catch (err) { setError('Failed to delete'); }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const activeCount = tickers.filter(t => t.isActive).length;

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes successPop { 0% { opacity: 0; transform: translateY(-8px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.3); } 50% { box-shadow: 0 0 0 6px rgba(22,163,74,0); } }
        .etm-card {
          animation: fadeSlideIn 0.35s ease-out both;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .etm-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
        }
        .etm-badge-live {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .etm-input:focus {
          outline: none;
          border-color: #0C3D4A !important;
          box-shadow: 0 0 0 3px rgba(12,61,74,0.12);
        }
        .etm-btn-primary {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .etm-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(12,61,74,0.35);
        }
        .etm-btn-primary:active { transform: translateY(0); }
        .etm-btn-ghost {
          transition: all 0.2s ease;
        }
        .etm-btn-ghost:hover {
          background: #f1f5f9 !important;
          border-color: #94a3b8 !important;
        }
        .etm-btn-danger:hover {
          background: #fef2f2 !important;
          border-color: #f87171 !important;
        }
        .etm-success-bar {
          animation: successPop 0.3s ease-out both;
        }
        .etm-empty-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div style={{ padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #0C3D4A, #1a6b7a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(12,61,74,0.3)',
            }}>
              T
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                Event Ticker
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                Manage scrolling announcements visible to all users
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <div style={{
              padding: '10px 18px', borderRadius: 8, background: '#f8fafc',
              border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{tickers.length}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Total<br/>Messages</span>
            </div>
            <div style={{
              padding: '10px 18px', borderRadius: 8, background: '#f0fdf4',
              border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{activeCount}</span>
                {activeCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -8,
                    width: 8, height: 8, borderRadius: '50%', background: '#16a34a',
                  }} className="etm-badge-live" />
                )}
              </div>
              <span style={{ fontSize: 12, color: '#15803d' }}>Active<br/>Now</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            padding: '12px 16px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
            color: '#991b1b', borderRadius: 10, marginBottom: 16, fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1px solid #fecaca',
          }}>
            <span>{error}</span>
            <span onClick={() => setError('')} style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1, opacity: 0.6 }}>x</span>
          </div>
        )}
        {success && (
          <div className="etm-success-bar" style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            color: '#166534', borderRadius: 10, marginBottom: 16, fontSize: 13,
            border: '1px solid #bbf7d0', fontWeight: 500,
          }}>
            {success}
          </div>
        )}

        {/* Create form */}
        <form onSubmit={handleCreate} style={{
          display: 'flex', gap: 10, marginBottom: 28,
          padding: 20, borderRadius: 14,
          background: '#fff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <input
            className="etm-input"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a new announcement message..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10,
              border: '2px solid #e2e8f0', fontSize: 14,
              transition: 'all 0.2s ease',
            }}
            required
          />
          <button
            className="etm-btn-primary"
            type="submit"
            disabled={creating}
            style={{
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #0C3D4A, #1a6b7a)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: creating ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? 'Adding...' : '+ Add Message'}
          </button>
        </form>

        {/* Loading skeleton */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} className="etm-empty-shimmer" style={{ height: 72, borderRadius: 12 }} />
            ))}
          </div>
        ) : tickers.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: '#f8fafc', borderRadius: 16,
            border: '2px dashed #e2e8f0',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #e2e8f0, #f1f5f9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              T
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#334155', margin: 0 }}>No ticker messages yet</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
              Create your first announcement above and it will scroll across every page
            </p>
          </div>
        ) : (
          /* Ticker list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tickers.map((ticker, idx) => (
              <div
                key={ticker.id}
                className="etm-card"
                style={{
                  padding: '16px 20px',
                  background: '#fff',
                  border: `1px solid ${ticker.isActive ? '#e2e8f0' : '#f1f5f9'}`,
                  borderRadius: 12,
                  borderLeft: `4px solid ${ticker.isActive ? '#16a34a' : '#d1d5db'}`,
                  animationDelay: `${idx * 0.06}s`,
                  opacity: ticker.isActive ? 1 : 0.55,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {editingId === ticker.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="etm-input"
                      type="text"
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 8,
                        border: '2px solid #0C3D4A', fontSize: 13,
                        boxShadow: '0 0 0 3px rgba(12,61,74,0.1)',
                      }}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(ticker.id); if (e.key === 'Escape') { setEditingId(null); setEditMessage(''); } }}
                    />
                    <button
                      className="etm-btn-primary"
                      onClick={() => handleUpdate(ticker.id)}
                      style={{
                        padding: '10px 18px', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg, #0C3D4A, #1a6b7a)',
                        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="etm-btn-ghost"
                      onClick={() => { setEditingId(null); setEditMessage(''); }}
                      style={{
                        padding: '10px 14px', borderRadius: 8,
                        border: '1px solid #d1d5db', background: '#fff',
                        fontSize: 12, cursor: 'pointer', color: '#64748b',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 14, color: '#0f172a', fontWeight: 500,
                        lineHeight: 1.5,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {ticker.message}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {formatDate(ticker.createdAt)}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                          letterSpacing: '0.5px', textTransform: 'uppercase',
                          background: ticker.isActive ? '#f0fdf4' : '#f8fafc',
                          color: ticker.isActive ? '#16a34a' : '#94a3b8',
                          border: `1px solid ${ticker.isActive ? '#bbf7d0' : '#e2e8f0'}`,
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: ticker.isActive ? '#16a34a' : '#d1d5db',
                          }} />
                          {ticker.isActive ? 'Live' : 'Off'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {/* Toggle */}
                      <div
                        onClick={() => handleToggle(ticker)}
                        title={ticker.isActive ? 'Deactivate' : 'Activate'}
                        style={{
                          width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
                          background: ticker.isActive
                            ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                            : '#d1d5db',
                          position: 'relative',
                          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                          boxShadow: ticker.isActive ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 3,
                          left: ticker.isActive ? 25 : 3,
                          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        }} />
                      </div>
                      <button
                        className="etm-btn-ghost"
                        onClick={() => { setEditingId(ticker.id); setEditMessage(ticker.message); }}
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          border: '1px solid #d1d5db', background: '#fff',
                          fontSize: 12, cursor: 'pointer', color: '#0369a1', fontWeight: 500,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="etm-btn-ghost etm-btn-danger"
                        onClick={() => handleDelete(ticker.id)}
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          border: '1px solid #fca5a5', background: '#fff',
                          fontSize: 12, cursor: 'pointer', color: '#dc2626', fontWeight: 500,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 20, textAlign: 'center' }}>
          Active messages appear as a scrolling ticker bar on every page for all logged-in users.
        </p>
      </div>
    </>
  );
}
