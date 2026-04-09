import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

const API_BASE_URL = 'http://localhost:5000';

const JobApplicationsModal = ({ job, isOpen, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && job) {
      fetchApplications();
    }
  }, [isOpen, job]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/applications`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Applications - ${job.title}`} size="large">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading applications...</div>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <p>No applications received yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.map((app) => (
            <div key={app.id} style={{
              padding: '16px', background: '#f8f9fa', borderRadius: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#0C3D4A' }}>{app.candidate?.name || 'Unknown'}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{app.candidate?.email}</div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '600',
                background: app.status === 'NEW' ? '#e7f3ff' : app.status === 'HIRED' ? '#d4edda' : '#f8f9fa',
                color: app.status === 'NEW' ? '#0056b3' : app.status === 'HIRED' ? '#155724' : '#333'
              }}>{app.status}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default JobApplicationsModal;
