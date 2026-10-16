import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Copy,
  Check,
  Search,
  Plus,
  RefreshCw,
  Wallet,
  ArrowLeft,
  Terminal,
  X,
  ShieldAlert,
  ShieldCheck,
  Clock,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  CHAIN_ID,
  CHAIN_NAME,
  contractUrl,
  writeSourceFirewall,
  errorText,
} from "../api";

const CATEGORY_META = {
  PROMPT_INJECTION: "Prompt Injection",
  INSTRUCTION_HIJACKING: "Instruction Hijacking",
  SECRET_EXFILTRATION: "Secret Exfiltration",
  MALICIOUS_TOOL_REDIRECTION: "Tool Redirection",
  UNSUPPORTED_CLAIM: "Unsupported Claim",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatingRecordId, setEvaluatingRecordId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // Create Form State
  const [newRecordForm, setNewRecordForm] = useState({
    recordId: `target-sec-${Math.floor(Math.random() * 900 + 100)}`,
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

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.record_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.source_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.source_url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filterState === "ALL") return true;
      return r.state === filterState;
    });
  }, [records, searchQuery, filterState]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: records.length,
      cleared: records.filter((r) => r.state === "CLEARED").length,
      quarantined: records.filter((r) => r.state === "QUARANTINED").length,
      submitted: records.filter((r) => r.state === "SUBMITTED").length,
    };
  }, [records]);

  const copyToClipboard = (text, fieldName) => {
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

  // Handle Consensus Evaluation
  const handleEvaluate = async (recordId) => {
    if (!writeClient) {
      onNotify("Connect a browser wallet on GenLayer Studionet to run consensus.", "error");
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

  // Handle Record Creation
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Top Bar: Minimal Operational HUD Header */}
      <header
        style={{
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          backgroundColor: "#040507",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Left: Back & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <motion.button
            onClick={onReturnLanding}
            whileHover={{ y: -1 }}
            className="btn-tactical"
            style={{ fontSize: "11px", padding: "6px 14px" }}
          >
            <ArrowLeft size={13} />
            BACK
          </motion.button>
          <div style={{ width: "1px", height: "14px", backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
          <div className="mono" style={{ fontSize: "12px", color: "var(--text-white)", letterSpacing: "0.06em", fontWeight: 600 }}>
            SOURCEFIREWALL // TERMINAL
          </div>
        </div>

        {/* Center: Live Studionet Status Dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 14px",
              borderRadius: "9999px",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <span className="radar-dot cleared" />
            <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {CHAIN_NAME} [{CHAIN_ID}]
            </span>
          </div>

          <button
            onClick={onToggleDemoMode}
            className="btn-tactical"
            style={{
              fontSize: "10px",
              padding: "5px 10px",
              color: isDemoMode ? "var(--accent-amber)" : "var(--text-muted)",
              boxShadow: isDemoMode ? "0 0 0 1px rgba(245, 158, 11, 0.3)" : "var(--specular-pill)",
            }}
          >
            {isDemoMode ? "SAMPLE MODE" : "LIVE MODE"}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-tactical"
            style={{ fontSize: "11px", padding: "6px 10px" }}
            title="Refresh Registry"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Right: Wallet Connection Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {walletAccount ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 14px",
                backgroundColor: "var(--surface-deep)",
                boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span className="radar-dot cleared" />
              <span style={{ color: "var(--text-white)" }}>
                {walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}
              </span>
              <span style={{ color: "var(--text-dim)" }}>|</span>
              <span style={{ color: "var(--accent-cleared)", fontWeight: 600 }}>
                {walletBalance} GEN
              </span>
            </div>
          ) : (
            <motion.button
              onClick={onConnectWallet}
              whileHover={{ y: -1 }}
              className="btn-primary"
              style={{ fontSize: "11px", padding: "6px 16px" }}
            >
              <Wallet size={12} />
              CONNECT WALLET
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Console Split View: 340px Stream + Right Forensic Stage */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "340px 1fr", overflow: "hidden" }}>
        {/* Left Stream: Dark-Glass Ledger Rows (340px) */}
        <aside
          style={{
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
            backgroundColor: "#050608",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 58px)",
            overflowY: "auto",
          }}
        >
          {/* Action & Filter Bar */}
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span className="telemetry-label" style={{ fontSize: "10px" }}>
                INGRESS STREAM ({records.length})
              </span>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                whileHover={{ y: -1 }}
                className="btn-primary"
                style={{ fontSize: "10px", padding: "4px 10px" }}
              >
                <Plus size={11} />
                INTAKE
              </motion.button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-dim)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domain or ID…"
                className="tactical-input"
                style={{ paddingLeft: "30px", fontSize: "11px", padding: "8px 10px 8px 30px" }}
              />
            </div>

            {/* Filter Pills with fluid framer-motion sliding background */}
            <div
              style={{
                display: "flex",
                gap: "2px",
                padding: "2px",
                backgroundColor: "var(--surface-deep)",
                borderRadius: "8px",
                boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05) inset",
                position: "relative",
              }}
            >
              {["ALL", "CLEARED", "QUARANTINED", "SUBMITTED"].map((filter) => {
                const countKey = filter.toLowerCase();
                const badgeCount = counts[countKey] || 0;
                const isSelected = filterState === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setFilterState(filter)}
                    style={{
                      flex: 1,
                      position: "relative",
                      padding: "5px 2px",
                      fontSize: "9px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: isSelected ? "var(--text-white)" : "var(--text-dim)",
                      zIndex: 1,
                      textAlign: "center",
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="workbenchHudFilter"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "6px",
                          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.12)",
                          zIndex: -1,
                        }}
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    {filter} ({badgeCount})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Ledger Table */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                No records match current filter.
              </div>
            ) : (
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60%" }}>TARGET DOMAIN / ID</th>
                      <th style={{ width: "40%", textAlign: "right" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r) => {
                      const isSelected = r.record_id === activeRecord?.record_id;
                      const domain = getDomain(r.source_url);
                      return (
                        <tr
                          key={r.record_id}
                          className={isSelected ? "selected" : ""}
                          onClick={() => setSelectedRecordId(r.record_id)}
                        >
                          <td>
                            <div className="mono" style={{ fontSize: "11px", fontWeight: 600, color: isSelected ? "#FFFFFF" : "var(--text-white)" }}>
                              {domain}
                            </div>
                            <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                              {r.record_id}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`status-chip ${r.state.toLowerCase()}`}>
                              <span className={`radar-dot ${r.state.toLowerCase()}`} />
                              {r.state}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </aside>

        {/* Right Forensic Stage */}
        <main
          style={{
            height: "calc(100vh - 58px)",
            overflowY: "auto",
            padding: "36px 48px 80px",
            backgroundColor: "#040507",
          }}
        >
          {activeRecord ? (
            <div style={{ maxWidth: "980px", margin: "0 auto" }}>
              {/* Authoritative Clearance Banner with Specular Highlight */}
              <div
                className="framer-glass-card"
                style={{
                  padding: "28px 32px",
                  marginBottom: "28px",
                  boxShadow:
                    activeRecord.state === "QUARANTINED"
                      ? "0 0 0 1px rgba(239, 68, 68, 0.25), 0 1px 0 0 rgba(255, 255, 255, 0.2) inset, 0 20px 50px -15px rgba(239, 68, 68, 0.15)"
                      : activeRecord.state === "CLEARED"
                      ? "0 0 0 1px rgba(16, 185, 129, 0.25), 0 1px 0 0 rgba(255, 255, 255, 0.2) inset, 0 20px 50px -15px rgba(16, 185, 129, 0.15)"
                      : "var(--specular-card)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span className="mono" style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-white)" }}>
                        {activeRecord.record_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(activeRecord.record_id, "id")}
                        style={{ color: copiedField === "id" ? "var(--accent-cleared)" : "var(--text-dim)" }}
                        title="Copy Record ID"
                      >
                        {copiedField === "id" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <a
                        href={activeRecord.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-tactical"
                        style={{ fontSize: "10px", padding: "4px 10px" }}
                      >
                        SOURCE <ExternalLink size={11} />
                      </a>
                    </div>

                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-white)", marginBottom: "6px" }}>
                      {activeRecord.source_label}
                    </div>

                    <div className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                      {activeRecord.source_url}
                    </div>
                  </div>

                  {/* Single Authoritative Status Badge */}
                  <div style={{ textAlign: "right" }}>
                    <div className="telemetry-label" style={{ marginBottom: "6px" }}>
                      QUARANTINE BOUNDARY VERDICT
                    </div>
                    <span
                      className={`status-chip ${activeRecord.state.toLowerCase()}`}
                      style={{ fontSize: "12px", padding: "7px 16px" }}
                    >
                      <span className={`radar-dot ${activeRecord.state.toLowerCase()}`} />
                      {activeRecord.state} // is_safe: {activeRecord.state === "CLEARED" ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                </div>

                {/* Subhead / Agent Purpose */}
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <div className="telemetry-label" style={{ marginBottom: "4px" }}>
                    PERMITTED DOWNSTREAM AGENT PURPOSE
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-subhead)" }}>
                    {activeRecord.agent_purpose || "General read-only research assistant."}
                  </div>
                </div>

                {/* If SUBMITTED: High-Contrast Evaluation Button */}
                {activeRecord.state === "SUBMITTED" && (
                  <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Target registered on-chain. Multi-validator consensus pending.
                    </div>
                    <motion.button
                      onClick={() => handleEvaluate(activeRecord.record_id)}
                      disabled={isEvaluating}
                      whileHover={{ y: -1 }}
                      className="btn-primary"
                      style={{ fontSize: "12px", padding: "8px 20px" }}
                    >
                      {isEvaluating && evaluatingRecordId === activeRecord.record_id ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          RUNNING CONSENSUS…
                        </>
                      ) : (
                        <>
                          <Terminal size={13} />
                          Run Consensus Evaluation
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* 5 Threat Vectors: High-Density Telemetry Table */}
              <div style={{ marginBottom: "32px" }}>
                <div className="telemetry-label" style={{ marginBottom: "14px" }}>
                  5-POINT THREAT VECTOR ANALYSIS
                </div>

                <div
                  className="framer-glass-card"
                  style={{
                    overflow: "hidden",
                    padding: "6px 0",
                  }}
                >
                  {activeRecord.findings.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", color: "var(--text-dim)", fontSize: "13px" }}>
                      No threat findings recorded yet. Execute consensus evaluation to inspect adversarial vectors.
                    </div>
                  ) : (
                    activeRecord.findings.map((f, i) => {
                      const label = CATEGORY_META[f.category] || f.category;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "18px 24px",
                            borderBottom: i === activeRecord.findings.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.04)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-white)" }}>
                                {label}
                              </span>
                              <span className={`badge-severity ${f.severity.toLowerCase()}`}>
                                {f.severity}
                              </span>
                            </div>
                            <div className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                              CONFIDENCE: {f.confidence}
                            </div>
                          </div>

                          <div style={{ fontSize: "13px", color: "var(--text-subhead)", marginBottom: f.evidence_quote ? "12px" : "4px", lineHeight: 1.5 }}>
                            {f.explanation}
                          </div>

                          {/* Verbatim Quoted Evidence in Sunken #030406 Code Block */}
                          {f.evidence_quote && (
                            <div
                              className="sunken-code"
                              style={{
                                padding: "11px 16px",
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--text-white)",
                                lineHeight: 1.5,
                                borderLeft: f.severity === "HIGH" ? "2px solid var(--accent-quarantined)" : "2px solid rgba(255, 255, 255, 0.18)",
                              }}
                            >
                              <span style={{ color: "var(--text-dim)", marginRight: "8px" }}>EXTRACT //</span>
                              “{f.evidence_quote}”
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Compact 4-Column Cryptographic Proof Bar */}
              <div
                className="framer-glass-card"
                style={{
                  padding: "22px 28px",
                }}
              >
                <div className="telemetry-label" style={{ marginBottom: "16px" }}>
                  CRYPTOGRAPHIC PROOF &amp; AUDIT RECEIPT
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "24px",
                  }}
                >
                  <div>
                    <div className="telemetry-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      CONTENT SHA-256 DIGEST
                    </div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-white)", wordBreak: "break-all" }}>
                      {activeRecord.source_digest || "Pending consensus"}
                    </div>
                  </div>

                  <div>
                    <div className="telemetry-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      RESULT FINGERPRINT
                    </div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", wordBreak: "break-all" }}>
                      {activeRecord.result_fingerprint || "00000000000000000000000000000000"}
                    </div>
                  </div>

                  <div>
                    <div className="telemetry-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      VALIDATOR QUORUM
                    </div>
                    <div className="mono" style={{ fontSize: "11px", color: "var(--accent-cleared)", fontWeight: 600 }}>
                      100% CONSENSUS AGREEMENT
                    </div>
                  </div>

                  <div>
                    <div className="telemetry-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      CALLER &amp; ATTEMPTS
                    </div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", wordBreak: "break-all" }}>
                      {activeRecord.owner ? `${activeRecord.owner.slice(0, 6)}…${activeRecord.owner.slice(-4)}` : CONTRACT_ADDRESS.slice(0, 10)} ({activeRecord.evaluation_attempts} att.)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px", color: "var(--text-dim)" }}>
              No target selected.
            </div>
          )}
        </main>
      </div>

      {/* Target Intake Modal with Framer-motion Spring */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ type: "spring", damping: 26, stiffness: 350 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ padding: "32px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px", paddingBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div>
                  <h3 className="display-font" style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-white)", margin: 0 }}>
                    REGISTER INGRESS TARGET
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>
                    On-chain intake quarantine via GenLayer
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ color: "var(--text-dim)" }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateRecord}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label className="telemetry-label" style={{ display: "block", marginBottom: "6px" }}>
                      RECORD ID
                    </label>
                    <input
                      type="text"
                      value={newRecordForm.recordId}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, recordId: e.target.value })}
                      placeholder="target-sec-001"
                      className="tactical-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="telemetry-label" style={{ display: "block", marginBottom: "6px" }}>
                      SOURCE URL (HTTPS)
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
                      <div className="mono" style={{ color: "var(--accent-quarantined)", fontSize: "10px", marginTop: "4px" }}>
                        {urlError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="telemetry-label" style={{ display: "block", marginBottom: "6px" }}>
                      SOURCE LABEL
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
                    <label className="telemetry-label" style={{ display: "block", marginBottom: "6px" }}>
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "26px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-tactical"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRecord}
                    className="btn-primary"
                  >
                    {isSubmittingRecord ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        SUBMITTING…
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        CREATE RECORD
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
