import React from 'react';
import Modal from './Modal';

const ViewCandidateModal = ({ candidate, candidateInterviews, isOpen, onClose }) => {
  if (!candidate) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInterviewTypeIcon = (type) => {
    switch(type) {
      case 'video': return '📹';
      case 'phone': return '📞';
      case 'in-person': return '🏢';
      default: return '📅';
    }
  };

  const getInterviewStatusColor = (interview) => {
    const interviewDate = new Date(interview.date);
    const now = new Date();
    
    if (interviewDate > now) {
      return '#0ea5e9'; // Blue for upcoming
    } else {
      return '#10b981'; // Green for completed
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Candidate Profile" size="large">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Column */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '32px',
            padding: '24px',
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            borderRadius: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #0C3D4A, #1a4f5e)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '28px',
              fontWeight: '700'
            }}>
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#0C3D4A' }}>
                {candidate.name}
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#666' }}>
                {candidate.position}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b' }}>⭐</span>
                <span style={{ fontWeight: '600' }}>{candidate.rating}</span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: candidate.status === 'New' ? '#fff3cd' : 
                            candidate.status === 'Screening' ? '#e7f3ff' :
                            candidate.status === 'Interview' ? '#f3e8ff' : 
                            candidate.status === 'Offer' ? '#d4edda' : '#f8d7da',
                  color: candidate.status === 'New' ? '#856404' : 
                         candidate.status === 'Screening' ? '#0056b3' :
                         candidate.status === 'Interview' ? '#7c2d12' : 
                         candidate.status === 'Offer' ? '#155724' : '#721c24'
                }}>
                  {candidate.status}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '18px', color: '#0C3D4A' }}>
              Contact Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px' }}>📧</span>
                <span style={{ fontWeight: '500' }}>{candidate.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px' }}>📱</span>
                <span style={{ fontWeight: '500' }}>{candidate.phone}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '18px', color: '#0C3D4A' }}>Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {candidate.skills.map((skill, index) => (
                <span key={index} style={{
                  background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
                  color: '#0C3D4A',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '18px', color: '#0C3D4A' }}>
              Application Details
            </h4>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Applied Date:</span>
                  <span style={{ fontWeight: '500' }}>{candidate.appliedDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Source:</span>
                  <span style={{ fontWeight: '500' }}>{candidate.source}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Experience:</span>
                  <span style={{ fontWeight: '500' }}>{candidate.experience}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '18px', color: '#0C3D4A' }}>
              Interview History
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#0C3D4A',
                color: 'white',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: '500'
              }}>
                {candidateInterviews.length}
              </span>
            </h4>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
              {candidateInterviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {candidateInterviews.map((interview, index) => (
                    <div key={interview.id} style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${getInterviewStatusColor(interview)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600', color: '#0C3D4A' }}>
                          {getInterviewTypeIcon(interview.type)} Round {interview.round}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {formatDate(interview.date)}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>
                        <strong>Time:</strong> {formatTime(interview.time)} ({interview.duration} min)
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>
                        <strong>Interviewer:</strong> {interview.interviewer}
                      </div>
                      
                      {interview.location && (
                        <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>
                          <strong>
                            {interview.type === 'video' ? 'Meeting Link:' : 
                             interview.type === 'phone' ? 'Phone:' : 'Location:'}
                          </strong> {interview.location}
                        </div>
                      )}
                      
                      {interview.notes && (
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                          <strong>Notes:</strong> {interview.notes}
                        </div>
                      )}
                      
                      <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: new Date(interview.date) > new Date() ? '#dbeafe' : '#dcfce7',
                        color: new Date(interview.date) > new Date() ? '#1e40af' : '#16a34a'
                      }}>
                        {new Date(interview.date) > new Date() ? 'Upcoming' : 'Completed'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  📅 No interviews scheduled yet
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '18px', color: '#0C3D4A' }}>
              Notes
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#0C3D4A',
                color: 'white',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: '500'
              }}>
                {candidate.notes?.length || 0}
              </span>
            </h4>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
              {candidate.notes && candidate.notes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {candidate.notes.map((note, index) => (
                    <div key={index} style={{
                      background: 'white',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '14px', color: '#333' }}>{note.content}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {note.date} by {note.author}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  📝 No notes added yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewCandidateModal;