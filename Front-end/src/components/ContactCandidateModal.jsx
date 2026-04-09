import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const ContactCandidateModal = ({ candidate, isOpen, onClose, onStatusChange }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    template: 'custom'
  });

  // Update email data when candidate changes
  useEffect(() => {
    if (candidate) {
      setEmailData(prev => ({
        ...prev,
        to: candidate.email
      }));
    }
  }, [candidate]);

  const emailTemplates = {
    screening_invite: {
      subject: 'Screening Call Invitation - {{position}}',
      message: `Dear {{name}},

Thank you for your interest in the {{position}} position at our company. We would like to schedule a brief screening call to discuss your background and the role.

Please let us know your availability for a 30-minute call this week.

Best regards,
HR Team`,
      statusChange: 'Screening'
    },
    interview_invite: {
      subject: 'Interview Invitation - {{position}}',
      message: `Dear {{name}},

Thank you for your interest in the {{position}} position at our company. We were impressed with your application and would like to invite you for an interview.

Please let us know your availability for the upcoming week, and we'll schedule a convenient time.

Best regards,
HR Team`,
      statusChange: null // Will be handled by interview scheduling
    },
    status_update: {
      subject: 'Application Status Update - {{position}}',
      message: `Dear {{name}},

We wanted to provide you with an update on your application for the {{position}} position.

We are currently reviewing applications and will be in touch soon with next steps.

Thank you for your patience.

Best regards,
HR Team`,
      statusChange: null
    },
    offer: {
      subject: 'Job Offer - {{position}}',
      message: `Dear {{name}},

We are delighted to offer you the position of {{position}} at our company.

We were impressed by your qualifications and believe you will be a valuable addition to our team.

Please review the attached offer details and let us know your decision by [DATE].

Congratulations and welcome to the team!

Best regards,
HR Team`,
      statusChange: 'Offer'
    },
    rejection: {
      subject: 'Application Update - {{position}}',
      message: `Dear {{name}},

Thank you for your interest in the {{position}} position and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We appreciate your interest in our company and encourage you to apply for future opportunities that align with your skills and experience.

Best regards,
HR Team`,
      statusChange: 'Rejected'
    }
  };

  const applyTemplate = (templateKey) => {
    if (templateKey === 'custom') {
      setEmailData(prev => ({ 
        ...prev, 
        subject: '', 
        message: '', 
        template: 'custom' 
      }));
      return;
    }

    const template = emailTemplates[templateKey];
    const subject = template.subject
      .replace('{{position}}', candidate?.position || '')
      .replace('{{name}}', candidate?.name || '');
    
    const message = template.message
      .replace(/{{name}}/g, candidate?.name || '')
      .replace(/{{position}}/g, candidate?.position || '');

    setEmailData(prev => ({
      ...prev,
      subject,
      message,
      template: templateKey
    }));
  };

  const getStatusChangeMessage = (template) => {
    if (!template || !emailTemplates[template]) return null;
    
    const statusChange = emailTemplates[template].statusChange;
    if (!statusChange) return null;
    
    return `This will automatically change the candidate's status to "${statusChange}"`;
  };

  const sendEmail = () => {
    const template = emailTemplates[emailData.template];
    const statusChange = template?.statusChange;
    
    // Show confirmation for status-changing emails
    if (statusChange && statusChange !== candidate.status) {
      const confirmMessage = `Send email and change candidate status from "${candidate.status}" to "${statusChange}"?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    // Here you would integrate with your email service
    console.log('Sending email:', emailData);
    
    // Handle automatic status changes
    if (statusChange && statusChange !== candidate.status) {
      onStatusChange(candidate.id, statusChange);
      alert(`Email sent successfully! Candidate status updated to "${statusChange}"`);
    } else {
      alert('Email sent successfully!');
    }
    
    onClose();
  };

  const getTemplateButtonStyle = (templateKey) => {
    const template = emailTemplates[templateKey];
    const statusChange = template?.statusChange;
    
    let backgroundColor = 'white';
    let color = '#333';
    
    if (emailData.template === templateKey) {
      backgroundColor = '#0C3D4A';
      color = 'white';
    } else if (statusChange) {
      // Different colors for status-changing templates
      if (statusChange === 'Offer') {
        backgroundColor = '#f0f9ff';
        color = '#0369a1';
      } else if (statusChange === 'Rejected') {
        backgroundColor = '#fef2f2';
        color = '#dc2626';
      } else if (statusChange === 'Screening') {
        backgroundColor = '#f0fdf4';
        color = '#16a34a';
      }
    }
    
    return {
      width: '100%',
      padding: '12px 16px',
      background: backgroundColor,
      color: color,
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '8px',
      fontSize: '14px',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      position: 'relative'
    };
  };

  if (!candidate) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Candidate" size="large">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
        {/* Main Email Form */}
        <div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              To
            </label>
            <input
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: '#f8f9fa'
              }}
              readOnly
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Subject
            </label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter email subject"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Message
            </label>
            <textarea
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              style={{
                width: '100%',
                height: '300px',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
              placeholder="Enter your message..."
            />
          </div>

          {/* Status Change Warning */}
          {getStatusChangeMessage(emailData.template) && (
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #fdba74'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#ea580c',
                fontWeight: '500'
              }}>
                <span>⚠️</span>
                {getStatusChangeMessage(emailData.template)}
              </div>
            </div>
          )}
        </div>

        {/* Template Sidebar */}
        <div>
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px'
          }}>
            <h4 style={{ 
              marginBottom: '16px', 
              fontSize: '16px', 
              color: '#0C3D4A' 
            }}>
              Email Templates
            </h4>
            
            <div style={{ marginBottom: '16px' }}>
              {/* Screening Invite */}
              <button
                onClick={() => applyTemplate('screening_invite')}
                style={getTemplateButtonStyle('screening_invite')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📞 Screening Invitation</span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>→ Screening</span>
                </div>
              </button>
              
              {/* Interview Invite */}
              <button
                onClick={() => applyTemplate('interview_invite')}
                style={getTemplateButtonStyle('interview_invite')}
              >
                📅 Interview Invitation
              </button>
              
              {/* Status Update */}
              <button
                onClick={() => applyTemplate('status_update')}
                style={getTemplateButtonStyle('status_update')}
              >
                📋 Status Update
              </button>
              
              {/* Offer */}
              <button
                onClick={() => applyTemplate('offer')}
                style={getTemplateButtonStyle('offer')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎉 Job Offer</span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>→ Offer</span>
                </div>
              </button>
              
              {/* Rejection */}
              <button
                onClick={() => applyTemplate('rejection')}
                style={getTemplateButtonStyle('rejection')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>❌ Rejection Letter</span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>→ Rejected</span>
                </div>
              </button>
              
              {/* Custom */}
              <button
                onClick={() => applyTemplate('custom')}
                style={getTemplateButtonStyle('custom')}
              >
                ✏️ Custom Message
              </button>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h5 style={{ 
                marginBottom: '12px', 
                fontSize: '14px', 
                color: '#666' 
              }}>
                Candidate Info
              </h5>
              <div style={{ 
                fontSize: '13px', 
                color: '#666', 
                lineHeight: '1.5',
                background: 'white',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <div><strong>Name:</strong> {candidate.name}</div>
                <div><strong>Position:</strong> {candidate.position}</div>
                <div><strong>Current Status:</strong> {candidate.status}</div>
                <div><strong>Applied:</strong> {candidate.appliedDate}</div>
              </div>
            </div>

            {/* Status Flow Guide */}
            <div style={{ marginTop: '20px' }}>
              <h5 style={{ 
                marginBottom: '12px', 
                fontSize: '14px', 
                color: '#666' 
              }}>
                Status Flow
              </h5>
              <div style={{ 
                fontSize: '11px', 
                color: '#888', 
                lineHeight: '1.4',
                background: 'white',
                padding: '10px',
                borderRadius: '6px'
              }}>
                New → Screening → Interview → Offer
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '12px 24px',
            background: 'white',
            color: '#666',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Cancel
        </button>
        <button
          onClick={sendEmail}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #0C3D4A, #1a4f5e)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📤 Send Email
        </button>
      </div>
    </Modal>
  );
};

export default ContactCandidateModal;