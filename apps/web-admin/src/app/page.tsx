import React from 'react';
import { SEED_INSTITUTE_RICM_BHOPAL, SEED_PROGRAMME, SEED_USERS } from '@sahakar/test-fixtures';

export default function AdminHomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#0f172a', margin: 0 }}>Sahakar Edge — NCCT Central Admin Portal</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Ministry of Cooperation | National Council for Cooperative Training (SIH PS 26087)
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#0369a1' }}>Registered Institute</h3>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: '0.5rem 0' }}>{SEED_INSTITUTE_RICM_BHOPAL.name}</p>
          <span style={{ fontSize: '0.875rem', background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            Code: {SEED_INSTITUTE_RICM_BHOPAL.code}
          </span>
        </div>

        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#0369a1' }}>Active Programme</h3>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: '0.5rem 0' }}>{SEED_PROGRAMME.title}</p>
          <span style={{ fontSize: '0.875rem', background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            Status: {SEED_PROGRAMME.status}
          </span>
        </div>

        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#0369a1' }}>Provisioned Users</h3>
          <p style={{ fontWeight: 600, fontSize: '1.5rem', margin: '0.5rem 0' }}>{SEED_USERS.length}</p>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Roles: Admin, Trainer, Trainee, Employer</span>
        </div>
      </section>

      <section style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ marginTop: 0, color: '#0f172a' }}>Offline Synchronization Architecture</h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Sahakar Edge nodes capture attendance, interactive learning progress, and assessment completions locally in an append-only event journal during WAN outage. Upon internet restoration, events stream to the Central API with monotonic sequences and idempotent ingestion, ensuring zero loss of trainee completion evidence.
        </p>
      </section>
    </main>
  );
}
