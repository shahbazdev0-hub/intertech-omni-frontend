import React, { useState, useEffect } from 'react';
import Modal from './Modal'; 

const ScheduleInterviewModal = ({ candidate, isOpen, onClose, onSchedule }) => {
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    duration: '60',
    type: 'video',
    interviewer: '',
    location: '',
    notes: '',
    round: '1'
  });

  const today = new Date().toISOString().split('T')[0];

  // Get available interview types based on candidate status
  const getAvailableInterviewTypes = (candidateStatus) => {
    if (candidateStatus === 'New') {
      return [
        { value: 'phone', label: '📞 Phone Screening', defaultDuration: '30' },
        { value: 'video', label: '📹 Video Screening', defaultDuration: '45' }
      ];
    }
    
    // For Screening, Interview, and Offer candidates
    return [
      { value: 'phone', label: '📞 Phone Call', defaultDuration: '30' },
      { value: 'video', label: '📹 Video Call', defaultDuration: '60' },
      { value: 'in-person', label: '🏢 In-Person', defaultDuration: '60' }
    ];
  };

  // Get interview rounds based on candidate status
  const getInterviewRounds = (candidateStatus) => {
    if (candidateStatus === 'New') {
      return [
        { value: '1', label: 'Initial Phone Screening' },
        { value: '1', label: 'Initial Video Screening' }
      ];
    } else if (candidateStatus === 'Screening') {
      return [
        { value: '1', label: 'Round 1 - Technical Interview' },
        { value: '1', label: 'Round 1 - Behavioral Interview' },
        { value: '1', label: 'Round 1 - Department Interview' }
      ];
    } else {
      return [
        { value: '2', label: 'Round 2 - Technical Interview' },
        { value: '2', label: 'Round 2 - Team Interview' },
        { value: '3', label: 'Round 3 - Final Interview' },
        { value: '4', label: 'Round 4 - Leadership Interview' },
        { value: 'other', label: 'Other' }
      ];
    }
  };

  // Get status-based suggestions
  const getStatusSuggestions = (candidateStatus) => {
    switch (candidateStatus) {
      case 'New':
        return {
          title: 'Initial Screening',
          suggestion: 'Schedule a brief screening call to assess basic qualifications',
          recommendedDuration: '30-45 minutes',
          recommendedType: 'phone'
        };
      case 'Screening':
        return {
          title: 'Formal Interview',
          suggestion: 'Schedule a comprehensive interview to evaluate technical and cultural fit',
          recommendedDuration: '60-90 minutes',
          recommendedType: 'video'
        };
      case 'Interview':
        return {
          title: 'Additional Round',
          suggestion: 'Schedule follow-up interview or final round with leadership',
          recommendedDuration: '60-90 minutes',
          recommendedType: 'in-person'
        };
      default:
        return {
          title: 'Interview',
          suggestion: 'Schedule interview',
          recommendedDuration: '60 minutes',
          recommendedType: 'video'
        };
    }
  };

  // Initialize form with smart defaults based on candidate status
  useEffect(() => {
    if (candidate) {
      const availableTypes = getAvailableInterviewTypes(candidate.status);
      const suggestions = getStatusSuggestions(candidate.status);
      
      // Find the recommended type or use the first available
      const recommendedType = availableTypes.find(type => type.value === suggestions.recommendedType);
      const defaultType = recommendedType || availableTypes[0];
      
      setInterviewData(prev => ({
        ...prev,
        type: defaultType.value,
        duration: defaultType.defaultDuration,
        round: candidate.status === 'New' ? '1' : 
               candidate.status === 'Screening' ? '1' : '2'
      }));
    }
  }, [candidate]);

  const handleInputChange = (field, value) => {
    setInterviewData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-adjust duration when interview type changes
  const handleTypeChange = (type) => {
    const availableTypes = getAvailableInterviewTypes(candidate.status);
    const selectedType = availableTypes.find(t => t.value === type);
    
    setInterviewData(prev => ({
      ...prev,
      type: type,
      duration: selectedType?.defaultDuration || '60'
    }));
  };

  const handleSchedule = () => {
    // Validation
    if (!interviewData.date || !interviewData.time || !interviewData.interviewer) {
      alert('Please fill in all required fields (Date, Time, and Interviewer)');
      return;
    }

    const interview = {
      ...interviewData,
      candidateId: candidate.id,
      candidateName: candidate.name,
      position: candidate.position,
      scheduledBy: 'HR Team', // You can make this dynamic
      createdAt: new Date().toISOString()
    };
    
    onSchedule(interview);
    
    // Reset form
    setInterviewData({
      date: '',
      time: '',
      duration: '60',
      type: 'video',
      interviewer: '',
      location: '',
      notes: '',
      round: '1'
    });
    
    onClose();
  };

  if (!candidate) return null;

  const availableTypes = getAvailableInterviewTypes(candidate.status);
  const availableRounds = getInterviewRounds(candidate.status);
  const suggestions = getStatusSuggestions(candidate.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Interview" size="medium">
      {/* Status-based Suggestions */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #bae6fd'
      }}>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px', 
          color: '#0c4a6e',
          fontWeight: '600'
        }}>
          💡 {suggestions.title} Recommendation
        </h4>
        <div style={{ 
          fontSize: '13px', 
          color: '#075985',
          marginBottom: '8px'
        }}>
          {suggestions.suggestion}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#0369a1'
        }}>
          Recommended: {suggestions.recommendedDuration} • {suggestions.recommendedType}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Interview Date *
            </label>
            <input
              type="date"
              value={interviewData.date}
              min={today}
              onChange={(e) => handleInputChange('date', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Interview Time *
            </label>
            <input
              type="time"
              value={interviewData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Duration (minutes)
            </label>
            <select
              value={interviewData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              {candidate.status === 'New' ? (
                <>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                </>
              ) : (
                <>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">2 hours</option>
                </>
              )}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Interview Round
            </label>
            <select
              value={interviewData.round}
              onChange={(e) => handleInputChange('round', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              {availableRounds.map((round, index) => (
                <option key={index} value={round.value}>{round.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Interview Type
              {candidate.status === 'New' && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#0369a1', 
                  marginLeft: '8px' 
                }}>
                  (Screening only)
                </span>
              )}
            </label>
            <select
              value={interviewData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              {availableTypes.map((type, index) => (
                <option key={index} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Interviewer *
            </label>
            <input
              type="text"
              value={interviewData.interviewer}
              onChange={(e) => handleInputChange('interviewer', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter interviewer name"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              {interviewData.type === 'video' ? 'Meeting Link' : 
               interviewData.type === 'phone' ? 'Phone Number' : 'Location'}
            </label>
            <input
              type="text"
              value={interviewData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder={
                interviewData.type === 'video' ? 'https://zoom.us/j/...' :
                interviewData.type === 'phone' ? '+1 (555) 123-4567' :
                'Office address or room number'
              }
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: '#333' 
            }}>
              Notes
            </label>
            <textarea
              value={interviewData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              placeholder="Any additional notes or instructions..."
            />
          </div>
        </div>
      </div>

      {/* Candidate Info Summary */}
      <div style={{
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px', 
          color: '#0C3D4A',
          fontWeight: '600'
        }}>
          📅 Interview for:
        </h4>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#333',
          marginBottom: '4px'
        }}>
          {candidate.name} - {candidate.position}
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#666'
        }}>
          Current Status: {candidate.status} • Applied: {candidate.appliedDate}
        </div>
        
        {/* Status Change Preview */}
        {candidate.status === 'New' && (interviewData.type === 'phone' || interviewData.type === 'video') && (
          <div style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: '#dcfce7',
            color: '#16a34a',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            ✓ Status will change to "Screening" after scheduling
          </div>
        )}
        
        {candidate.status === 'Screening' && (
          <div style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: '#e0e7ff',
            color: '#4338ca',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            ✓ Status will change to "Interview" after scheduling
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
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
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSchedule}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #0C3D4A, #1a4f5e)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          📅 Schedule Interview
        </button>
      </div>
    </Modal>
  );
};

export default ScheduleInterviewModal;