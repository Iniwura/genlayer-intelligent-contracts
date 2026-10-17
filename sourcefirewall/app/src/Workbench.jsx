import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Wallet,
  ArrowLeft,
  X,
  ArrowUpRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  FileText,
  Activity,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  CHAIN_ID,
  CHAIN_NAME,
  contractUrl,
  writeSourceFirewall,
  errorText,
} from "./api";

const CATEGORY_META = {
  PROMPT_INJECTION: { label: "Prompt Injection", icon: ShieldAlert },
  INSTRUCTION_HIJACKING: { label: "Instruction Hijacking", icon: Lock },
  SECRET_EXFILTRATION: { label: "Secret Exfiltration", icon: AlertTriangle },
  MALICIOUS_TOOL_REDIRECTION: { label: "Tool Redirection", icon: Terminal },
  UNSUPPORTED_CLAIM: { label: "Unsupported Claim", icon: FileText },
};

export function Workbench({
  records,
  onRefresh,
  isRefreshing,
  walletAccount,
  walletBalance,
  writeClient,
  onConnectWallet,
  onReturnLanding,
  isDemoMode,
  onToggleDemoMode,
  onNotify,
}) {
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.record_id || "");
  const [showSafeVectors, setShowSafeVectors] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatingRecordId, setEvaluatingRecordId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // Create Target Form State
  const [newRecordForm, setNewRecordForm] = useState({
    recordId: `rec_target_${Math.floor(Math.random() * 9000 + 1000)}`,
    label: "Untrusted Research Paper",
    url: "https://raw.githubusercontent.com/Iniwura/semantic-breach-registry/main/README.md",
    purpose: "Analyze technical claims and extract CVE mappings for security assistant.",
  });
  const [urlError, setUrlError] = useState("");

  // Active Selected Record
  const activeRecord = useMemo(() => {
    return (
      records.find((r) => r.record_id === selectedRecordId) ||
      records[0] ||
      null
    );
  }, [records, selectedRecordId]);

  // Threat Breakdown for Active Record
  const threatCounts = useMemo(() => {
    if (!activeRecord || !activeRecord.findings) return { high: 0, medium: 0, low: 0 };
    return {
      high: activeRecord.findings.filter((f) => f.severity === "HIGH").length,
      medium: activeRecord.findings.filter((f) => f.severity === "MEDIUM").length,
      low: activeRecord.findings.filter((f) => f.severity === "LOW").length,
    };
  }, [activeRecord]);

  // Progressive Disclosure: Separate triggered threats from safe/cleared vectors
  const { triggeredFindings, safeFindings } = useMemo(() => {
    if (!activeRecord || !activeRecord.findings) {
      return { triggeredFindings: [], safeFindings: [] };
    }
    const triggered = activeRecord.findings.filter(
      (f) => f.severity === "HIGH" || f.severity === "MEDIUM"
    );
    const safe = activeRecord.findings.filter((f) => f.severity === "LOW");
    return { triggeredFindings: triggered, safeFindings: safe };
  }, [activeRecord]);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleUrlChange = (value) => {
    setNewRecordForm((prev) => ({ ...prev, url: value }));
    if (!value.startsWith("https://")) {
      setUrlError("HTTPS protocol required.");
    } else {
      setUrlError("");
    }
  };

  const getDomain = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return url.split("/")[2] || url;
    }
  };

  // Format tab label following Design System rules (e.g., REC_8992 [QUARANTINED])
  const formatTabLabel = (id) => {
    return id.toUpperCase().replace(/DEMO-|REC-/, "REC_").replace(/-/g, "_");
  };

  // Execute Evaluation on GenLayer Studionet
  const handleEvaluate = async (recordId) => {
    if (!writeClient) {
      onNotify("Connect a browser wallet on GenLayer Studionet to execute evaluation.", "error");
      return;
    }
    setIsEvaluating(true);
    setEvaluatingRecordId(recordId);
    onNotify(`Broadcasting evaluate_record('${recordId}')…`, "info");

    try {
      const result = await writeSourceFirewall(
        writeClient,
        "evaluate_record",
        [recordId],
        (txHash) => {
          onNotify(`Consensus broadcast: ${txHash.slice(0, 10)}… Awaiting validator agreement…`, "info");
        }
      );
      onNotify(`Consensus accepted: ${result.hash.slice(0, 10)}…`, "success");
      await onRefresh();
    } catch (err) {
      onNotify(errorText(err), "error");
    } finally {
      setIsEvaluating(false);
      setEvaluatingRecordId("");
    }
  };

  // Submit New Ingress Target
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (urlError || !newRecordForm.url.startsWith("https://")) {
      setUrlError("Valid HTTPS URL required.");
      return;
    }
    if (!newRecordForm.recordId.trim()) {
      onNotify("Record ID required.", "error");
      return;
    }

    if (!writeClient) {
      onNotify("Connect a browser wallet to create on-chain record.", "error");
      return;
    }

    setIsSubmittingRecord(true);
    onNotify(`Submitting create_record('${newRecordForm.recordId}')…`, "info");

    try {
      const result = await writeSourceFirewall(
        writeClient,
        "create_record",
        [
          newRecordForm.recordId.trim(),
          newRecordForm.url.trim(),
          newRecordForm.label.trim(),
          newRecordForm.purpose.trim(),
        ],
        (txHash) => {
          onNotify(`Record creation broadcast: ${txHash.slice(0, 10)}…`, "info");
        }
      );
      onNotify(`Record created on-chain: ${result.hash.slice(0, 10)}…`, "success");
      setShowCreateModal(false);
      setSelectedRecordId(newRecordForm.recordId.trim());
      await onRefresh();
    } catch (err) {
      onNotify(errorText(err), "error");
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  return (
    <div className="workbench-shell">
      {/* 1. OPERATIONAL STUDIO HEADER */}
      <header
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(16px, 3vw, 36px)",
          borderBottom: "1px solid #1C1C1F",
          backgroundColor: "#09090B",
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Return & Identification */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <button
            onClick={onReturnLanding}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-stone)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s ease",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={13} />
            <span className="header-btn-prefix">OVERVIEW</span>
          </button>
          <span className="header-overview-slash" style={{ color: "#2B2B30" }}>/</span>
          <span
            className="serif-font"
            style={{
              fontSize: "19px",
              color: "var(--text-ivory)",
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            SourceFirewall
          </span>
          <span className="meta-label header-edition-tag" style={{ fontSize: "10px", color: "var(--text-meta)" }}>
            [STUDIO WORKBENCH]
          </span>
        </div>

        {/* Right: Telemetry Controls & Wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div
            className="header-status-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "9999px",
              border: "1px solid #1C1C1F",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#F4F1EA" }} />
            <span className="meta-label" style={{ fontSize: "10px", color: "var(--text-stone)" }}>
              {CHAIN_NAME} [61999]
            </span>
          </div>

          <button
            onClick={onToggleDemoMode}
            className="header-demo-toggle"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "4px 10px",
              border: "1px solid #222225",
              color: isDemoMode ? "var(--status-amber-text)" : "var(--text-meta)",
              borderRadius: "2px",
              backgroundColor: isDemoMode ? "rgba(212, 149, 106, 0.06)" : "transparent",
              transition: "all 0.15s ease",
            }}
          >
            {isDemoMode ? "SAMPLE MODE" : "LIVE MODE"}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ color: "var(--text-stone)", padding: "4px", display: "flex", alignItems: "center" }}
            title="Refresh Ledger Telemetry"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          </button>

          {walletAccount ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-ivory)",
                padding: "6px 12px",
                border: "1px solid #222225",
                borderRadius: "2px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--bg-sunken)",
              }}
            >
              <span>{walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}</span>
              <span style={{ color: "#333338" }}>/</span>
              <span style={{ color: "var(--text-stone)" }}>{walletBalance} GEN</span>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-ivory"
              style={{ fontSize: "12px", padding: "6px 14px", whiteSpace: "nowrap" }}
            >
              <Wallet size={12} />
              <span className="header-btn-prefix">Connect </span>Wallet
            </button>
          )}
        </div>
      </header>

      {/* 2. CENTERED SINGLE-COLUMN WORKSPACE (docs/DESIGN.md compliant) */}
      <main className="workbench-workspace">
        {/* SLEEK HORIZONTAL TARGET BAR */}
        <div className="record-tabs-bar">
          <div className="record-tabs-list">
            {records.map((r) => {
              const isSelected = r.record_id === activeRecord?.record_id;
              const formattedLabel = formatTabLabel(r.record_id);
              const statusColor =
                r.state === "CLEARED"
                  ? "var(--text-ivory)"
                  : r.state === "QUARANTINED"
                  ? "#c25e4a"
                  : "var(--status-amber-text)";

              return (
                <button
                  key={r.record_id}
                  onClick={() => {
                    setSelectedRecordId(r.record_id);
                    setShowSafeVectors(false);
                  }}
                  className={`record-tab ${isSelected ? "active" : ""}`}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: statusColor,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: isSelected ? 500 : 400 }}>
                    {formattedLabel}
                  </span>
                  <span
                    className={`status-tag ${r.state.toLowerCase()}`}
                    style={{ fontSize: "9px", padding: "2px 6px" }}
                  >
                    [{r.state}]
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="record-new-btn"
          >
            <Plus size={12} />
            <span>NEW TARGET</span>
          </button>
        </div>

        {activeRecord ? (
          <div>
            {/* DOSSIER HEADER (Editorial Minimal) */}
            <div style={{ paddingBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                }}
              >
                <div className="meta-label" style={{ fontSize: "10px" }}>
                  INGRESS TARGET // {activeRecord.record_id}
                </div>

                <span
                  className={`status-tag ${activeRecord.state.toLowerCase()}`}
                  style={{ fontSize: "10px", padding: "3px 8px" }}
                >
                  [{activeRecord.state}]
                </span>
              </div>

              <h1
                className="serif-font"
                style={{
                  fontSize: "clamp(26px, 5.5vw, 44px)",
                  color: "var(--text-ivory)",
                  margin: "0 0 12px 0",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  wordBreak: "break-word",
                  fontStyle: "italic",
                }}
              >
                {activeRecord.source_label}
              </h1>

              <div
                className="mono"
                style={{
                  fontSize: "12px",
                  color: "var(--text-stone)",
                  marginBottom: "16px",
                  wordBreak: "break-all",
                }}
              >
                {activeRecord.source_url}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
                <a
                  href={activeRecord.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-stone)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Source Document <ExternalLink size={11} />
                </a>

                <button
                  onClick={() => copyToClipboard(activeRecord.record_id, "recId")}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: copiedField === "recId" ? "var(--text-ivory)" : "var(--text-dim)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {copiedField === "recId" ? <Check size={12} /> : <Copy size={12} />}
                  Copy ID
                </button>

                <a
                  href={contractUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Contract <ArrowUpRight size={11} />
                </a>
              </div>
            </div>

            {/* STAGE 2: FLATTENED 4-KPI TELEMETRY (No heavy boxes, pure typography & alignment) */}
            <div className="telemetry-flat-grid">
              {/* Tile 1: Consensus Verdict */}
              <div className="telemetry-flat-item">
                <div className="meta-label" style={{ fontSize: "9px" }}>
                  CONSENSUS GATE
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color:
                      activeRecord.state === "CLEARED"
                        ? "var(--text-ivory)"
                        : activeRecord.state === "QUARANTINED"
                        ? "#c25e4a"
                        : "var(--status-amber-text)",
                  }}
                >
                  {activeRecord.state === "CLEARED"
                    ? "is_safe() = TRUE"
                    : activeRecord.state === "QUARANTINED"
                    ? "is_safe() = FALSE"
                    : "PENDING"}
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                  {activeRecord.state === "CLEARED"
                    ? "Cleared for intake"
                    : activeRecord.state === "QUARANTINED"
                    ? "Fail-closed quarantine"
                    : "Awaiting execution"}
                </div>
              </div>

              {/* Tile 2: Threat Profile */}
              <div className="telemetry-flat-item">
                <div className="meta-label" style={{ fontSize: "9px" }}>
                  THREAT PROFILE
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color:
                      threatCounts.high > 0
                        ? "#c25e4a"
                        : threatCounts.medium > 0
                        ? "var(--status-amber-text)"
                        : "var(--text-ivory)",
                  }}
                >
                  {threatCounts.high > 0
                    ? `${threatCounts.high} HIGH THREAT${threatCounts.high > 1 ? "S" : ""}`
                    : threatCounts.medium > 0
                    ? `${threatCounts.medium} WARNING`
                    : "0 DETECTED"}
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                  5 canonical vectors evaluated
                </div>
              </div>

              {/* Tile 3: Payload Digest */}
              <div className="telemetry-flat-item">
                <div className="meta-label" style={{ fontSize: "9px" }}>
                  SHA-256 DIGEST
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: "14px",
                      color: "var(--text-ivory)",
                      wordBreak: "break-all",
                    }}
                  >
                    {activeRecord.source_digest
                      ? `${activeRecord.source_digest.slice(0, 12)}…`
                      : "Pending"}
                  </div>
                  {activeRecord.source_digest && (
                    <button
                      onClick={() => copyToClipboard(activeRecord.source_digest, "digest")}
                      style={{
                        color: copiedField === "digest" ? "var(--text-ivory)" : "var(--text-dim)",
                      }}
                      title="Copy SHA-256 Digest"
                    >
                      {copiedField === "digest" ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                  Invariant payload hash
                </div>
              </div>

              {/* Tile 4: Quorum Consensus */}
              <div className="telemetry-flat-item">
                <div className="meta-label" style={{ fontSize: "9px" }}>
                  QUORUM MODEL
                </div>
                <div
                  className="mono"
                  style={{ fontSize: "15px", color: "var(--text-ivory)", fontWeight: 500 }}
                >
                  Strict Equivalence
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                  GenLayer Studionet
                </div>
              </div>
            </div>

            {/* ACTION CALLOUT IF PENDING SUBMISSION */}
            {activeRecord.state === "SUBMITTED" && (
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: "2px",
                  border: "1px solid var(--status-amber-border)",
                  backgroundColor: "var(--status-amber-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginBottom: "36px",
                }}
              >
                <div>
                  <div
                    className="meta-label"
                    style={{
                      color: "var(--status-amber-text)",
                      fontSize: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    INGRESS RECORD COMMITTED TO ON-CHAIN LEDGER
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-ivory)", fontFamily: "var(--font-sans)" }}>
                    Awaiting validator consensus evaluation. Run evaluate_record() to execute 5-point adversarial analysis.
                  </div>
                </div>

                <button
                  onClick={() => handleEvaluate(activeRecord.record_id)}
                  disabled={isEvaluating}
                  className="btn-ivory"
                  style={{ fontSize: "12px", padding: "8px 20px" }}
                >
                  {isEvaluating && evaluatingRecordId === activeRecord.record_id ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Executing Consensus…
                    </>
                  ) : (
                    <>Execute Consensus Evaluation</>
                  )}
                </button>
              </div>
            )}

            {/* PERMITTED AGENT PURPOSE (Clean unboxed reading statement) */}
            <div
              style={{
                marginBottom: "36px",
                paddingBottom: "24px",
                borderBottom: "1px solid #1C1C1F",
              }}
            >
              <div className="meta-label" style={{ fontSize: "10px", marginBottom: "8px" }}>
                DOWNSTREAM PERMITTED AGENT PURPOSE
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--text-stone)",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 300,
                }}
              >
                “{activeRecord.agent_purpose || "General read-only research assistant."}”
              </div>
            </div>

            {/* STAGE 2: PROGRESSIVE DISCLOSURE FOR THREAT FINDINGS */}
            <div style={{ marginBottom: "48px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <span className="meta-label" style={{ fontSize: "10px" }}>
                  SECURITY VECTOR EVALUATION
                </span>
                <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                  {activeRecord.findings.length} TOTAL VECTORS INSPECTED
                </span>
              </div>

              {activeRecord.findings.length === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    border: "1px dashed #222225",
                    borderRadius: "2px",
                    color: "var(--text-dim)",
                    fontSize: "13px",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  No threat vector findings recorded yet. Execute consensus evaluation to generate verified evidence.
                </div>
              ) : triggeredFindings.length > 0 ? (
                /* A. THREAT/QUARANTINED RECORD: PROMINENT TRIGGERED VECTORS + COLLAPSED SAFE STATE */
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Prominent Triggered Vectors */}
                  {triggeredFindings.map((f, i) => {
                    const meta = CATEGORY_META[f.category] || { label: f.category, icon: Shield };
                    const IconComp = meta.icon;
                    const isHigh = f.severity === "HIGH";

                    return (
                      <div
                        key={i}
                        style={{
                          paddingBottom: "24px",
                          borderBottom: "1px solid #1C1C1F",
                        }}
                      >
                        {/* Finding Header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <IconComp
                              size={16}
                              color={isHigh ? "#c25e4a" : "var(--status-amber-text)"}
                            />
                            <span
                              style={{
                                fontSize: "15px",
                                color: "var(--text-ivory)",
                                fontWeight: 500,
                              }}
                            >
                              {meta.label}
                            </span>
                            <span
                              className={`badge-severity ${f.severity.toLowerCase()}`}
                              style={isHigh ? { color: "#c25e4a", borderColor: "rgba(194, 94, 74, 0.3)" } : {}}
                            >
                              {f.severity} THREAT
                            </span>
                          </div>

                          <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                            CONFIDENCE: {f.confidence}
                          </div>
                        </div>

                        {/* Raw Ingress Material (Prominently displayed) */}
                        {f.evidence_quote && (
                          <div
                            className={`raw-evidence-box ${isHigh ? "quarantined" : "cleared"}`}
                            style={isHigh ? { borderLeftColor: "#c25e4a" } : {}}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "6px",
                              }}
                            >
                              <span
                                className="meta-label"
                                style={{
                                  fontSize: "9px",
                                  color: isHigh ? "#c25e4a" : "var(--text-meta)",
                                }}
                              >
                                RAW INGRESS EXCERPT // EXTRACTED FROM UNTRUSTED SOURCE
                              </span>
                              {f.source_pointer && (
                                <span className="mono" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                                  {f.source_pointer}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-ivory)" }}>
                              “{f.evidence_quote}”
                            </div>
                          </div>
                        )}

                        {/* Validator Consensus Rationale */}
                        <div style={{ marginTop: "12px" }}>
                          <div
                            className="meta-label"
                            style={{ fontSize: "9px", color: "var(--text-meta)", marginBottom: "4px" }}
                          >
                            VALIDATOR CONSENSUS RATIONALE
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--text-stone)",
                              lineHeight: 1.6,
                              fontFamily: "var(--font-sans)",
                              fontWeight: 300,
                            }}
                          >
                            {f.explanation}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Collapsed Safe Vectors in Minimal "Passed" State */}
                  {safeFindings.length > 0 && (
                    <div>
                      <div
                        onClick={() => setShowSafeVectors(!showSafeVectors)}
                        className="safe-vectors-collapsed-bar"
                        style={{ cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <Check size={14} color="#10B981" />
                          <span
                            className="mono"
                            style={{ fontSize: "11px", color: "var(--text-ivory)", fontWeight: 500 }}
                          >
                            {safeFindings.length} Security Vectors Cleared
                          </span>
                          <span style={{ color: "#333338" }}>/</span>
                          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                            {safeFindings.map((v) => CATEGORY_META[v.category]?.label || v.category).join(" · ")}
                          </span>
                        </div>

                        <button
                          type="button"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--text-stone)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "transparent",
                            border: "none",
                            padding: "4px",
                          }}
                        >
                          {showSafeVectors ? (
                            <>
                              Hide Details <ChevronUp size={12} />
                            </>
                          ) : (
                            <>
                              View Passed ({safeFindings.length}) <ChevronDown size={12} />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expandable Minimal Passed Checks */}
                      <AnimatePresence>
                        {showSafeVectors && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: "hidden", marginTop: "12px" }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "12px" }}>
                              {safeFindings.map((f, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                    padding: "8px 0",
                                    borderBottom: "1px solid #141417",
                                  }}
                                >
                                  <span style={{ color: "#10B981", fontSize: "12px", marginTop: "1px" }}>✓</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                                      <span style={{ fontSize: "12px", color: "var(--text-ivory)", fontWeight: 500 }}>
                                        {CATEGORY_META[f.category]?.label || f.category}
                                      </span>
                                      <span className="mono" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                                        CONFIDENCE: {f.confidence}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--text-stone)", lineHeight: 1.5, fontFamily: "var(--font-sans)", fontWeight: 300 }}>
                                      {f.explanation}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ) : (
                /* B. CLEARED RECORD: ALL VECTORS PASSED */
                <div>
                  <div
                    style={{
                      padding: "20px 0",
                      borderBottom: "1px solid #1C1C1F",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <ShieldCheck size={18} color="#10B981" />
                      <span
                        style={{
                          fontSize: "16px",
                          color: "var(--text-ivory)",
                          fontWeight: 500,
                        }}
                      >
                        All 5 Ingress Vectors Certified Safe
                      </span>
                      <span className="status-tag cleared" style={{ fontSize: "10px" }}>
                        QUORUM TRUE
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-stone)", lineHeight: 1.6, fontFamily: "var(--font-sans)", fontWeight: 300 }}>
                      Multi-validator consensus achieved. Zero prompt injection, instruction hijacking, secret exfiltration, or malicious tool redirection patterns detected in ingress payload.
                    </div>
                  </div>

                  {/* Clean Minimal Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {safeFindings.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "10px 0",
                          borderBottom: "1px solid #141417",
                        }}
                      >
                        <span style={{ color: "#10B981", fontSize: "13px", marginTop: "1px" }}>✓</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                            <span style={{ fontSize: "13px", color: "var(--text-ivory)", fontWeight: 500 }}>
                              {CATEGORY_META[f.category]?.label || f.category}
                            </span>
                            <span className="mono" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                              CONFIDENCE: {f.confidence}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-stone)", lineHeight: 1.5, fontFamily: "var(--font-sans)", fontWeight: 300 }}>
                            {f.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CRYPTOGRAPHIC VERIFICATION RECEIPT (Whisper-thin divider footer) */}
            <div className="receipt-grid">
              <div>
                <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                  RESULT FINGERPRINT
                </div>
                <div
                  className="mono"
                  style={{ fontSize: "11px", color: "var(--text-stone)", wordBreak: "break-all" }}
                >
                  {activeRecord.result_fingerprint || "00000000000000000000"}
                </div>
              </div>

              <div>
                <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                  EVALUATION ATTEMPTS
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--text-ivory)" }}>
                  {activeRecord.evaluation_attempts || 1} Attempt(s) committed
                </div>
              </div>

              <div>
                <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                  RECORD OWNER
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--text-stone)" }}>
                  {activeRecord.owner
                    ? `${activeRecord.owner.slice(0, 6)}…${activeRecord.owner.slice(-4)}`
                    : CONTRACT_ADDRESS.slice(0, 10)}
                </div>
              </div>

              <div>
                <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                  INTELLIGENT CONTRACT
                </div>
                <a
                  href={contractUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-stone)",
                    textDecoration: "underline",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Explorer Proof <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-dim)", fontFamily: "var(--font-sans)" }}>
            No ingress target available. Register a new target to begin.
          </div>
        )}
      </main>

      {/* Target Intake Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  paddingBottom: "14px",
                  borderBottom: "1px solid #1C1C1F",
                }}
              >
                <div>
                  <h3
                    className="serif-font"
                    style={{
                      fontSize: "22px",
                      color: "var(--text-ivory)",
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    Register Ingress Target
                  </h3>
                  <div className="meta-label" style={{ fontSize: "9px", marginTop: "2px" }}>
                    On-chain intake quarantine via GenLayer
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} style={{ color: "var(--text-dim)" }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateRecord}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label className="meta-label" style={{ display: "block", marginBottom: "6px" }}>
                      RECORD IDENTIFIER
                    </label>
                    <input
                      type="text"
                      value={newRecordForm.recordId}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, recordId: e.target.value })}
                      placeholder="rec_target_001"
                      className="tactical-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="meta-label" style={{ display: "block", marginBottom: "6px" }}>
                      SOURCE URL (CANONICAL HTTPS)
                    </label>
                    <input
                      type="url"
                      value={newRecordForm.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://example.org/source.txt"
                      className="tactical-input"
                      required
                    />
                    {urlError && (
                      <div
                        className="mono"
                        style={{
                          color: "#c25e4a",
                          fontSize: "10px",
                          marginTop: "4px",
                        }}
                      >
                        {urlError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="meta-label" style={{ display: "block", marginBottom: "6px" }}>
                      TARGET LABEL
                    </label>
                    <input
                      type="text"
                      value={newRecordForm.label}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, label: e.target.value })}
                      placeholder="E.g., Competitor Threat Whitepaper"
                      className="tactical-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="meta-label" style={{ display: "block", marginBottom: "6px" }}>
                      DOWNSTREAM AGENT PURPOSE
                    </label>
                    <textarea
                      value={newRecordForm.purpose}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, purpose: e.target.value })}
                      placeholder="What is the consuming agent permitted to do with this source content?"
                      className="tactical-input"
                      rows="3"
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "24px",
                    paddingTop: "16px",
                    borderTop: "1px solid #1C1C1F",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRecord}
                    className="btn-ivory"
                  >
                    {isSubmittingRecord ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>Create Record</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
