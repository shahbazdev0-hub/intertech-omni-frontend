import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Clock, CheckCircle, XCircle, Eye, Loader2, RefreshCw } from 'lucide-react';
import './LeaveRequests.css';
import LeaveRequestDetailsModal from './LeaveRequestDetailsModal';

const LeaveRequests = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Requests');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState({
    totalApproved: 0,
    pendingRequests: 0,
    mostCommonType: 'None'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch all leave requests from backend
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/leave`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const requests = await response.json();
      setLeaveRequests(requests);
      setError('');
    } catch (err) {
      setError('Failed to load leave requests: ' + err.message);
      console.error('Error fetching leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leave statistics from backend
  const fetchLeaveStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/leave/stats/summary`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave statistics');
      }

      const statistics = await response.json();
      setStats(statistics);
    } catch (err) {
      console.error('Error fetching leave stats:', err);
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

  // Fetch data on component mount
  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveStats();
  }, []);

  // Handle approve/decline/reconsider actions
  const handleAction = async (action, requestId) => {
  const request = leaveRequests.find(req => req.id === requestId);
  
  if (action === 'details') {
    // Open the details modal
    setSelectedRequestId(requestId);
    setIsDetailsModalOpen(true);
    return; // Exit early for details action
  }
  
  setActionLoading(prev => ({ ...prev, [requestId]: true }));
  
  try {
    if (action === 'approve') {
      const response = await fetch(`${API_BASE_URL}/leave/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'Approved',
          approvedBy: 'Admin'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve request');
      }

      console.log(`Approved ${request?.name}'s ${request?.type} leave request`);
    } else if (action === 'decline') {
      const response = await fetch(`${API_BASE_URL}/leave/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'Declined',
          approvedBy: 'Admin'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline request');
      }

      console.log(`Declined ${request?.name}'s ${request?.type} leave request`);
    } else if (action === 'reconsider') {
      const response = await fetch(`${API_BASE_URL}/leave/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'Pending',
          approvedBy: null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reconsider request');
      }

      console.log(`Reconsidering ${request?.name}'s leave request`);
    }
    
    // Refresh the data after successful action
    await fetchLeaveRequests();
    await fetchLeaveStats();
    
  } catch (err) {
    setError(`Failed to ${action} request: ` + err.message);
    console.error(`Error ${action}ing request:`, err);
  } finally {
    setActionLoading(prev => ({ ...prev, [requestId]: false }));
  }
};


  const getTypeColor = (type) => {
    switch (type) {
      case 'Sick':
      case 'Sick Leave':
        return '#ef4444';
      case 'Emergency':
      case 'Emergency Leave':
        return '#f59e0b';
      case 'Maternity':
      case 'Maternity Leave':
        return '#8b5cf6';
      case 'Annual':
      case 'Annual Leave':
        return '#10b981';
      case 'Paternity':
      case 'Paternity Leave':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const ActionButton = ({ status, requestId, request }) => {
    const isLoading = actionLoading[requestId];

    if (!request) {
      return (
        <div className="action-buttons-container">
          <button className="action-button" disabled>
            Loading...
          </button>
        </div>
      );
    }

    if (status === 'Pending') {
      return (
        <div className="action-buttons-container">
          <button 
            onClick={() => handleAction('approve', requestId)}
            className="action-button approve"
            disabled={isLoading}
            title={`Approve ${request.name || 'employee'}'s ${(request.type || 'leave').toLowerCase()} leave request`}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '32px',
              backgroundColor: isLoading ? '#9ca3af' : '#059669',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Approve
          </button>
          <button 
            onClick={() => handleAction('decline', requestId)}
            className="action-button decline"
            disabled={isLoading}
            title={`Decline ${request.name || 'employee'}'s ${(request.type || 'leave').toLowerCase()} leave request`}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '32px',
              backgroundColor: isLoading ? '#9ca3af' : '#dc2626',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Decline
          </button>
          <button 
            onClick={() => handleAction('details', requestId)}
            className="action-button details"
            title="View full request details and supporting documents"
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '32px',
              backgroundColor: '#0C3D4A',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <Eye size={14} />
            Details
          </button>
        </div>
      );
    }

    if (status === 'Approved') {
      return (
        <div className="action-buttons-container">
          <div className="status-badge approved" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            minHeight: '28px',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <CheckCircle size={14} />
            Approved
          </div>
          <button 
            onClick={() => handleAction('details', requestId)}
            className="action-button details"
            title="View complete request and approval details"
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '32px',
              backgroundColor: '#0C3D4A',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <Eye size={14} />
            Details
          </button>
        </div>
      );
    }

    if (status === 'Declined') {
      return (
        <div className="action-buttons-container">
          <div className="status-badge declined" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            minHeight: '28px',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <XCircle size={14} />
            Declined
          </div>
          <button 
            onClick={() => handleAction('reconsider', requestId)}
            className="action-button"
            disabled={isLoading}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: '1px solid #d1d5db',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '32px',
              backgroundColor: 'white',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
            title="Reconsider this declined request"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Reconsider
          </button>
          <button 
            onClick={() => handleAction('details', requestId)}
            className="action-button details"
            title="View request details and decline reason"
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '32px',
              backgroundColor: '#0C3D4A',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <Eye size={14} />
            Details
          </button>
        </div>
      );
    }

    return null;
  };

  // Filter requests based on active tab
  const getFilteredRequests = () => {
    let requests = leaveRequests;
    
    if (activeTab === 'history') {
      // Show only approved requests in history
      requests = requests.filter(req => req.status === 'Approved');
    }
    
    // Apply search filter
    requests = requests.filter(request => 
      request.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply status filter (only for requests tab)
    if (activeTab === 'requests') {
      if (selectedFilter !== 'All Requests') {
        requests = requests.filter(request => request.status === selectedFilter);
      }
    }
    
    return requests;
  };

  const filteredRequests = getFilteredRequests();


  // Loading state
  if (loading) {
    return (
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#f9fafb', 
        minHeight: '100vh',
        marginLeft: '7cm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#0C3D4A' }} />
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div className="page-header">
          <div className="black-square"></div>
          <h1 className="page-title">Leave Management</h1>
        </div>
        <button
          onClick={refreshData}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0C3D4A',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#083344'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3D4A'}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab('requests')}
          className={`tab ${activeTab === 'requests' ? 'active' : 'inactive'}`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`tab ${activeTab === 'history' ? 'active' : 'inactive'}`}
        >
          Leave History
        </button>
      </div>

      {/* Stats Cards for History */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
                <User size={20} color="#166534" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Total Approved</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>{stats.totalApproved || 0}</p>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
                <Clock size={20} color="#92400e" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Pending Review</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>{stats.pendingRequests || 0}</p>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem' }}>
                <Calendar size={20} color="#3730a3" />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Most Common</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>{stats.mostCommonType || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="content-area">
        {/* Table Header */}
        <div className="table-header">
          <div className="table-header-left">
            <h2 className="table-title">
              {activeTab === 'requests' ? 'Leave Requests' : 'Leave History'}
            </h2>
          </div>
          <div className="table-header-right">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {activeTab === 'requests' && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="filter-button"
                >
                  <Filter style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
                {filterDropdownOpen && (
                  <div className="dropdown">
                    {['All Requests', 'Pending', 'Approved', 'Declined'].map(filter => (
                      <button 
                        key={filter}
                        onClick={() => {
                          setSelectedFilter(filter);
                          setFilterDropdownOpen(false);
                        }}
                        className="dropdown-item"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead className="table-head">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Duration</th>
                <th className="table-header-cell">Start Date</th>
                <th className="table-header-cell">End Date</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Status</th>
                {activeTab === 'history' && (
                  <th className="table-header-cell">Approved By</th>
                )}
                {activeTab === 'history' && (
                  <th className="table-header-cell">Approved Date</th>
                )}
                {activeTab === 'requests' && (
                  <th className="table-header-cell actions">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="table-row">
                  <td className="table-cell">{request.name}</td>
                  <td className="table-cell">{request.duration} days</td>
                  <td className="table-cell">{request.startDate}</td>
                  <td className="table-cell">{request.endDate}</td>
                  <td className="table-cell">
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: getTypeColor(request.type) + '20',
                      color: getTypeColor(request.type),
                      border: `1px solid ${getTypeColor(request.type)}40`
                    }}>
                      {request.type}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: request.status === 'Approved' ? '#dcfce7' : 
                                    request.status === 'Declined' ? '#fee2e2' : '#fef3c7',
                      color: request.status === 'Approved' ? '#166534' : 
                             request.status === 'Declined' ? '#991b1b' : '#92400e'
                    }}>
                      {request.status}
                    </span>
                  </td>
                  {activeTab === 'history' && (
                    <td className="table-cell">{request.approvedBy || '-'}</td>
                  )}
                  {activeTab === 'history' && (
                    <td className="table-cell">{request.approvedDate || '-'}</td>
                  )}
                  {activeTab === 'requests' && (
                    <td className="table-cell actions">
                      <ActionButton 
                        status={request.status}
                        requestId={request.id}
                        request={request}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredRequests.length === 0 && !loading && (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: '#6b7280' 
          }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              No {activeTab === 'history' ? 'approved requests' : 'requests'} found
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              {activeTab === 'history' 
                ? 'When leave requests are approved, they will appear here.'
                : searchTerm || selectedFilter !== 'All Requests' 
                  ? 'Try adjusting your search or filters.'
                  : 'No leave requests have been submitted yet.'}
            </p>
          </div>
        )}

        {/* Loading overlay for actions */}
        {Object.keys(actionLoading).some(key => actionLoading[key]) && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Loader2 size={24} className="animate-spin" />
              <span>Processing request...</span>
            </div>
          </div>
        )}
      </div>
      <LeaveRequestDetailsModal
      isOpen={isDetailsModalOpen}
      onClose={closeDetailsModal}
      requestId={selectedRequestId}
      API_BASE_URL={API_BASE_URL}
    />
    </div>
  );
};

export default LeaveRequests;