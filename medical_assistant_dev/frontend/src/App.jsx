import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ProfileManager from './components/ProfileManager';
import MedicalAssistant from './components/MedicalAssistant';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Navigation View ('chat' or 'profile')
  const [view, setView] = useState('chat');

  // Conditions list summary state for stats counters
  const [conditionsCount, setConditionsCount] = useState(0);

  // Helper for requests with auth header
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Verify session on mount or token changes
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.authenticated) {
          setUser(data.user);
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, [token]);

  // 2. Fetch Conditions count for dashboard counters
  const fetchConditionsCount = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/conditions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setConditionsCount(data.length);
      }
    } catch (err) {
      console.error('Failed to update stats count:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConditionsCount();
    }
  }, [user, view]); // Reload when switching views to update stats

  // Auth actions
  const handleAuthSuccess = (loggedInUser, userToken) => {
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(loggedInUser);
    setView('chat');
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
      setView('chat');
    }
  };

  // Profile Update Action
  const handleUpdateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }
      setUser(data.user);
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  if (checkingAuth) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-box">
          <div className="spinner" />
          <p style={{ marginTop: '1rem', fontFamily: 'var(--font-heading)' }}>Connecting with Health Vault...</p>
        </div>
      </div>
    );
  }

  // Render Auth screen if not logged in
  if (!user) {
    return (
      <div className="app-container">
        <Auth
          onAuthSuccess={(user, token) => handleAuthSuccess(user, token)}
          apiBaseUrl={API_BASE_URL}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <nav className="navbar glass-panel">
        <div className="nav-brand">
          <svg viewBox="0 0 24 24">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span>AI Medical Assistant</span>
        </div>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${view === 'chat' ? 'active' : ''}`}
              onClick={() => setView('chat')}
            >
              Assistant Chat
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${view === 'profile' ? 'active' : ''}`}
              onClick={() => setView('profile')}
            >
              My Profile & Conditions
            </button>
          </li>
          <li className="user-badge" style={{ color: 'var(--color-brand-primary-light)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Patient: {user.username}</span>
          </li>
          <li>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Workspace Dashboard */}
      <main className="main-content">
        {/* Render Stats Dashboard Cards */}
        <div className="stats-row">
          <div className="stat-card glass-panel">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="stat-details">
              <h3>{conditionsCount}</h3>
              <p>Active Conditions Logged</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ color: 'var(--color-brand-secondary-light)', background: 'rgba(99, 102, 241, 0.1)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="stat-details">
              <h3>Personalized</h3>
              <p>RAG Decision Support</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="stat-details">
              <h3>Guideline</h3>
              <p>Verified Clinical Database</p>
            </div>
          </div>
        </div>

        {/* View Routing */}
        {view === 'chat' ? (
          <MedicalAssistant
            token={token}
            apiBaseUrl={API_BASE_URL}
          />
        ) : (
          <ProfileManager
            user={user}
            onUpdateProfile={handleUpdateProfile}
            apiBaseUrl={API_BASE_URL}
            token={token}
          />
        )}
      </main>
    </div>
  );
}
