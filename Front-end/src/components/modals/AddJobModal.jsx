import React, { useState } from 'react';
import Modal from '../Modal';

const AddJobModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '', department: '', location: '', salary: '', description: '', status: 'Draft'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ title: '', department: '', location: '', salary: '', description: '', status: 'Draft' });
    onClose();
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  };
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post New Job" size="large">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Job Title *</label>
          <input name="title" value={formData.title} onChange={handleChange} style={inputStyle} required placeholder="e.g. Senior React Developer" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Department *</label>
            <input name="department" value={formData.department} onChange={handleChange} style={inputStyle} required placeholder="e.g. Engineering" />
          </div>
          <div>
            <label style={labelStyle}>Location *</label>
            <input name="location" value={formData.location} onChange={handleChange} style={inputStyle} required placeholder="e.g. Remote" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Salary</label>
            <input name="salary" value={formData.salary} onChange={handleChange} style={inputStyle} placeholder="e.g. $80,000 - $120,000" />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Job description..." />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={{
            padding: '10px 24px', borderRadius: '8px', border: '1px solid #ddd',
            background: 'white', cursor: 'pointer', fontWeight: '500'
          }}>Cancel</button>
          <button type="submit" style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#0C3D4A', color: 'white', cursor: 'pointer', fontWeight: '500'
          }}>Post Job</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddJobModal;
