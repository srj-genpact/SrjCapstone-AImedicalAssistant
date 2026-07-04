import { useState } from 'react'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const [view, setView] = useState('chat');

  return (
    <div className="app-container">
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
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
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

        {/* Profile consultation histry component to come here.. */}
      </main>
    </div>
  )
}

export default App
