import React from 'react';
import Modal from '../Modal';

const ViewJobModal = ({ job, isOpen, onClose }) => {
  if (!job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="large">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
          <div style={{ fontSize: '40px' }}>💼</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0C3D4A' }}>{job.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#666' }}>{job.department}</p>
          </div>
          <span style={{
            marginLeft: 'auto', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
            background: job.status === 'Active' ? '#d4edda' : job.status === 'Draft' ? '#fff3cd' : '#f8d7da',
            color: job.status === 'Active' ? '#155724' : job.status === 'Draft' ? '#856404' : '#721c24'
          }}>{job.status}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            ['Location', job.location],
            ['Salary', job.salary],
            ['Applicants', job.applicants],
            ['Posted Date', job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'N/A']
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '14px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>{value || 'N/A'}</div>
            </div>
          ))}
        </div>

        {job.description && (
          <div>
            <h4 style={{ margin: '0 0 8px', color: '#0C3D4A' }}>Description</h4>
            <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>{job.description}</p>
          </div>
        )}

        {job.requirements && job.requirements.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px', color: '#0C3D4A' }}>Requirements</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
              {(Array.isArray(job.requirements) ? job.requirements : []).map((req, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewJobModal;
