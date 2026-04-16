import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Clock, CheckCircle, XCircle, Eye, Loader2, RefreshCw, Plus, DollarSign } from 'lucide-react';
import './LeaveRequests.css';
import LeaveRequestDetailsModal from './LeaveRequestDetailsModal';

const LeaveRequests = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Requests');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState({ totalApproved: 0, pendingRequests: 0, mostCommonType: 'None' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Session user
  const [sessionUser, setSessionUser] = useState(null);

  // Action modal (comment + paid/unpaid)
  const [actionModal, setActionModal] = useState(null); // { action, requestId, requestName }
  const [actionComment, setActionComment] = useState('');
  const [actionIsPaid, setActionIsPaid] = useState(true);

  // Submit leave request form
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({ leaveType: 'Annual Leave', startDate: '', endDate: '', reason: '' });
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Leave balance
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch session user
  useEffect(() => {
    fetch('http://localhost:5000/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.loggedIn) setSessionUser(d.user); })
      .catch(() => {});
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/leave`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      setLeaveRequests(await response.json());
      setError('');
    } catch (err) {
      setError('Failed to load leave requests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/leave/stats/summary`, { credentials: 'include' });
      if (response.ok) setStats(await response.json());
    } catch (err) {
      console.error('Error fetching leave stats:', err);
    }
  };

  const fetchLeaveBalance = async () => {
    if (!sessionUser?.id) return;
    setBalanceLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leave/balance/${sessionUser.id}`, { credentials: 'include' });
      if (res.ok) setLeaveBalance(await res.json());
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchLeaveRequests();
    await fetchLeaveStats();
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRequestId(null);
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'balance' && sessionUser?.id) fetchLeaveBalance();
  }, [activeTab, sessionUser]);

  // Open action modal (approve/decline)
  const openActionModal = (action, request) => {
    setActionModal({ action, requestId: request.id, requestName: request.name });
    setActionComment('');
    setActionIsPaid(true);
  };

  // Confirm action (sends comment + isPaid)
  const confirmAction = async () => {
    if (!actionModal) return;
    const { action, requestId } = actionModal;
    setActionLoading(prev => ({ ...prev, [requestId]: true }));

    try {
      const statusMap = { approve: 'Approved', decline: 'Declined', reconsider: 'Pending' };
      const body = {
        status: statusMap[action],
        approvedBy: sessionUser?.name || sessionUser?.email || 'Manager',
        comment: actionComment || null,
        isPaid: actionIsPaid
      };

      const response = await fetch(`${API_BASE_URL}/leave/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to ${action} request`);
      }

      await fetchLeaveRequests();
      await fetchLeaveStats();
    } catch (err) {
      setError(`Failed to ${actionModal.action} request: ` + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionModal.requestId]: false }));
      setActionModal(null);
    }
  };

  const handleAction = async (action, requestId) => {
    if (action === 'details') {
      setSelectedRequestId(requestId);
      setIsDetailsModalOpen(true);
      return;
    }
    const request = leaveRequests.find(r => r.id === requestId);
    if (action === 'reconsider') {
      // Reconsider doesn't need modal
      setActionLoading(prev => ({ ...prev, [requestId]: true }));
      try {
        await fetch(`${API_BASE_URL}/leave/${requestId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'Pending', approvedBy: null })
        });
        await fetchLeaveRequests();
        await fetchLeaveStats();
      } catch (err) {
        setError('Failed to reconsider: ' + err.message);
      } finally {
        setActionLoading(prev => ({ ...prev, [requestId]: false }));
      }
      return;
    }
    openActionModal(action, request);
  };

  // Submit leave request (for employees)
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const { leaveType, startDate, endDate, reason } = submitForm;
    if (!startDate || !endDate || !reason) { setSubmitError('All fields are required.'); return; }

    // Date validation: end must be >= start
    if (new Date(endDate) < new Date(startDate)) {
      setSubmitError('End date must be on or after the start date.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leaveType, startDate, endDate, reason })
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Failed to submit leave request'); return; }
      setShowSubmitForm(false);
      setSubmitForm({ leaveType: 'Annual Leave', startDate: '', endDate: '', reason: '' });
      await fetchLeaveRequests();
      await fetchLeaveStats();
    } catch (err) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const map = {
      'Sick': '#ef4444', 'Sick Leave': '#ef4444',
      'Emergency': '#f59e0b', 'Emergency Leave': '#f59e0b',
      'Maternity': '#8b5cf6', 'Maternity Leave': '#8b5cf6',
      'Annual': '#10b981', 'Annual Leave': '#10b981',
      'Paternity': '#3b82f6', 'Paternity Leave': '#3b82f6',
    };
    return map[type] || '#6b7280';
  };

  const isManager = sessionUser && ['SUPER_ADMIN', 'ADMIN', 'HR', 'HOD'].includes(sessionUser.role);
  const isHR = sessionUser && ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(sessionUser.role);

  const ActionButton = ({ status, requestId, request }) => {
    const isLoading = actionLoading[requestId];
    const btnBase = { padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' };

    if (status === 'Pending') return (
      <div className="action-buttons-container">
        {isManager && (
          <>
            <button onClick={() => handleAction('approve', requestId)} disabled={isLoading} style={{ ...btnBase, backgroundColor: isLoading ? '#9ca3af' : '#059669', color: 'white' }}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
            </button>
            <button onClick={() => handleAction('decline', requestId)} disabled={isLoading} style={{ ...btnBase, backgroundColor: isLoading ? '#9ca3af' : '#dc2626', color: 'white' }}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Decline
            </button>
          </>
        )}
        <button onClick={() => handleAction('details', requestId)} style={{ ...btnBase, backgroundColor: '#0C3D4A', color: 'white' }}>
          <Eye size={14} /> Details
        </button>
      </div>
    );

    if (status === 'Approved') return (
      <div className="action-buttons-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.875rem', fontWeight: '500' }}>
          <CheckCircle size={14} /> Approved
        </div>
        <button onClick={() => handleAction('details', requestId)} style={{ ...btnBase, backgroundColor: '#0C3D4A', color: 'white' }}>
          <Eye size={14} /> Details
        </button>
      </div>
    );

    if (status === 'Declined') return (
      <div className="action-buttons-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.875rem', fontWeight: '500' }}>
          <XCircle size={14} /> Declined
        </div>
        {isManager && (
          <button onClick={() => handleAction('reconsider', requestId)} disabled={actionLoading[requestId]} style={{ ...btnBase, border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151' }}>
            {actionLoading[requestId] ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Reconsider
          </button>
        )}
        <button onClick={() => handleAction('details', requestId)} style={{ ...btnBase, backgroundColor: '#0C3D4A', color: 'white' }}>
          <Eye size={14} /> Details
        </button>
      </div>
    );
    return null;
  };

  const getFilteredRequests = () => {
    let requests = leaveRequests;
    if (activeTab === 'history') requests = requests.filter(r => r.status === 'Approved');
    requests = requests.filter(r => (r.employee?.name || r.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeTab === 'requests' && selectedFilter !== 'All Requests') requests = requests.filter(r => r.status === selectedFilter);
    return requests;
  };

  const filteredRequests = getFilteredRequests();

  if (loading) return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#0C3D4A' }} />
        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading leave requests...</p>
      </div>
    </div>
  );

  return (
    <div className="main-content">
      {/* Error */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="page-header">
          <div className="black-square"></div>
          <h1 className="page-title">Leave Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isManager && (
            <button onClick={() => setShowSubmitForm(true)} style={{ padding: '0.5rem 1rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              <Plus size={16} /> New Request
            </button>
          )}
          <button onClick={refreshData} style={{ padding: '0.5rem 1rem', backgroundColor: '#0C3D4A', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab('requests')} className={`tab ${activeTab === 'requests' ? 'active' : 'inactive'}`}>Leave Requests</button>
        <button onClick={() => setActiveTab('history')} className={`tab ${activeTab === 'history' ? 'active' : 'inactive'}`}>Leave History</button>
        <button onClick={() => setActiveTab('balance')} className={`tab ${activeTab === 'balance' ? 'active' : 'inactive'}`}>Leave Balance</button>
      </div>

      {/* Leave Balance Tab */}
      {activeTab === 'balance' && (
        <div style={{ marginTop: '1rem' }}>
          {balanceLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#0C3D4A' }} />
              <p>Loading leave balance...</p>
            </div>
          ) : leaveBalance ? (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0C3D4A' }}>{leaveBalance.employee?.name}</span>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                    {leaveBalance.employee?.employmentType || 'FTE'}
                  </span>
                  {leaveBalance.isProbation && (
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>
                      Probation — Unpaid Leave Only
                    </span>
                  )}
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Annual Entitlement: <strong>{leaveBalance.annualEntitlement} days</strong></span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Year: {leaveBalance.year}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {leaveBalance.leaveBalance.map(lb => {
                  const pct = lb.allocated > 0 ? Math.min((lb.used / lb.allocated) * 100, 100) : 0;
                  const color = lb.remaining < 0 ? '#ef4444' : lb.remaining === 0 ? '#f59e0b' : '#10b981';
                  return (
                    <div key={lb.type} style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600, color: '#0C3D4A', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{lb.type}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>Used: <strong style={{ color: '#374151' }}>{lb.used}</strong></span>
                        <span>Allocated: <strong style={{ color: '#374151' }}>{lb.allocated}</strong></span>
                      </div>
                      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color }}>
                        {lb.remaining >= 0 ? `${lb.remaining} days remaining` : `${Math.abs(lb.remaining)} days over`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No balance data available</p>
            </div>
          )}
        </div>
      )}

      {/* Stats for History tab */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Approved', value: stats.totalApproved || 0, icon: <User size={20} color="#166534" />, bg: '#dcfce7' },
            { label: 'Pending Review', value: stats.pendingRequests || 0, icon: <Clock size={20} color="#92400e" />, bg: '#fef3c7' },
            { label: 'Most Common', value: stats.mostCommonType || 'None', icon: <Calendar size={20} color="#3730a3" />, bg: '#e0e7ff' },
          ].map(card => (
            <div key={card.label} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: card.bg, borderRadius: '0.5rem' }}>{card.icon}</div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{card.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests / History table */}
      {activeTab !== 'balance' && (
        <div className="content-area">
          <div className="table-header">
            <div className="table-header-left">
              <h2 className="table-title">{activeTab === 'requests' ? 'Leave Requests' : 'Leave History'}</h2>
            </div>
            <div className="table-header-right">
              <div className="search-container">
                <Search className="search-icon" />
                <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
              </div>
              {activeTab === 'requests' && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setFilterDropdownOpen(!filterDropdownOpen)} className="filter-button"><Filter style={{ width: '1.25rem', height: '1.25rem' }} /></button>
                  {filterDropdownOpen && (
                    <div className="dropdown">
                      {['All Requests', 'Pending', 'Approved', 'Declined'].map(f => (
                        <button key={f} onClick={() => { setSelectedFilter(f); setFilterDropdownOpen(false); }} className="dropdown-item">{f}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead className="table-head">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Duration</th>
                  <th className="table-header-cell">Start Date</th>
                  <th className="table-header-cell">End Date</th>
                  <th className="table-header-cell">Type</th>
                  <th className="table-header-cell">Paid</th>
                  <th className="table-header-cell">Status</th>
                  {activeTab === 'history' && <th className="table-header-cell">Approved By</th>}
                  {activeTab === 'history' && <th className="table-header-cell">Comment</th>}
                  {activeTab === 'requests' && <th className="table-header-cell actions">Actions</th>}
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredRequests.map(request => (
                  <tr key={request.id} className="table-row">
                    <td className="table-cell">{request.name}</td>
                    <td className="table-cell">{request.duration} days</td>
                    <td className="table-cell">{request.startDate}</td>
                    <td className="table-cell">{request.endDate}</td>
                    <td className="table-cell">
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500', backgroundColor: getTypeColor(request.type) + '20', color: getTypeColor(request.type), border: `1px solid ${getTypeColor(request.type)}40` }}>
                        {request.type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: request.isPaid !== false ? '#dcfce7' : '#fef3c7', color: request.isPaid !== false ? '#166534' : '#92400e', display: 'flex', alignItems: 'center', gap: '3px', width: 'fit-content' }}>
                        <DollarSign size={10} />
                        {request.isPaid !== false ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', fontWeight: '600', borderRadius: '9999px', backgroundColor: request.status === 'Approved' ? '#dcfce7' : request.status === 'Declined' ? '#fee2e2' : '#fef3c7', color: request.status === 'Approved' ? '#166534' : request.status === 'Declined' ? '#991b1b' : '#92400e' }}>
                        {request.status}
                      </span>
                    </td>
                    {activeTab === 'history' && <td className="table-cell">{request.approvedBy || '-'}</td>}
                    {activeTab === 'history' && (
                      <td className="table-cell" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: request.comment ? '#374151' : '#94a3b8', fontStyle: request.comment ? 'normal' : 'italic' }}>
                        {request.comment || '—'}
                      </td>
                    )}
                    {activeTab === 'requests' && (
                      <td className="table-cell actions">
                        <ActionButton status={request.status} requestId={request.id} request={request} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && !loading && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>No {activeTab === 'history' ? 'approved requests' : 'requests'} found</p>
            </div>
          )}

          {Object.keys(actionLoading).some(k => actionLoading[k]) && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Loader2 size={24} className="animate-spin" /><span>Processing request...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve/Decline Comment Modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ background: actionModal.action === 'approve' ? '#059669' : '#dc2626', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>
                {actionModal.action === 'approve' ? 'Approve' : 'Decline'} Leave Request
              </h3>
              <button onClick={() => setActionModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ margin: '0 0 1rem', color: '#374151', fontSize: '0.875rem' }}>
                {actionModal.action === 'approve' ? 'Approving' : 'Declining'} leave request for <strong>{actionModal.requestName}</strong>.
              </p>

              {/* Paid/Unpaid toggle — HR only */}
              {isHR && actionModal.action === 'approve' && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>LEAVE TYPE</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {[{ value: true, label: 'Paid Leave', color: '#059669', bg: '#dcfce7' }, { value: false, label: 'Unpaid Leave', color: '#b45309', bg: '#fef3c7' }].map(opt => (
                      <div key={String(opt.value)} onClick={() => setActionIsPaid(opt.value)}
                        style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', border: `2px solid ${actionIsPaid === opt.value ? opt.color : '#e2e8f0'}`, background: actionIsPaid === opt.value ? opt.bg : 'white', cursor: 'pointer', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: opt.color, transition: 'all 0.15s' }}>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Comment {actionModal.action === 'decline' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  rows={3}
                  placeholder={actionModal.action === 'approve' ? 'Add an optional note...' : 'Reason for declining...'}
                  style={{ width: '100%', padding: '0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setActionModal(null)} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button onClick={confirmAction} disabled={actionModal.action === 'decline' && !actionComment.trim()}
                  style={{ padding: '0.5rem 1.25rem', background: actionModal.action === 'approve' ? '#059669' : '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: (actionModal.action === 'decline' && !actionComment.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: (actionModal.action === 'decline' && !actionComment.trim()) ? 0.6 : 1 }}>
                  Confirm {actionModal.action === 'approve' ? 'Approval' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Leave Request Modal */}
      {showSubmitForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ background: '#0C3D4A', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Submit Leave Request</h3>
              <button onClick={() => { setShowSubmitForm(false); setSubmitError(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitLeave} style={{ padding: '1.25rem 1.5rem' }}>
              {submitError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.625rem 0.875rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{submitError}</div>
              )}

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leave Type *</label>
                <select value={submitForm.leaveType} onChange={e => setSubmitForm(p => ({ ...p, leaveType: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}>
                  {['Annual Leave', 'Sick Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date *</label>
                  <input type="date" required value={submitForm.startDate}
                    onChange={e => setSubmitForm(p => ({ ...p, startDate: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date *</label>
                  <input type="date" required value={submitForm.endDate}
                    min={submitForm.startDate}
                    onChange={e => setSubmitForm(p => ({ ...p, endDate: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1.5px solid ${submitForm.endDate && submitForm.startDate && new Date(submitForm.endDate) < new Date(submitForm.startDate) ? '#ef4444' : '#e2e8f0'}`, borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  {submitForm.endDate && submitForm.startDate && new Date(submitForm.endDate) < new Date(submitForm.startDate) && (
                    <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>End date must be after start date</span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason *</label>
                <textarea required rows={3} value={submitForm.reason}
                  onChange={e => setSubmitForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Briefly describe the reason for your leave..."
                  style={{ width: '100%', padding: '0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowSubmitForm(false); setSubmitError(''); }} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button type="submit" disabled={submitLoading} style={{ padding: '0.5rem 1.25rem', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: submitLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  {submitLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LeaveRequestDetailsModal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} requestId={selectedRequestId} API_BASE_URL={API_BASE_URL} />
    </div>
  );
};

export default LeaveRequests;
