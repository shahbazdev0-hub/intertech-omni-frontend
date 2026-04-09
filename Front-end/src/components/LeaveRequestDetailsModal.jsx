import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const LeaveRequestDetailsModal = ({ isOpen, onClose, requestId, API_BASE_URL }) => {
    const [requestDetails, setRequestDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const DOCUMENT_BASE_URL = 'http://localhost:5000'; 

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails();
    }
  }, [isOpen, requestId]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/leave/${requestId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch request details');
      }
      
      const data = await response.json();
      setRequestDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={20} style={{ color: '#059669' }} />;
      case 'Declined':
        return <XCircle size={20} style={{ color: '#dc2626' }} />;
      case 'Pending':
        return <AlertCircle size={20} style={{ color: '#d97706' }} />;
      default:
        return <Clock size={20} style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'Declined':
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
      case 'Pending':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const handleViewDocument = () => {
    if (requestDetails?.documentUrl) {
      window.open(`${DOCUMENT_BASE_URL}${requestDetails.documentUrl}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '42rem',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>Leave Request Details</h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={24} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <p style={{ color: '#6b7280' }}>Loading request details...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <XCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
              <p style={{ color: '#ef4444' }}>Error: {error}</p>
            </div>
          ) : requestDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Employee Info */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <User size={20} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                  Employee Information
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>Name</label>
                    <p style={{
                      color: '#111827',
                      fontWeight: '500',
                      margin: 0
                    }}>{requestDetails.employee?.name}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>Email</label>
                    <p style={{
                      color: '#111827',
                      margin: 0
                    }}>{requestDetails.employee?.email}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>Position</label>
                    <p style={{
                      color: '#111827',
                      margin: 0
                    }}>{requestDetails.employee?.position}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>Department</label>
                    <p style={{
                      color: '#111827',
                      margin: 0
                    }}>{requestDetails.employee?.department?.name}</p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div style={{
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Calendar size={20} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                  Leave Details
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>Leave Type</label>
                    <p style={{
                      color: '#111827',
                      fontWeight: '500',
                      margin: 0
                    }}>{requestDetails.leaveType}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>Duration</label>
                    <p style={{
                      color: '#111827',
                      fontWeight: '500',
                      margin: 0
                    }}>{requestDetails.duration}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>Start Date</label>
                    <p style={{
                      color: '#111827',
                      margin: 0
                    }}>{requestDetails.startDate}</p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>End Date</label>
                    <p style={{
                      color: '#111827',
                      margin: 0
                    }}>{requestDetails.endDate}</p>
                  </div>
                  {requestDetails.resumptionDate && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>Expected Resumption Date</label>
                      <p style={{
                        color: '#111827',
                        margin: 0
                      }}>{requestDetails.resumptionDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div style={{
                backgroundColor: '#fefbf3',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FileText size={20} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                  Reason for Leave
                </h3>
                <p style={{
                  color: '#111827',
                  lineHeight: '1.6',
                  margin: 0
                }}>{requestDetails.reason}</p>
              </div>

              {/* Status */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.75rem'
                }}>Status & Approval</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#6b7280' }}>Current Status:</span>
                    <div style={{
                      ...getStatusColor(requestDetails.status),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getStatusIcon(requestDetails.status)}
                      {requestDetails.status}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#6b7280' }}>Submitted Date:</span>
                    <span style={{
                      color: '#111827',
                      fontWeight: '500'
                    }}>{requestDetails.submittedDate}</span>
                  </div>
                  {requestDetails.approvedBy && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#6b7280' }}>Decision by:</span>
                      <span style={{
                        color: '#111827',
                        fontWeight: '500'
                      }}>{requestDetails.approvedBy}</span>
                    </div>
                  )}
                  {requestDetails.approvedDate && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#6b7280' }}>Decision Date:</span>
                      <span style={{
                        color: '#111827',
                        fontWeight: '500'
                      }}>{requestDetails.approvedDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attached Document */}
              {requestDetails.documentPath && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FileText size={20} style={{ marginRight: '0.5rem', color: '#059669' }} />
                    Supporting Document
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'white',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <FileText size={24} style={{ color: '#059669', marginRight: '0.75rem' }} />
                      <div>
                        <p style={{
                          color: '#111827',
                          fontWeight: '500',
                          margin: 0
                        }}>{requestDetails.documentName}</p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: 0
                        }}>Supporting document</p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={handleViewDocument}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#bfdbfe'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#dbeafe'}
                      >
                        <Eye size={16} style={{ marginRight: '0.25rem' }} />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestDetailsModal;