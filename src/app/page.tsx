import UploadRedactForm from '@/components/UploadRedactForm';

export default function Home() {
  return (
    <>
      {/* Topbar */}
      <nav className="topbar">
        <a href="/" className="topbar-logo">
          <svg
            style={{ color: 'var(--accent)' }}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span className="logo-text">PII Redaction Tool</span>
        </a>
        <div className="topbar-spacer" />
        <span className="topbar-badge">v1.0.0</span>
      </nav>

      {/* Main content */}
      <main className="page-layout">
        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">
            <svg
              style={{ color: 'var(--accent)', flexShrink: 0 }}
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            PII Redaction Tool
          </h1>
          <p className="page-description">
            Upload a <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--surface-3)', padding: '2px 5px', borderRadius: '3px', color: 'var(--text-secondary)' }}>.docx</code> file to automatically detect and replace all personally identifiable information with consistent fake alternatives. Same real value always maps to the same fake across the full document.
          </p>
          <div className="page-meta">
            <span className="meta-tag">
              <span className="meta-dot" />
              Regex-first detection
            </span>
            <span className="meta-tag" style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="meta-tag">12 PII types</span>
            <span className="meta-tag" style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="meta-tag">No cloud calls</span>
            <span className="meta-tag" style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="meta-tag">Deterministic output</span>
          </div>
        </div>

        {/* Form */}
        <UploadRedactForm />

        {/* Info cards */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-label">Consistent Mapping</div>
            <div className="info-card-value">
              The same real value always produces the same fake replacement across the entire document — powered by a deterministic djb2 hash lookup.
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Indian ID Support</div>
            <div className="info-card-value">
              PAN, DIN, and CIN are treated as PII and always redacted. Generic page numbers, financial figures, and share counts are left untouched.
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <span className="footer-left">PII Redaction Tool · Next.js + TypeScript · mammoth + docx</span>
          <div className="footer-right">
            <a href="/api/redact" className="footer-link">API</a>
          </div>
        </footer>
      </main>
    </>
  );
}
