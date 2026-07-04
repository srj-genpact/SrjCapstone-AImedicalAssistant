import React, { useState, useEffect } from 'react';

export default function ProfileManager({ 
  user, 
  onUpdateProfile, 
  apiBaseUrl, 
  token 
}) {
  const [dob, setDob] = useState(user.date_of_birth || '');
  const [gender, setGender] = useState(user.gender || 'Female');
  const [history, setHistory] = useState(user.medical_history || '');
  
  const [conditions, setConditions] = useState([]);
  const [loadingConds, setLoadingConds] = useState(false);
  const [condsError, setCondsError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  
  // Modals state for Conditions CRUD
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeCondition, setActiveCondition] = useState(null);
  
  // Form states for individual conditions
  const [condName, setCondName] = useState('');
  const [condNotes, setCondNotes] = useState('');

  // Fetch conditions on mount
  const fetchConditions = async () => {
    if (!token) return;
    setLoadingConds(true);
    setCondsError('');
    try {
      const response = await fetch(`${apiBaseUrl}/conditions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch medical conditions.');
      }
      setConditions(data);
    } catch (err) {
      setCondsError(err.message);
    } finally {
      setLoadingConds(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, [token]);

  // Handle profile info update
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileSuccess('');
    onUpdateProfile({
      date_of_birth: dob,
      gender,
      medical_history: history
    });
    setProfileSuccess('Profile information updated successfully.');
    setTimeout(() => setProfileSuccess(''), 4000);
  };

  // Conditions CRUD actions
  const handleOpenAdd = () => {
    setCondName('');
    setCondNotes('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!condName.trim()) return;
    
    setCondsError('');
    try {
      const response = await fetch(`${apiBaseUrl}/conditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          condition_name: condName,
          notes: condNotes
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log condition.');
      }
      setConditions([data, ...conditions]);
      setShowAddModal(false);
    } catch (err) {
      setCondsError(err.message);
    }
  };

  const handleOpenEdit = (cond) => {
    setActiveCondition(cond);
    setCondName(cond.condition_name);
    setCondNotes(cond.notes);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!condName.trim() || !activeCondition) return;

    setCondsError('');
    try {
      const response = await fetch(`${apiBaseUrl}/conditions/${activeCondition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          condition_name: condName,
          notes: condNotes
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update condition.');
      }
      setConditions(conditions.map(c => c.id === data.id ? data : c));
      setShowEditModal(false);
      setActiveCondition(null);
    } catch (err) {
      setCondsError(err.message);
    }
  };

  const handleDeleteCondition = async (id) => {
    if (!window.confirm("Remove this medical condition from your profile? This will update recommendations immediately.")) return;
    setCondsError('');
    try {
      const response = await fetch(`${apiBaseUrl}/conditions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete condition.');
      }
      setConditions(conditions.filter(c => c.id !== id));
    } catch (err) {
      setCondsError(err.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
      
      {/* Left side: Patient Personal Profile Form */}
      <div className="glass-panel card-panel" style={{ height: 'fit-content' }}>
        <div className="panel-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          My Profile Information
        </div>

        {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" className="input-control" value={user.username} disabled />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sign-in account username (cannot be modified)</span>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="input-control" value={user.email} disabled />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Birth Date</label>
              <input
                type="date"
                className="input-control"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select
                className="input-control"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>General Medical History / Bio</label>
            <textarea
              className="input-control"
              style={{ minHeight: '120px', resize: 'vertical' }}
              placeholder="e.g. Allergic to Penicillin. General stage 1 hypertension, high blood pressure runs in the family."
              value={history}
              onChange={(e) => setHistory(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              General observations here are analyzed by the AI Medical Assistant.
            </span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Profile Info
          </button>
        </form>
      </div>

      {/* Right side: Medical Conditions Log CRUD */}
      <div className="glass-panel card-panel">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '0.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            My Active Medical Conditions & Vitals Logs
          </h3>
          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleOpenAdd}>
            + Log Condition
          </button>
        </div>

        {condsError && <div className="alert alert-danger">{condsError}</div>}

        {loadingConds ? (
          <div className="loading-box">
            <div className="spinner" />
            <p>Loading medical profiles...</p>
          </div>
        ) : conditions.length === 0 ? (
          <div className="empty-placeholder" style={{ padding: '4rem 1.5rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3>No Chronic Conditions Logged</h3>
            <p>Add active diagnoses or vitals metrics (e.g. Diabetes, Hypertension) to receive personalized, guideline-compliant feedback from the AI assistant.</p>
          </div>
        ) : (
          <div className="patient-list">
            {conditions.map((c) => (
              <div key={c.id} className="patient-row glass-panel" style={{ cursor: 'default' }}>
                <div className="patient-info">
                  <h4 style={{ color: 'var(--color-brand-primary-light)' }}>{c.condition_name}</h4>
                  <div className="patient-meta" style={{ marginTop: '0.2rem' }}>
                    <span><strong>Notes:</strong> {c.notes || 'No description recorded'}</span>
                    <span>•</span>
                    <span><strong>Logged on:</strong> {new Date(c.logged_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="patient-actions">
                  <button className="action-btn" title="Edit Log details" onClick={() => handleOpenEdit(c)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button className="action-btn delete" title="Remove Condition" onClick={() => handleDeleteCondition(c.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Condition Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-brand-primary-light)' }}>Log New Health Condition / Metric</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Condition / Parameter Name</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  value={condName}
                  onChange={(e) => setCondName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Observation Notes / Vitals Values</label>
                <textarea
                  className="input-control"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="e.g. Type 2. Diagnosed in 2020. Average glucose levels 145 mg/dL. Taking Metformin."
                  value={condNotes}
                  onChange={(e) => setCondNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Condition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Condition Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-brand-secondary-light)' }}>Edit Health Condition / Vitals Log</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Condition / Parameter Name</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Diabetes"
                  value={condName}
                  onChange={(e) => setCondName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Observation Notes / Vitals Values</label>
                <textarea
                  className="input-control"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={condNotes}
                  onChange={(e) => setCondNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setActiveCondition(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-brand-secondary), var(--color-brand-secondary-light))', boxShadow: 'none' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
