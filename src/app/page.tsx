import UploadRedactForm from '@/components/UploadRedactForm';

export default function Home() {
  return (
    <>
      {/* ── Topbar ── */}
      <nav className="topbar">
        <a href="/" className="topbar-logo">
          <span className="logo-mark">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <span className="logo-text">PII Redaction Tool</span>
        </a>
        <div className="topbar-spacer" />
        <span className="topbar-pill">v1.0.0</span>
      </nav>

      {/* ── Main ── */}
      <div className="page-root">

        {/* ── Hero ── */}
        <div className="hero">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            Privacy-first document redaction
          </div>
          <h1 className="hero-title">
            Redact PII from<br />
            <span className="grad">any document.</span>
          </h1>
          <p className="hero-sub">
            Upload a <code style={{fontFamily:'var(--mono)',fontSize:'12px',background:'rgba(255,255,255,0.07)',padding:'2px 6px',borderRadius:'4px',color:'#c4b5fd'}}>.docx</code> file and every name, email, phone number, PAN, address, and more gets replaced with realistic fake alternatives — consistently and automatically.
          </p>
          <div className="hero-tags">
            {['Regex-first detection','12 PII types','Indian IDs (PAN · DIN · CIN)','No cloud calls','Deterministic output'].map(t => (
              <span key={t} className="hero-tag">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Upload Form ── */}
        <UploadRedactForm />

        {/* ── Features ── */}
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🔁</div>
            <div className="feature-title">Consistent Mapping</div>
            <div className="feature-desc">
              Same real value always produces the same fake — powered by a djb2 hash. "Rashi Patil" on page 1 and page 80 become the same fake name.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🇮🇳</div>
            <div className="feature-title">Indian ID Support</div>
            <div className="feature-desc">
              PAN, DIN, and CIN are treated as PII and always redacted. Generic page numbers, financial figures, and share counts are untouched.
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="footer">
          <span className="footer-copy">PII Redaction Tool · Next.js + TypeScript</span>
          <a href="/api/redact" className="footer-link">API Reference</a>
        </footer>
      </div>
    </>
  );
}
