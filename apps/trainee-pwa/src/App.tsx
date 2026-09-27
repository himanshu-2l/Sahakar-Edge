import React, { useState } from 'react';
import {
  SEED_PROGRAMME,
  SEED_COURSE,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_USERS,
  SEED_SKILLS,
  SEED_JOB_OPPORTUNITY,
} from '@sahakar/test-fixtures';

export default function App() {
  const [activeTab, setActiveTab] = useState<'HOME' | 'LEARN' | 'PROGRESS' | 'CREDENTIALS' | 'OPPORTUNITIES'>('HOME');
  const [isOffline, setIsOffline] = useState(true); // default to demonstrating edge offline mode
  const [queuedEvents, setQueuedEvents] = useState(2);

  const trainee = SEED_USERS.find((u) => u.role === 'TRAINEE') || SEED_USERS[3];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '480px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Offline Status Banner per 07_UI_UX_SPEC.md */}
      <div style={{
        backgroundColor: isOffline ? '#ea580c' : '#16a34a',
        color: '#ffffff',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {isOffline ? '⚡ Offline — Working from Sahakar Edge Node' : '✓ All records synchronized centrally'}
        </span>
        {isOffline && (
          <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>
            Queue: {queuedEvents}
          </span>
        )}
      </div>

      {/* Header */}
      <header style={{ padding: '1rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          NCCT Cooperative Learning
        </div>
        <h1 style={{ fontSize: '1.25rem', margin: '0.25rem 0 0 0', color: '#0f172a' }}>
          Namaste, {trainee.name.split(' ')[0]}
        </h1>
      </header>

      {/* Main Tab Content */}
      <main style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {activeTab === 'HOME' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ENROLLED PROGRAMME</div>
              <h2 style={{ fontSize: '1rem', margin: '0.25rem 0 0.5rem 0', color: '#0369a1' }}>{SEED_PROGRAMME.title}</h2>
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>RICM Bhopal Cohort | Batch 2026-A</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TODAY'S ATTENDANCE</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#16a34a' }}>✓ Present (QR Verified)</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>09:32 AM</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CONTINUE MODULE</div>
              <h3 style={{ fontSize: '0.95rem', margin: '0.25rem 0 0.5rem 0' }}>{SEED_LESSONS[0].title}</h3>
              <button
                onClick={() => setActiveTab('LEARN')}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Open Offline Lesson
              </button>
            </div>
          </div>
        )}

        {activeTab === 'LEARN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                Offline Cache Ready
              </span>
              <h2 style={{ fontSize: '1.1rem', margin: '0.5rem 0 0.25rem 0' }}>{SEED_COURSE.title}</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Language: Hindi | Version: 1.0</p>
            </div>

            {SEED_LESSONS.map((lesson) => (
              <div key={lesson.id} style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0 }}>{lesson.title}</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0.5rem 0' }}>Type: {lesson.type}</p>
                <button
                  onClick={() => alert(`Opening local lesson: ${lesson.title}`)}
                  style={{ backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Read Lesson
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'PROGRESS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1rem', margin: 0 }}>Learning Progress & Evaluation</h2>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Syllabus Completed</span>
                  <span style={{ fontWeight: 600 }}>65%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '0.25rem', overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', backgroundColor: '#0284c7' }} />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Pending Assessment</h3>
              <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.25rem 0 0.5rem 0' }}>{SEED_ASSESSMENT.title}</p>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Passing Score: {SEED_ASSESSMENT.passingScore}%</div>
              <button
                onClick={() => alert('Starting offline quiz on Sahakar Edge node!')}
                style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Take Assessment
              </button>
            </div>
          </div>
        )}

        {activeTab === 'CREDENTIALS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>✓ VERIFIED ED25519 CREDENTIAL</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>NCCT Issued</span>
              </div>
              <h3 style={{ fontSize: '1rem', margin: '0.5rem 0 0.25rem 0' }}>Certificate of Competency in PACS Ledgering</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>ID: cred-pacs-2026-0814</p>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }}>[Digital QR Verifier Stamp]</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Tamper-Evident Ed25519 Signature Verified</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'OPPORTUNITIES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                Matched Opportunity
              </span>
              <h3 style={{ fontSize: '1rem', margin: '0.5rem 0 0.25rem 0' }}>{SEED_JOB_OPPORTUNITY.title}</h3>
              <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>Employer: Amul Cooperative Talent Network</div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0' }}>Location: {SEED_JOB_OPPORTUNITY.location}</p>
              
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>✓ Matched: PACS Double-Entry Accounting</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Missing: Cooperative Governance (In Progress)</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '0.5rem 0' }}>
        {(['HOME', 'LEARN', 'PROGRESS', 'CREDENTIALS', 'OPPORTUNITIES'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? '#0284c7' : '#64748b',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '0.65rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
