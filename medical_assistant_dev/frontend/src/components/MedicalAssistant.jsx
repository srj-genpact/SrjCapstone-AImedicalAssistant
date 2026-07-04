import React from 'react';

export default function MedicalAssistant({ token, apiBaseUrl }) {
  return (
    <div className="glass-panel card-panel" style={{ padding: '2rem', textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-brand-primary-light)' }}>
        AI Medical Assistant Chat (Coming in Stage 7)
      </h3>
      <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        Configure guidelines chat, TF-IDF sources citation block, and health observations reminders.
      </p>
    </div>
  );
}
