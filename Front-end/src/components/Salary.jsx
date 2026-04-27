import React, { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:5000/api/salaries';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : 'N/A');

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Tab 1: Monthly Payroll ────────────────────────────────────────────────
const MonthlyPayroll = ({ departments }) => {
  const now = new Date();
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [year,   setYear]   = useState(now.getFullYear());
  const [deptId, setDeptId] = useState('');
  const [payroll, setPayroll] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  const compute = async () => {
    setLoading(true);
    setMsg('');
    setPayroll(null);
    try {
      const params = new URLSearchParams({ month, year });
      if (deptId) params.append('departmentId', deptId);
      const res  = await fetch(`${API}/payroll/compute?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPayroll(data.payroll);
        setSummary(data.summary);
      } else {
        setMsg('Error: ' + (data.message || 'Failed to compute payroll'));
      }
    } catch {
      setMsg('Error: Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    if (!window.confirm(`Generate & save payroll for ${months[month-1]} ${year}? This creates permanent salary records.`)) return;
    setSaving(true);
    setMsg('');
    try {
      const periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const periodEnd   = new Date(year, month,     0).toISOString().split('T')[0];
      const body = { startDate: periodStart, endDate: periodEnd };
      if (deptId) body.departmentId = parseInt(deptId);
      const res  = await fetch(`${API}/payroll/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Payroll saved — ${data.summary.totalEmployees} records created, total gross ${fmt(data.summary.totalGrossPay)}.`);
      } else {
        setMsg('Error: ' + (data.message || 'Failed to generate payroll'));
      }
    } catch {
      setMsg('Error: Could not reach server');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!payroll) return;
    const header = 'Employee,Department,Type,Base Salary,Regular Pay,OT Hours,OT Pay,Break Deduction,Unpaid Leave Days,Leave Deduction,Net Pay';
    const rows = payroll.map(r =>
      [r.employeeName, r.department, r.employmentType, r.baseSalary,
       r.regularPay, r.otHours, r.otPay, r.breakDeduction,
       r.unpaidLeaveDays, r.leaveDeduction, r.netPay].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `payroll_${months[month-1]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filters */}
      <div style={S.filterBar}>
        <div style={S.fg}>
          <label style={S.label}>Month</label>
          <select style={S.sel} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div style={S.fg}>
          <label style={S.label}>Year</label>
          <select style={S.sel} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={S.fg}>
          <label style={S.label}>Department</label>
          <select style={S.sel} value={deptId} onChange={e => setDeptId(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button style={S.btnPrimary} onClick={compute} disabled={loading}>
          {loading ? 'Computing…' : 'Compute Preview'}
        </button>
      </div>

      {msg && (
        <div style={msg.startsWith('Error') ? S.alertErr : S.alertOk}>{msg}</div>
      )}

      {/* Summary cards */}
      {summary && (
        <div style={S.cardRow}>
          <SCard label="Employees"        value={summary.totalEmployees} />
          <SCard label="Total Gross Pay"  value={fmt(summary.totalGrossPay)} />
          <SCard label="Total OT Pay"     value={fmt(summary.totalOTPay)} />
          <SCard label="Break Deductions" value={fmt(summary.totalBreakDeductions)} />
          <SCard label="Leave Deductions" value={fmt(summary.totalLeaveDeductions)} />
        </div>
      )}

      {/* Payroll table */}
      {payroll && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button style={S.btnSuccess} onClick={generate} disabled={saving}>
              {saving ? 'Saving…' : 'Generate & Save Payroll'}
            </button>
            <button style={S.btnSecondary} onClick={exportCSV}>Export CSV</button>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Employee','Dept','Type','Base Salary',
                    'Regular Pay','OT Hrs','OT Pay',
                    'Break Ded.','Leave Ded.','Net Pay'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payroll.map((r, i) => (
                  <tr key={r.employeeId} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                    <td style={S.td}>{r.employeeName}</td>
                    <td style={S.td}>{r.department}</td>
                    <td style={S.td}>
                      <span style={typeBadge(r.employmentType)}>{r.employmentType}</span>
                    </td>
                    <td style={{...S.td, ...S.num}}>{fmt(r.baseSalary)}</td>
                    <td style={{...S.td, ...S.num}}>{fmt(r.regularPay)}</td>
                    <td style={{...S.td, ...S.num}}>{r.otHours ?? '—'}</td>
                    <td style={{...S.td, ...S.num}}>{fmt(r.otPay)}</td>
                    <td style={{...S.td, ...S.num, color: '#dc2626'}}>{fmt(r.breakDeduction)}</td>
                    <td style={{...S.td, ...S.num, color: '#dc2626'}}>{fmt(r.leaveDeduction)}</td>
                    <td style={{...S.td, ...S.num, fontWeight: 700, color: '#166534'}}>{fmt(r.netPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Tab 2: Individual Payslip ────────────────────────────────────────────
const IndividualPayslip = ({ departments, currentUser }) => {
  const now = new Date();
  const isEmployee = currentUser?.role === 'GENERAL_USER';
  const [deptId, setDeptId]       = useState('');
  const [employees, setEmployees] = useState([]);
  // GENERAL_USER: default to their own ID so they can immediately load their payslip
  const [empId,  setEmpId]  = useState(isEmployee ? String(currentUser.id) : '');
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [year,   setYear]   = useState(now.getFullYear());
  const [slip,   setSlip]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg,    setMsg]    = useState('');
  const printRef = useRef();

  useEffect(() => {
    if (isEmployee || !deptId) { if (!isEmployee) { setEmployees([]); setEmpId(''); } return; }
    fetch(`${API}/dropdown/employees?departmentId=${deptId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setEmployees(d.data); });
  }, [deptId, isEmployee]);

  const load = async () => {
    const targetId = isEmployee ? currentUser.id : empId;
    if (!targetId) { setMsg('Please select an employee'); return; }
    setLoading(true);
    setMsg('');
    setSlip(null);
    try {
      const params = new URLSearchParams({ employeeId: targetId, month, year });
      const res  = await fetch(`${API}/payslip?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSlip(data);
      } else {
        setMsg('Error: ' + (data.message || 'Failed to load payslip'));
      }
    } catch {
      setMsg('Error: Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const print = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Payslip</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { padding: 8px 12px; border: 1px solid #ccc; text-align: left; }
        th { background: #f3f4f6; }
        .right { text-align: right; }
        h2, h3 { margin: 0 0 8px 0; }
        .total { font-weight: bold; font-size: 1.1em; }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div>
      {isEmployee && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#1d4ed8' }}>
          Showing your personal payslip. Select a month and year then click Load.
        </div>
      )}
      <div style={S.filterBar}>
        {!isEmployee && (
          <>
            <div style={S.fg}>
              <label style={S.label}>Department</label>
              <select style={S.sel} value={deptId} onChange={e => setDeptId(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div style={S.fg}>
              <label style={S.label}>Employee</label>
              <select style={S.sel} value={empId} onChange={e => setEmpId(e.target.value)} disabled={!deptId}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </>
        )}
        <div style={S.fg}>
          <label style={S.label}>Month</label>
          <select style={S.sel} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div style={S.fg}>
          <label style={S.label}>Year</label>
          <select style={S.sel} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button style={S.btnPrimary} onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Load Payslip'}
        </button>
      </div>

      {msg && <div style={msg.startsWith('Error') ? S.alertErr : S.alertOk}>{msg}</div>}

      {slip && (
        <>
          <div style={{ marginBottom: 12 }}>
            <button style={S.btnSecondary} onClick={print}>Print / Save as PDF</button>
          </div>

          <div ref={printRef} style={S.slipWrap}>
            {/* Header */}
            <div style={S.slipHeader}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Pay Slip</div>
                <div style={{ color: '#475569' }}>{slip.period.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{slip.employee.name}</div>
                <div style={{ color: '#475569' }}>{slip.employee.position}</div>
                <div style={{ color: '#475569' }}>{slip.employee.department}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{slip.employee.email}</div>
              </div>
            </div>

            <div style={S.slipBadge}>
              Employment Type: <strong>{slip.employee.employmentType}</strong>
              {slip.payslip.note && <span style={{ marginLeft: 16, color: '#64748b' }}>{slip.payslip.note}</span>}
            </div>

            {/* Earnings & Deductions */}
            <div style={S.slipGrid}>
              {/* Earnings */}
              <div>
                <div style={S.slipSectionTitle}>Earnings</div>
                <table style={S.slipTable}>
                  <tbody>
                    <SlipRow label="Regular Pay"
                      note={slip.payslip.regularHours != null ? `${slip.payslip.regularHours} hrs` : null}
                      value={fmt(slip.payslip.regularPay)} />
                    <SlipRow label="Overtime Pay"
                      note={slip.payslip.otHours > 0 ? `${slip.payslip.otHours} hrs × 1× rate` : null}
                      value={fmt(slip.payslip.otPay)} />
                  </tbody>
                </table>
              </div>
              {/* Deductions */}
              <div>
                <div style={S.slipSectionTitle}>Deductions</div>
                <table style={S.slipTable}>
                  <tbody>
                    <SlipRow label="Break Overruns"      value={fmt(slip.payslip.breakDeduction)} red />
                    <SlipRow label={`Unpaid Leave (${slip.payslip.unpaidLeaveDays} day${slip.payslip.unpaidLeaveDays !== 1 ? 's' : ''})`}
                      value={fmt(slip.payslip.leaveDeduction)} red />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Pay */}
            <div style={S.netPay}>
              <span>Net Pay</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#166534' }}>{fmt(slip.payslip.netPay)}</span>
            </div>

            {/* Attendance summary */}
            {slip.attendanceDetail.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={S.slipSectionTitle}>Attendance This Period ({slip.payslip.attendanceDays} day{slip.payslip.attendanceDays !== 1 ? 's' : ''})</div>
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Date','Status','Hours','OT','Break (min)','Breaks'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slip.attendanceDetail.map((a, i) => (
                        <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                          <td style={S.td}>{fmtDate(a.date)}</td>
                          <td style={S.td}>{a.status}</td>
                          <td style={{...S.td, ...S.num}}>{a.totalHours ?? '—'}</td>
                          <td style={{...S.td, ...S.num}}>{a.overtime ?? 0}</td>
                          <td style={{...S.td, ...S.num}}>{a.breakMinutes ?? 0}</td>
                          <td style={S.td}>{a.breaks?.length > 0 ? a.breaks.map(b => `${b.breakType}${b.overrun ? '⚠' : ''}`).join(', ') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Leave detail */}
            {slip.leaveDetail.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={S.slipSectionTitle}>Approved Leaves This Period</div>
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Leave Type','From','To','Paid?'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slip.leaveDetail.map((l, i) => (
                        <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                          <td style={S.td}>{l.leaveType}</td>
                          <td style={S.td}>{fmtDate(l.startDate)}</td>
                          <td style={S.td}>{fmtDate(l.endDate)}</td>
                          <td style={S.td}>{l.isPaid ? 'Yes' : <span style={{ color: '#dc2626' }}>No</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approved OT requests */}
            {slip.approvedOTDetail?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={S.slipSectionTitle}>Approved OT Requests</div>
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Date','Approved Hours','Approved By'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slip.approvedOTDetail.map((o, i) => (
                        <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                          <td style={S.td}>{fmtDate(o.date)}</td>
                          <td style={{...S.td, ...S.num}}>{o.hours}</td>
                          <td style={S.td}>{o.approvedBy || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Tab 3: Salary Adjustment (existing form) ─────────────────────────────
const SalaryAdjustment = ({ departments }) => {
  const [formData, setFormData] = useState({
    department: departments[0]?.id || '',
    employee: '',
    baseSalary: '',
    allowances: '',
    deductions: '',
    payDate: '',
    salaryId: '',
  });
  const [searchMode,    setSearchMode]    = useState('employee');
  const [currentSalary, setCurrentSalary] = useState(null);
  const [employees,     setEmployees]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [loadingEmp,    setLoadingEmp]    = useState(false);
  const [searchErr,     setSearchErr]     = useState('');
  const [msg,           setMsg]           = useState('');
  const [recentIds,     setRecentIds]     = useState(
    JSON.parse(localStorage.getItem('recentSalaryIds') || '[]').slice(0, 5)
  );

  const saveRecent = (id) => {
    const upd = [id, ...recentIds.filter(x => x !== id)].slice(0, 5);
    localStorage.setItem('recentSalaryIds', JSON.stringify(upd));
    setRecentIds(upd);
  };

  // Load employees on department change
  useEffect(() => {
    if (!formData.department || searchMode !== 'employee') return;
    fetch(`${API}/dropdown/employees?departmentId=${formData.department}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setEmployees(d.data);
          setCurrentSalary(null);
          setFormData(p => ({ ...p, employee: '', baseSalary: '', allowances: '', deductions: '', payDate: '' }));
        }
      });
  }, [formData.department, searchMode]);

  // Auto-load salary on employee select
  useEffect(() => {
    if (searchMode !== 'employee' || !formData.employee) { setCurrentSalary(null); return; }
    setLoadingEmp(true);
    fetch(`${API}/current?employeeId=${formData.employee}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCurrentSalary(d.data);
          setFormData(p => ({ ...p, baseSalary: d.data.baseSalary.toString(), allowances: d.data.allowances.toString(), deductions: d.data.deductions.toString() }));
        }
      })
      .catch(() => setSearchErr('Failed to load salary data.'))
      .finally(() => setLoadingEmp(false));
  }, [formData.employee, searchMode]);

  const searchById = async () => {
    if (!formData.salaryId || !/^\d+$/.test(formData.salaryId)) { setSearchErr('Enter a valid salary ID'); return; }
    setLoadingEmp(true); setSearchErr(''); setCurrentSalary(null);
    try {
      const res  = await fetch(`${API}/${formData.salaryId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCurrentSalary(data.data);
        saveRecent(parseInt(formData.salaryId));
        setFormData(p => ({
          ...p,
          baseSalary:  data.data.baseSalary.toString(),
          allowances:  data.data.allowances.toString(),
          deductions:  data.data.deductions.toString(),
          department:  data.data.departmentId?.toString() || '',
          employee:    data.data.employeeId.toString(),
        }));
        if (data.data.departmentId) {
          const er = await fetch(`${API}/dropdown/employees?departmentId=${data.data.departmentId}`, { credentials: 'include' });
          const ed = await er.json();
          if (ed.success) setEmployees(ed.data);
        }
      } else {
        setSearchErr(res.status === 404 ? `Record #${formData.salaryId} not found` : data.message || 'Not found');
      }
    } catch { setSearchErr('Server error'); }
    finally { setLoadingEmp(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (name === 'salaryId') setSearchErr('');
  };

  const handleSubmit = async () => {
    const valid = searchMode === 'employee'
      ? formData.employee && formData.baseSalary && formData.payDate
      : formData.salaryId && formData.baseSalary && formData.payDate;
    if (!valid) { setMsg('Please fill in all required fields.'); return; }
    setLoading(true); setMsg('');
    try {
      const payload = {
        baseSalary: formData.baseSalary,
        allowances: formData.allowances || 0,
        deductions: formData.deductions || 0,
        payDate:    formData.payDate,
        ...(searchMode === 'employee' ? { employee: formData.employee } : { salaryId: formData.salaryId }),
      };
      const res  = await fetch(`${API}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setMsg(`Salary record ${searchMode === 'employee' ? 'created' : 'updated'} successfully!`);
        if (searchMode === 'employee' && data.data?.id) saveRecent(data.data.id);
      } else {
        setMsg('Error: ' + data.message);
      }
    } catch { setMsg('Error: Server connection failed.'); }
    finally { setLoading(false); }
  };

  const net = (parseFloat(formData.baseSalary) || 0) + (parseFloat(formData.allowances) || 0) - (parseFloat(formData.deductions) || 0);

  return (
    <div style={S.card}>
      {/* Mode toggle */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Search by</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['employee', 'salaryId'].map(m => (
            <button key={m} style={searchMode === m ? S.tabActive : S.tabInactive}
              onClick={() => { setSearchMode(m); setCurrentSalary(null); setSearchErr(''); setFormData(p => ({ ...p, salaryId: '', employee: '', baseSalary: '', allowances: '', deductions: '', payDate: '' })); }}>
              {m === 'employee' ? 'By Employee' : 'By Salary ID'}
            </button>
          ))}
        </div>
      </div>

      {searchMode === 'employee' && (
        <div style={S.row2}>
          <div style={S.fg}>
            <label style={S.label}>Department</label>
            <select name="department" value={formData.department} onChange={handleChange} style={S.sel}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div style={S.fg}>
            <label style={S.label}>Employee</label>
            <select name="employee" value={formData.employee} onChange={handleChange} style={S.sel} disabled={!formData.department}>
              <option value="">Select…</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            {loadingEmp && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Loading…</div>}
          </div>
        </div>
      )}

      {searchMode === 'salaryId' && (
        <div style={S.fg}>
          <label style={S.label}>Salary Record ID</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input name="salaryId" value={formData.salaryId} onChange={handleChange} placeholder="e.g. 123"
              style={{ ...S.inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && searchById()} />
            <button style={S.btnSuccess} onClick={searchById} disabled={loadingEmp || !formData.salaryId}>
              {loadingEmp ? 'Searching…' : 'Search'}
            </button>
          </div>
          {recentIds.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Recent:</span>
              {recentIds.map(id => (
                <button key={id} style={S.chip}
                  onClick={() => { setFormData(p => ({ ...p, salaryId: id.toString() })); setTimeout(searchById, 50); }}>
                  #{id}
                </button>
              ))}
            </div>
          )}
          {searchErr && <div style={S.alertErr}>{searchErr}</div>}
        </div>
      )}

      {/* Current salary info */}
      {currentSalary && (
        <div style={{ ...S.infoBox, marginTop: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>
            {searchMode === 'salaryId' ? 'Salary Record Details' : 'Current Salary Information'}
          </div>
          <div style={S.infoGrid}>
            {searchMode === 'salaryId' && <InfoItem label="Record ID" value={`#${currentSalary.salaryId || formData.salaryId}`} />}
            <InfoItem label="Employee"   value={currentSalary.employeeName} />
            <InfoItem label="Position"   value={currentSalary.position} />
            <InfoItem label="Department" value={currentSalary.department} />
            <InfoItem label="Base Salary" value={fmt(currentSalary.baseSalary)} />
            <InfoItem label="Allowances"  value={fmt(currentSalary.allowances)} />
            <InfoItem label="Deductions"  value={fmt(currentSalary.deductions)} />
            <InfoItem label={searchMode === 'salaryId' ? 'Record Date' : 'Last Updated'} value={fmtDate(currentSalary.createdAt || currentSalary.lastUpdated)} />
          </div>
        </div>
      )}

      {/* Adjustment form */}
      {currentSalary && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            {searchMode === 'employee' ? 'Create New Salary Record' : 'Edit Salary Record'}
          </div>
          <div style={S.row2}>
            <div style={S.fg}>
              <label style={S.label}>Base Salary</label>
              <input type="number" step="0.01" name="baseSalary" value={formData.baseSalary} onChange={handleChange} placeholder="Enter base salary" style={S.inp} />
            </div>
            <div style={S.fg}>
              <label style={S.label}>Effective Date</label>
              <input type="date" name="payDate" value={formData.payDate} onChange={handleChange} style={S.inp} />
            </div>
          </div>
          <div style={{ ...S.row2, marginTop: 16 }}>
            <div style={S.fg}>
              <label style={S.label}>Allowances</label>
              <input type="number" step="0.01" name="allowances" value={formData.allowances} onChange={handleChange} placeholder="Travel, bonuses…" style={S.inp} />
            </div>
            <div style={S.fg}>
              <label style={S.label}>Deductions</label>
              <input type="number" step="0.01" name="deductions" value={formData.deductions} onChange={handleChange} placeholder="Taxes, insurance…" style={S.inp} />
            </div>
          </div>

          {formData.baseSalary && (
            <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 8, padding: 16, marginTop: 16 }}>
              <div style={{ fontWeight: 600, color: '#166534', marginBottom: 8 }}>Preview</div>
              {[
                ['Base Salary',  fmt(parseFloat(formData.baseSalary) || 0)],
                ['+ Allowances', fmt(parseFloat(formData.allowances) || 0)],
                ['− Deductions', fmt(parseFloat(formData.deductions) || 0)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', marginBottom: 4 }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: '#166534', marginTop: 8, paddingTop: 8, borderTop: '1px solid #bbf7d0' }}>
                <span>Net Salary</span><span>{fmt(net)}</span>
              </div>
            </div>
          )}

          <button style={{ ...S.btnPrimary, width: '100%', marginTop: 16, padding: '14px 0' }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing…' : (searchMode === 'employee' ? 'Create New Salary Record' : 'Update Salary Record')}
          </button>
        </div>
      )}

      {msg && <div style={{ ...( msg.includes('Error') ? S.alertErr : S.alertOk), marginTop: 16 }}>{msg}</div>}
    </div>
  );
};

// ─── Small helper components ───────────────────────────────────────────────
const SCard = ({ label, value }) => (
  <div style={S.summaryCard}>
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{value}</div>
  </div>
);

const SlipRow = ({ label, note, value, red }) => (
  <tr>
    <td style={{ padding: '6px 0', color: '#374151' }}>
      {label}
      {note && <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>({note})</span>}
    </td>
    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: red ? '#dc2626' : '#1e293b' }}>{value}</td>
  </tr>
);

const InfoItem = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'white', borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <span style={{ color: '#475569', fontSize: 14 }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
  </div>
);

const typeBadge = (type) => {
  const colors = { CONSULTANT: '#7c3aed', PROBATION: '#d97706', PTE: '#0891b2', FTE: '#16a34a' };
  return { background: (colors[type] || '#6b7280') + '20', color: colors[type] || '#6b7280', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 };
};

// ─── Shared styles ─────────────────────────────────────────────────────────
const S = {
  filterBar:   { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 },
  fg:          { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 140 },
  label:       { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  sel:         { padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white', cursor: 'pointer' },
  inp:         { padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white' },
  row2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  btnPrimary:  { padding: '10px 20px', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSuccess:  { padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSecondary:{ padding: '10px 20px', background: 'white', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  alertErr:    { padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 14, marginTop: 12 },
  alertOk:     { padding: '10px 14px', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 6, color: '#166534', fontSize: 14, marginTop: 12 },
  cardRow:     { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  summaryCard: { flex: 1, minWidth: 130, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' },
  tableWrap:   { overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:          { padding: '10px 12px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' },
  td:          { padding: '9px 12px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
  num:         { textAlign: 'right' },
  trEven:      { background: 'white' },
  trOdd:       { background: '#f8fafc' },
  card:        { background: 'white', borderRadius: 10, padding: 28, boxShadow: '0 1px 6px rgba(0,0,0,.08)' },
  tabActive:   { padding: '8px 18px', background: '#0C3D4A', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  tabInactive: { padding: '8px 18px', background: 'white', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  infoBox:     { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 },
  infoGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 },
  chip:        { padding: '4px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
  slipWrap:    { background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 28 },
  slipHeader:  { display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '2px solid #e5e7eb' },
  slipBadge:   { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 14px', fontSize: 13, marginBottom: 20 },
  slipGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 },
  slipSectionTitle: { fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' },
  slipTable:   { width: '100%', borderCollapse: 'collapse' },
  netPay:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '14px 20px', marginTop: 8 },
};

// ─── Main Salary component ─────────────────────────────────────────────────
const Salary = () => {
  const [activeTab,    setActiveTab]    = useState(0);
  const [departments,  setDepartments]  = useState([]);
  const [currentUser,  setCurrentUser]  = useState(null);

  useEffect(() => {
    // Fetch current user role
    fetch('http://localhost:5000/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.loggedIn) setCurrentUser(d.user); });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    // Only admin/HR roles can access the department dropdown
    if (['SUPER_ADMIN','ADMIN','HR'].includes(currentUser.role)) {
      fetch(`${API}/dropdown/departments`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d.success) setDepartments(d.data); });
    }
  }, [currentUser]);

  const pp = JSON.parse(localStorage.getItem('payrollPermissions') || '[]');
  const canCompute   = pp.includes('COMPUTE_PAYROLL');
  const canViewSlip  = pp.includes('VIEW_OWN_PAYSLIP') || pp.includes('VIEW_ALL_PAYSLIPS');
  const canAdjust    = pp.includes('ADJUST_SALARY');
  const isEmployee   = !canCompute && !canAdjust;

  // Build visible tabs based on permissions
  const tabs = [
    canCompute  && { label: 'Monthly Payroll',    id: 'monthly'    },
    canViewSlip && { label: 'Individual Payslip', id: 'payslip'    },
    canAdjust   && { label: 'Salary Adjustment',  id: 'adjustment' },
  ].filter(Boolean);

  // Keep activeTab in bounds if role has fewer tabs
  const safeTab = Math.min(activeTab, tabs.length - 1);

  if (!currentUser) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page header */}
      <div style={{ background: 'white', borderRadius: 10, padding: '20px 28px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,.08)' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: 24, fontWeight: 700 }}>Payroll Management</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b' }}>
          {isEmployee
            ? 'View your payslip and salary breakdown'
            : 'Compute monthly payroll, generate payslips, and adjust individual salaries'}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: 'white', padding: '6px 8px', borderRadius: 10, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,.08)' }}>
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => setActiveTab(i)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: safeTab === i ? '#0C3D4A' : 'transparent',
              color:      safeTab === i ? 'white'   : '#64748b',
              transition: 'all .15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: 'white', borderRadius: 10, padding: 28, boxShadow: '0 1px 6px rgba(0,0,0,.08)' }}>
        {tabs[safeTab]?.id === 'monthly'    && <MonthlyPayroll    departments={departments} />}
        {tabs[safeTab]?.id === 'payslip'    && <IndividualPayslip departments={departments} currentUser={currentUser} />}
        {tabs[safeTab]?.id === 'adjustment' && <SalaryAdjustment  departments={departments} />}
      </div>
    </div>
  );
};

export default Salary;
