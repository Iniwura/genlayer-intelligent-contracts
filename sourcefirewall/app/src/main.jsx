import React, { useEffect, useMemo, useState } from "react";
import { createReadClient, configurationError, connectWallet, errorText, loadRecords, transactionUrl, writeSourceFirewall } from "./api";
import { EXAMPLE_RECORDS } from "./demoData";
import "./style.css";

const CATEGORY_LABELS = {
  PROMPT_INJECTION: "Prompt injection",
  INSTRUCTION_HIJACKING: "Instruction hijacking",
  SECRET_EXFILTRATION: "Secret exfiltration",
  MALICIOUS_TOOL_REDIRECTION: "Tool redirection",
  UNSUPPORTED_CLAIM: "Unsupported claim",
};

function Icon({ name }) {
  const paths = {
    shield: <path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z" />,
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    link: <path d="m10 13 4-4m-6.5 7.5-1 1a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0m4-4 1-1a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    external: <><path d="M14 5h5v5" /><path d="m19 5-8 8" /><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function RiskPill({ state }) {
  const config = {
    CLEARED: ["cleared", "CLEARED"],
    QUARANTINED: ["quarantined", "QUARANTINED"],
    UNRESOLVED: ["unresolved", "UNRESOLVED"],
    SUBMITTED: ["submitted", "SUBMITTED"],
    EVALUATING: ["evaluating", "EVALUATING"],
  }[state] || ["submitted", state];
  return <span className={`status-pill ${config[0]}`}><span className="status-dot" />{config[1]}</span>;
}

function SeverityBadge({ severity }) {
  return <span className={`severity ${severity.toLowerCase()}`}>{severity}</span>;
}

function RecordCard({ item, selected, onSelect }) {
  return (
    <button className={`record-card ${selected ? "selected" : ""}`} onClick={() => onSelect(item)}>
      <div className="record-card-top"><span className="record-index">{item.record_id}</span><RiskPill state={item.state} /></div>
      <h3>{item.source_label || "Unnamed source"}</h3>
      <p className="source-url">{item.source_url}</p>
      <div className="record-card-foot"><span>{item.findings.length || 5} findings</span><span>{item.decision}</span></div>
    </button>
  );
}

function FindingRow({ finding }) {
  return (
    <article className="finding-row">
      <div className="finding-icon"><Icon name={finding.severity === "HIGH" ? "shield" : finding.severity === "MEDIUM" ? "lock" : "check"} /></div>
      <div className="finding-main">
        <div className="finding-heading"><strong>{CATEGORY_LABELS[finding.category] || finding.category}</strong><SeverityBadge severity={finding.severity} /></div>
        <p>{finding.explanation}</p>
        {finding.evidence_quote && <blockquote>“{finding.evidence_quote}”</blockquote>}
        <span className="pointer">SOURCE POINTER · {finding.source_pointer}</span>
      </div>
    </article>
  );
}

function App() {
  const [records, setRecords] = useState(EXAMPLE_RECORDS);
  const [selected, setSelected] = useState(EXAMPLE_RECORDS[0]);
  const [account, setAccount] = useState("");
  const [client, setClient] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ recordId: "source-001", label: "Weekly agent source", url: "https://example.org/", purpose: "Summarize this source for a research assistant without taking actions." });
  const configMessage = configurationError();
  const isDemo = Boolean(configMessage);
  const selectedLive = useMemo(() => records.find((item) => item.record_id === selected?.record_id) || selected, [records, selected]);

  async function refresh() {
    if (isDemo) return;
    try {
      const next = await loadRecords(createReadClient());
      setRecords(next);
      if (next.length) setSelected((current) => next.find((item) => item.record_id === current?.record_id) || next[0]);
    } catch (cause) { setError(errorText(cause)); }
  }

  useEffect(() => { refresh(); }, []);

  async function handleConnect() {
    setError("");
    try {
      const connected = await connectWallet();
      setAccount(connected.account);
      setClient(connected.client);
      setMessage("Wallet linked to Bradbury.");
    } catch (cause) { setError(errorText(cause)); }
  }

  async function handleCreate() {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await writeSourceFirewall(client, "create_record", [form.recordId.trim(), form.url.trim(), form.label.trim(), form.purpose.trim()], (hash) => setMessage(`Record transaction submitted · ${hash.slice(0, 10)}…`));
      setMessage(`Record accepted · ${result.hash.slice(0, 10)}…`);
      await refresh();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  async function handleEvaluate() {
    if (!selectedLive?.record_id) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await writeSourceFirewall(client, "evaluate_record", [selectedLive.record_id], (hash) => setMessage(`Consensus evaluation submitted · ${hash.slice(0, 10)}…`));
      setMessage(`Evaluation accepted · ${result.hash.slice(0, 10)}…`);
      await refresh();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  const isTerminal = ["CLEARED", "QUARANTINED", "UNRESOLVED"].includes(selectedLive?.state);
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark"><Icon name="shield" /></span><span>Source<span>Firewall</span></span></a>
        <nav><a href="#queue">Audit queue</a><a href="#protocol">Protocol</a><a href="#review">Review guide</a></nav>
        <button className="wallet-button" onClick={handleConnect}>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect wallet"}<Icon name="arrow" /></button>
      </header>

      <main id="top">
        <section className="hero section-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />CONSENSUS-BACKED SOURCE INSPECTION</div>
            <h1>Untrusted source in.<br /><em>Bounded evidence out.</em></h1>
            <p className="hero-lede">SourceFirewall gives downstream AI agents a hard trust boundary: inspect the source, bind every finding to its digest, and keep unresolved content out of the action path.</p>
            <div className="hero-actions"><a className="primary-button" href="#queue">Open inspection desk <Icon name="arrow" /></a><a className="text-button" href="#protocol">See the protocol <Icon name="arrow" /></a></div>
            <div className="hero-note"><span className="note-line" />External content is data, never instructions.</div>
          </div>
          <div className="hero-card-wrap"><div className="hero-card-glow" /><div className="hero-card">
            <div className="hero-card-head"><span className="live-chip"><span className="pulse" />BOUNDARY ONLINE</span><span className="mono">SF / 01</span></div>
            <div className="signal-stack"><div className="signal-line"><span className="signal-label">SOURCE</span><span className="signal-value">rendered text</span><span className="signal-state">captured</span></div><div className="signal-line"><span className="signal-label">EVALUATOR</span><span className="signal-value">independent validators</span><span className="signal-state">quorum</span></div><div className="signal-line"><span className="signal-label">OUTPUT</span><span className="signal-value">structured findings</span><span className="signal-state">bound</span></div></div>
            <div className="hero-card-foot"><span><Icon name="lock" /> fail-closed by default</span><span className="mono">v1.0</span></div>
          </div></div>
        </section>

        <section className="trust-strip"><div><span className="strip-number">01</span><strong>Detect</strong><span>five risk families</span></div><div><span className="strip-number">02</span><strong>Bind</strong><span>source digest + pointers</span></div><div><span className="strip-number">03</span><strong>Decide</strong><span>allow, review, or block</span></div><div><span className="strip-number">04</span><strong>Fail closed</strong><span>unresolved never clears</span></div></section>

        <section id="queue" className="desk-section section-grid"><div className="section-intro"><div className="eyebrow">01 / INSPECTION DESK</div><h2>Review the source<br /><em>before the agent does.</em></h2><p>Each record is immutable at creation, evaluated against its registered purpose, and stored with source-bound evidence that a reviewer can challenge.</p><div className={`connection-state ${isDemo ? "demo" : "live"}`}><span className="state-orb" /><div><strong>{isDemo ? "EXAMPLE MODE" : "BRADBURY LINKED"}</strong><span>{isDemo ? "No deployed address configured" : "Latest non-final state reads enabled"}</span></div></div></div>
          <div className="desk-panel"><div className="panel-top"><div><span className="panel-kicker">LIVE RECORDS</span><h3>{isDemo ? "Illustrative review queue" : "On-chain review queue"}</h3></div><button className="refresh-button" onClick={refresh} disabled={busy}>Refresh <Icon name="arrow" /></button></div><div className="record-list">{records.length ? records.map((item) => <RecordCard key={item.record_id} item={item} selected={item.record_id === selectedLive?.record_id} onSelect={setSelected} />) : <div className="empty-state">No records yet. Create the first source record below.</div>}</div></div></section>

        <section className="review-section section-grid" id="review"><div className="review-panel"><div className="panel-top"><div><span className="panel-kicker">SELECTED RECORD</span><h3>{selectedLive?.source_label || "Select a record"}</h3></div>{selectedLive && <RiskPill state={selectedLive.state} />}</div>{selectedLive && <><div className="record-meta"><div><span>RECORD ID</span><strong>{selectedLive.record_id}</strong></div><div><span>DECISION</span><strong>{selectedLive.decision}</strong></div><div><span>ATTEMPTS</span><strong>{selectedLive.evaluation_attempts}</strong></div></div><div className="source-binding"><div className="binding-label"><Icon name="link" /><span>SOURCE BINDING</span></div><a href={selectedLive.source_url} target="_blank" rel="noreferrer">{selectedLive.source_url} <Icon name="external" /></a><p className="digest">{selectedLive.source_digest}</p></div><div className="review-summary"><span className="panel-kicker">EVALUATION SUMMARY</span><p>{selectedLive.summary}</p>{selectedLive.error_code && <span className="error-code">FAIL-CLOSED · {selectedLive.error_code}</span>}</div><div className="finding-list">{selectedLive.findings.length ? selectedLive.findings.map((finding) => <FindingRow key={finding.category} finding={finding} />) : <div className="unresolved-box"><Icon name="lock" /><div><strong>No findings were accepted.</strong><p>The evaluation is unresolved. Downstream consumers must treat this record as blocked until a new, trustworthy evaluation exists.</p></div></div>}</div><div className="review-actions">{!isDemo && !isTerminal && <button className="primary-button compact" onClick={handleEvaluate} disabled={busy}>{busy ? "Evaluating…" : "Run consensus evaluation"}<Icon name="arrow" /></button>}{isDemo && <span className="example-note">EXAMPLE DATA · not an on-chain proof</span>}{selectedLive.result_fingerprint && <span className="fingerprint">RESULT FINGERPRINT · {selectedLive.result_fingerprint}</span>}</div></>}</div></section>

        <section className="create-section section-grid"><div className="section-intro"><div className="eyebrow">02 / NEW RECORD</div><h2>Put a source<br /><em>behind the firewall.</em></h2><p>Create a bounded record first. The contract then renders the public source and evaluates it through consensus.</p></div><div className="create-panel"><div className="panel-top"><div><span className="panel-kicker">SOURCE INTAKE</span><h3>Register untrusted content</h3></div><span className="lock-label"><Icon name="lock" /> owner gated</span></div><div className="form-grid"><label>Record ID<input value={form.recordId} onChange={(event) => setForm({ ...form, recordId: event.target.value })} placeholder="source-001" /></label><label>Source label<input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Weekly agent source" /></label><label className="wide">Public HTTPS source<input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://example.org/article" /></label><label className="wide">Downstream purpose<textarea value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} rows="3" placeholder="What is the consuming agent allowed to use this source for?" /></label></div><div className="create-footer"><span><Icon name="shield" /> credentials and headers are never accepted</span><button className="primary-button compact" onClick={handleCreate} disabled={isDemo || !client || busy}>{busy ? "Submitting…" : "Create source record"}<Icon name="arrow" /></button></div>{isDemo && <p className="form-hint">Configure <code>VITE_SOURCEFIREWALL_CONTRACT_ADDRESS</code> and connect a Bradbury wallet to submit real records.</p>}</div></section>

        <section id="protocol" className="protocol-section"><div className="section-intro"><div className="eyebrow">03 / PROTOCOL</div><h2>Every path ends<br /><em>in a safe state.</em></h2></div><div className="protocol-grid"><div className="protocol-card"><span className="protocol-step">A</span><h3>Render the source</h3><p>Only bounded public HTTPS sources are accepted. The contract renders text and stores a SHA-256 digest, never the raw body.</p></div><div className="protocol-card"><span className="protocol-step">B</span><h3>Normalize five risks</h3><p>Prompt control, instruction hijacking, secret exfiltration, malicious tool redirection, and unsupported claims become structured findings.</p></div><div className="protocol-card"><span className="protocol-step">C</span><h3>Quarantine ambiguity</h3><p>Validator disagreement, fetch failures, malformed output, or any medium/high finding prevents CLEAR status.</p></div></div></section>

        {(message || error) && <div className={`toast ${error ? "error" : ""}`}>{error || message}{message && !error && !isDemo && selectedLive?.result_fingerprint && <a href={transactionUrl(message.match(/0x[a-fA-F0-9]+/)?.[0])} target="_blank" rel="noreferrer">View transaction <Icon name="external" /></a>}</div>}
      </main>
      <footer><span>SourceFirewall / source trust boundary for AI agents</span><span className="mono">GenLayer · Bradbury · sourcefirewall.v1</span></footer>
    </div>
  );
}

React.createRoot(document.getElementById("root")).render(<App />);
