import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Square, AlertTriangle, CheckCircle } from 'lucide-react';

const BREAK_TYPES = {
  SHORT:     { label: 'Short Break',     minutes: 15,  color: '#3b82f6', desc: '15 minutes' },
  LONG:      { label: 'Long Break',      minutes: 30,  color: '#8b5cf6', desc: '30 minutes' },
  FULL:      { label: 'Full Break',      minutes: 60,  color: '#f59e0b', desc: '1 hour' },
  EMERGENCY: { label: 'Emergency Break', minutes: null, color: '#ef4444', desc: 'No time limit' },
};

const AttendanceTracker = ({ employeeId, onAttendanceUpdate }) => {
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [autoCheckoutWarning, setAutoCheckoutWarning] = useState(false);
  const [shiftInfo, setShiftInfo] = useState(null);

  // Break type modal state
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState('SHORT');

  // Break countdown
  const [breakCountdown, setBreakCountdown] = useState(null);
  const [breakOverrunAlert, setBreakOverrunAlert] = useState(false);
  const breakIntervalRef = useRef(null);

  // Default config — overridden by shift info from API
  const BUSINESS_CONFIG = {
    STANDARD_WORK_HOURS: 8,
    MAX_OVERTIME_HOURS: 4,
    MAX_TOTAL_HOURS: 12,
    WORK_START_TIME: shiftInfo?.shiftStart || '08:00',
    WORK_END_TIME: shiftInfo?.shiftEnd || '17:00',
    AUTO_CHECKOUT_TIME: '21:00',
    LATE_THRESHOLD_MINUTES: 15
  };

  const getCurrentTime = () => new Date();

  const checkAutoCheckout = async () => {
    if (!currentAttendance?.checkInTime || currentAttendance?.checkOutTime) return;
    const checkInTime = new Date(currentAttendance.checkInTime);
    const now = getCurrentTime();
    const hoursWorked = (now - checkInTime) / (1000 * 60 * 60);
    if (hoursWorked >= BUSINESS_CONFIG.MAX_TOTAL_HOURS) {
      setAutoCheckoutWarning(true);
      setTimeout(async () => {
        await handleAutoCheckout();
        setAutoCheckoutWarning(false);
      }, 3000);
    }
  };

  const handleAutoCheckout = async () => {
    try {
      const result = await makeAttendanceCall('checkout', { isAutoCheckout: true, reason: 'Maximum work hours exceeded' });
      if (result.success) alert(`Auto check-out completed! You've reached the maximum ${BUSINESS_CONFIG.MAX_TOTAL_HOURS}-hour work limit.`);
    } catch (error) { console.error('Auto checkout failed:', error); }
  };

  // Find the active (unfinished) break from the breaks array
  const activeBreakRecord = currentAttendance?.breaks?.find(b => !b.endTime);
  const activeBreakTypeKey = activeBreakRecord?.breakType || 'SHORT';

  // Update break countdown every second
  useEffect(() => {
    if (currentAttendance?.status === 'ON_BREAK' && activeBreakRecord) {
      const config = BREAK_TYPES[activeBreakTypeKey];

      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);

      breakIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((getCurrentTime() - new Date(activeBreakRecord.startTime)) / 1000);

        if (config.minutes !== null) {
          const remaining = config.minutes * 60 - elapsed;
          if (remaining <= 0) {
            setBreakCountdown({ elapsed, remaining: 0, overrun: Math.abs(remaining), allowedMinutes: config.minutes });
            if (!breakOverrunAlert) setBreakOverrunAlert(true);
          } else {
            setBreakCountdown({ elapsed, remaining, overrun: 0, allowedMinutes: config.minutes });
            setBreakOverrunAlert(false);
          }
        } else {
          setBreakCountdown({ elapsed, remaining: null, overrun: 0, allowedMinutes: null });
        }
      }, 1000);
    } else {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
      setBreakCountdown(null);
      setBreakOverrunAlert(false);
    }
    return () => { if (breakIntervalRef.current) clearInterval(breakIntervalRef.current); };
  }, [currentAttendance?.status, activeBreakRecord?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getCurrentTime();
      setCurrentTime(newTime);
      if (newTime.getSeconds() === 0) checkAutoCheckout();
    }, 1000);
    return () => clearInterval(timer);
  }, [currentAttendance]);

  useEffect(() => {
    if (currentAttendance?.checkInTime && !currentAttendance?.checkOutTime) {
      const checkInTime = new Date(currentAttendance.checkInTime);
      const now = getCurrentTime();
      let endTime = now;
      if (currentAttendance.status === 'ON_BREAK' && activeBreakRecord) {
        endTime = new Date(activeBreakRecord.startTime);
      }
      const diff = endTime - checkInTime;
      const breakTime = (currentAttendance.breakMinutes || 0) * 60 * 1000;
      const workingDiff = Math.max(0, diff - breakTime);
      const hours = Math.floor(workingDiff / (1000 * 60 * 60));
      const minutes = Math.floor((workingDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((workingDiff % (1000 * 60)) / 1000);
      setSessionTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setSessionTime('00:00:00');
    }
  }, [currentTime, currentAttendance]);

  const fetchCurrentAttendance = async () => {
    if (!employeeId) return;
    try {
      const today = getCurrentTime().toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/api/attendance/current/${employeeId}?date=${today}`, { credentials: 'include' });
      const data = await response.json();
      setCurrentAttendance(data.attendance);
    } catch (error) { console.error('Error fetching attendance:', error); }
  };

  // Fetch employee shift info (department-based timings)
  const fetchShiftInfo = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/attendance/shift-info/${employeeId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setShiftInfo(data);
      }
    } catch (err) {
      console.error('Error fetching shift info:', err);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchCurrentAttendance();
      fetchShiftInfo();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      setTimeout(() => { fetchCurrentAttendance(); onAttendanceUpdate && onAttendanceUpdate(); }, midnight - new Date());
    }
  }, [employeeId]);

  const validateAttendanceAction = (action) => {
    switch (action) {
      case 'checkin':
        if (currentAttendance?.checkInTime && !currentAttendance?.checkOutTime)
          return { valid: false, error: 'Already checked in today.' };
        break;
      case 'checkout':
        if (!currentAttendance?.checkInTime)
          return { valid: false, error: 'Cannot check out without checking in first.' };
        if (currentAttendance?.checkOutTime)
          return { valid: false, error: 'Already checked out today.' };
        break;
      case 'break':
        if (!currentAttendance?.checkInTime)
          return { valid: false, error: 'Cannot take break without checking in first.' };
        if (currentAttendance?.checkOutTime)
          return { valid: false, error: 'Cannot take break after checking out.' };
        if (currentAttendance?.status === 'ON_BREAK')
          return { valid: false, error: 'Already on break.' };
        break;
    }
    return { valid: true };
  };

  const makeAttendanceCall = async (endpoint, data = {}) => {
    const action = endpoint.split('/')[0];
    const validation = validateAttendanceAction(action);
    if (!validation.valid) { alert(validation.error); return { success: false, error: validation.error }; }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/attendance/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeId: parseInt(employeeId), timestamp: getCurrentTime().toISOString(), ...data })
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
      let msg = 'Check-in successful!';
      if (result.data.isLate) {
        const mins = result.data.lateMinutes || 0;
        if (mins >= 120) {
          msg += ` (Late by ${mins} min — half-day deduction applies)`;
        } else {
          msg += ` (Late by ${mins} min)`;
        }
      }
      if (result.data.isTechnical) msg += ' [Technical — no late penalty]';
      alert(msg);
    } else {
      alert(result.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    const result = await makeAttendanceCall('checkout');
    if (result.success) {
      const totalHours = result.data.totalHours?.toFixed(2) || 0;
      const overtime = result.data.overtime?.toFixed(2) || 0;
      const extended = result.data.extendedHours?.toFixed(2) || 0;
      const unapproved = Math.max(0, parseFloat(extended) - parseFloat(overtime)).toFixed(2);
      let message = `Check-out successful! Total hours: ${totalHours}`;
      if (parseFloat(overtime) > 0) message += `\nApproved overtime: ${overtime} hrs (paid)`;
      if (parseFloat(unapproved) > 0) message += `\nExtended hours: ${unapproved} hrs (unpaid — no approved OT request)`;
      alert(message);
    } else {
      alert(result.error || 'Check-out failed');
    }
  };

  const handleBreakStart = async () => {
    const result = await makeAttendanceCall('break/start', { breakType: selectedBreakType });
    setShowBreakModal(false);
    if (result.success) {
      await fetchCurrentAttendance(); // re-fetch to get updated breaks array
      const cfg = BREAK_TYPES[selectedBreakType];
      alert(`${cfg.label} started (Break #${result.data.breakNumber})! ${cfg.minutes ? `You have ${cfg.desc}.` : 'No time limit.'}`);
    } else {
      alert(result.error || 'Failed to start break');
    }
  };

  const handleBreakEnd = async () => {
    const result = await makeAttendanceCall('break/end');
    if (result.success) {
      await fetchCurrentAttendance(); // re-fetch to get updated breaks array
      const { breakDuration, isOverrun, overrunMinutes, breakType, totalBreaksToday, totalBreakMinutes } = result.data;
      const cfg = BREAK_TYPES[breakType] || {};
      let msg = `Break ended! Duration: ${breakDuration} min (${cfg.label || breakType})`;
      msg += `\nBreaks today: ${totalBreaksToday} | Total break time: ${totalBreakMinutes} min`;
      if (isOverrun) {
        msg += `\n⚠️ Overrun by ${overrunMinutes} minutes — excess time flagged for salary deduction.`;
      }
      alert(msg);
    } else {
      alert(result.error || 'Failed to end break');
    }
  };

  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatSeconds = (totalSecs) => {
    const m = Math.floor(Math.abs(totalSecs) / 60);
    const s = Math.abs(totalSecs) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const map = {
      PRESENT:         { class: 'status-present',  label: 'Present' },
      ABSENT:          { class: 'status-absent',   label: 'Absent' },
      LATE:            { class: 'status-late',     label: 'Late' },
      HALF_DAY:        { class: 'status-early',    label: 'Half Day' },
      ON_BREAK:        { class: 'status-late',     label: 'On Break' },
      EARLY_DEPARTURE: { class: 'status-early',    label: 'Early Out' },
      OVERTIME:        { class: 'status-overtime', label: 'Overtime' },
    };
    return map[status] || map.PRESENT;
  };

  const getWorkProgress = () => {
    if (!currentAttendance?.checkInTime || currentAttendance?.checkOutTime)
      return { hours: 0, percentage: 0, overtimeHours: 0 };
    const checkInTime = new Date(currentAttendance.checkInTime);
    const now = getCurrentTime();
    const workMs = Math.max(0, (now - checkInTime) - (currentAttendance.breakMinutes || 0) * 60 * 1000);
    const hoursWorked = workMs / (1000 * 60 * 60);
    return {
      hours: hoursWorked,
      regularHours: Math.min(hoursWorked, BUSINESS_CONFIG.STANDARD_WORK_HOURS),
      overtimeHours: Math.max(0, hoursWorked - BUSINESS_CONFIG.STANDARD_WORK_HOURS),
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
  const activeBreakType = activeBreakRecord ? BREAK_TYPES[activeBreakTypeKey] : null;
  const completedBreaks = currentAttendance?.breaks?.filter(b => b.endTime) || [];

  return (
    <div className="attendance-tracker-card">
      {/* Auto-checkout warning */}
      {autoCheckoutWarning && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#fee2e2', border: '2px solid #fecaca', borderRadius: '8px', padding: '16px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: '600' }}>Auto check-out in 3 seconds — Maximum work hours exceeded!</span>
          </div>
        </div>
      )}

      {/* Break overrun alert */}
      {breakOverrunAlert && breakCountdown && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#fef3c7', border: '2px solid #fcd34d', borderRadius: '8px', padding: '16px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: '600' }}>
              Break overrun! +{formatSeconds(breakCountdown.overrun)} over limit — salary deduction will apply.
            </span>
          </div>
        </div>
      )}

      <div className="tracker-header">
        <Clock className="header-icon" />
        <h3>Smart Attendance Tracker</h3>
        <div className="current-time">
          <span className="time-label">Current Time</span>
          <span className="time-display">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
            Shift: {BUSINESS_CONFIG.WORK_START_TIME} – {BUSINESS_CONFIG.WORK_END_TIME}
            {shiftInfo && (
              <span style={{ marginLeft: '6px', color: shiftInfo.isTechnical ? '#3b82f6' : '#8b5cf6' }}>
                ({shiftInfo.isTechnical ? 'Technical' : 'Non-Technical'})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="attendance-status-section">
        {currentAttendance ? (
          <div className="status-card-tracker">
            <div className="status-header">
              <span className="status-label">Today's Status:</span>
              {statusBadge && <span className={`status-badge ${statusBadge.class}`}>{statusBadge.label}</span>}
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

              {/* Break countdown */}
              {currentAttendance.status === 'ON_BREAK' && breakCountdown !== null && activeBreakType && (
                <div className="time-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ color: activeBreakType.color, fontWeight: 600 }}>
                      {activeBreakType.label}
                    </span>
                    {breakCountdown.allowedMinutes !== null ? (
                      <span style={{ fontWeight: 700, color: breakCountdown.overrun > 0 ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>
                        {breakCountdown.overrun > 0 ? `+${formatSeconds(breakCountdown.overrun)} OVER` : `${formatSeconds(breakCountdown.remaining)} left`}
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{formatSeconds(breakCountdown.elapsed)} elapsed</span>
                    )}
                  </div>
                  {breakCountdown.allowedMinutes !== null && (
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min((breakCountdown.elapsed / (breakCountdown.allowedMinutes * 60)) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: breakCountdown.overrun > 0 ? '#ef4444' : activeBreakType.color,
                        transition: 'width 1s linear'
                      }} />
                    </div>
                  )}
                </div>
              )}

              {!currentAttendance.checkOutTime && currentAttendance.checkInTime && (
                <div className="time-row">
                  <span>Progress:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(workProgress.percentage, 100)}%`, height: '100%', backgroundColor: workProgress.overtimeHours > 0 ? '#f59e0b' : '#10b981', transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#666' }}>{workProgress.hours.toFixed(1)}h</span>
                  </div>
                </div>
              )}

              {currentAttendance.totalHours != null && (
                <div className="time-row">
                  <span>Total Hours:</span>
                  <span className="time-value" style={{ fontWeight: 700, color: '#0C3D4A' }}>
                    {Math.floor(currentAttendance.totalHours)}h {Math.round((currentAttendance.totalHours % 1) * 60)}m
                    <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 4, fontSize: '0.85em' }}>
                      ({currentAttendance.totalHours.toFixed(2)} hrs)
                    </span>
                  </span>
                </div>
              )}
              {(currentAttendance.breakMinutes > 0 || completedBreaks.length > 0) && (
                <div className="time-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Breaks ({completedBreaks.length}):</span>
                    <span className="time-value">
                      {currentAttendance.breakMinutes || 0} mins total
                      {currentAttendance.breakOverrun && <span style={{ color: '#ef4444', marginLeft: '6px', fontSize: '0.75rem' }}>⚠ Overrun</span>}
                    </span>
                  </div>
                  {completedBreaks.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {completedBreaks.map((b, i) => {
                        const cfg = BREAK_TYPES[b.breakType] || BREAK_TYPES.SHORT;
                        return (
                          <span key={b.id} style={{
                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                            background: `${cfg.color}15`, color: cfg.color, fontWeight: 600
                          }}>
                            {cfg.label}: {b.duration}m{b.overrun ? ' ⚠' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {currentAttendance.overtime > 0 && (
                <div className="time-row overtime-row">
                  <span>Overtime:</span>
                  <span className="overtime-value">{currentAttendance.overtime.toFixed(2)} hrs</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-attendance-card">
            <p>No attendance record for today</p>
          </div>
        )}
      </div>

      <div className="action-buttons-section">
        {!currentAttendance?.checkInTime ? (
          <button className="tracker-btn btn-check-in" onClick={handleCheckIn} disabled={loading}>
            <Play className="btn-icon" />
            {loading ? 'Processing...' : 'Check In'}
          </button>
        ) : !currentAttendance?.checkOutTime ? (
          <div className="button-group">
            {currentAttendance.status !== 'ON_BREAK' ? (
              <>
                <button className="tracker-btn btn-break" onClick={() => setShowBreakModal(true)} disabled={loading}>
                  <Pause className="btn-icon" />
                  {loading ? 'Processing...' : 'Start Break'}
                </button>
                <button className="tracker-btn btn-check-out" onClick={handleCheckOut} disabled={loading}>
                  <Square className="btn-icon" />
                  {loading ? 'Processing...' : 'Check Out'}
                </button>
              </>
            ) : (
              <>
                <button className="tracker-btn btn-end-break" onClick={handleBreakEnd} disabled={loading}>
                  <Play className="btn-icon" />
                  {loading ? 'Processing...' : 'End Break'}
                </button>
                <button className="tracker-btn btn-check-out" onClick={handleCheckOut} disabled={loading}>
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

      {/* Break Type Selection Modal */}
      {showBreakModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '400px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ background: '#0C3D4A', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Select Break Type</h3>
              <button onClick={() => setShowBreakModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {Object.entries(BREAK_TYPES).map(([key, cfg]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedBreakType(key)}
                    style={{
                      border: `2px solid ${selectedBreakType === key ? cfg.color : '#e2e8f0'}`,
                      borderRadius: '10px',
                      padding: '0.875rem',
                      cursor: 'pointer',
                      background: selectedBreakType === key ? `${cfg.color}12` : 'white',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: cfg.color, fontSize: '0.875rem', marginBottom: '2px' }}>{cfg.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cfg.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                <strong style={{ color: '#374151' }}>Note:</strong> Exceeding the allowed break duration will flag your record for salary deduction.
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowBreakModal(false)} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button onClick={handleBreakStart} disabled={loading} style={{ padding: '0.5rem 1.25rem', background: BREAK_TYPES[selectedBreakType].color, color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  {loading ? 'Starting...' : `Start ${BREAK_TYPES[selectedBreakType].label}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
