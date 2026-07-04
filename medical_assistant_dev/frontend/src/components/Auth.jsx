import React, { useState } from 'react';

export default function Auth({ onAuthSuccess, apiBaseUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Optional patient profile fields for registration
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Female');
  const [history, setHistory] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(false);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister
      ? { username, email, password, date_of_birth: dob, gender, medical_history: history }
      : { username, password };

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDob('');
    setGender('Female');
    setHistory('');
    setError('');
  };

  return (
    <div className="auth-box glass-panel card-panel" style={{ marginTop: '5vh' }}>
      <div className="panel-header" style={{ justifyContent: 'center', flexFlow: 'column', gap: '0.25rem', border: 'none', padding: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-brand-primary-light)' }}>
          {isRegister ? 'Create Patient Account' : 'Patient Vault Sign In'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {isRegister ? 'Provide credentials to setup clinical assistant' : 'Sign in to access personalized RAG recommendations'}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} style={{ marginTop: '0.5rem' }}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            className="input-control"
            placeholder="e.g. Priyasharma"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {isRegister && (
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="input-control"
              placeholder="e.g. priya@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        )}

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="input-control"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {isRegister && (
          <>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  className="input-control"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  className="input-control"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>General Medical History</label>
              <textarea
                className="input-control"
                placeholder="Allergies, chronic issues, family history..."
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                disabled={loading}
              />
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={loading}>
          {loading ? (
            <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
          ) : (
            isRegister ? 'Register & Login' : 'Sign In'
          )}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>
          {isRegister ? 'Already registered?' : 'Need to log medical parameters?'}
        </span>{' '}
        <button
          onClick={toggleMode}
          style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary-light)', cursor: 'pointer', fontWeight: '600' }}
          disabled={loading}
        >
          {isRegister ? 'Sign In Here' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}
