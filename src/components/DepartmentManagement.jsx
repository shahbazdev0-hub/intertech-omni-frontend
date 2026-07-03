import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const defaultRules = {
  workingDaysPerMonth: 22, dailyHours: 8, taxRate: 0.01,
  pfLow: 2000, pfHigh: 3000, pfThreshold: 50000, probationMonths: 3,
  latePenaltyPerSet: 1000, lateReliefMinutes: 120, halfDayLateMinutes: 120,
  saturdayPayEnabled: false, saturdayMinHours: 4, saturdayPayHours: 6,
  homeWarrantyPerSale: 1000, maxLoanAmount: 20000,
  homeWarrantyEnabled: false, autoWarrantyEnabled: false, softwareCommEnabled: false,
  eidBonusEnabled: true, arrearsEnabled: true, fineEnabled: true,
  casualLeaveAllocation: 12, medicalLeaveAllocation: 0,
  probationCasualLeave: 0, probationMedicalLeave: 0, probationLeavePerMonth: false
};

const ruleFields = [
  { section: 'Working Hours', fields: [
    { key: 'workingDaysPerMonth', label: 'Working Days Per Month', type: 'number', min: 1, max: 31 },
    { key: 'dailyHours', label: 'Daily Working Hours', type: 'number', min: 1, max: 24 },
  ]},
  { section: 'Tax & Provident Fund', fields: [
    { key: 'taxRate', label: 'Tax Rate (e.g. 0.01 = 1%)', type: 'number', step: '0.001', min: 0, max: 1 },
    { key: 'pfLow', label: 'PF Amount (Low Salary)', type: 'number', min: 0 },
    { key: 'pfHigh', label: 'PF Amount (High Salary)', type: 'number', min: 0 },
    { key: 'pfThreshold', label: 'PF Salary Threshold', type: 'number', min: 0 },
    { key: 'probationMonths', label: 'Probation Period (months)', type: 'number', min: 0, max: 24 },
  ]},
  { section: 'Late Penalties', fields: [
    { key: 'lateReliefMinutes', label: 'Allowed Late Minutes Per Month (No Penalty)', type: 'number', min: 0 },
    { key: 'latePenaltyPerSet', label: 'Amount Deducted Per Late (PKR)', type: 'number', min: 0 },
    { key: 'halfDayLateMinutes', label: 'Late Minutes For Half-Day Deduction (Single Day)', type: 'number', min: 1 },
  ]},
  { section: 'Saturday Pay', fields: [
    { key: 'saturdayPayEnabled', label: 'Saturday Pay Enabled', type: 'checkbox' },
    { key: 'saturdayMinHours', label: 'Min Hours to Qualify', type: 'number', step: '0.5', min: 0, showIf: 'saturdayPayEnabled' },
    { key: 'saturdayPayHours', label: 'Paid Hours Per Saturday', type: 'number', step: '0.5', min: 0, showIf: 'saturdayPayEnabled' },
  ]},
  { section: 'Bonuses & Loans', fields: [
    { key: 'homeWarrantyPerSale', label: 'Home Warranty Bonus Per Sale (PKR)', type: 'number', min: 0 },
    { key: 'maxLoanAmount', label: 'Max Loan Amount (PKR)', type: 'number', min: 0 },
  ]},
  { section: 'Leave Allocations', fields: [
    { key: 'casualLeaveAllocation', label: 'Casual Leaves Per Year', type: 'number', min: 0, hint: 'Total paid casual leaves for permanent employees per year' },
    { key: 'medicalLeaveAllocation', label: 'Medical Leaves Per Year', type: 'number', min: 0, hint: 'Total paid medical/sick leaves for permanent employees per year' },
    { key: 'probationLeavePerMonth', label: 'Probation Leave Per Month', type: 'checkbox', hint: 'If ON, probation employees get 1 leave per month. If OFF, no leaves during probation' },
  ]},
  { section: 'Adjustment Fields Visibility', fields: [
    { key: 'homeWarrantyEnabled', label: 'Home Warranty Sales', type: 'checkbox' },
    { key: 'autoWarrantyEnabled', label: 'Auto Warranty Bonus', type: 'checkbox' },
    { key: 'softwareCommEnabled', label: 'Software Commission', type: 'checkbox' },
    { key: 'eidBonusEnabled', label: 'Eid Bonus', type: 'checkbox' },
    { key: 'arrearsEnabled', label: 'Arrears', type: 'checkbox' },
    { key: 'fineEnabled', label: 'Fine / Penalty', type: 'checkbox' },
  ]},
];

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Payroll Rules state
  const [rulesModal, setRulesModal] = useState(null);
  const [rulesForm, setRulesForm] = useState(defaultRules);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState('');
  const [rulesSaving, setRulesSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/auth/status`, { credentials: 'include' });
        const j = await r.json();
        if (!j.loggedIn) { navigate('/login'); return; }
        setRole(j.user?.role);
        fetchDepartments();
      } catch { navigate('/login'); }
    })();
  }, [navigate]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/departments', { credentials: 'include' });
      if (res.ok) setDepartments(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"? This will also delete all employees in this department.`)) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to delete'); return; }
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch { alert('Failed to delete department.'); }
  };

  const openAdd = () => { setEditingDept(null); setError(''); setShowModal(true); };
  const openEdit = (dept) => { setEditingDept(dept); setError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingDept(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
    const method = editingDept ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      await fetchDepartments();
      closeModal();
    } catch { setError('An unexpected error occurred.'); }
  };

  // Payroll Rules handlers
  const openRulesModal = async (dept) => {
    setRulesModal(dept);
    setRulesError('');
    setRulesLoading(true);
    try {
      const res = await fetch(`/api/payroll/rules/${dept.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRulesForm(data || { ...defaultRules });
      } else {
        setRulesForm({ ...defaultRules });
      }
    } catch {
      setRulesForm({ ...defaultRules });
    }
    setRulesLoading(false);
  };

  const handleRulesSave = async (e) => {
    e.preventDefault();
    setRulesSaving(true);
    setRulesError('');
    try {
      const res = await fetch(`/api/payroll/rules/${rulesModal.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rulesForm)
      });
      const data = await res.json();
      if (!res.ok) { setRulesError(data.error || 'Failed to save'); setRulesSaving(false); return; }
      alert('Payroll rules saved successfully!');
      setRulesModal(null);
    } catch { setRulesError('Failed to save payroll rules.'); }
    setRulesSaving(false);
  };

  const pp = JSON.parse(localStorage.getItem('pagePermissions') || '{}');
  const hpp = Object.keys(pp).length > 0;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || (hpp && pp.departments);

  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0',
    borderRadius: '6px', fontSize: '0.875rem', color: '#1e293b',
    boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0C3D4A' }}>
          Departments{' '}
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>({departments.length})</span>
        </h2>
        {isAdmin && (
          <button onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: 'linear-gradient(135deg, #0C3D4A, #1a4f5e)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(12,61,74,0.25)' }}>
            <FaPlus /> Add Department
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: '#64748b', padding: '1rem 0' }}>Loading departments...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0C3D4A' }}>
                {['#', 'Name', 'Head of Dept', 'Email', 'Phone', 'Address', 'Employees', ...(isAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>No departments found.</td></tr>
              ) : departments.map((dept, i) => (
                <tr key={dept.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '0.875rem 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#0C3D4A', fontSize: '0.875rem' }}>{dept.name}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{dept.hod || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{dept.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem' }}>{dept.phone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151', fontSize: '0.875rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.address || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                      {dept._count?.employees ?? 0}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <button onClick={() => openRulesModal(dept)} style={{ padding: '4px 10px', background: '#ede9fe', color: '#6d28d9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, marginRight: '6px', transition: 'opacity 0.15s' }}>Payroll Rules</button>
                      <button onClick={() => openEdit(dept)} style={{ padding: '4px 10px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, marginRight: '6px', transition: 'opacity 0.15s' }}>Edit</button>
                      <button onClick={() => handleDelete(dept.id, dept.name)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, transition: 'opacity 0.15s' }}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Department Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '520px', maxWidth: '96vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.4rem 1.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0C3D4A' }}>
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '1.25rem 1.75rem 1.5rem' }}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.65rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                {[
                  { name: 'name', label: 'Department Name *', required: true, placeholder: 'e.g. Engineering' },
                  { name: 'hod', label: 'Head of Department', placeholder: 'e.g. John Smith' },
                  { name: 'email', label: 'Department Email', type: 'email', placeholder: 'e.g. engineering@company.com' },
                  { name: 'phone', label: 'Department Phone', placeholder: 'e.g. +1 234 567 8900' },
                  { name: 'address', label: 'Department Address', placeholder: 'e.g. Floor 3, Building A' },
                ].map(field => (
                  <div key={field.name} style={{ marginBottom: '0.9rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      required={field.required}
                      placeholder={field.placeholder}
                      defaultValue={editingDept?.[field.name] || ''}
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#0C3D4A'; e.target.style.boxShadow = '0 0 0 3px rgba(12,61,74,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" onClick={closeModal} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #0C3D4A, #1a4f5e)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    {editingDept ? 'Save Changes' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Rules Modal */}
      {rulesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '680px', maxWidth: '96vw', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.4rem 1.75rem 1rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0C3D4A' }}>
                Payroll Rules — {rulesModal.name}
              </h3>
              <button onClick={() => setRulesModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '1.25rem 1.75rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {rulesError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.65rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>{rulesError}</div>
              )}

              {rulesLoading ? (
                <p style={{ color: '#64748b' }}>Loading rules...</p>
              ) : (
                <form onSubmit={handleRulesSave}>
                  {ruleFields.map(section => (
                    <div key={section.section} style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: '#0C3D4A', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                        {section.section}
                      </h4>
                      {section.section === 'Late Penalties' && (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '6px', lineHeight: '1.4' }}>
                          No penalty until relief minutes are used. After that, each late day is charged.
                        </p>
                      )}
                      {section.section === 'Leave Allocations' && (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '6px', lineHeight: '1.4' }}>
                          Set how many paid leaves each employee gets per year. Probation rules apply separately.
                        </p>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {section.fields.filter(field => !field.showIf || rulesForm[field.showIf]).map(field => (
                          <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{field.label}</label>
                            {field.type === 'checkbox' ? (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                                <input
                                  type="checkbox"
                                  checked={!!rulesForm[field.key]}
                                  onChange={e => setRulesForm({ ...rulesForm, [field.key]: e.target.checked })}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>{rulesForm[field.key] ? 'Yes' : 'No'}</span>
                              </label>
                            ) : (
                              <input
                                type="number"
                                value={rulesForm[field.key] ?? ''}
                                onChange={e => setRulesForm({ ...rulesForm, [field.key]: e.target.value })}
                                step={field.step || '1'}
                                min={field.min}
                                max={field.max}
                                required
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = '#6d28d9'; e.target.style.boxShadow = '0 0 0 3px rgba(109,40,217,0.08)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                              />
                            )}
                            {field.hint && (
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.3' }}>{field.hint}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <button type="button" onClick={() => setRulesModal(null)} style={{ padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                    <button type="submit" disabled={rulesSaving} style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', color: 'white', border: 'none', borderRadius: '6px', cursor: rulesSaving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: rulesSaving ? 0.7 : 1 }}>
                      {rulesSaving ? 'Saving...' : 'Save Rules'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
