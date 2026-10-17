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
  X,
  ArrowUpRight,
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
      {/* Clean Top Navigation: Luxury-Tier Inspection Desk */}
      <header
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 36px",
          borderBottom: "1px solid #1C1C1F",
          backgroundColor: "#09090B",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Left: Back & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
            }}
          >
            <ArrowLeft size={13} />
            OVERVIEW
          </button>
          <span style={{ color: "#222225" }}>|</span>
          <span
            className="serif-font"
            style={{
              fontSize: "18px",
              color: "var(--text-ivory)",
              fontStyle: "italic",
              letterSpacing: "-0.01em",
            }}
          >
            SourceFirewall Studio
          </span>
        </div>

        {/* Center: Live Studionet Network Label */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#F4F1EA" }} />
            <span className="meta-label" style={{ fontSize: "10px", color: "var(--text-stone)" }}>
              {CHAIN_NAME} [{CHAIN_ID}]
            </span>
          </div>

          <button
            onClick={onToggleDemoMode}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "4px 10px",
              border: "1px solid #222225",
              color: isDemoMode ? "var(--status-amber-text)" : "var(--text-meta)",
              borderRadius: "2px",
            }}
          >
            {isDemoMode ? "SAMPLE MODE" : "LIVE MODE"}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ color: "var(--text-stone)" }}
            title="Refresh Ledger"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Right: Minimalist Wallet Address Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {walletAccount ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-ivory)",
                padding: "6px 14px",
                border: "1px solid #222225",
                borderRadius: "2px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
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
              style={{ fontSize: "12px", padding: "7px 18px" }}
            >
              <Wallet size={12} />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Asymmetric Split View: Left Ledger (380px) + Right Canvas */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "380px 1fr", overflow: "hidden" }}>
        {/* Left Ledger: Borderless List with Hairline Dividers (380px) */}
        <aside
          style={{
            borderRight: "1px solid #1C1C1F",
            backgroundColor: "#09090B",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 64px)",
            overflowY: "auto",
          }}
        >
          {/* Action & Filter Bar */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #1C1C1F" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span className="meta-label">
                INGRESS LEDGER ({records.length})
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  border: "1px solid #333338",
                  color: "var(--text-ivory)",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={11} />
                NEW TARGET
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-dim)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domain or record ID…"
                className="tactical-input"
                style={{ paddingLeft: "32px", fontSize: "11px", padding: "8px 10px 8px 32px" }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "14px" }}>
              {["ALL", "CLEARED", "QUARANTINED", "SUBMITTED"].map((filter) => {
                const countKey = filter.toLowerCase();
                const badgeCount = counts[countKey] || 0;
                const isSelected = filterState === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setFilterState(filter)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: isSelected ? "var(--text-ivory)" : "var(--text-dim)",
                      paddingBottom: "4px",
                      borderBottom: isSelected ? "1px solid var(--text-ivory)" : "1px solid transparent",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {filter} [{badgeCount}]
                  </button>
                );
              })}
            </div>
          </div>

          {/* Borderless Ledger Rows with Hairline Dividers */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                No records match current filter.
              </div>
            ) : (
              <div>
                {filteredRecords.map((r) => {
                  const isSelected = r.record_id === activeRecord?.record_id;
                  const domain = getDomain(r.source_url);
                  return (
                    <div
                      key={r.record_id}
                      onClick={() => setSelectedRecordId(r.record_id)}
                      style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid #141416",
                        backgroundColor: isSelected ? "#0F0F12" : "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span className="mono" style={{ fontSize: "12px", color: isSelected ? "var(--text-ivory)" : "var(--text-stone)", fontWeight: 500 }}>
                          {domain}
                        </span>
                        <span className={`status-tag ${r.state.toLowerCase()}`}>
                          {r.state}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                          {r.record_id}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-dim)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.source_label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right Canvas: Quiet Luxury Inspection Desk */}
        <main
          style={{
            height: "calc(100vh - 64px)",
            overflowY: "auto",
            padding: "48px 56px 96px",
            backgroundColor: "#0B0B0D",
          }}
        >
          {activeRecord ? (
            <div style={{ maxWidth: "920px", margin: "0 auto" }}>
              {/* Header Dossier */}
              <div style={{ paddingBottom: "32px", borderBottom: "1px solid #1C1C1F", marginBottom: "36px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div>
                    <div className="meta-label" style={{ marginBottom: "6px" }}>
                      INGRESS RECORD // {activeRecord.record_id}
                    </div>
                    <h2
                      className="serif-font"
                      style={{
                        fontSize: "36px",
                        color: "var(--text-ivory)",
                        margin: 0,
                        fontWeight: 500,
                        lineHeight: 1.1,
                      }}
                    >
                      {activeRecord.source_label}
                    </h2>
                  </div>

                  {/* Understated Status Badge */}
                  <div style={{ textAlign: "right" }}>
                    <div className="meta-label" style={{ marginBottom: "6px" }}>
                      CONSENSUS STATE
                    </div>
                    <span className={`status-tag ${activeRecord.state.toLowerCase()}`} style={{ fontSize: "11px", padding: "4px 10px" }}>
                      {activeRecord.state} // IS_SAFE: {activeRecord.state === "CLEARED" ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                </div>

                <div className="mono" style={{ fontSize: "12px", color: "var(--text-stone)", marginBottom: "16px" }}>
                  {activeRecord.source_url}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                      gap: "4px",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    View Source Web Target <ExternalLink size={11} />
                  </a>

                  <button
                    onClick={() => copyToClipboard(activeRecord.record_id, "recId")}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: copiedField === "recId" ? "var(--text-ivory)" : "var(--text-dim)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {copiedField === "recId" ? <Check size={12} /> : <Copy size={12} />}
                    Copy ID
                  </button>
                </div>

                {/* Downstream Agent Purpose */}
                <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #141416" }}>
                  <div className="meta-label" style={{ fontSize: "10px", marginBottom: "4px" }}>
                    DOWNSTREAM PERMITTED AGENT PURPOSE
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-stone)", lineHeight: 1.6 }}>
                    {activeRecord.agent_purpose || "General read-only research assistant."}
                  </div>
                </div>

                {/* If SUBMITTED: Run Consensus Evaluation Button */}
                {activeRecord.state === "SUBMITTED" && (
                  <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #1C1C1F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-stone)" }}>
                      Target registered. Quorum verification pending execution.
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
                          Running Consensus…
                        </>
                      ) : (
                        <>Run Consensus Evaluation</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* 5 Threat Vectors: Borderless Typographic Table */}
              <div style={{ marginBottom: "44px" }}>
                <div className="meta-label" style={{ marginBottom: "16px" }}>
                  5-POINT THREAT VECTOR INSPECTION
                </div>

                {activeRecord.findings.length === 0 ? (
                  <div style={{ padding: "40px 0", color: "var(--text-dim)", fontSize: "13px" }}>
                    No threat findings recorded yet. Execute consensus evaluation to inspect adversarial vectors.
                  </div>
                ) : (
                  <div style={{ borderTop: "1px solid #1C1C1F" }}>
                    {activeRecord.findings.map((f, i) => {
                      const label = CATEGORY_META[f.category] || f.category;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "20px 0",
                            borderBottom: "1px solid #141416",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "14px", color: "var(--text-ivory)", fontWeight: 500 }}>
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

                          <div style={{ fontSize: "13px", color: "var(--text-stone)", marginBottom: f.evidence_quote ? "12px" : "4px", lineHeight: 1.6 }}>
                            {f.explanation}
                          </div>

                          {/* Sunken Quoted Evidence in Warm Container */}
                          {f.evidence_quote && (
                            <div
                              className="sunken-box"
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--text-ivory)",
                                lineHeight: 1.6,
                              }}
                            >
                              <span style={{ color: "var(--text-meta)", marginRight: "8px" }}>EXTRACT //</span>
                              “{f.evidence_quote}”
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Minimalist Cryptographic Receipt Footer with One-Click Copy */}
              <div
                style={{
                  borderTop: "1px solid #1C1C1F",
                  paddingTop: "28px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "24px",
                }}
              >
                <div>
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                    CONTENT SHA-256 DIGEST
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="mono" style={{ fontSize: "11px", color: "var(--text-ivory)", wordBreak: "break-all" }}>
                      {activeRecord.source_digest ? `${activeRecord.source_digest.slice(0, 16)}…` : "Pending consensus"}
                    </div>
                    {activeRecord.source_digest && (
                      <button
                        onClick={() => copyToClipboard(activeRecord.source_digest, "digest")}
                        style={{ color: copiedField === "digest" ? "var(--text-ivory)" : "var(--text-dim)" }}
                        title="Copy Digest"
                      >
                        {copiedField === "digest" ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                    RESULT FINGERPRINT
                  </div>
                  <div className="mono" style={{ fontSize: "11px", color: "var(--text-stone)", wordBreak: "break-all" }}>
                    {activeRecord.result_fingerprint || "00000000000000000000"}
                  </div>
                </div>

                <div>
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                    QUORUM AGREEMENT
                  </div>
                  <div className="mono" style={{ fontSize: "11px", color: "var(--text-ivory)" }}>
                    100% (Strict Equivalence)
                  </div>
                </div>

                <div>
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "4px" }}>
                    RECORD OWNER
                  </div>
                  <div className="mono" style={{ fontSize: "11px", color: "var(--text-stone)" }}>
                    {activeRecord.owner ? `${activeRecord.owner.slice(0, 6)}…${activeRecord.owner.slice(-4)}` : CONTRACT_ADDRESS.slice(0, 10)}
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
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "36px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #1C1C1F" }}>
                <div>
                  <h3 className="serif-font" style={{ fontSize: "22px", color: "var(--text-ivory)", margin: 0, fontStyle: "italic" }}>
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
                      placeholder="target-sec-001"
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
                      <div className="mono" style={{ color: "var(--status-quarantined-text)", fontSize: "10px", marginTop: "4px" }}>
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "28px", paddingTop: "16px", borderTop: "1px solid #1C1C1F" }}>
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
