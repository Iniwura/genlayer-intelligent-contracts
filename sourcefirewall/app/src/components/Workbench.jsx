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

  // Extract domain helper
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
      {/* Top Bar: Minimal Calm Instrument */}
      <header
        style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          backgroundColor: "#060709",
        }}
      >
        {/* Left: Back & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onReturnLanding}
            className="btn-tactical"
            style={{ fontSize: "11px", padding: "5px 10px" }}
          >
            <ArrowLeft size={13} />
            BACK
          </button>
          <div style={{ width: "1px", height: "14px", backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
          <div className="mono" style={{ fontSize: "12px", color: "var(--text-heading)", letterSpacing: "0.06em" }}>
            SOURCEFIREWALL // TERMINAL
          </div>
        </div>

        {/* Center: Live Studionet Status Dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "4px 10px",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <span className="status-dot cleared" />
            <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {CHAIN_NAME} [{CHAIN_ID}]
            </span>
          </div>

          <button
            onClick={onToggleDemoMode}
            className="btn-tactical"
            style={{
              fontSize: "10px",
              padding: "4px 8px",
              color: isDemoMode ? "var(--accent-amber)" : "var(--text-muted)",
              borderColor: isDemoMode ? "rgba(245, 158, 11, 0.3)" : "rgba(255, 255, 255, 0.06)",
            }}
          >
            {isDemoMode ? "SAMPLE MODE" : "LIVE MODE"}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-tactical"
            style={{ fontSize: "11px", padding: "5px 8px" }}
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
                padding: "4px 12px",
                backgroundColor: "var(--surface-deep)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "var(--radius-inner)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span className="status-dot cleared" />
              <span style={{ color: "var(--text-heading)" }}>
                {walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}
              </span>
              <span style={{ color: "var(--text-dim)" }}>|</span>
              <span style={{ color: "var(--accent-cleared)", fontWeight: 600 }}>
                {walletBalance} GEN
              </span>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-primary"
              style={{ fontSize: "11px", padding: "6px 14px" }}
            >
              <Wallet size={12} />
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      {/* Main Console Split View: 360px Stream + Right Dossier */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "360px 1fr", overflow: "hidden" }}>
        {/* Left Stream: High-Density Ledger Table (360px) */}
        <aside
          style={{
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            backgroundColor: "#060709",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 56px)",
            overflowY: "auto",
          }}
        >
          {/* Action & Filter Bar */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span className="eyebrow-mono" style={{ fontSize: "10px" }}>
                TARGET STREAM ({records.length})
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
                style={{ fontSize: "10px", padding: "4px 10px" }}
              >
                <Plus size={11} />
                NEW TARGET
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
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
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.04)",
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
                      color: isSelected ? "var(--text-heading)" : "var(--text-dim)",
                      zIndex: 1,
                      textAlign: "center",
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="workbenchMinimalFilter"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "4px",
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
          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                No records match current filter.
              </div>
            ) : (
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th style={{ width: "55%" }}>TARGET DOMAIN / ID</th>
                      <th style={{ width: "45%", textAlign: "right" }}>STATUS</th>
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
                            <div className="mono" style={{ fontSize: "11px", fontWeight: 600, color: isSelected ? "#FFFFFF" : "var(--text-heading)" }}>
                              {domain}
                            </div>
                            <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                              {r.record_id}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`badge-status ${r.state.toLowerCase()}`}>
                              <span className={`status-dot ${r.state.toLowerCase()}`} />
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

        {/* Right Dossier (Forensic Canvas) */}
        <main
          style={{
            height: "calc(100vh - 56px)",
            overflowY: "auto",
            padding: "32px 40px 64px",
            backgroundColor: "#060709",
          }}
        >
          {activeRecord ? (
            <div style={{ maxWidth: "960px", margin: "0 auto" }}>
              {/* Clean Status Header Card with Top Specular Highlight */}
              <div
                className="framer-card"
                style={{
                  padding: "24px 28px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span className="mono" style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>
                        {activeRecord.record_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(activeRecord.record_id, "id")}
                        style={{ color: copiedField === "id" ? "var(--accent-cleared)" : "var(--text-dim)" }}
                        title="Copy Record ID"
                      >
                        {copiedField === "id" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "4px" }}>
                      {activeRecord.source_label}
                    </div>

                    <div className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                      {activeRecord.source_url}
                    </div>
                  </div>

                  {/* Single Crisp Badge */}
                  <div style={{ textAlign: "right" }}>
                    <div className="eyebrow-mono" style={{ marginBottom: "6px" }}>
                      GATE STATUS
                    </div>
                    <span
                      className={`badge-status ${activeRecord.state.toLowerCase()}`}
                      style={{ fontSize: "12px", padding: "6px 14px" }}
                    >
                      <span className={`status-dot ${activeRecord.state.toLowerCase()}`} />
                      {activeRecord.state} // is_safe: {activeRecord.state === "CLEARED" ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                </div>

                {/* Subhead / Summary */}
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <div className="eyebrow-mono" style={{ marginBottom: "4px" }}>
                    AGENT PERMITTED PURPOSE
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-body)" }}>
                    {activeRecord.agent_purpose || "General read-only research assistant."}
                  </div>
                </div>

                {/* If SUBMITTED: High-Contrast Action Button */}
                {activeRecord.state === "SUBMITTED" && (
                  <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Target registered on-chain. Multi-validator consensus pending.
                    </div>
                    <button
                      onClick={() => handleEvaluate(activeRecord.record_id)}
                      disabled={isEvaluating}
                      className="btn-primary"
                      style={{ fontSize: "12px", padding: "8px 18px" }}
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
                    </button>
                  </div>
                )}
              </div>

              {/* 5 Threat Vectors: Clean, Hairline-Separated List */}
              <div style={{ marginBottom: "28px" }}>
                <div className="eyebrow-mono" style={{ marginBottom: "12px" }}>
                  5-POINT THREAT VECTOR ANALYSIS
                </div>

                <div
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "var(--radius-card)",
                    overflow: "hidden",
                    backgroundColor: "var(--surface)",
                  }}
                >
                  {activeRecord.findings.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "var(--text-dim)", fontSize: "13px" }}>
                      No threat findings recorded yet. Execute consensus evaluation to inspect adversarial vectors.
                    </div>
                  ) : (
                    activeRecord.findings.map((f, i) => {
                      const label = CATEGORY_META[f.category] || f.category;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "16px 20px",
                            borderBottom: i === activeRecord.findings.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.04)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-heading)" }}>
                                {label}
                              </span>
                              <span className={`badge-severity ${f.severity.toLowerCase()}`}>
                                {f.severity}
                              </span>
                            </div>
                            <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                              CONFIDENCE: {f.confidence}
                            </div>
                          </div>

                          <div style={{ fontSize: "13px", color: "var(--text-body)", marginBottom: f.evidence_quote ? "10px" : "4px", lineHeight: 1.5 }}>
                            {f.explanation}
                          </div>

                          {/* Verbatim Quoted Evidence in Sunken #030405 Code Block */}
                          {f.evidence_quote && (
                            <div
                              className="sunken-code"
                              style={{
                                padding: "10px 14px",
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--text-heading)",
                                lineHeight: 1.5,
                                borderLeft: f.severity === "HIGH" ? "2px solid var(--accent-quarantined)" : "2px solid rgba(255, 255, 255, 0.15)",
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

              {/* Cryptographic Proof Strip: Clean Minimal Grid */}
              <div
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "var(--radius-card)",
                  backgroundColor: "var(--surface)",
                  padding: "20px 24px",
                }}
              >
                <div className="eyebrow-mono" style={{ marginBottom: "14px" }}>
                  CRYPTOGRAPHIC PROOF &amp; AUDIT RECEIPT
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                  }}
                >
                  <div>
                    <div className="eyebrow-mono" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      SHA-256 DIGEST
                    </div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-heading)", wordBreak: "break-all" }}>
                      {activeRecord.source_digest || "Pending consensus"}
                    </div>
                  </div>

                  <div>
                    <div className="eyebrow-mono" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      RESULT FINGERPRINT
                    </div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", wordBreak: "break-all" }}>
                      {activeRecord.result_fingerprint || "00000000000000000000000000000000"}
                    </div>
                  </div>

                  <div>
                    <div className="eyebrow-mono" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      CALLER / OWNER
                    </div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-muted)", wordBreak: "break-all" }}>
                      {activeRecord.owner || CONTRACT_ADDRESS}
                    </div>
                  </div>

                  <div>
                    <div className="eyebrow-mono" style={{ fontSize: "9px", marginBottom: "4px" }}>
                      CONSENSUS ATTEMPTS
                    </div>
                    <div className="mono" style={{ fontSize: "11px", color: "var(--text-heading)" }}>
                      {activeRecord.evaluation_attempts} Attempts
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

      {/* Target Intake Modal */}
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
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 350 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ padding: "28px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div>
                  <h3 className="display-font" style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label className="eyebrow-mono" style={{ display: "block", marginBottom: "6px" }}>
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
                    <label className="eyebrow-mono" style={{ display: "block", marginBottom: "6px" }}>
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
                    <label className="eyebrow-mono" style={{ display: "block", marginBottom: "6px" }}>
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
                    <label className="eyebrow-mono" style={{ display: "block", marginBottom: "6px" }}>
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
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
