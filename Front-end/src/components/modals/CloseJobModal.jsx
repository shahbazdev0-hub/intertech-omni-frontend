import React from 'react';
import Modal from '../Modal';

const CloseJobModal = ({ job, isOpen, onClose, onConfirm }) => {
  if (!job) return null;

  const handleConfirm = () => {
    onConfirm({ jobId: job.id });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Job Posting" size="small">
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>
          Are you sure you want to close this job posting?
        </p>
        <p style={{ fontSize: '18px', fontWeight: '600', color: '#0C3D4A', marginBottom: '24px' }}>
          {job.title}
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
          This will mark the job as closed and it will no longer accept new applications.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', borderRadius: '8px', border: '1px solid #ddd',
            background: 'white', cursor: 'pointer', fontWeight: '500'
          }}>Cancel</button>
          <button onClick={handleConfirm} style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#dc3545', color: 'white', cursor: 'pointer', fontWeight: '500'
          }}>Close Job</button>
        </div>
      </div>
    </Modal>
  );
};

export default CloseJobModal;
