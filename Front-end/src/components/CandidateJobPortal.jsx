import React, { useState, useEffect } from 'react';
import './CandidateJobPortal.css';

const API_BASE_URL = 'http://localhost:5000';

const CandidateJobPortal = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add ?status=active to only get active jobs
      const response = await fetch(`${API_BASE_URL}/api/jobs?status=active`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setJobs(data);
      
    } catch (err) {
      setError('Failed to load job postings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Refresh every 30 seconds to get latest jobs
    //const interval = setInterval(fetchJobs, 30000);
    //return () => clearInterval(interval);
  }, []);

  const handleApplyForJob = (job) => {
    setSelectedJob(job);
    setApplicationModalOpen(true);
  };

  const handleApplicationSubmit = async (formData) => {
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('experience', formData.experience);
      submitData.append('skills', formData.skills);
      submitData.append('coverLetter', formData.coverLetter);
      
      if (formData.cv) {
        submitData.append('cv', formData.cv);
      }

      const response = await fetch(`${API_BASE_URL}/api/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      // Mark job as applied
      setAppliedJobs(prev => new Set([...prev, selectedJob.id]));
      
      alert('Application submitted successfully!');
      setApplicationModalOpen(false);
      
      // Refresh jobs to update applicant count
      fetchJobs();
      
    } catch (error) {
      alert(`Failed to submit application: ${error.message}`);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    const matchesLocation = locationFilter === 'all' || job.location === locationFilter;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  // Get unique departments and locations for filters
  const departments = [...new Set(jobs.map(job => job.department).filter(Boolean))];
  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))];

  // Function to normalize requirements to always be an array
  const normalizeRequirements = (requirements) => {
    if (!requirements) return [];
    if (Array.isArray(requirements)) return requirements;
    if (typeof requirements === 'string') {
      return requirements.split(',').map(req => req.trim()).filter(req => req.length > 0);
    }
    return [];
  };

  if (loading) {
    return (
      <div className="job-portal">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading job opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-portal">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Unable to Load Jobs</h2>
          <p className="error-message">{error}</p>
          <button onClick={fetchJobs} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-portal">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="header-title">Find Your Dream Job</h1>
            <p className="header-subtitle">
              Explore exciting career opportunities and join our growing team
            </p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card card-hover">
              <div className="stat-icon">💼</div>
              <p className="stat-label">Open Positions</p>
              <h3 className="stat-value">{jobs.length}</h3>
            </div>
            <div className="stat-card card-hover">
              <div className="stat-icon">🏢</div>
              <p className="stat-label">Departments</p>
              <h3 className="stat-value">{departments.length}</h3>
            </div>
            <div className="stat-card card-hover">
              <div className="stat-icon">🌍</div>
              <p className="stat-label">Locations</p>
              <h3 className="stat-value">{locations.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h2 className="main-title">Available Positions</h2>
        
        {/* Search Controls */}
        <div className="search-controls">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="search-select input-focus"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="search-select input-focus"
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="Search jobs by title, department, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input input-focus"
          />
          
          <button onClick={fetchJobs} className="refresh-button">
            🔄 Refresh
          </button>
        </div>

        {/* Jobs Grid */}
        <div className="jobs-grid">
          {filteredJobs.length === 0 ? (
            <div className="no-jobs">
              <div className="no-jobs-icon">🔍</div>
              <h3 className="no-jobs-title">No Jobs Found</h3>
              <p className="no-jobs-text">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const requirementsArray = normalizeRequirements(job.requirements);

              return (
                <div key={job.id} className="job-card card-hover">
                  <div className="job-header">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-department">{job.department}</p>
                  </div>
                  
                  <div className="job-details">
                    <div className="job-detail-row">
                      <span className="job-detail-label">📍 Location:</span>
                      <span className="job-detail-value">{job.location}</span>
                    </div>
                    <div className="job-detail-row">
                      <span className="job-detail-label">📅 Posted:</span>
                      <span className="job-detail-value">{job.postedDate}</span>
                    </div>
                    <div className="job-detail-row">
                      <span className="job-detail-label">👥 Applicants:</span>
                      <span className="job-detail-value">{job.applicants || 0}</span>
                    </div>
                    {job.salary && (
                      <div className="job-detail-row">
                        <span className="job-detail-label">💰 Salary:</span>
                        <span className="job-detail-value">{job.salary}</span>
                      </div>
                    )}
                  </div>

                  {job.description && (
                    <div className="job-description">
                      <p className="job-description-text">
                        {job.description.length > 150 
                          ? job.description.substring(0, 150) + '...' 
                          : job.description}
                      </p>
                    </div>
                  )}

                  {requirementsArray.length > 0 && (
                    <div className="job-requirements">
                      {requirementsArray.slice(0, 3).map((req, index) => (
                        <span key={index} className="requirement-tag">
                          {req}
                        </span>
                      ))}
                      {requirementsArray.length > 3 && (
                        <span className="requirement-more">
                          +{requirementsArray.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="job-actions">
                    <button
                      onClick={() => handleApplyForJob(job)}
                      className={`apply-button ${appliedJobs.has(job.id) ? 'applied' : 'not-applied'}`}
                      disabled={appliedJobs.has(job.id)}
                    >
                      {appliedJobs.has(job.id) ? '✅ Applied' : '📝 Apply Now'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Application Modal */}
      {applicationModalOpen && selectedJob && (
        <ApplicationModal
          job={selectedJob}
          onClose={() => setApplicationModalOpen(false)}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
};

// Application Modal Component
const ApplicationModal = ({ job, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    skills: '',
    coverLetter: '',
    cv: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, cv: file }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Apply for {job.title}</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="form-input"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="form-input"
                placeholder="Enter your phone number"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                className="form-input"
                placeholder="e.g., 3+ years"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              className="form-input"
              placeholder="Enter your skills (comma separated)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cover Letter</label>
            <textarea
              value={formData.coverLetter}
              onChange={(e) => handleInputChange('coverLetter', e.target.value)}
              className="form-textarea"
              placeholder="Tell us why you're interested in this position..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resume/CV</label>
            <div className={`file-upload-area ${formData.cv ? 'filled' : 'empty'}`}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="cv-upload"
              />
              <label htmlFor="cv-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div className="file-upload-icon">
                  {formData.cv ? '📄' : '📁'}
                </div>
                <p className={`file-upload-text ${formData.cv ? 'success' : 'default'}`}>
                  {formData.cv ? formData.cv.name : 'Click to upload your resume'}
                </p>
                <p className="file-upload-subtext">
                  PDF, DOC, or DOCX files only (max 5MB)
                </p>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`modal-button submit ${isSubmitting ? 'submitting' : 'normal'}`}
            >
              {isSubmitting ? '⏳ Submitting...' : '📝 Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateJobPortal;