import React, { useState, useEffect } from 'react';
import './RecruitmentDashboard.css'; 
import ViewCandidateModal from './ViewCandidateModal';
import ContactCandidateModal from './ContactCandidateModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';

const API_BASE_URL = 'http://localhost:5000';

const CandidatesPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateInterviews, setCandidateInterviews] = useState([]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/candidates`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }
      
      const data = await response.json();
      setCandidates(data);
      
    } catch (err) {
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateInterviews = async (candidateId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}/interviews`);
      if (response.ok) {
        const interviews = await response.json();
        setCandidateInterviews(interviews);
      } else {
        setCandidateInterviews([]);
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setCandidateInterviews([]);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, status: newStatus }
            : candidate
        )
      );
      
    } catch (err) {
      alert('Failed to update candidate status');
    }
  };



  const handleDownloadCV = async (candidateId, candidateName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}/cv/download`);
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('CV not found for this candidate');
        } else {
          throw new Error('Failed to download CV');
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${candidateName}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download CV. Please try again.');
    }
  };

  const handleViewCandidate = async (candidate) => {
    setSelectedCandidate(candidate);
    await fetchCandidateInterviews(candidate.id);
    setViewModalOpen(true);
  };

  const handleContactCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setContactModalOpen(true);
  };

  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate);
    setScheduleModalOpen(true);
  };

  const handleScheduleInterviewSubmit = async (interviewData) => {
    try {
      if (!interviewData.date || !interviewData.time || !interviewData.interviewer) {
        alert('Please fill in Date, Time, and Interviewer fields');
        return;
      }

      const requestData = {
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        position: selectedCandidate.position,
        date: interviewData.date,
        time: interviewData.time,
        duration: String(interviewData.duration || '60'),
        type: interviewData.type.toUpperCase().replace('-', '_'), // Convert 'in-person' to 'IN_PERSON'
        interviewer: interviewData.interviewer,
        location: interviewData.location || '',
        notes: interviewData.notes || ''
      };

      const response = await fetch(`${API_BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to schedule interview');
      }

      // Update candidate status based on interview type and current status
    
let newStatus = selectedCandidate.status;
const interviewTypeUpper = interviewData.type.toUpperCase().replace('-', '_');

