import React, { useState, useEffect } from 'react';
import './RecruitmentDashboard.css';
// Import Job Modal Components
import ViewJobModal from './modals/ViewJobModal.jsx';
import EditJobModal from './modals/EditJobModal.jsx';
import JobApplicationsModal from './modals/JobApplicationsModal.jsx';
import CloseJobModal from './modals/CloseJobModal.jsx';
import AddJobModal from './modals/AddJobModal.jsx';

// Add API base URL configuration
const API_BASE_URL = 'http://localhost:5000';

const JobPostingsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Job Modal states
  const [viewJobModalOpen, setViewJobModalOpen] = useState(false);
  const [editJobModalOpen, setEditJobModalOpen] = useState(false);
  const [jobApplicationsModalOpen, setJobApplicationsModalOpen] = useState(false);
  const [closeJobModalOpen, setCloseJobModalOpen] = useState(false);
  const [addJobModalOpen, setAddJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Data states
  const [jobPostings, setJobPostings] = useState([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    jobsFilledThisMonth: 0,
    avgApplicationsPerJob: 0
  });

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setJobPostings(data);
      
      // Calculate stats from the data
      const activeJobs = data.filter(job => job.status?.toLowerCase() === 'active').length;
      const totalApplications = data.reduce((sum, job) => sum + (job.applicants || 0), 0);
      const avgApplications = activeJobs > 0 ? Math.round(totalApplications / activeJobs) : 0;
      
      const newStats = {
        activeJobs,
        totalApplications,
        jobsFilledThisMonth: data.filter(job => job.status?.toLowerCase() === 'closed').length,
        avgApplicationsPerJob: avgApplications
      };
      setStats(newStats);
      
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(`Failed to load job postings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const statsDisplay = [
    { id: 1, title: 'Active Jobs', value: stats.activeJobs.toString(), change: '+3', icon: '💼', color: 'green' },
    { id: 2, title: 'Total Applications', value: stats.totalApplications.toString(), change: '+45', icon: '📄', color: 'blue' },
    { id: 3, title: 'Jobs Filled This Month', value: stats.jobsFilledThisMonth.toString(), change: '+2', icon: '✅', color: 'purple' },
    { id: 4, title: 'Avg. Applications per Job', value: stats.avgApplicationsPerJob.toString(), change: '+5', icon: '📊', color: 'orange' }
  ];

  // Job action handlers
  const handleViewJob = (job) => {
    setSelectedJob(job);
    setViewJobModalOpen(true);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setEditJobModalOpen(true);
  };

  const handleViewJobApplications = (job) => {
    setSelectedJob(job);
    setJobApplicationsModalOpen(true);
  };

  const handleCloseJob = (job) => {
    setSelectedJob(job);
    setCloseJobModalOpen(true);
  };

  // Save job changes
  const handleSaveJob = async (updatedJob) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${updatedJob.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedJob)
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      const savedJob = await response.json();
      
      // Update local state
      setJobPostings(prev => 
        prev.map(job => 
          job.id === savedJob.id ? savedJob : job
        )
      );

      // Refresh stats
      fetchJobs();
      
      alert('Job updated successfully!');
      
    } catch (err) {
      console.error('Error updating job:', err);
      alert('Failed to update job');
    }
  };

  // Handle job closure
  const handleConfirmCloseJob = async (closeData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${closeData.jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'CLOSED' }) // Uppercase for consistency
      });

      if (!response.ok) {
        throw new Error('Failed to close job');
      }

      // Update local state
      setJobPostings(prev => 
        prev.map(job => 
          job.id === closeData.jobId ? { ...job, status: 'Closed' } : job
        )
      );

      // Refresh data
      fetchJobs();
      
      alert('Job closed successfully!');
      
    } catch (err) {
      console.error('Error closing job:', err);
      alert('Failed to close job');
    }
  };

  // Handle adding new job
  const handleAddJob = async (newJobData) => {
    try {
      // Ensure status is uppercase for database consistency
      const jobData = {
        ...newJobData,
        status: newJobData.status?.toUpperCase() || 'DRAFT'
      };
      
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      const newJob = await response.json();
      
      // Update local state
      setJobPostings(prev => [newJob, ...prev]);
      
      // Refresh stats
      fetchJobs();
      
      alert('Job posted successfully!');
      
    } catch (err) {
      console.error('Error creating job:', err);
      alert('Failed to create job');
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'Active': 'status-active',
      'Draft': 'status-draft', 
      'Closed': 'status-closed'
    };
    return statusClasses[status] || 'status-default';
  };

  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status?.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedAndFilteredJobs = filteredJobs.sort((a, b) => {
    switch(sortBy) {
      case 'title': return (a.title || '').localeCompare(b.title || '');
      case 'date': return new Date(b.postedDate) - new Date(a.postedDate);
      case 'applicants': return (b.applicants || 0) - (a.applicants || 0);
      case 'department': return (a.department || '').localeCompare(b.department || '');
      default: return 0;
    }
  });



  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>⏳</div>
          <p>Loading job postings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="error-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>⚠</div>
          <p>{error}</p>
          <button onClick={fetchJobs} className="btn-primary">
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
        <div className="page-icon">💼</div>
        <h1 className="page-title">Job Postings Management</h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statsDisplay.map((stat) => (
          <div key={stat.id} className={`stat-card stat-${stat.color}`}>
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-title">{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-change">{stat.change}</div>
              </div>
              <div className="stat-icon">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="actions-row">
        <h2 className="section-title">Job Postings</h2>
        <div className="search-actions">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-icon">🔍</button>
          </div>
          <button className="filter-button">⚙️</button>
          <button onClick={fetchJobs} className="btn-secondary">
            🔄 Refresh
          </button>
          <button 
            className="btn-primary"
            onClick={() => setAddJobModalOpen(true)}
          >
            ➕ Post New Job
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="status-filter-container">
        <div className="status-filter-tabs">
          {['all', 'active', 'draft', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`status-tab ${statusFilter === status ? 'active' : ''}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="status-count">
                {status === 'all' 
                  ? filteredJobs.length 
                  : jobPostings.filter(j => j.status?.toLowerCase() === status && 
                      (j.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       j.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       j.location?.toLowerCase().includes(searchTerm.toLowerCase()))).length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="sort-container">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="applicants">Sort by Applicants</option>
            <option value="department">Sort by Department</option>
          </select>
        </div>
      </div>

      {/* Job Postings Grid */}
      <div className="jobs-grid">
        {sortedAndFilteredJobs.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#6b7280' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
            <h3>No job postings found</h3>
            <p>Try adjusting your search criteria or create a new job posting.</p>
          </div>
        ) : (
          sortedAndFilteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div className="job-icon">💼</div>
                <div className="job-basic-info">
                  <h3 className="job-title">{job.title || 'Untitled Job'}</h3>
                  <p className="job-department">{job.department || 'N/A'}</p>
                </div>
                <div className="job-status">
                  <span className={`status-badge ${getStatusClass(job.status)}`}>
                    {job.status || 'Draft'}
                  </span>
                </div>
              </div>
              
              <div className="job-details">
                <div className="detail-row">
                  <span className="detail-label">📍 Location:</span>
                  <span className="detail-value">{job.location || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 Posted:</span>
                  <span className="detail-value">{job.postedDate || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">👥 Applicants:</span>
                  <span className="detail-value">{job.applicants || 0}</span>
                </div>
                {job.salary && (
                  <div className="detail-row">
                    <span className="detail-label">💰 Salary:</span>
                    <span className="detail-value">{job.salary}</span>
                  </div>
                )}
              </div>

              {job.description && (
                <div className="job-description">
                  <p>{job.description.length > 100 ? job.description.substring(0, 100) + '...' : job.description}</p>
                </div>
              )}

              <div className="job-actions">
                <button 
                  className="action-btn btn-view"
                  onClick={() => handleViewJob(job)}
                >
                  👁️ View
                </button>
                <button 
                  className="action-btn btn-edit"
                  onClick={() => handleEditJob(job)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="action-btn btn-applications"
                  onClick={() => handleViewJobApplications(job)}
                >
                  📋 Applications
                </button>
                <button 
                  className="action-btn btn-close"
                  onClick={() => handleCloseJob(job)}
                  disabled={job.status === 'Closed'}
                  style={{
                    opacity: job.status === 'Closed' ? 0.5 : 1,
                    cursor: job.status === 'Closed' ? 'not-allowed' : 'pointer'
                  }}
                >
                  {job.status === 'Closed' ? '✅ Closed' : '❌ Close'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Components */}
      <ViewJobModal
        job={selectedJob}
        isOpen={viewJobModalOpen}
        onClose={() => setViewJobModalOpen(false)}
      />
      
      <EditJobModal
        job={selectedJob}
        isOpen={editJobModalOpen}
        onClose={() => setEditJobModalOpen(false)}
        onSave={handleSaveJob}
      />
      
      <JobApplicationsModal
        job={selectedJob}
        isOpen={jobApplicationsModalOpen}
        onClose={() => setJobApplicationsModalOpen(false)}
      />
      
      <CloseJobModal
        job={selectedJob}
        isOpen={closeJobModalOpen}
        onClose={() => setCloseJobModalOpen(false)}
        onConfirm={handleConfirmCloseJob}
      />

      <AddJobModal
        isOpen={addJobModalOpen}
        onClose={() => setAddJobModalOpen(false)}
        onAdd={handleAddJob}
      />
    </div>
  );
};

export default JobPostingsPage;
