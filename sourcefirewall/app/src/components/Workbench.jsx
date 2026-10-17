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
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Layers,
  FileText,
  Activity,
  Terminal,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatingRecordId, setEvaluatingRecordId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // Mobile Tab State: "LEDGER" vs "DETAIL"
  const [mobileTab, setMobileTab] = useState("LEDGER");

  // Create Target Form State
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

  // Record Counts
  const counts = useMemo(() => {
    return {
      all: records.length,
      cleared: records.filter((r) => r.state === "CLEARED").length,
      quarantined: records.filter((r) => r.state === "QUARANTINED").length,
      submitted: records.filter((r) => r.state === "SUBMITTED").length,
    };
  }, [records]);

  // Threat Breakdown for Active Record
  const threatCounts = useMemo(() => {
    if (!activeRecord || !activeRecord.findings) return { high: 0, medium: 0, low: 0 };
    return {
      high: activeRecord.findings.filter((f) => f.severity === "HIGH").length,
      medium: activeRecord.findings.filter((f) => f.severity === "MEDIUM").length,
      low: activeRecord.findings.filter((f) => f.severity === "LOW").length,
    };
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
      setMobileTab("DETAIL");
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
        }}
      >
        {/* Left: Return & Identification */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
            }}
          >
            <ArrowLeft size={13} />
            <span className="header-btn-prefix">OVERVIEW</span>
          </button>
          <span style={{ color: "#2B2B30" }}>/</span>
          <span
            className="serif-font"
            style={{
              fontSize: "19px",
              color: "var(--text-ivory)",
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              fontWeight: 500,
            }}
          >
            SourceFirewall
          </span>
          <span className="meta-label header-edition-tag" style={{ fontSize: "10px", color: "var(--text-meta)" }}>
            [STUDIO WORKBENCH]
          </span>
        </div>

        {/* Center: Live Studionet Telemetry & Mode Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
            style={{ color: "var(--text-stone)", padding: "4px" }}
            title="Refresh Ledger Telemetry"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Right: Wallet Integration */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              style={{ fontSize: "12px", padding: "7px 16px" }}
            >
              <Wallet size={12} />
              <span className="header-btn-prefix">Connect </span>Wallet
            </button>
          )}
        </div>
      </header>

      {/* Mobile Master-Detail Switcher Bar (< 900px) */}
      <div className="workbench-mobile-tabs">
        <button
          onClick={() => setMobileTab("LEDGER")}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: mobileTab === "LEDGER" ? "var(--text-ivory)" : "var(--text-dim)",
            borderBottom: mobileTab === "LEDGER" ? "2px solid var(--text-ivory)" : "2px solid transparent",
            backgroundColor: mobileTab === "LEDGER" ? "#0F1014" : "transparent",
          }}
        >
          TARGET LEDGER ({records.length})
        </button>
        <button
          onClick={() => setMobileTab("DETAIL")}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: mobileTab === "DETAIL" ? "var(--text-ivory)" : "var(--text-dim)",
            borderBottom: mobileTab === "DETAIL" ? "2px solid var(--text-ivory)" : "2px solid transparent",
            backgroundColor: mobileTab === "DETAIL" ? "#0F1014" : "transparent",
          }}
        >
          INSPECTION DOSSIER
        </button>
      </div>

      {/* 2. MASTER-DETAIL WORKSPACE */}
      <div className="workbench-layout">
        {/* LEFT PANE: INGRESS LEDGER (360px - 380px) */}
        <aside
          className="workbench-ledger"
          style={{
            display: mobileTab === "LEDGER" ? "flex" : undefined,
          }}
        >
          {/* Action & Filter Bar */}
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #1C1C1F" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span className="meta-label" style={{ fontSize: "10px" }}>
                INGRESS TARGETS ({records.length})
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  border: "1px solid #333338",
                  color: "var(--text-ivory)",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus size={11} />
                NEW TARGET
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "14px" }}>
              <Search size={12} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-dim)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domain, label, or record ID…"
                className="tactical-input"
                style={{ paddingLeft: "30px", fontSize: "11px", padding: "7px 10px 7px 30px" }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: isSelected ? "var(--text-ivory)" : "var(--text-dim)",
                      paddingBottom: "3px",
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

          {/* Ledger Records List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                No records match current filter.
              </div>
            ) : (
              <div>
                {filteredRecords.map((r) => {
                  const isSelected = r.record_id === activeRecord?.record_id;
                  const domain = getDomain(r.source_url);
                  const highThreats = r.findings?.filter((f) => f.severity === "HIGH").length || 0;
                  return (
                    <div
                      key={r.record_id}
                      onClick={() => {
                        setSelectedRecordId(r.record_id);
                        setMobileTab("DETAIL");
                      }}
                      className={`ledger-item ${isSelected ? "selected" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", gap: "8px" }}>
                        <span className="mono" style={{ fontSize: "12px", color: isSelected ? "var(--text-ivory)" : "var(--text-stone)", fontWeight: 500, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {domain}
                        </span>
                        <span className={`status-tag ${r.state.toLowerCase()}`} style={{ fontSize: "9px", flexShrink: 0 }}>
                          {r.state}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: isSelected ? "var(--text-ivory)" : "var(--text-stone)", marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.source_label}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                          {r.record_id}
                        </span>
                        <span className="mono" style={{ fontSize: "10px", color: highThreats > 0 ? "var(--status-quarantined-text)" : "var(--text-dim)" }}>
                          {r.state === "SUBMITTED" ? "PENDING QUORUM" : `${highThreats} HIGH THREATS`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANE: DETAIL INSPECTION CANVAS */}
        <main
          className="workbench-canvas"
          style={{
            display: mobileTab === "DETAIL" ? "block" : undefined,
          }}
        >
          {activeRecord ? (
            <div style={{ maxWidth: "940px", margin: "0 auto" }}>
              {/* Mobile Return to Ledger Button */}
              <div style={{ marginBottom: "16px" }} className="header-demo-toggle">
                <button
                  onClick={() => setMobileTab("LEDGER")}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--text-stone)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 0",
                  }}
                >
                  <ArrowLeft size={11} /> BACK TO TARGET LEDGER
                </button>
              </div>
              {/* Header Dossier Bar */}
              <div style={{ paddingBottom: "24px", borderBottom: "1px solid #1C1C1F", marginBottom: "28px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <div>
                    <div className="meta-label" style={{ fontSize: "10px", marginBottom: "6px" }}>
                      INGRESS DOSSIER // {activeRecord.record_id}
                    </div>
                    <h2
                      className="serif-font"
                      style={{
                        fontSize: "clamp(26px, 3.2vw, 36px)",
                        color: "var(--text-ivory)",
                        margin: 0,
                        fontWeight: 500,
                        lineHeight: 1.15,
                      }}
                    >
                      {activeRecord.source_label}
                    </h2>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`status-tag ${activeRecord.state.toLowerCase()}`} style={{ fontSize: "11px", padding: "5px 12px" }}>
                      {activeRecord.state}
                    </span>
                  </div>
                </div>

                <div className="mono" style={{ fontSize: "12px", color: "var(--text-stone)", marginBottom: "14px", wordBreak: "break-all" }}>
                  {activeRecord.source_url}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
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

              {/* COMPACT SCANNABLE TELEMETRY DASHBOARD (4 Tiles) */}
              <div className="telemetry-kpi-grid">
                {/* Tile 1: Consensus Verdict */}
                <div className="telemetry-kpi-card">
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "6px" }}>
                    CONSENSUS GATE
                  </div>
                  <div className="mono" style={{ fontSize: "16px", fontWeight: 700, color: activeRecord.state === "CLEARED" ? "var(--text-ivory)" : activeRecord.state === "QUARANTINED" ? "var(--status-quarantined-text)" : "var(--status-amber-text)" }}>
                    {activeRecord.state === "CLEARED" ? "is_safe() = TRUE" : activeRecord.state === "QUARANTINED" ? "is_safe() = FALSE" : "PENDING QUORUM"}
                  </div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>
                    {activeRecord.state === "CLEARED" ? "Cleared for agent intake" : activeRecord.state === "QUARANTINED" ? "Blocked by fail-closed gate" : "Awaiting validator execution"}
                  </div>
                </div>

                {/* Tile 2: Threat Profile */}
                <div className="telemetry-kpi-card">
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "6px" }}>
                    THREAT PROFILE
                  </div>
                  <div className="mono" style={{ fontSize: "16px", fontWeight: 700, color: threatCounts.high > 0 ? "var(--status-quarantined-text)" : "var(--text-ivory)" }}>
                    {threatCounts.high} HIGH / {threatCounts.medium} MED / {threatCounts.low} LOW
                  </div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>
                    5 Canonical vectors inspected
                  </div>
                </div>

                {/* Tile 3: Payload Digest */}
                <div className="telemetry-kpi-card">
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "6px" }}>
                    SHA-256 DIGEST
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="mono" style={{ fontSize: "13px", color: "var(--text-ivory)", wordBreak: "break-all" }}>
                      {activeRecord.source_digest ? `${activeRecord.source_digest.slice(0, 14)}…` : "Pending evaluation"}
                    </div>
                    {activeRecord.source_digest && (
                      <button
                        onClick={() => copyToClipboard(activeRecord.source_digest, "digest")}
                        style={{ color: copiedField === "digest" ? "var(--text-ivory)" : "var(--text-dim)" }}
                        title="Copy SHA-256 Digest"
                      >
                        {copiedField === "digest" ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>
                    Invariant content fingerprint
                  </div>
                </div>

                {/* Tile 4: Quorum Consensus */}
                <div className="telemetry-kpi-card">
                  <div className="meta-label" style={{ fontSize: "9px", marginBottom: "6px" }}>
                    QUORUM MODEL
                  </div>
                  <div className="mono" style={{ fontSize: "14px", color: "var(--text-ivory)", fontWeight: 600 }}>
                    Strict Equivalence
                  </div>
                  <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>
                    Multi-validator consensus
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
                    marginBottom: "32px",
                  }}
                >
                  <div>
                    <div className="meta-label" style={{ color: "var(--status-amber-text)", fontSize: "10px", marginBottom: "2px" }}>
                      INGRESS RECORD COMMITTED TO ON-CHAIN LEDGER
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-ivory)" }}>
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

              {/* PERMITTED AGENT PURPOSE */}
              <div style={{ marginBottom: "32px", padding: "20px 24px", backgroundColor: "var(--bg-surface)", border: "1px solid #1C1C1F", borderRadius: "2px" }}>
                <div className="meta-label" style={{ fontSize: "10px", marginBottom: "6px" }}>
                  DOWNSTREAM PERMITTED AGENT INTAKE OBJECTIVE
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-stone)", lineHeight: 1.65 }}>
                  {activeRecord.agent_purpose || "General read-only research assistant."}
                </div>
              </div>

              {/* FINDINGS EVIDENCE HIERARCHY */}
              <div style={{ marginBottom: "40px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span className="meta-label" style={{ fontSize: "10px" }}>
                    5-POINT THREAT VECTOR CONSENSUS FINDINGS
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                    EVALUATOR SYNTHESIS &amp; RAW EVIDENCE
                  </span>
                </div>

                {activeRecord.findings.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center", backgroundColor: "var(--bg-surface)", border: "1px solid #1C1C1F", borderRadius: "2px", color: "var(--text-dim)", fontSize: "13px" }}>
                    No threat vector findings recorded yet. Execute consensus evaluation to generate verified evidence.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {activeRecord.findings.map((f, i) => {
                      const meta = CATEGORY_META[f.category] || { label: f.category, icon: Shield };
                      const IconComp = meta.icon;
                      const isQuarantined = f.severity === "HIGH";
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "20px 24px",
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid #1C1C1F",
                            borderRadius: "2px",
                          }}
                        >
                          {/* Finding Header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <IconComp size={15} color={isQuarantined ? "var(--status-quarantined-text)" : "var(--text-ivory)"} />
                              <span style={{ fontSize: "14px", color: "var(--text-ivory)", fontWeight: 500 }}>
                                {meta.label}
                              </span>
                              <span className={`badge-severity ${f.severity.toLowerCase()}`}>
                                {f.severity}
                              </span>
                            </div>

                            <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                              CONFIDENCE: {f.confidence}
                            </div>
                          </div>

                          {/* Evaluator Interpretation */}
                          <div style={{ fontSize: "13px", color: "var(--text-stone)", lineHeight: 1.6, marginBottom: f.evidence_quote ? "14px" : "0" }}>
                            {f.explanation}
                          </div>

                          {/* Extracted Raw Material (Sunken Raw Text Box) */}
                          {f.evidence_quote && (
                            <div className={`raw-evidence-box ${isQuarantined ? "quarantined" : "cleared"}`}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span className="meta-label" style={{ fontSize: "9px", color: isQuarantined ? "var(--status-quarantined-text)" : "var(--text-meta)" }}>
                                  RAW PAYLOAD EXCERPT // EXTRACTED FROM SOURCE
                                </span>
                                {f.source_pointer && (
                                  <span className="mono" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                                    POINTER: {f.source_pointer}
                                  </span>
                                )}
                              </div>
                              <div>“{f.evidence_quote}”</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CRYPTOGRAPHIC VERIFICATION RECEIPT */}
              <div
                style={{
                  borderTop: "1px solid #1C1C1F",
                  paddingTop: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "20px",
                }}
              >
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
                    {activeRecord.owner ? `${activeRecord.owner.slice(0, 6)}…${activeRecord.owner.slice(-4)}` : CONTRACT_ADDRESS.slice(0, 10)}
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
            <div style={{ textAlign: "center", padding: "80px", color: "var(--text-dim)" }}>
              No ingress target selected.
            </div>
          )}
        </main>
      </div>

      {/* Target Intake Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #1C1C1F" }}>
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #1C1C1F" }}>
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
