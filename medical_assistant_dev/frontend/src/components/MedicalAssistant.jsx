import React, { useState, useEffect } from 'react';

export default function MedicalAssistant({ 
  token,
  apiBaseUrl 
}) {
  const [consultations, setConsultations] = useState([]);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [queryText, setQueryText] = useState('');
  
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Personal notes/reminders state
  const [personalNotes, setPersonalNotes] = useState('');

  // Fetch past consultation history for the logged-in patient
  const fetchHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/consultations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch consultation history.');
      }
      setConsultations(data);
      if (data.length > 0) {
        setActiveConsultation(data[0]);
        setPersonalNotes(data[0].notes || '');
      } else {
        setActiveConsultation(null);
        setPersonalNotes('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleSelectConsultation = (c) => {
    setActiveConsultation(c);
    setPersonalNotes(c.notes || '');
    setError('');
    setSuccess('');
  };

  // Submit symptom/question (triggers personalized RAG pipeline)
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryText.trim() || submittingQuery) return;

    setSubmittingQuery(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${apiBaseUrl}/consultations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query_text: queryText
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Diagnostic RAG query failed.');
      }

      setConsultations([data, ...consultations]);
      setActiveConsultation(data);
      setPersonalNotes(data.notes || '');
      setQueryText('');
      setSuccess('Clinical recommendations loaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Save personal notes / observations on a consultation
  const handleSaveNotes = async () => {
    if (!activeConsultation || savingNotes) return;
    setSavingNotes(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/consultations/${activeConsultation.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: personalNotes })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save health notes.');
      }

      setConsultations(consultations.map(c => c.id === data.id ? data : c));
      setActiveConsultation(data);
      setSuccess('Personal observations and reminders saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete consultation session
  const handleDeleteConsultation = async (id) => {
    if (!window.confirm("Permanently delete this consultation record from your history?")) return;
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/consultations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete consultation.');
      }

      const filtered = consultations.filter(c => c.id !== id);
      setConsultations(filtered);
      if (filtered.length > 0) {
        setActiveConsultation(filtered[0]);
        setPersonalNotes(filtered[0].notes || '');
      } else {
        setActiveConsultation(null);
        setPersonalNotes('');
      }
      setSuccess('Consultation record removed.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>AI Symptom Assessment & Medical Assistant</h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Describe what you are feeling below to consult clinical practice guidelines personalized to your health profile.
        </span>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      <div className="rag-layout">
        {/* Left Side: Diagnostic Query & Recommendation Chat View */}
        <div className="chat-panel glass-panel">
          <div className="chat-header">
            <h3>Symptom Conversation</h3>
            {submittingQuery && <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />}
          </div>

          <div className="chat-messages">
            {activeConsultation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                {/* User's Query */}
                <div className="message-bubble user">
                  <p>{activeConsultation.query_text}</p>
                  <span className="message-meta" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Asked on {new Date(activeConsultation.created_at).toLocaleString()}
                  </span>
                </div>

                {/* AI RAG Suggestion */}
                <div className="message-bubble assistant">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--color-brand-primary-light)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      AI Personalized Recommendation
                    </span>
                    <button className="action-btn delete" title="Delete Session Record" onClick={() => handleDeleteConsultation(activeConsultation.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                    {activeConsultation.response_text}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-placeholder" style={{ flex: 1, justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <h3>Consult your Assistant</h3>
                <p>Type how you are feeling (symptoms) or questions about health guidelines below to start your diagnostic check.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleQuerySubmit} className="chat-input-bar glass-panel">
            <input
              type="text"
              className="input-control"
              placeholder="Describe symptoms, e.g. I am feeling chest tightness, cough and shortness of breath..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              required
              disabled={submittingQuery}
            />
            <button type="submit" className="btn btn-primary" disabled={submittingQuery}>
              {submittingQuery ? (
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              ) : (
                <>
                  <span>Consult</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Cited Guidelines and Patient Personal Observations (CRUD) */}
        <div className="details-panel">
          {/* Section A: Cited Guidelines Sources */}
          <div className="glass-panel card-panel" style={{ padding: '1.25rem' }}>
            <div className="panel-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Supporting Clinical Sources
            </div>
            
            {activeConsultation && activeConsultation.sources && activeConsultation.sources.length > 0 ? (
              <div className="sources-list">
                {activeConsultation.sources.map((source, index) => (
                  <div key={index} className="source-card">
                    <div className="source-title">
                      <span>[{index + 1}] {source.source_title}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Match: {source.score.toFixed(3)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.2rem' }}>
                      Section: {source.section}
                    </div>
                    <div className="source-text">
                      "...{source.text.length > 150 ? source.text.substring(0, 150) + '...' : source.text}..."
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                No active guidelines cited.
              </p>
            )}
          </div>

          {/* Section B: Personal Health Notes / Reminders */}
          <div className="glass-panel card-panel" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                My Health Notes & Vitals Notes
              </span>
              {activeConsultation && (
                <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              )}
            </div>

            {activeConsultation ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  className="notes-editor"
                  placeholder="e.g. Set reminders, clinical advice, doctor checkups..."
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  disabled={savingNotes}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Append reminders, doctor checkup schedules, or symptom progression logs associated with this query.
                </span>
              </div>
            ) : (
              <div className="empty-placeholder" style={{ margin: 'auto' }}>
                <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Submit a consult to write and log personal notes.
                </p>
              </div>
            )}
          </div>

          {/* Section C: Consultation Session Logs History */}
          <div className="glass-panel card-panel" style={{ padding: '1.25rem', maxHeight: '180px', overflowY: 'auto' }}>
            <div className="panel-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Consultation Session History
            </div>
            
            {loadingHistory ? (
              <div className="spinner" style={{ margin: '1rem auto', width: '20px', height: '20px', borderWidth: '2px' }} />
            ) : consultations.length === 0 ? (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                No past sessions.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {consultations.map((c) => (
                  <div 
                    key={c.id} 
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--border-radius-sm)',
                      backgroundColor: activeConsultation && activeConsultation.id === c.id ? 'rgba(13, 148, 136, 0.15)' : 'rgba(255,255,255,0.01)',
                      border: activeConsultation && activeConsultation.id === c.id ? '1px solid rgba(13,148,136,0.3)' : '1px solid var(--color-card-border)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'var(--transition-smooth)'
                    }}
                    onClick={() => handleSelectConsultation(c)}
                  >
                    <strong>{new Date(c.created_at).toLocaleDateString()}:</strong> {c.query_text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
