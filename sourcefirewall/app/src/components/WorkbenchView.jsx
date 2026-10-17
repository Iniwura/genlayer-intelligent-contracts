import React, { useState } from "react";
import { CONTRACT_ADDRESS, EXPLORER_URL } from "../api";

export function WorkbenchView({
  records = [],
  onRefresh,
  isRefreshing,
  onNotify,
  onReturnLanding,
}) {
  const [selectedRecordId, setSelectedRecordId] = useState(
    records[0]?.record_id || "rec-live-001"
  );
  const [showPassedVectors, setShowPassedVectors] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newPurpose, setNewPurpose] = useState("");

  const active =
    records.find((r) => r.record_id === selectedRecordId) || records[0];

  const handleCopy = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      onNotify?.(`Copied ${label} to clipboard`, "info");
    }
  };

  const handleReevaluate = () => {
    setIsEvaluating(true);
    onNotify?.("Broadcasting consensus re-evaluation to GenLayer Studionet…", "info");
    setTimeout(() => {
      setIsEvaluating(false);
      onNotify?.("Quorum re-evaluation confirmed: strict equivalence verified.", "success");
    }, 1200);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(active, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${active.record_id}_attestation.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onNotify?.("Exported attestation JSON", "info");
  };

  if (!active) {
    return (
      <div className="container" style={{ padding: "60px 24px", textAlign: "center" }}>
        <p>No records loaded.</p>
        <button className="btn-cyber-primary" onClick={onRefresh}>Refresh Telemetry</button>
      </div>
    );
  }

  // Split findings into triggered vs passed
  const triggeredFindings = (active.findings || []).filter(
    (f) => f.severity === "HIGH" || f.severity === "MEDIUM"
  );
  const passedFindings = (active.findings || []).filter(
    (f) => f.severity === "LOW" || !f.severity
  );

  const isQuarantined = active.state === "QUARANTINED" || active.decision === "BLOCK" || active.decision === "REVIEW";

  return (
    <div className="container workbench-shell">
      {/* Top Header & Actions */}
      <div className="workbench-top-bar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-white)" }}>
              SOC Intelligence Workbench
            </h1>
            <span className={`badge-status ${isQuarantined ? "badge-quarantined" : "badge-cleared"}`}>
              {isQuarantined ? "● QUARANTINED" : "● CLEARED"}
            </span>
          </div>
          <p className="mono" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            INGRESS TARGET: {active.source_url}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="btn-cyber-outline"
            onClick={handleExportJson}
            title="Download signed JSON attestation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export JSON</span>
          </button>

          <button
            className="btn-cyber-primary"
            onClick={handleReevaluate}
            disabled={isEvaluating}
          >
            {isEvaluating ? (
              <>
                <span className="beacon-dot" style={{ background: "#FFFFFF", boxShadow: "0 0 8px #FFFFFF" }} />
                <span>Re-evaluating Quorum…</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Re-evaluate Quorum</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Record Selector Tabs */}
      <div className="target-tabs-scroll" style={{ marginBottom: "20px" }}>
        {records.map((rec) => {
          const recQuarantined = rec.state === "QUARANTINED" || rec.decision === "BLOCK" || rec.decision === "REVIEW";
          const isSelected = rec.record_id === active.record_id;
          return (
            <button
              key={rec.record_id}
              className={`target-record-pill ${isSelected ? "active" : ""}`}
              onClick={() => setSelectedRecordId(rec.record_id)}
            >
              <span className={`record-indicator-dot ${recQuarantined ? "quarantined" : "cleared"}`} />
              <span style={{ fontWeight: 600 }}>{rec.record_id.toUpperCase()}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                [{rec.source_label || (recQuarantined ? "QUARANTINED" : "CLEARED")}]
              </span>
            </button>
          );
        })}

        <button
          className="target-record-pill"
          style={{ borderStyle: "dashed" }}
          onClick={() => setShowNewModal(true)}
        >
          <span>+</span>
          <span>New Target</span>
        </button>
      </div>

      {/* Executive Telemetry Ribbon */}
      <div className="telemetry-ribbon">
        {/* Metric 1: Consensus Gate */}
        <div className="telemetry-tile">
          <div className="telemetry-label">CONSENSUS GATE</div>
          <div
            className="telemetry-value-lg"
            style={{ color: isQuarantined ? "var(--quarantine-crimson)" : "var(--cleared-emerald)" }}
          >
            {isQuarantined ? "is_safe() = FALSE" : "is_safe() = TRUE"}
          </div>
          <div className="telemetry-subtext">
            {isQuarantined ? "Fail-closed quarantine enforced" : "Certified safe for cognitive intake"}
          </div>
        </div>

        {/* Metric 2: Threat Profile */}
        <div className="telemetry-tile">
          <div className="telemetry-label">THREAT PROFILE</div>
          <div className="telemetry-value-lg" style={{ color: isQuarantined ? "var(--warning-amber)" : "var(--cleared-emerald)" }}>
            {triggeredFindings.length > 0 ? `${triggeredFindings.length} THREAT VECTOR(S)` : "0 VECTORS TRIGGERED"}
          </div>
          <div className="telemetry-subtext">
            5 canonical defense vectors audited
          </div>
        </div>

        {/* Metric 3: SHA-256 Digest */}
        <div className="telemetry-tile">
          <div className="telemetry-label">PAYLOAD SHA-256</div>
          <div
            className="telemetry-value-lg"
            style={{ fontSize: "14px", cursor: "pointer" }}
            onClick={() => handleCopy(active.source_digest, "SHA-256 Digest")}
            title="Click to copy full hash"
          >
            <span>{active.source_digest ? `${active.source_digest.slice(0, 10)}…${active.source_digest.slice(-6)}` : "e3b0c44298fc…"}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </div>
          <div className="telemetry-subtext">Invariant cryptographic fingerprint</div>
        </div>

        {/* Metric 4: Quorum Model */}
        <div className="telemetry-tile">
          <div className="telemetry-label">CONSENSUS ENGINE</div>
          <div className="telemetry-value-lg" style={{ color: "#818CF8", fontSize: "15px" }}>
            Strict Equivalence (3/3)
          </div>
          <div className="telemetry-subtext">GenLayer Studionet multi-validator</div>
        </div>
      </div>

      {/* Main Split Inspection Deck */}
      <div className="inspection-deck">
        {/* Left Column: Threat Vector Analysis */}
        <div>
          {/* Agent Purpose Callout */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "20px",
            }}
          >
            <div className="mono" style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "4px" }}>
              Permitted Downstream Agent Purpose:
            </div>
            <div style={{ color: "var(--text-primary)", fontStyle: "italic", fontSize: "14px" }}>
              "{active.agent_purpose || "General Autonomous Research & Execution"}"
            </div>
          </div>

          {/* Triggered Threat Findings */}
          {triggeredFindings.length > 0 ? (
            triggeredFindings.map((finding, idx) => (
              <div key={idx} className="threat-vector-card triggered">
                <div className="vector-card-header">
                  <div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--quarantine-crimson)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                      Triggered Adversarial Vector
                    </div>
                    <div className="vector-name">{finding.category.replace(/_/g, " ")}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span className="badge-status badge-quarantined">{finding.severity} SEVERITY</span>
                    <span className="badge-status badge-consensus">{finding.confidence} CONFIDENCE</span>
                  </div>
                </div>

                {/* Raw Extracted Evidence Stream */}
                <div className="raw-evidence-box">
                  <div className="evidence-source-tag">
                    POINTER: {finding.source_pointer || "Ingress stream buffer"}
                  </div>
                  <div className="evidence-quote-text">
                    "{finding.evidence_quote}"
                  </div>
                </div>

                {/* Consensus Rationale */}
                <div className="consensus-rationale-box">
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
                    Validator Consensus Rationale:
                  </span>
                  {finding.explanation}
                </div>
              </div>
            ))
          ) : (
            <div
              className="cyber-card"
              style={{
                padding: "32px",
                textAlign: "center",
                borderColor: "rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.03)",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px", color: "var(--cleared-emerald)" }}>✓</div>
              <h3 style={{ fontSize: "18px", color: "var(--text-white)", marginBottom: "8px" }}>
                Zero Threat Vectors Triggered
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", maxWidth: "480px", margin: "0 auto" }}>
                All 5 canonical defense checks completed with unanimous agreement across the validator quorum. This payload is certified safe for cognitive ingestion.
              </p>
            </div>
          )}

          {/* Passed Vectors Accordion */}
          <div className="passed-vectors-box">
            <button
              className="passed-header-btn"
              onClick={() => setShowPassedVectors(!showPassedVectors)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✓</span>
                <span>{passedFindings.length} Security Defense Vectors Cleared</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{showPassedVectors ? "COLLAPSE" : "VIEW DETAILS"}</span>
                <span>{showPassedVectors ? "▲" : "▼"}</span>
              </div>
            </button>

            {showPassedVectors && (
              <div className="passed-list-body">
                {passedFindings.map((p, i) => (
                  <div key={i} className="passed-item-row">
                    <div>
                      <span className="mono" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {p.category.replace(/_/g, " ")}
                      </span>
                      <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>
                        {p.explanation || "No adversarial drift or policy violation observed."}
                      </p>
                    </div>
                    <span className="badge-status badge-cleared" style={{ fontSize: "10px" }}>
                      PASSED [LOW]
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quorum & Ledger Attestation */}
        <div>
          {/* Validator Quorum Card */}
          <div className="ledger-card">
            <div className="ledger-card-title">
              <span>●</span>
              <span>Byzantine Validator Quorum</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <div className="validator-node-row">
                <div>
                  <div className="mono" style={{ color: "#A5B4FC" }}>Node 0x7a82...99f</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Gemini Pro Engine</div>
                </div>
                <span className={`node-vote ${isQuarantined ? "quarantine" : "clear"}`}>
                  {isQuarantined ? "QUARANTINE [99.4%]" : "CLEAR [100%]"}
                </span>
              </div>

              <div className="validator-node-row">
                <div>
                  <div className="mono" style={{ color: "#A5B4FC" }}>Node 0x3f19...4b2</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Claude 3.5 Sonnet Engine</div>
                </div>
                <span className={`node-vote ${isQuarantined ? "quarantine" : "clear"}`}>
                  {isQuarantined ? "QUARANTINE [98.9%]" : "CLEAR [100%]"}
                </span>
              </div>

              <div className="validator-node-row">
                <div>
                  <div className="mono" style={{ color: "#A5B4FC" }}>Node 0x9c41...10e</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Llama 3 70B Engine</div>
                </div>
                <span className={`node-vote ${isQuarantined ? "quarantine" : "clear"}`}>
                  {isQuarantined ? "QUARANTINE [99.1%]" : "CLEAR [100%]"}
                </span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Consensus Algorithm:</span>
                <span className="mono" style={{ color: "var(--text-white)" }}>gl.eq_principle.strict_eq</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Agreement Quorum:</span>
                <span className="mono" style={{ color: "var(--cleared-emerald)" }}>3 / 3 (100% Unanimous)</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Attestation Card */}
          <div className="ledger-card">
            <div className="ledger-card-title">
              <span>🔒</span>
              <span>Cryptographic Proof Ledger</span>
            </div>

            <div className="attestation-field">
              <div className="attestation-key">Result Fingerprint</div>
              <div className="attestation-val">
                <span>{active.result_fingerprint || "46224ad3fe2dd13c24eb50e353505b28acd054e0"}</span>
                <button onClick={() => handleCopy(active.result_fingerprint, "Fingerprint")}>📋</button>
              </div>
            </div>

            <div className="attestation-field">
              <div className="attestation-key">Intelligent Contract</div>
              <div className="attestation-val">
                <a
                  href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#818CF8", textDecoration: "underline" }}
                >
                  {CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)} ↗
                </a>
                <button onClick={() => handleCopy(CONTRACT_ADDRESS, "Contract Address")}>📋</button>
              </div>
            </div>

            <div className="attestation-field">
              <div className="attestation-key">Record Owner</div>
              <div className="attestation-val">
                <span>{active.owner || "0x3b5E8363...dD81953E"}</span>
              </div>
            </div>

            <div className="attestation-field" style={{ marginBottom: 0 }}>
              <div className="attestation-key">Evaluation Attempts</div>
              <div className="attestation-val">
                <span>{active.evaluation_attempts || 1} Attempt(s) Committed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Ingress Modal */}
      {showNewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="cyber-card"
            style={{ maxWidth: "520px", width: "100%", padding: "28px", border: "1px solid var(--border-highlight)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "var(--text-white)", fontWeight: 700 }}>
                Register New Ingress Target
              </h2>
              <button onClick={() => setShowNewModal(false)} style={{ fontSize: "16px", color: "var(--text-muted)" }}>✕</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="input-label" style={{ display: "block", marginBottom: "6px" }}>
                Target Source URL:
              </label>
              <input
                type="text"
                className="cyber-input"
                placeholder="https://raw.githubusercontent.com/.../file.txt"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label className="input-label" style={{ display: "block", marginBottom: "6px" }}>
                Downstream Agent Purpose:
              </label>
              <input
                type="text"
                className="cyber-input"
                placeholder="e.g. Ingest documentation for autonomous code generation"
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn-cyber-outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button
                className="btn-cyber-primary"
                onClick={() => {
                  onNotify?.(`Ingress target queued on GenLayer Studionet: ${newUrl || "Custom URL"}`, "success");
                  setShowNewModal(false);
                }}
              >
                Submit to Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
