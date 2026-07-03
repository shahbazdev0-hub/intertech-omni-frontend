import React, { useState } from 'react';

function AddEmployee() {
  const [showModal, setShowModal] = useState(false);

  const handleAddClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
   

    
    setShowModal(false);
  };

  return (
    <div>
      <button onClick={handleAddClick}>Add Employee</button>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '500px', maxWidth: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>Add New Employee</h2>
              <button onClick={handleCloseModal} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input required placeholder="Name *" style={{ flex: 1, padding: '0.5rem' }} />
                <input required type="email" placeholder="Email *" style={{ flex: 1, padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <select required style={{ flex: 1, padding: '0.5rem' }}>
                  <option value="">Select Department *</option>
                  <option value="HR">HR</option>
                  <option value="Design">Design</option>
                  <option value="Engineering">Engineering</option>
                </select>
                <input required placeholder="Position *" style={{ flex: 1, padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input required placeholder="Salary *" type="number" style={{ flex: 1, padding: '0.5rem' }} />
                <select required style={{ flex: 1, padding: '0.5rem' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input required type="date" placeholder="Join Date *" style={{ flex: 1, padding: '0.5rem' }} />
                <input required placeholder="Age *" type="number" style={{ flex: 1, padding: '0.5rem' }} />
                <input required placeholder="Experience (years) *" type="number" style={{ flex: 1, padding: '0.5rem' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#008075', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddEmployee;