if (selectedCandidate.status === 'New' && (interviewTypeUpper === 'PHONE' || interviewTypeUpper === 'VIDEO')) {
  newStatus = 'Screening';
} else if (selectedCandidate.status === 'Screening') {
  newStatus = 'Interview';
}

      if (newStatus !== selectedCandidate.status) {
        await handleStatusChange(selectedCandidate.id, newStatus);
      }

      alert('Interview scheduled successfully!');
      setScheduleModalOpen(false);
      fetchCandidates();
      
    } catch (err) {
      alert(`Failed to schedule interview: ${err.message}`);
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'New': 'status-new',
      'Screening': 'status-screening', 
      'Interview': 'status-interview',
      'Offer': 'status-offer',
      'Rejected': 'status-rejected'
    };
    return statusClasses[status] || 'status-default';
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           candidate.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status?.toLowerCase() === statusFilter;
    const matchesJob = jobFilter === 'all' || candidate.position === jobFilter;
    
    return matchesSearch && matchesStatus && matchesJob;
  });



  if (loading) {
    return (
      <div className="main-content">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>⏳</div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>⚠</div>
          <p>{error}</p>
          <button onClick={fetchCandidates} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Header Section */}
      <div className="content-header">
        <div className="page-icon">👥</div>
        <h1 className="page-title">Candidate Management</h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3 className="stat-title">Total Candidates</h3>
              <div className="stat-value">{candidates.length}</div>
            </div>
            <div className="stat-icon">👥</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3 className="stat-title">New Applications</h3>
              <div className="stat-value">
                {candidates.filter(c => c.status?.toLowerCase() === 'new').length}
              </div>
            </div>
            <div className="stat-icon">📄</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3 className="stat-title">CVs Received</h3>
              <div className="stat-value">
                {candidates.filter(c => c.hasCV).length}
              </div>
            </div>
            <div className="stat-icon">📎</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3 className="stat-title">In Interview</h3>
              <div className="stat-value">
                {candidates.filter(c => c.status?.toLowerCase() === 'interview').length}
              </div>
            </div>
            <div className="stat-icon">📅</div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="actions-row">
        <h2 className="section-title">Candidates</h2>
        <div className="search-actions">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Positions</option>
            {[...new Set(candidates.map(c => c.position).filter(Boolean))].map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button onClick={fetchCandidates} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="candidates-grid">
        {filteredCandidates.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#6b7280' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
            <h3>No candidates found</h3>
            <p>Try adjusting your search criteria or check back later for new applications.</p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="candidate-card">
              <div className="candidate-header">
                <div className="candidate-avatar">
                  {(candidate.name || 'U').split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="candidate-name">{candidate.name || 'Unknown'}</h3>
                  <p className="candidate-position">{candidate.position || 'N/A'}</p>
                </div>
                <div className="candidate-status">
                  <span className={`status-badge ${getStatusClass(candidate.status)}`}>
                    {candidate.status || 'New'}
                  </span>
                </div>
              </div>
              
              <div className="candidate-details">
                <div className="detail-row">
                  <span className="detail-label">📧 Email:</span>
                  <span className="detail-value">{candidate.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📱 Phone:</span>
                  <span className="detail-value">{candidate.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 Applied:</span>
                  <span className="detail-value">{candidate.appliedDate || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🔗 Source:</span>
                  <span className="detail-value">{candidate.source || 'Website'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">💼 Experience:</span>
                  <span className="detail-value">{candidate.experience || 'N/A'}</span>
                </div>
              </div>

              <div className="candidate-skills">
                {(candidate.skills || []).map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>

              {/* CV Section */}
              <div className={`cv-section ${candidate.hasCV ? 'cv-available' : 'cv-missing'}`}>
                <div className="cv-info">
                  <span className="cv-label">📎 CV/Resume:</span>
                  <span className={`cv-status ${candidate.hasCV ? 'available' : 'missing'}`}>
                    {candidate.hasCV ? '✅ Available' : '⚠ Not Uploaded'}
                  </span>
                </div>
                
                {candidate.hasCV && candidate.cvOriginalName && (
                  <div className="cv-filename">
                    📄 {candidate.cvOriginalName}
                  </div>
                )}
                
                <div className="cv-actions">
                  {candidate.hasCV ? (
                    <button
                      onClick={() => handleDownloadCV(candidate.id, candidate.name)}
                      className="cv-download-btn"
                    >
                      📥 Download CV
                    </button>
                  ) : (
                    <button
                      className="cv-download-btn"
                      disabled
                    >
                      📎 No CV Available
                    </button>
                  )}
                </div>
              </div>

              <div className="status-selector">
                <select
                  value={candidate.status || 'New'}
                  onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                  className="status-select"
                >
                  <option value="New">New</option>
                  <option value="Screening">Screening</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="candidate-actions">
                <button 
                  className="action-btn view"
                  onClick={() => handleViewCandidate(candidate)}
                >
                  👁️ View Details
                </button>
                <button 
                  className="action-btn contact"
                  onClick={() => handleContactCandidate(candidate)}
                >
                  💬 Contact
                </button>
                <button 
                  className="action-btn schedule"
                  onClick={() => handleScheduleInterview(candidate)}
                >
                  📅 Schedule
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {viewModalOpen && selectedCandidate && (
        <ViewCandidateModal
          candidate={selectedCandidate}
          candidateInterviews={candidateInterviews}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedCandidate(null);
            setCandidateInterviews([]);
          }}
        />
      )}

      {contactModalOpen && selectedCandidate && (
        <ContactCandidateModal
          candidate={selectedCandidate}
          isOpen={contactModalOpen}
          onClose={() => {
            setContactModalOpen(false);
            setSelectedCandidate(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {scheduleModalOpen && selectedCandidate && (
        <ScheduleInterviewModal
          candidate={selectedCandidate}
          isOpen={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setSelectedCandidate(null);
          }}
          onSchedule={handleScheduleInterviewSubmit}
        />
      )}
    </div>
  );
};

export default CandidatesPage;
