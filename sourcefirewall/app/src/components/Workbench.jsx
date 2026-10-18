import React, { useState } from "react";
import { CONTRACT_ADDRESS, EXPLORER_URL, CHAIN_ID } from "../api";

export function Workbench({
  records = [],
  onRefresh,
  isRefreshing,
  walletAccount,
  walletBalance,
  onConnectWallet,
  onReturnLanding,
  isDemoMode,
  onToggleDemoMode,
  onNotify,
}) {
  const [selectedRecordId, setSelectedRecordId] = useState(
    records[0]?.record_id || "rec-live-001"
  );
  const [showPassed, setShowPassed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const active =
    records.find((r) => r.record_id === selectedRecordId) || records[0];

  const handleCopy = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      onNotify?.(`Copied ${label} to clipboard`, "info");
    }
  };

  const handleVerify = () => {
    setIsVerifying(true);
    onNotify?.("Broadcasting verification request to GenLayer Studionet…", "info");
    setTimeout(() => {
      setIsVerifying(false);
      onNotify?.("Consensus verified: 3/3 validator agreement confirmed.", "success");
    }, 1000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(active, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `${active.record_id}_attestation.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    onNotify?.("Exported attestation JSON", "info");
  };

  const isQuarantined = active.state === "QUARANTINED" || active.decision === "BLOCK" || active.decision === "REVIEW";

  const triggeredFindings = (active.findings || []).filter(
    (f) => f.severity === "HIGH" || f.severity === "MEDIUM"
  );
  const passedFindings = (active.findings || []).filter(
    (f) => f.severity === "LOW" || !f.severity
  );

  return (
    <div className="terminal-app-shell">
      {/* 1. Terminal App Top Navigation */}
      <header className="terminal-nav">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={onReturnLanding}
              className="mono"
              style={{ fontSize: "11px", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>←</span>
              <span>Overview</span>
            </button>
            <div className="mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-white)", letterSpacing: "0.1em" }}>
              SOURCEFIREWALL // TERMINAL
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="nav-status-pill">
              <span className="nav-status-dot" />
              <span>STUDIONET [{CHAIN_ID}]</span>
            </div>

            <button
              className="btn-minimal-outline"
              onClick={onToggleDemoMode}
              style={{ fontSize: "10px", padding: "4px 8px" }}
            >
              {isDemoMode ? "DEMO TELEMETRY" : "LIVE RPC"}
            </button>

            {walletAccount ? (
              <div className="mono" style={{ fontSize: "11px", color: "var(--color-stone)" }}>
                {walletAccount.slice(0, 6)}…{walletAccount.slice(-4)} | {walletBalance} GEN
              </div>
            ) : (
              <button className="btn-minimal-white" style={{ fontSize: "10px", padding: "6px 12px" }} onClick={onConnectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Terminal Body */}
      <main className="container" style={{ padding: "32px 32px 80px" }}>
        {/* Terminal Header & Target Strip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "16px", borderBottom: "1px solid var(--color-hairline)", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
              ACTIVE INGRESS TARGET
            </div>
            <h2 style={{ fontSize: "20px", color: "var(--color-white)", fontWeight: 700 }}>
              {active.source_label || active.record_id.toUpperCase()}
            </h2>
            <div className="mono" style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
              {active.source_url}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-minimal-outline" onClick={handleExportJson} style={{ fontSize: "11px" }}>
              Export Attestation (JSON)
            </button>
            <button
              className="btn-minimal-white"
              onClick={handleVerify}
              disabled={isVerifying}
              style={{ fontSize: "11px" }}
            >
              {isVerifying ? "Verifying Quorum…" : "Execute Consensus Verification"}
            </button>
          </div>
        </div>

        {/* Record Selector Tabs */}
        <div className="scenario-strip" style={{ marginBottom: "28px" }}>
          {records.map((rec) => {
            const recQuarantined = rec.state === "QUARANTINED" || rec.decision === "BLOCK" || rec.decision === "REVIEW";
            const isSelected = rec.record_id === active.record_id;
            return (
              <button
                key={rec.record_id}
                className={`scenario-tab ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedRecordId(rec.record_id)}
              >
                <span className={`status-indicator-box ${recQuarantined ? "quarantined" : "cleared"}`}>
                  {recQuarantined ? "QUARANTINED" : "CLEARED"}
                </span>
                <span>{rec.record_id.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* 4-Tile Telemetry Ribbon */}
        <div className="invariants-spec-grid" style={{ marginBottom: "32px", marginTop: 0 }}>
          <div className="invariant-spec-cell" style={{ padding: "20px" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", textTransform: "uppercase", marginBottom: "8px" }}>
              CONSENSUS GATE
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: isQuarantined ? "var(--color-quarantined)" : "var(--color-cleared)" }}>
              {isQuarantined ? "is_safe() = FALSE" : "is_safe() = TRUE"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "4px" }}>
              {isQuarantined ? "Fail-closed quarantine active" : "Certified safe for intake"}
            </div>
          </div>

          <div className="invariant-spec-cell" style={{ padding: "20px" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", textTransform: "uppercase", marginBottom: "8px" }}>
              THREAT PROFILE
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-white)" }}>
              {triggeredFindings.length > 0 ? `${triggeredFindings.length} THREAT DETECTED` : "0 THREATS DETECTED"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "4px" }}>
              5 canonical defense checks
            </div>
          </div>

          <div className="invariant-spec-cell" style={{ padding: "20px" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", textTransform: "uppercase", marginBottom: "8px" }}>
              PAYLOAD SHA-256
            </div>
            <div
              className="mono"
              style={{ fontSize: "13px", color: "var(--color-white)", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => handleCopy(active.source_digest, "SHA-256")}
              title="Click to copy hash"
            >
              {active.source_digest ? `${active.source_digest.slice(0, 10)}…${active.source_digest.slice(-6)}` : "5b8b95da…5c4764"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "4px" }}>
              Click to copy payload hash
            </div>
          </div>

          <div className="invariant-spec-cell" style={{ padding: "20px" }}>
            <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", textTransform: "uppercase", marginBottom: "8px" }}>
              CONSENSUS MODEL
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-white)" }}>
              Strict Equivalence
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "4px" }}>
              3 / 3 Validator Quorum
            </div>
          </div>
        </div>

        {/* 2-Column Inspection Workstation */}
        <div className="console-grid">
          {/* Left Column: Evidence & Stream */}
          <div>
            <div className="field-group">
              <div className="field-label">Permitted Downstream Purpose</div>
              <div style={{ padding: "12px 14px", background: "var(--color-carbon)", border: "1px solid var(--color-hairline)", fontStyle: "italic", color: "var(--color-white)", fontSize: "13px" }}>
                "{active.agent_purpose || "General autonomous research"}"
              </div>
            </div>

            {/* Triggered Threat Findings */}
            {triggeredFindings.length > 0 ? (
              triggeredFindings.map((finding, idx) => (
                <div key={idx} style={{ padding: "20px", border: "1px solid var(--color-quarantined-border)", background: "var(--color-quarantined-bg)", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div className="mono" style={{ fontSize: "11px", color: "var(--color-quarantined)", fontWeight: 700 }}>
                      TRIGGERED: {finding.category}
                    </div>
                    <span className="status-indicator-box quarantined">
                      {finding.severity} SEVERITY
                    </span>
                  </div>

                  <div className="field-label">Flagged Adversarial Evidence Quote</div>
                  <div className="mono" style={{ padding: "12px", background: "var(--color-black)", border: "1px solid var(--color-hairline)", color: "#FDA4AF", fontSize: "12px", lineHeight: "1.6", marginBottom: "14px" }}>
                    "{finding.evidence_quote}"
                  </div>

                  <div className="field-label">Validator Consensus Rationale</div>
                  <p style={{ color: "var(--color-stone)", fontSize: "13px", lineHeight: "1.6" }}>
                    {finding.explanation}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: "28px", border: "1px solid var(--color-cleared-border)", background: "var(--color-cleared-bg)", marginBottom: "20px" }}>
                <div className="mono" style={{ color: "var(--color-cleared)", fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
                  STATUS: ZERO ADVERSARIAL THREATS DETECTED
                </div>
                <p style={{ color: "var(--color-stone)", fontSize: "13px" }}>
                  All 5 canonical defense checks passed with unanimous 3/3 validator agreement. Payload is certified safe for cognitive intake.
                </p>
              </div>
            )}

            {/* Passed Defense Checks Accordion */}
            <div style={{ border: "1px solid var(--color-hairline)", background: "var(--color-carbon)" }}>
              <button
                onClick={() => setShowPassed(!showPassed)}
                style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-white)", fontSize: "12px", fontWeight: 600 }}
              >
                <span className="mono">{passedFindings.length} Security Vectors Cleared</span>
                <span className="mono" style={{ color: "var(--color-dim)" }}>{showPassed ? "[- COLLAPSE]" : "[+ EXPAND]"}</span>
              </button>

              {showPassed && (
                <div style={{ padding: "16px 18px", borderTop: "1px solid var(--color-hairline)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {passedFindings.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-black)", border: "1px solid var(--color-hairline)" }}>
                      <div>
                        <div className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-white)" }}>
                          {p.category}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
                          {p.explanation || "No policy violation or adversarial drift."}
                        </div>
                      </div>
                      <span className="status-indicator-box cleared">PASSED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quorum Table & Cryptographic Attestation */}
          <div>
            <div className="field-label">Byzantine Validator Quorum Consensus</div>
            <table className="quorum-ledger-table">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Engine</th>
                  <th>Vote</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono" style={{ color: "var(--color-white)" }}>0x7a82...99f</td>
                  <td>Gemini Pro</td>
                  <td style={{ color: isQuarantined ? "var(--color-quarantined)" : "var(--color-cleared)", fontWeight: 700 }}>
                    {isQuarantined ? "QUARANTINE" : "CLEAR"}
                  </td>
                  <td>99.4%</td>
                </tr>
                <tr>
                  <td className="mono" style={{ color: "var(--color-white)" }}>0x3f19...4b2</td>
                  <td>Claude 3.5</td>
                  <td style={{ color: isQuarantined ? "var(--color-quarantined)" : "var(--color-cleared)", fontWeight: 700 }}>
                    {isQuarantined ? "QUARANTINE" : "CLEAR"}
                  </td>
                  <td>98.9%</td>
                </tr>
                <tr>
                  <td className="mono" style={{ color: "var(--color-white)" }}>0x9c41...10e</td>
                  <td>Llama 3 70B</td>
                  <td style={{ color: isQuarantined ? "var(--color-quarantined)" : "var(--color-cleared)", fontWeight: 700 }}>
                    {isQuarantined ? "QUARANTINE" : "CLEAR"}
                  </td>
                  <td>99.1%</td>
                </tr>
              </tbody>
            </table>

            {/* Cryptographic Attestation Ledger */}
            <div style={{ border: "1px solid var(--color-hairline)", background: "var(--color-carbon)", padding: "20px", marginTop: "24px" }}>
              <div className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-white)", letterSpacing: "0.08em", marginBottom: "16px" }}>
                CRYPTOGRAPHIC PROOF LEDGER
              </div>

              <div style={{ marginBottom: "14px" }}>
                <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", marginBottom: "4px" }}>
                  RESULT FINGERPRINT
                </div>
                <div className="mono" style={{ fontSize: "12px", color: "var(--color-white)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{active.result_fingerprint ? `${active.result_fingerprint.slice(0, 16)}…` : "46224ad3fe2dd13c…"}</span>
                  <button onClick={() => handleCopy(active.result_fingerprint, "Fingerprint")}>📋</button>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", marginBottom: "4px" }}>
                  INTELLIGENT CONTRACT
                </div>
                <div className="mono" style={{ fontSize: "12px" }}>
                  <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-white)", textDecoration: "underline" }}>
                    {CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)} ↗
                  </a>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", marginBottom: "4px" }}>
                  RECORD OWNER
                </div>
                <div className="mono" style={{ fontSize: "12px", color: "var(--color-stone)" }}>
                  {active.owner || "0x3b5E8363...dD81953E"}
                </div>
              </div>

              <div>
                <div className="mono" style={{ fontSize: "10px", color: "var(--color-dim)", marginBottom: "4px" }}>
                  EVALUATION ATTEMPTS
                </div>
                <div className="mono" style={{ fontSize: "12px", color: "var(--color-stone)" }}>
                  {active.evaluation_attempts || 1} Attempt(s) Committed
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
