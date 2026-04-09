import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

const AttendanceTracker = ({ employeeId, onAttendanceUpdate }) => {
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [apiTimeAvailable, setApiTimeAvailable] = useState(true);
  const [timeOffset, setTimeOffset] = useState(0);
  const [autoCheckoutWarning, setAutoCheckoutWarning] = useState(false);

  // BUSINESS RULES
  const BUSINESS_CONFIG = {
    STANDARD_WORK_HOURS: 8,
    MAX_OVERTIME_HOURS: 4,
    MAX_TOTAL_HOURS: 12, // 8 + 4 = 12 hours maximum per day
    WORK_START_TIME: '09:00', // 9 AM
    AUTO_CHECKOUT_TIME: '21:00', // 9 PM (9 AM + 12 hours)
    LATE_THRESHOLD_MINUTES: 15 // Late if more than 15 min after work start
  };

  // Fetch real-time from WorldTimeAPI
  const fetchApiTime = async () => {
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
      if (response.ok) {
        const data = await response.json();
        const apiTime = new Date(data.datetime);
        const systemTime = new Date();
        setTimeOffset(apiTime.getTime() - systemTime.getTime());
        setApiTimeAvailable(true);
        return apiTime;
      }
    } catch (error) {
      console.warn('API time unavailable, using system time:', error);
      setApiTimeAvailable(false);
      return new Date();
    }
  };

  // Get current accurate time
  const getCurrentTime = () => {
    const systemTime = new Date();
    return new Date(systemTime.getTime() + timeOffset);
  };

  // Check if auto-checkout is needed
  const checkAutoCheckout = async () => {
    if (!currentAttendance?.checkInTime || currentAttendance?.checkOutTime) {
      return;
    }

    const checkInTime = new Date(currentAttendance.checkInTime);
    const now = getCurrentTime();
    const hoursWorked = (now - checkInTime) / (1000 * 60 * 60);

    // Auto-checkout if worked more than max hours
    if (hoursWorked >= BUSINESS_CONFIG.MAX_TOTAL_HOURS) {
      setAutoCheckoutWarning(true);
      setTimeout(async () => {
        await handleAutoCheckout();
        setAutoCheckoutWarning(false);
      }, 3000); // 3 second warning before auto-checkout
    }
  };

  // Handle automatic checkout
  const handleAutoCheckout = async () => {
    try {
      const result = await makeAttendanceCall('checkout', { 
        isAutoCheckout: true,
        reason: 'Maximum work hours exceeded' 
      });
      
      if (result.success) {
        alert(`Auto check-out completed! You've reached the maximum ${BUSINESS_CONFIG.MAX_TOTAL_HOURS}-hour work limit.`);
      }
    } catch (error) {
      console.error('Auto checkout failed:', error);
    }
  };

  // Update current time every second and check for auto-checkout
  useEffect(() => {
    fetchApiTime().then(apiTime => {
      setCurrentTime(apiTime);
    });

    const timer = setInterval(() => {
      const newTime = getCurrentTime();
      setCurrentTime(newTime);
      
      // Check for auto-checkout every minute
      if (newTime.getSeconds() === 0) {
        checkAutoCheckout();
      }
    }, 1000);

    // Refresh API time every 5 minutes
    const apiRefreshTimer = setInterval(() => {
      fetchApiTime();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(apiRefreshTimer);
    };
  }, [timeOffset, currentAttendance]);

  // Calculate session time with business logic
  useEffect(() => {
    if (currentAttendance?.checkInTime && !currentAttendance?.checkOutTime) {
      const checkInTime = new Date(currentAttendance.checkInTime);
      const now = getCurrentTime();
      
      let endTime = now;
      if (currentAttendance.status === 'ON_BREAK' && currentAttendance.breakStart) {
        endTime = new Date(currentAttendance.breakStart);
      }
      
      const diff = endTime - checkInTime;
      let breakTime = 0;
      if (currentAttendance.breakMinutes) {
        breakTime = currentAttendance.breakMinutes * 60 * 1000;
      }
      
      const workingDiff = Math.max(0, diff - breakTime);
      
      const hours = Math.floor(workingDiff / (1000 * 60 * 60));
      const minutes = Math.floor((workingDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((workingDiff % (1000 * 60)) / 1000);
      
      setSessionTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setSessionTime('00:00:00');
    }
  }, [currentTime, currentAttendance]);

  // Fetch current attendance status with date validation
  const fetchCurrentAttendance = async () => {
    if (!employeeId) return;
    
    try {
      const today = getCurrentTime().toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/api/attendance/current/${employeeId}?date=${today}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setCurrentAttendance(data.attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Auto-refresh attendance data when date changes
  useEffect(() => {
    const checkDateChange = () => {
      const now = getCurrentTime();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
      const timeToMidnight = midnight - now;
      
      // Set timeout to refresh at midnight
      setTimeout(() => {
        fetchCurrentAttendance();
        onAttendanceUpdate && onAttendanceUpdate();
      }, timeToMidnight);
    };

    if (employeeId) {
      fetchCurrentAttendance();
      checkDateChange();
    }
  }, [employeeId]);

  // Validate business rules before API calls
  const validateAttendanceAction = (action) => {
    const now = getCurrentTime();
    
    switch (action) {
      case 'checkin':
        if (currentAttendance?.checkInTime && !currentAttendance?.checkOutTime) {
          return { valid: false, error: 'Already checked in today. Please check out first.' };
        }
        break;
        
      case 'checkout':
        if (!currentAttendance?.checkInTime) {
          return { valid: false, error: 'Cannot check out without checking in first.' };
        }
        if (currentAttendance?.checkOutTime) {
          return { valid: false, error: 'Already checked out today.' };
        }
        break;
        
      case 'break':
        if (!currentAttendance?.checkInTime) {
          return { valid: false, error: 'Cannot take break without checking in first.' };
        }
        if (currentAttendance?.checkOutTime) {
          return { valid: false, error: 'Cannot take break after checking out.' };
        }
        if (currentAttendance?.status === 'ON_BREAK') {
          return { valid: false, error: 'Already on break.' };
        }
        break;
        
      default:
        break;
    }
    
    return { valid: true };
  };

  // Handle API calls with business rule validation
  const makeAttendanceCall = async (endpoint, data = {}) => {
    const validation = validateAttendanceAction(endpoint.split('/')[0]);
    if (!validation.valid) {
      alert(validation.error);
      return { success: false, error: validation.error };
    }

    setLoading(true);
    try {
      const accurateTime = getCurrentTime();
      
      const response = await fetch(`http://localhost:5000/api/attendance/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          employeeId: parseInt(employeeId), 
          timestamp: accurateTime.toISOString(),
          businessConfig: BUSINESS_CONFIG,
          ...data 
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setCurrentAttendance(result.attendance);
        onAttendanceUpdate && onAttendanceUpdate();
        return { success: true, data: result };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    const result = await makeAttendanceCall('checkin');
    if (result.success) {
      const message = `Check-in successful!${result.data.isLate ? ' (Late arrival noted)' : ''}`;
      alert(message);
    } else {
      alert(result.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    const result = await makeAttendanceCall('checkout');
    if (result.success) {
      const totalHours = result.data.totalHours?.toFixed(2) || 0;
      const overtime = result.data.overtime?.toFixed(2) || 0;
      let message = `Check-out successful! Total hours: ${totalHours}`;
      if (overtime > 0) message += ` (Overtime: ${overtime} hours)`;
      alert(message);
    } else {
      alert(result.error || 'Check-out failed');
    }
  };

  const handleBreakStart = async () => {
    const result = await makeAttendanceCall('break/start');
    if (result.success) {
      alert('Break started!');
    } else {
      alert(result.error || 'Failed to start break');
    }
  };

  const handleBreakEnd = async () => {
    const result = await makeAttendanceCall('break/end');
    if (result.success) {
      alert(`Break ended! Duration: ${result.data.breakDuration} minutes`);
    } else {
      alert(result.error || 'Failed to end break');
    }
  };

  const formatTime = (date) => {
    return date ? new Date(date).toLocaleTimeString() : '--:--:--';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PRESENT: { class: 'status-present', label: 'Present' },
      ABSENT: { class: 'status-absent', label: 'Absent' },
      LATE: { class: 'status-late', label: 'Late' },
      HALF_DAY: { class: 'status-early', label: 'Half Day' },
      ON_BREAK: { class: 'status-late', label: 'On Break' },
      EARLY_DEPARTURE: { class: 'status-early', label: 'Early Out' },
      OVERTIME: { class: 'status-overtime', label: 'Overtime' }
    };
    
    const config = statusConfig[status] || statusConfig.PRESENT;
    return { class: config.class, label: config.label };
  };

  // Calculate hours worked for progress indication
  const getWorkProgress = () => {
    if (!currentAttendance?.checkInTime || currentAttendance?.checkOutTime) {
      return { hours: 0, percentage: 0, overtimeHours: 0 };
    }

    const checkInTime = new Date(currentAttendance.checkInTime);
    const now = getCurrentTime();
    const totalMs = now - checkInTime;
    const breakMs = (currentAttendance.breakMinutes || 0) * 60 * 1000;
    const workMs = Math.max(0, totalMs - breakMs);
    const hoursWorked = workMs / (1000 * 60 * 60);
    
    const regularHours = Math.min(hoursWorked, BUSINESS_CONFIG.STANDARD_WORK_HOURS);
    const overtimeHours = Math.max(0, hoursWorked - BUSINESS_CONFIG.STANDARD_WORK_HOURS);
    
    return {
      hours: hoursWorked,
      regularHours,
      overtimeHours,
      percentage: (hoursWorked / BUSINESS_CONFIG.MAX_TOTAL_HOURS) * 100
    };
  };

  if (!employeeId) {
    return (
      <div className="attendance-tracker-card">
        <div className="tracker-header">
          <Clock className="header-icon" />
          <h3>Attendance Tracker</h3>
        </div>
        <div className="no-employee-selected">
          <p>Please select an employee to track attendance</p>
        </div>
      </div>
    );
  }

  const statusBadge = currentAttendance?.status ? getStatusBadge(currentAttendance.status) : null;
  const workProgress = getWorkProgress();

  return (
    <div className="attendance-tracker-card">
      {/* Auto-checkout warning */}
      {autoCheckoutWarning && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#fee2e2',
          border: '2px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: '600' }}>
              Auto check-out in 3 seconds - Maximum work hours exceeded!
            </span>
          </div>
        </div>
      )}

      <div className="tracker-header">
        <Clock className="header-icon" />
        <h3>Smart Attendance Tracker</h3>
        <div className="current-time">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="time-label">Current Time</span>
            {apiTimeAvailable ? (
              <Wifi size={16} color="#10b981" title="API Time - Accurate" />
            ) : (
              <WifiOff size={16} color="#ef4444" title="System Time - Fallback" />
            )}
          </div>
          <span className="time-display">{currentTime.toLocaleTimeString()}</span>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
            Max: {BUSINESS_CONFIG.MAX_TOTAL_HOURS}h/day
          </div>
        </div>
      </div>

      <div className="attendance-status-section">
        {currentAttendance ? (
          <div className="status-card-tracker">
            <div className="status-header">
              <span className="status-label">Today's Status:</span>
              {statusBadge && (
                <span className={`status-badge ${statusBadge.class}`}>
                  {statusBadge.label}
                </span>
              )}
            </div>
            
            <div className="time-info-grid">
              <div className="time-row">
                <span>Check-in:</span>
                <span className="time-value">{formatTime(currentAttendance.checkInTime)}</span>
              </div>
              <div className="time-row">
                <span>Check-out:</span>
                <span className="time-value">{formatTime(currentAttendance.checkOutTime)}</span>
              </div>
              <div className="time-row session-row">
                <span>Session Time:</span>
                <span className="session-time">{sessionTime}</span>
              </div>
              
              {/* Work progress indicator */}
              {!currentAttendance.checkOutTime && currentAttendance.checkInTime && (
                <div className="time-row">
                  <span>Progress:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '100px',
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(workProgress.percentage, 100)}%`,
                        height: '100%',
                        backgroundColor: workProgress.overtimeHours > 0 ? '#f59e0b' : '#10b981',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {workProgress.hours.toFixed(1)}h
                    </span>
                  </div>
                </div>
              )}
              
              {currentAttendance.totalHours && (
                <div className="time-row">
                  <span>Total Hours:</span>
                  <span className="time-value">{currentAttendance.totalHours.toFixed(2)} hrs</span>
                </div>
              )}
              {currentAttendance.breakMinutes > 0 && (
                <div className="time-row">
                  <span>Break Time:</span>
                  <span className="time-value">{currentAttendance.breakMinutes} mins</span>
                </div>
              )}
              {currentAttendance.overtime > 0 && (
                <div className="time-row overtime-row">
                  <span>Overtime:</span>
                  <span className="overtime-value">{currentAttendance.overtime.toFixed(2)} hrs</span>
                </div>
              )}
            </div>

            {currentAttendance.breakStart && !currentAttendance.breakEnd && (
              <div className="break-info-alert">
                <span>Break started at: {formatTime(currentAttendance.breakStart)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="no-attendance-card">
            <p>No attendance record for today</p>
          </div>
        )}
      </div>

      <div className="action-buttons-section">
        {!currentAttendance?.checkInTime ? (
          <button 
            className="tracker-btn btn-check-in"
            onClick={handleCheckIn}
            disabled={loading}
          >
            <Play className="btn-icon" />
            {loading ? 'Processing...' : 'Check In'}
          </button>
        ) : !currentAttendance?.checkOutTime ? (
          <div className="button-group">
            {currentAttendance.status !== 'ON_BREAK' ? (
              <>
                <button 
                  className="tracker-btn btn-break"
                  onClick={handleBreakStart}
                  disabled={loading}
                >
                  <Pause className="btn-icon" />
                  {loading ? 'Processing...' : 'Start Break'}
                </button>
                <button 
                  className="tracker-btn btn-check-out"
                  onClick={handleCheckOut}
                  disabled={loading}
                >
                  <Square className="btn-icon" />
                  {loading ? 'Processing...' : 'Check Out'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="tracker-btn btn-end-break"
                  onClick={handleBreakEnd}
                  disabled={loading}
                >
                  <Play className="btn-icon" />
                  {loading ? 'Processing...' : 'End Break'}
                </button>
                <button 
                  className="tracker-btn btn-check-out"
                  onClick={handleCheckOut}
                  disabled={loading}
                >
                  <Square className="btn-icon" />
                  {loading ? 'Processing...' : 'Check Out'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="completed-message">
            <CheckCircle className="check-icon" color="#10b981" size={24} />
            <span>Attendance completed for today</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
