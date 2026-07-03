import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_URL}/api/payroll`;
const LOAN_API = `${API_URL}/api/loans`;
const OLD_API = `${API_URL}/api/salaries`;

const fmt = (n) => {
  if (n == null || isNaN(n)) return 'PKR 0';
  return 'PKR ' + Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const S = {
  page: { padding: '1.5rem', fontFamily: "'Segoe UI', -apple-system, sans-serif", color: '#1e293b', maxWidth: '1400px', margin: '0 auto' },
  h1: { fontSize: '1.5rem', fontWeight: 700, color: '#0C3D4A', marginBottom: '1.25rem' },
  tabs: { display: 'flex', gap: '2px', marginBottom: '1.5rem', background: '#f1f5f9', borderRadius: '10px', padding: '4px' },
  tab: (a) => ({ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s', background: a ? '#0C3D4A' : 'transparent', color: a ? '#fff' : '#64748b' }),
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' },
  summaryCard: (color) => ({ background: `${color}08`, border: `1px solid ${color}25`, borderRadius: '10px', padding: '1rem', textAlign: 'center' }),
  summaryLabel: { fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  summaryValue: (color) => ({ fontSize: '1.35rem', fontWeight: 700, color, marginTop: '4px' }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' },
  th: { padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#fff', background: '#0C3D4A', textTransform: 'uppercase', letterSpacing: '0.3px' },
  td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #f1f5f9' },
  btn: (bg = '#0C3D4A') => ({ padding: '0.5rem 1.25rem', background: bg, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }),
  btnOutline: { padding: '0.5rem 1rem', background: '#fff', color: '#0C3D4A', border: '1.5px solid #0C3D4A', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  select: { padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', minWidth: '140px', outline: 'none' },
  input: { padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', width: '100%' },
  row: { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' },
  badge: (bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: bg, color }),
  label: { fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' },
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function Salary() {
  const [activeTab, setActiveTab] = useState(0);
  const [perms, setPerms] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const pp = JSON.parse(localStorage.getItem('payrollPermissions') || '[]');
    setPerms(pp);
    fetch(`${API_URL}/auth/status`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.loggedIn) setUser(d.user); });
  }, []);

  const _spp = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
  const _shpp = Object.keys(_spp).length > 0 && _spp.salary;
  const canCompute = perms.includes('COMPUTE_PAYROLL') || _shpp;
  const canGenerate = perms.includes('GENERATE_PAYROLL') || _shpp;
  const canExport = perms.includes('EXPORT_PAYROLL') || _shpp;
  const canViewPayslip = perms.includes('VIEW_OWN_PAYSLIP') || perms.includes('VIEW_ALL_PAYSLIPS') || _shpp;
  const canViewAll = perms.includes('VIEW_ALL_PAYSLIPS') || _shpp;
  const canAdjust = perms.includes('ADJUST_SALARY') || _shpp;
  const isManager = ['SUPER_ADMIN','ADMIN','HR'].includes(user?.role) || _shpp;

  const tabs = [];
  if (canCompute) tabs.push({ label: 'Monthly Payroll', comp: <MonthlyPayroll canGenerate={canGenerate} canExport={canExport} /> });
  if (canAdjust) tabs.push({ label: 'Adjustments', comp: <Adjustments /> });
  if (canViewPayslip) tabs.push({ label: 'Payslip', comp: <PayslipView canViewAll={canViewAll} user={user} /> });
  tabs.push({ label: 'Loans', comp: <LoanManagement user={user} isManager={isManager} /> });

  if (tabs.length === 0) {
    return <div style={S.page}><div style={S.card}><p style={{ color: '#94a3b8', textAlign: 'center' }}>No payroll permissions assigned.</p></div></div>;
  }

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Payroll & Compensation</h1>
      <div style={S.tabs}>
        {tabs.map((t, i) => (
          <button key={i} style={S.tab(activeTab === i)} onClick={() => setActiveTab(i)}>{t.label}</button>
        ))}
      </div>
      {tabs[activeTab]?.comp}
    </div>
  );
}

// ── Monthly Payroll Tab ─────────────────────────────────────────────────────

function MonthlyPayroll({ canGenerate, canExport }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [deptId, setDeptId] = useState('all');
  const [depts, setDepts] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`${API}/dropdown/departments`, { credentials: 'include' })
      .then(r => r.json()).then(d => setDepts(d.data || []));
  }, []);

  const computePreview = async () => {
    setLoading(true);
    try {
      const url = `${API}/compute?month=${month}&year=${year}${deptId !== 'all' ? `&departmentId=${deptId}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      const d = await res.json();
      setData(d);
    } catch (e) { alert('Failed to compute payroll'); }
    setLoading(false);
  };

  const generatePayroll = async () => {
    if (!confirm('Generate and save payroll for all employees? This will overwrite any existing draft records.')) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ month, year, departmentId: deptId !== 'all' ? deptId : undefined })
      });
      const d = await res.json();
      if (res.ok) { alert(d.message); computePreview(); }
      else alert(d.error);
    } catch (e) { alert('Failed to generate payroll'); }
    setGenerating(false);
  };

  const finalizePayroll = async () => {
    if (!confirm('Finalize payroll? This will lock all computed records for this month.')) return;
    try {
      const res = await fetch(`${API}/finalize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ month, year })
      });
      const d = await res.json();
      if (res.ok) { alert(d.message); computePreview(); }
      else alert(d.error);
    } catch (e) { alert('Failed to finalize'); }
  };

  const getPayrollExportData = () => {
    const headers = ['Employee','Department','Type','Basic Salary','Saturday Pay','Home Warranty','Auto Warranty','Software Commission','Eid Bonus','Arrears','Tax','PF','Absence Ded.','Late Ded.','Loan Ded.','Fine','Gross','Deductions','Net Salary','Absent Days','Lates','Status'];
    const rows = data.payrolls.map(p => [
      p.employeeName, p.department, p.departmentName, p.basicSalary,
      p.saturdayExtraPay, p.homeWarrantyBonus, p.autoWarrantyBonus,
      p.softwareCommission, p.eidBonus, p.arrears,
      p.tax, p.providentFund, p.absenceDeduction, p.lateDeduction, p.loanDeduction, p.fine,
      p.grossEarnings, p.totalDeductions, p.netSalary,
      p.absentDays, p.normalLates + p.halfDayLates, p.status
    ]);
    return { headers, rows };
  };

  const exportCSV = () => {
    if (!data?.payrolls?.length) return;
    const { headers, rows } = getPayrollExportData();
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `payroll_${MONTHS[month - 1]}_${year}.csv`; a.click();
  };

  const exportExcel = () => {
    if (!data?.payrolls?.length) return;
    const { headers, rows } = getPayrollExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `payroll_${MONTHS[month - 1]}_${year}.xlsx`);
  };

  return (
    <>
      <div style={S.card}>
        <div style={{ ...S.row, marginBottom: '1rem' }}>
          <select style={S.select} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select style={S.select} value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select style={S.select} value={deptId} onChange={e => setDeptId(e.target.value)}>
            <option value="all">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button style={S.btn()} onClick={computePreview} disabled={loading}>
            {loading ? 'Computing...' : 'Compute Preview'}
          </button>
          {canGenerate && data?.payrolls?.length > 0 && (
            <button style={S.btn('#059669')} onClick={generatePayroll} disabled={generating}>
              {generating ? 'Saving...' : 'Generate & Save'}
            </button>
          )}
          {canGenerate && data?.payrolls?.some(p => p.status === 'COMPUTED') && (
            <button style={S.btn('#7c3aed')} onClick={finalizePayroll}>Finalize</button>
          )}
          {canExport && data?.payrolls?.length > 0 && (<>
            <button style={S.btnOutline} onClick={exportCSV}>Export CSV</button>
            <button style={{ ...S.btnOutline, borderColor: '#059669', color: '#059669' }} onClick={exportExcel}>Export Excel</button>
          </>)}
        </div>
      </div>

      {data?.ruleErrors?.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#92400e' }}>Payroll rules not configured for the following departments:</p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '0.875rem' }}>
            {data.ruleErrors.map((e, i) => (
              <li key={i}>{e.employeeName} — {e.department}: {e.error}</li>
            ))}
          </ul>
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#92400e' }}>Go to Department Management and set Payroll Rules for these departments.</p>
        </div>
      )}

      {data && (
        <>
          <div style={S.summaryGrid}>
            <div style={S.summaryCard('#0C3D4A')}>
              <div style={S.summaryLabel}>Employees</div>
              <div style={S.summaryValue('#0C3D4A')}>{data.employeeCount}</div>
            </div>
            <div style={S.summaryCard('#059669')}>
              <div style={S.summaryLabel}>Total Gross</div>
              <div style={S.summaryValue('#059669')}>{fmt(data.summary.totalGross)}</div>
            </div>
            <div style={S.summaryCard('#ef4444')}>
              <div style={S.summaryLabel}>Total Deductions</div>
              <div style={S.summaryValue('#ef4444')}>{fmt(data.summary.totalDeductions)}</div>
            </div>
            <div style={S.summaryCard('#0369a1')}>
              <div style={S.summaryLabel}>Total Net Pay</div>
              <div style={S.summaryValue('#0369a1')}>{fmt(data.summary.totalNet)}</div>
            </div>
          </div>

          <div style={{ ...S.card, overflow: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Employee','Dept','Type','Basic','Sat Pay','Bonuses','Gross','Tax','PF','Absent','Late','Loan','Fine','Deductions','Net Salary','Status'].map(h =>
                    <th key={h} style={S.th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.payrolls.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{p.employeeName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.position}</div>
                    </td>
                    <td style={S.td}>{p.department}</td>
                    <td style={S.td}>
                      <span style={S.badge(p.departmentName === 'Technical' ? '#dbeafe' : '#f3e8ff', p.departmentName === 'Technical' ? '#1d4ed8' : '#7c3aed')}>
                        {p.departmentName}
                      </span>
                    </td>
                    <td style={S.td}>{fmt(p.basicSalary)}</td>
                    <td style={S.td}>{p.saturdayExtraPay > 0 ? fmt(p.saturdayExtraPay) : '-'}</td>
                    <td style={S.td}>
                      {(p.homeWarrantyBonus + p.autoWarrantyBonus + p.softwareCommission + p.eidBonus + p.arrears) > 0
                        ? fmt(p.homeWarrantyBonus + p.autoWarrantyBonus + p.softwareCommission + p.eidBonus + p.arrears)
                        : '-'}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#059669' }}>{fmt(p.grossEarnings)}</td>
                    <td style={S.td}>{fmt(p.tax)}</td>
                    <td style={S.td}>{p.providentFund > 0 ? fmt(p.providentFund) : '-'}</td>
                    <td style={S.td}>{p.absenceDeduction > 0 ? <span style={{ color: '#ef4444' }}>{fmt(p.absenceDeduction)} <span style={{ fontSize: '0.65rem' }}>({p.absentDays}d)</span></span> : '-'}</td>
                    <td style={S.td}>{p.lateDeduction > 0 ? <span style={{ color: '#f59e0b' }}>{fmt(p.lateDeduction)}</span> : '-'}</td>
                    <td style={S.td}>{p.loanDeduction > 0 ? fmt(p.loanDeduction) : '-'}</td>
                    <td style={S.td}>{p.fine > 0 ? fmt(p.fine) : '-'}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#ef4444' }}>{fmt(p.totalDeductions)}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: '#0C3D4A', fontSize: '0.9rem' }}>{fmt(p.netSalary)}</td>
                    <td style={S.td}>
                      <span style={S.badge(
                        p.status === 'FINALIZED' ? '#dcfce7' : p.status === 'COMPUTED' ? '#dbeafe' : '#fef3c7',
                        p.status === 'FINALIZED' ? '#166534' : p.status === 'COMPUTED' ? '#1d4ed8' : '#92400e'
                      )}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

// ── Adjustments Tab ─────────────────────────────────────────────────────────

function Adjustments() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [depts, setDepts] = useState([]);
  const [deptId, setDeptId] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [empId, setEmpId] = useState('');
  const [form, setForm] = useState({ homeWarrantySales: 0, autoWarrantyBonus: 0, softwareCommission: 0, eidBonus: 0, arrears: 0, fine: 0, notes: '' });
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deptRules, setDeptRules] = useState(null);

  useEffect(() => {
    fetch(`${API}/dropdown/departments`, { credentials: 'include' })
      .then(r => r.json()).then(d => setDepts(d.data || []));
  }, []);

  useEffect(() => {
    if (deptId) {
      fetch(`${API}/dropdown/employees?departmentId=${deptId}`, { credentials: 'include' })
        .then(r => r.json()).then(d => setEmployees(d.data || []));
    }
  }, [deptId]);

  useEffect(() => {
    if (empId && month && year) {
      fetch(`${API}/payslip?employeeId=${empId}&month=${month}&year=${year}`, { credentials: 'include' })
        .then(r => { if (r.ok) return r.json(); return null; })
        .then(d => {
          if (d) {
            setCurrent(d);
            setForm({
              homeWarrantySales: d.homeWarrantySales || 0,
              autoWarrantyBonus: d.autoWarrantyBonus || 0,
              softwareCommission: d.softwareCommission || 0,
              eidBonus: d.eidBonus || 0,
              arrears: d.arrears || 0,
              fine: d.fine || 0,
              notes: d.notes || ''
            });
          } else {
            setCurrent(null);
            setForm({ homeWarrantySales: 0, autoWarrantyBonus: 0, softwareCommission: 0, eidBonus: 0, arrears: 0, fine: 0, notes: '' });
          }
        });
    }
  }, [empId, month, year]);

  const save = async () => {
    if (!empId) return alert('Select an employee');
    setSaving(true);
    try {
      const res = await fetch(`${API}/adjustments/${empId}/${month}/${year}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(form)
      });
      const d = await res.json();
      if (res.ok) alert('Adjustments saved successfully');
      else alert(d.error);
    } catch (e) { alert('Failed to save'); }
    setSaving(false);
  };

  const selectedEmp = employees.find(e => e.id === parseInt(empId));

  useEffect(() => {
    if (selectedEmp?.departmentId) {
      fetch(`${API}/rules/${selectedEmp.departmentId}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => setDeptRules(d))
        .catch(() => setDeptRules(null));
    } else {
      setDeptRules(null);
    }
  }, [empId, selectedEmp?.departmentId]);

  return (
    <div style={S.card}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0C3D4A', marginBottom: '1rem' }}>Monthly Adjustments</h3>
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Enter bonuses, fines, and manual amounts for each employee per month.</p>

      <div style={{ ...S.row, marginBottom: '1.25rem' }}>
        <select style={S.select} value={month} onChange={e => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select style={S.select} value={year} onChange={e => setYear(+e.target.value)}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select style={S.select} value={deptId} onChange={e => { setDeptId(e.target.value); setEmpId(''); }}>
          <option value="all">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select style={{ ...S.select, minWidth: '200px' }} value={empId} onChange={e => setEmpId(e.target.value)}>
          <option value="">-- Select Employee --</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department?.name}</option>)}
        </select>
      </div>

      {empId && (
        <>
          {selectedEmp && (
            <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <strong>{selectedEmp.name}</strong> — {selectedEmp.position} — Basic: {fmt(selectedEmp.salary)} — {selectedEmp.department?.name}
              {current && <span style={S.badge(current.status === 'FINALIZED' ? '#dcfce7' : '#dbeafe', current.status === 'FINALIZED' ? '#166534' : '#1d4ed8')}> {current.status}</span>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {deptRules?.homeWarrantyEnabled && (
              <div>
                <label style={S.label}>Home Warranty Sales (count)</label>
                <input type="number" min="0" style={S.input} value={form.homeWarrantySales} onChange={e => setForm(f => ({ ...f, homeWarrantySales: +e.target.value }))} />
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>= {fmt(form.homeWarrantySales * (deptRules?.homeWarrantyPerSale || 1000))} bonus</div>
              </div>
            )}
            {deptRules?.autoWarrantyEnabled && (
              <div>
                <label style={S.label}>Auto Warranty Bonus (PKR)</label>
                <input type="number" min="0" style={S.input} value={form.autoWarrantyBonus} onChange={e => setForm(f => ({ ...f, autoWarrantyBonus: +e.target.value }))} />
              </div>
            )}
            {deptRules?.softwareCommEnabled && (
              <div>
                <label style={S.label}>Software Commission (PKR)</label>
                <input type="number" min="0" style={S.input} value={form.softwareCommission} onChange={e => setForm(f => ({ ...f, softwareCommission: +e.target.value }))} />
              </div>
            )}
            {deptRules?.eidBonusEnabled && (
              <div>
                <label style={S.label}>Eid Bonus (PKR)</label>
                <input type="number" min="0" step="100" style={S.input} value={form.eidBonus || ''} onChange={e => setForm(f => ({ ...f, eidBonus: +e.target.value }))} placeholder="0" />
              </div>
            )}
            {deptRules?.arrearsEnabled && (
              <div>
                <label style={S.label}>Arrears (PKR)</label>
                <input type="number" min="0" step="100" style={S.input} value={form.arrears || ''} onChange={e => setForm(f => ({ ...f, arrears: +e.target.value }))} placeholder="0" />
              </div>
            )}
            {deptRules?.fineEnabled && (
              <div>
                <label style={S.label}>Fine / Penalty (PKR)</label>
                <input type="number" min="0" step="100" style={S.input} value={form.fine || ''} onChange={e => setForm(f => ({ ...f, fine: +e.target.value }))} placeholder="0" />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Notes</label>
            <textarea style={{ ...S.input, height: '60px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>

          <button style={S.btn('#059669')} onClick={save} disabled={saving || current?.status === 'FINALIZED'}>
            {saving ? 'Saving...' : current?.status === 'FINALIZED' ? 'Finalized (Locked)' : 'Save Adjustments'}
          </button>
        </>
      )}
    </div>
  );
}

// ── Payslip Tab ─────────────────────────────────────────────────────────────

function PayslipView({ canViewAll, user }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [depts, setDepts] = useState([]);
  const [deptId, setDeptId] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [empId, setEmpId] = useState('');
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (canViewAll) {
      fetch(`${API}/dropdown/departments`, { credentials: 'include' })
        .then(r => r.json()).then(d => setDepts(d.data || []));
    } else if (user?.id) {
      setEmpId(String(user.id));
    }
  }, [canViewAll, user]);

  useEffect(() => {
    if (canViewAll && deptId) {
      fetch(`${API}/dropdown/employees?departmentId=${deptId}`, { credentials: 'include' })
        .then(r => r.json()).then(d => setEmployees(d.data || []));
    }
  }, [deptId, canViewAll]);

  const fetchPayslip = async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/payslip?employeeId=${empId}&month=${month}&year=${year}`, { credentials: 'include' });
      if (res.ok) setPayslip(await res.json());
      else { setPayslip(null); alert('No payslip found for this period'); }
    } catch (e) { alert('Failed to fetch payslip'); }
    setLoading(false);
  };

  const printPayslip = () => {
    if (!payslip) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Payslip - ${payslip.employee.name} - ${MONTHS[month - 1]} ${year}</title>
      <style>body{font-family:Segoe UI,sans-serif;padding:2rem;color:#1e293b}
      table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}
      th{background:#0C3D4A;color:#fff;font-size:0.8rem}h1{color:#0C3D4A}
      .section{margin:1.5rem 0}.amount{font-weight:700}.green{color:#059669}.red{color:#ef4444}
      @media print{button{display:none}}</style></head><body>`);
    w.document.write(printRef.current.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  const sharePayslipEmail = async () => {
    if (!payslip) return;
    setSharing(true);
    try {
      const res = await fetch(`${API}/payslip/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeId: parseInt(empId), month, year })
      });
      const data = await res.json();
      if (res.ok) alert(data.message);
      else alert(data.error || 'Failed to send email');
    } catch (e) { alert('Failed to send email'); }
    setSharing(false);
  };

  const p = payslip;

  return (
    <>
      <div style={S.card}>
        <div style={{ ...S.row, marginBottom: '1rem' }}>
          <select style={S.select} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select style={S.select} value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {canViewAll && (
            <>
              <select style={S.select} value={deptId} onChange={e => { setDeptId(e.target.value); setEmpId(''); }}>
                <option value="all">All Departments</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select style={{ ...S.select, minWidth: '200px' }} value={empId} onChange={e => setEmpId(e.target.value)}>
                <option value="">-- Select Employee --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </>
          )}
          <button style={S.btn()} onClick={fetchPayslip} disabled={loading || !empId}>
            {loading ? 'Loading...' : 'View Payslip'}
          </button>
          {p && <button style={S.btnOutline} onClick={printPayslip}>Print / PDF</button>}
          {p && <button style={{ ...S.btn('#7c3aed') }} onClick={sharePayslipEmail} disabled={sharing}>
            {sharing ? 'Sending...' : 'Share via Email'}
          </button>}
        </div>
      </div>

      {p && (
        <div ref={printRef}>
          <div style={{ ...S.card, border: '2px solid #0C3D4A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #0C3D4A', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0C3D4A', fontSize: '1.3rem' }}>PAYSLIP</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Decoders-digital — {MONTHS[month - 1]} {year}</p>
              </div>
              <span style={S.badge(p.status === 'FINALIZED' ? '#dcfce7' : '#dbeafe', p.status === 'FINALIZED' ? '#166534' : '#1d4ed8')}>{p.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>EMPLOYEE DETAILS</div>
                <div style={{ fontSize: '0.9rem' }}><strong>{p.employee.name}</strong></div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.employee.position} — {p.employee.department?.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.employee.email}</div>
                <div style={{ marginTop: '4px' }}>
                  <span style={S.badge(p.departmentName === 'Technical' ? '#dbeafe' : '#f3e8ff', p.departmentName === 'Technical' ? '#1d4ed8' : '#7c3aed')}>{p.departmentName}</span>
                  {' '}
                  <span style={S.badge('#e0f2fe', '#0369a1')}>{p.employee.employmentType}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>ATTENDANCE SUMMARY</div>
                <div style={{ fontSize: '0.8rem' }}>Absent Days: <strong>{p.absentDays}</strong></div>
                <div style={{ fontSize: '0.8rem' }}>Normal Lates: <strong>{p.normalLates}</strong></div>
                <div style={{ fontSize: '0.8rem' }}>Half-Day Lates (2h+): <strong>{p.halfDayLates}</strong></div>
                <div style={{ fontSize: '0.8rem' }}>Saturday Pay Days: <strong>{p.saturdayPayDays}</strong></div>
                <div style={{ fontSize: '0.8rem' }}>Approved Leave Days: <strong>{p.approvedLeaveDays}</strong></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Earnings */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Earnings</div>
                <table style={{ ...S.table, fontSize: '0.82rem' }}>
                  <tbody>
                    <tr><td style={S.td}>Basic Salary</td><td style={{ ...S.td, textAlign: 'right', fontWeight: 600 }}>{fmt(p.basicSalary)}</td></tr>
                    {p.saturdayExtraPay > 0 && <tr><td style={S.td}>Saturday Extra Pay ({p.saturdayPayDays} days)</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.saturdayExtraPay)}</td></tr>}
                    {p.homeWarrantyBonus > 0 && <tr><td style={S.td}>Home Warranty ({p.homeWarrantySales} sales x 1,000)</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.homeWarrantyBonus)}</td></tr>}
                    {p.autoWarrantyBonus > 0 && <tr><td style={S.td}>Auto Warranty Bonus</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.autoWarrantyBonus)}</td></tr>}
                    {p.softwareCommission > 0 && <tr><td style={S.td}>Software Commission</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.softwareCommission)}</td></tr>}
                    {p.eidBonus > 0 && <tr><td style={S.td}>Eid Bonus</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.eidBonus)}</td></tr>}
                    {p.arrears > 0 && <tr><td style={S.td}>Arrears</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.arrears)}</td></tr>}
                    <tr style={{ background: '#f0fdf4' }}><td style={{ ...S.td, fontWeight: 700 }}>Total Earnings</td><td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmt(p.grossEarnings)}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Deductions</div>
                <table style={{ ...S.table, fontSize: '0.82rem' }}>
                  <tbody>
                    <tr><td style={S.td}>Tax (1% of Basic)</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.tax)}</td></tr>
                    {p.providentFund > 0 && <tr><td style={S.td}>Provident Fund</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.providentFund)}</td></tr>}
                    {p.absenceDeduction > 0 && <tr><td style={S.td}>Absence ({p.absentDays} days)</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.absenceDeduction)}</td></tr>}
                    {p.lateDeduction > 0 && <tr><td style={S.td}>Late Penalty</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.lateDeduction)}</td></tr>}
                    {p.loanDeduction > 0 && <tr><td style={S.td}>Loan Deduction</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.loanDeduction)}</td></tr>}
                    {p.fine > 0 && <tr><td style={S.td}>Fine / Penalty</td><td style={{ ...S.td, textAlign: 'right' }}>{fmt(p.fine)}</td></tr>}
                    <tr style={{ background: '#fef2f2' }}><td style={{ ...S.td, fontWeight: 700 }}>Total Deductions</td><td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{fmt(p.totalDeductions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Pay */}
            <div style={{ background: 'linear-gradient(135deg, #0C3D4A, #145369)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Net Salary</div>
              <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{fmt(p.netSalary)}</div>
            </div>

            {p.notes && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e' }}>
                <strong>Notes:</strong> {p.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Loan Management Tab ─────────────────────────────────────────────────────

function LoanManagement({ user, isManager }) {
  const [loans, setLoans] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(isManager ? 'all' : 'my');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [schedMonth, setSchedMonth] = useState(new Date().getMonth() + 1);
  const [schedYear, setSchedYear] = useState(new Date().getFullYear());

  const fetchAll = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        isManager ? fetch(`${LOAN_API}`, { credentials: 'include' }).then(r => r.json()) : Promise.resolve([]),
        fetch(`${LOAN_API}/my`, { credentials: 'include' }).then(r => r.json())
      ]);
      setLoans(allRes);
      setMyLoans(myRes);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAll(); }, []);

  const requestLoan = async () => {
    if (!amount || amount <= 0 || amount > 20000) return alert('Amount must be 1 – 20,000 PKR');
    setLoading(true);
    try {
      const res = await fetch(`${LOAN_API}/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ employeeId: user.id, amount: +amount })
      });
      const d = await res.json();
      if (res.ok) { alert('Loan request submitted'); setAmount(''); fetchAll(); }
      else alert(d.error);
    } catch (e) { alert('Failed to request loan'); }
    setLoading(false);
  };

  const approveSA = async (id) => {
    if (!confirm('Approve this loan as Super Admin?')) return;
    const res = await fetch(`${LOAN_API}/${id}/approve-sa`, { method: 'PUT', credentials: 'include' });
    const d = await res.json();
    if (res.ok) { alert(d.message); fetchAll(); } else alert(d.error);
  };

  const approveHR = async (id) => {
    if (!confirm('Give final HR approval for this loan?')) return;
    const res = await fetch(`${LOAN_API}/${id}/approve-hr`, { method: 'PUT', credentials: 'include' });
    const d = await res.json();
    if (res.ok) { alert(d.message); fetchAll(); } else alert(d.error);
  };

  const rejectLoan = async () => {
    if (!rejectModal) return;
    const res = await fetch(`${LOAN_API}/${rejectModal}/reject`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ reason: rejectReason })
    });
    const d = await res.json();
    if (res.ok) { alert(d.message); setRejectModal(null); setRejectReason(''); fetchAll(); }
    else alert(d.error);
  };

  const scheduleLoanDed = async () => {
    if (!scheduleModal) return;
    const res = await fetch(`${API}/schedule-loan`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ loanId: scheduleModal, month: schedMonth, year: schedYear })
    });
    const d = await res.json();
    if (res.ok) { alert(d.message); setScheduleModal(null); fetchAll(); }
    else alert(d.error);
  };

  const statusBadge = (st) => {
    const map = {
      PENDING: ['#fef3c7', '#92400e'],
      APPROVED_SA: ['#dbeafe', '#1d4ed8'],
      APPROVED_HR: ['#dcfce7', '#166534'],
      DEDUCTED: ['#e2e8f0', '#475569'],
      REJECTED: ['#fef2f2', '#dc2626']
    };
    const [bg, color] = map[st] || ['#f1f5f9', '#64748b'];
    const labels = { PENDING: 'Pending', APPROVED_SA: 'SA Approved', APPROVED_HR: 'Fully Approved', DEDUCTED: 'Deducted', REJECTED: 'Rejected' };
    return <span style={S.badge(bg, color)}>{labels[st] || st}</span>;
  };

  const displayLoans = tab === 'all' ? loans : myLoans;

  return (
    <>
      <div style={S.card}>
        <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0C3D4A' }}>Loan Management</h3>
          <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {isManager && <button style={S.tab(tab === 'all')} onClick={() => setTab('all')}>All Loans</button>}
            <button style={S.tab(tab === 'my')} onClick={() => setTab('my')}>My Loans</button>
          </div>
        </div>

        {/* Request new loan */}
        {tab === 'my' && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Loan Amount (PKR) — Max 20,000</label>
              <input type="number" min="1" max="20000" style={S.input} value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount..." />
            </div>
            <button style={S.btn('#059669')} onClick={requestLoan} disabled={loading}>
              {loading ? 'Submitting...' : 'Request Loan'}
            </button>
          </div>
        )}

        {/* Loans table */}
        <div style={{ overflow: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {tab === 'all' && <th style={S.th}>Employee</th>}
                {tab === 'all' && <th style={S.th}>Department</th>}
                <th style={S.th}>Amount</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Requested</th>
                <th style={S.th}>SA Approval</th>
                <th style={S.th}>HR Approval</th>
                <th style={S.th}>Deduction</th>
                {isManager && <th style={S.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayLoans.length === 0 ? (
                <tr><td style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }} colSpan={isManager ? 9 : 7}>No loans found</td></tr>
              ) : displayLoans.map((loan, i) => (
                <tr key={loan.id} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                  {tab === 'all' && <td style={S.td}><strong>{loan.employee?.name}</strong></td>}
                  {tab === 'all' && <td style={S.td}>{loan.employee?.department?.name || '-'}</td>}
                  <td style={{ ...S.td, fontWeight: 700 }}>{fmt(loan.amount)}</td>
                  <td style={S.td}>{statusBadge(loan.status)}</td>
                  <td style={S.td}>{new Date(loan.requestDate).toLocaleDateString()}</td>
                  <td style={S.td}>{loan.approvedBySA ? <span style={{ fontSize: '0.75rem' }}>{loan.approvedBySA}<br />{new Date(loan.approvedBySAAt).toLocaleDateString()}</span> : '-'}</td>
                  <td style={S.td}>{loan.approvedByHR ? <span style={{ fontSize: '0.75rem' }}>{loan.approvedByHR}<br />{new Date(loan.approvedByHRAt).toLocaleDateString()}</span> : '-'}</td>
                  <td style={S.td}>
                    {loan.deductedInMonth ? `${MONTHS[loan.deductedInMonth - 1]} ${loan.deductedInYear}` : '-'}
                    {loan.status === 'DEDUCTED' && <span style={S.badge('#dcfce7', '#166534')}> Done</span>}
                  </td>
                  {isManager && (
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {loan.status === 'PENDING' && user?.role === 'SUPER_ADMIN' && (
                          <>
                            <button style={{ ...S.btn('#059669'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => approveSA(loan.id)}>Approve (SA)</button>
                            <button style={{ ...S.btn('#ef4444'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => setRejectModal(loan.id)}>Reject</button>
                          </>
                        )}
                        {loan.status === 'APPROVED_SA' && ['HR','ADMIN','SUPER_ADMIN'].includes(user?.role) && (
                          <>
                            <button style={{ ...S.btn('#059669'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => approveHR(loan.id)}>Approve (HR)</button>
                            <button style={{ ...S.btn('#ef4444'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => setRejectModal(loan.id)}>Reject</button>
                          </>
                        )}
                        {loan.status === 'APPROVED_HR' && !loan.deductedInMonth && (
                          <button style={{ ...S.btn('#7c3aed'), padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => setScheduleModal(loan.id)}>Schedule Deduction</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '400px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#ef4444', padding: '1rem 1.25rem', color: '#fff', fontWeight: 700 }}>Reject Loan</div>
            <div style={{ padding: '1.25rem' }}>
              <label style={S.label}>Reason (optional)</label>
              <textarea style={{ ...S.input, height: '80px' }} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter rejection reason..." />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button style={S.btnOutline} onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
                <button style={S.btn('#ef4444')} onClick={rejectLoan}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Deduction Modal */}
      {scheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '400px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#7c3aed', padding: '1rem 1.25rem', color: '#fff', fontWeight: 700 }}>Schedule Loan Deduction</div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Select the month when this loan should be deducted from salary.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <select style={S.select} value={schedMonth} onChange={e => setSchedMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select style={S.select} value={schedYear} onChange={e => setSchedYear(+e.target.value)}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button style={S.btnOutline} onClick={() => setScheduleModal(null)}>Cancel</button>
                <button style={S.btn('#7c3aed')} onClick={scheduleLoanDed}>Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
