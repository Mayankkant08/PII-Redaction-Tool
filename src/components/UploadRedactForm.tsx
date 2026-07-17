'use client';

import { useState, useCallback, useRef } from 'react';

interface MappingEntry {
  type: string;
  real: string;
  fake: string;
  count: number;
}

interface RedactionResult {
  stats: Record<string, number>;
  mappingCount: number;
  mapping: MappingEntry[];
}

const TYPE_LABELS: Record<string, string> = {
  email:        'Emails',
  phone:        'Phones',
  ip:           'IP Addresses',
  ssn:          'SSNs',
  credit_card:  'Credit Cards',
  dob:          'Dates of Birth',
  full_name:    'Full Names',
  company_name: 'Companies',
  address:      'Addresses',
  pan:          'PAN Numbers',
  din:          'DIN Numbers',
  cin:          'CIN Numbers',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadRedactForm() {
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<RedactionResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showAll, setShowAll]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.docx')) {
      setError('Only .docx files are supported.');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    setDownloadUrl(null);
    setShowAll(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDownloadUrl(null);

    try {
      const formJson = new FormData();
      formJson.append('file', file);
      const jsonRes = await fetch('/api/redact?mode=json', { method: 'POST', body: formJson });
      if (!jsonRes.ok) {
        const err = await jsonRes.json();
        throw new Error(err.error ?? 'Server error');
      }
      const jsonData: RedactionResult = await jsonRes.json();
      setResult(jsonData);

      const formDocx = new FormData();
      formDocx.append('file', file);
      const docxRes = await fetch('/api/redact', { method: 'POST', body: formDocx });
      if (docxRes.ok) {
        const blob = await docxRes.blob();
        setDownloadUrl(URL.createObjectURL(blob));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const totalPii = result
    ? Object.values(result.stats).reduce((a, b) => a + b, 0)
    : 0;

  const visibleRows = showAll ? result?.mapping : result?.mapping.slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Upload section */}
      <div className="section">
        <div className="section-header">
          <span className="section-label">Input Document</span>
          {file && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatBytes(file.size)}
            </span>
          )}
        </div>
        <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            className={`drop-zone ${dragging ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".docx"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            {!file ? (
              <>
                <span className="drop-icon">↑</span>
                <div className="drop-primary">Drop your .docx file here</div>
                <div className="drop-secondary">or click to browse — max 50 MB</div>
              </>
            ) : (
              <div className="file-row">
                <div className="file-icon-small">W</div>
                <div className="file-info">
                  <div className="file-name-text">{file.name}</div>
                  <div className="file-size-text">{formatBytes(file.size)}</div>
                </div>
              </div>
            )}
            {file && <div className="file-change">Click to change file</div>}
          </div>

          {error && (
            <div className="error-row">
              <span>⚠</span>
              {error}
            </div>
          )}

          <button
            className={`run-btn ${loading ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? (
              <><span className="spinner" /> Processing document...</>
            ) : (
              'Run Redaction'
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="results-wrapper">

          {/* Metrics */}
          <div className="section">
            <div className="section-header">
              <span className="section-label">Redaction Summary</span>
            </div>
            <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="metrics-row">
                <div className="metric-cell">
                  <span className="metric-value">{totalPii.toLocaleString()}</span>
                  <span className="metric-label">PII Instances</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-value">{result.mappingCount.toLocaleString()}</span>
                  <span className="metric-label">Unique Mappings</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-value">{Object.keys(result.stats).filter(k => result.stats[k] > 0).length}</span>
                  <span className="metric-label">PII Types</span>
                </div>
              </div>

              {/* Per-type breakdown */}
              <div className="type-grid">
                {(Object.entries(result.stats) as [string, number][])
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="type-chip">
                      <span className="chip-label">{TYPE_LABELS[type] ?? type}</span>
                      <span className="chip-count">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Download */}
          {downloadUrl && (
            <div className="section">
              <div className="section-header">
                <span className="section-label">Output</span>
                <span style={{ fontSize: '11px', color: 'var(--green)' }}>Ready</span>
              </div>
              <div className="section-body">
                <a
                  href={downloadUrl}
                  download={file ? file.name.replace(/\.docx$/i, '_redacted.docx') : 'redacted.docx'}
                  className="download-btn"
                >
                  ↓ Download Redacted Document
                </a>
              </div>
            </div>
          )}

          {/* Mapping table */}
          {result.mapping.length > 0 && (
            <div className="section">
              <div className="section-header">
                <span className="section-label">
                  Replacement Mappings
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {showAll ? result.mappingCount : Math.min(20, result.mapping.length)} of {result.mappingCount}
                </span>
              </div>
              <div className="section-body">
                <div className="mapping-section">
                  <div className="table-scroll">
                    <table className="map-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Original</th>
                          <th>Replacement</th>
                          <th style={{ textAlign: 'right' }}>Occurrences</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(visibleRows ?? []).map((entry, i) => (
                          <tr key={i}>
                            <td><span className="type-tag">{entry.type}</span></td>
                            <td className="real-cell">{entry.real}</td>
                            <td className="fake-cell">{entry.fake}</td>
                            <td className="count-cell">{entry.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.mapping.length > 20 && (
                    <button
                      type="button"
                      className="show-more-btn"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll
                        ? '↑ Show less'
                        : `↓ Show all ${result.mappingCount} mappings`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
