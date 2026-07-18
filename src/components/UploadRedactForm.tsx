'use client';
import { useState, useCallback, useRef } from 'react';

interface MappingEntry { type: string; real: string; fake: string; count: number; }
interface RedactionResult {
  stats: Record<string, number>;
  mappingCount: number;
  mapping: MappingEntry[];
}

const LABELS: Record<string, string> = {
  email: 'Emails', phone: 'Phones', ip: 'IP Addrs', ssn: 'SSNs',
  credit_card: 'Cards', dob: 'Dates of Birth', full_name: 'Full Names',
  company_name: 'Companies', address: 'Addresses', pan: 'PAN', din: 'DIN', cin: 'CIN',
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

export default function UploadRedactForm() {
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<RedactionResult | null>(null);
  const [dlUrl, setDlUrl]         = useState<string | null>(null);
  const [showAll, setShowAll]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.docx')) {
      setError('Only .docx files are supported.'); return;
    }
    setFile(f); setError(null); setResult(null); setDlUrl(null); setShowAll(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) accept(f);
  }, []);

  const run = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null); setDlUrl(null);
    try {
      const fd1 = new FormData(); fd1.append('file', file);
      const r1 = await fetch('/api/redact?mode=json', { method: 'POST', body: fd1 });
      if (!r1.ok) { const e = await r1.json(); throw new Error(e.error ?? 'Server error'); }
      setResult(await r1.json());

      const fd2 = new FormData(); fd2.append('file', file);
      const r2 = await fetch('/api/redact', { method: 'POST', body: fd2 });
      if (r2.ok) setDlUrl(URL.createObjectURL(await r2.blob()));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally { setLoading(false); }
  };

  const total = result ? Object.values(result.stats).reduce((a, b) => a + b, 0) : 0;
  const types = result ? (Object.entries(result.stats) as [string,number][]).filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a) : [];
  const rows = showAll ? result?.mapping : result?.mapping.slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Upload card */}
      <div className="card">
        <div className="card-header">
          <span className="card-label">Input Document</span>
          {file && <span style={{fontSize:'11px',color:'var(--text-3)'}}>{fmtBytes(file.size)}</span>}
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            className={`drop-zone${dragging ? ' drag-active' : ''}${file ? ' has-file' : ''}`}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".docx" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) accept(e.target.files[0]); }} />
            {file ? (
              <>
                <div className="file-pill">
                  <span className="file-pill-icon">W</span>
                  <div>
                    <div className="file-pill-name">{file.name}</div>
                    <div className="file-pill-size">{fmtBytes(file.size)}</div>
                  </div>
                </div>
                <div className="change-hint">Click to change file</div>
              </>
            ) : (
              <>
                <div className="dz-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                    stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="dz-primary">Drop your .docx file here</div>
                <div className="dz-secondary">or click to browse — max 50 MB</div>
              </>
            )}
          </div>

          {error && (
            <div className="error-box">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button
            className={`btn-primary${loading ? ' is-loading' : ''}`}
            onClick={run}
            disabled={!file || loading}
          >
            {loading
              ? <><span className="spinner" />Analyzing document…</>
              : <>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Run Redaction
                </>}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="results">

          {/* Stats */}
          <div className="card">
            <div className="card-header">
              <span className="card-label">Redaction Summary</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="stats-grid">
                <div className="stat-cell">
                  <span className="stat-num">{total.toLocaleString()}</span>
                  <span className="stat-lbl">PII Detected</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-num">{result.mappingCount.toLocaleString()}</span>
                  <span className="stat-lbl">Unique Fakes</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-num">{types.length}</span>
                  <span className="stat-lbl">PII Types</span>
                </div>
              </div>

              <div className="type-badges">
                {types.map(([type, count]) => (
                  <div key={type} className="type-badge">
                    <span className="badge-name">{LABELS[type] ?? type}</span>
                    <span className="badge-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Download */}
          {dlUrl && (
            <div className="card">
              <div className="card-header">
                <span className="card-label">Redacted Output</span>
                <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>● Ready</span>
              </div>
              <div className="card-body-sm">
                <a
                  href={dlUrl}
                  download={file ? file.name.replace(/\.docx$/i, '_redacted.docx') : 'redacted.docx'}
                  className="btn-download"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Redacted Document
                </a>
              </div>
            </div>
          )}

          {/* Mapping table */}
          {result.mapping.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-label">Replacement Mappings</span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  {showAll ? result.mappingCount : Math.min(20, result.mapping.length)} of {result.mappingCount}
                </span>
              </div>
              <div className="map-table-wrap">
                <table className="map-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Original</th>
                      <th>Replacement</th>
                      <th style={{ textAlign: 'right' }}>×</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows ?? []).map((e, i) => (
                      <tr key={i}>
                        <td><span className="type-chip">{e.type}</span></td>
                        <td><span className="real-val">{e.real}</span></td>
                        <td><span className="fake-val">{e.fake}</span></td>
                        <td><span className="cnt-val">{e.count}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.mapping.length > 20 && (
                  <button className="show-more" onClick={() => setShowAll(!showAll)}>
                    {showAll ? '↑ Show less' : `↓ Show all ${result.mappingCount} mappings`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
