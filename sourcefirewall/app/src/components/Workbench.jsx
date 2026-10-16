import React, { useState, useMemo } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Search,
  Plus,
  RefreshCw,
  Wallet,
  ArrowLeft,
  Terminal,
  FileCode,
  Layers,
  Cpu,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  CHAIN_ID,
  CHAIN_NAME,
  contractUrl,
  transactionUrl,
  writeSourceFirewall,
  isSafeRecord,
  errorText,
} from "../api";

const CATEGORY_META = {
  PROMPT_INJECTION: { label: "Prompt Injection", short: "INJECTION" },
  INSTRUCTION_HIJACKING: { label: "Instruction Hijacking", short: "HIJACK" },
  SECRET_EXFILTRATION: { label: "Secret Exfiltration", short: "EXFILTRATION" },
  MALICIOUS_TOOL_REDIRECTION: { label: "Tool Redirection", short: "REDIRECTION" },
  UNSUPPORTED_CLAIM: { label: "Unsupported Claim", short: "UNSUPPORTED" },
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

  // URL Validation
  const handleUrlChange = (value) => {
    setNewRecordForm({ ...newRecordForm, url: value });
    if (!value.startsWith("https://")) {
      setUrlError("SourceFirewall requires an HTTPS source URL.");
    } else {
      setUrlError("");
    }
  };

  // Handle Consensus Evaluation
  const handleEvaluate = async (recordId) => {
    if (!writeClient) {
      onNotify("Connect a browser wallet (e.g. MetaMask) on GenLayer Studionet to execute on-chain evaluation.", "error");
      return;
    }
    setIsEvaluating(true);
    setEvaluatingRecordId(recordId);
    onNotify(`Submitting evaluate_record('${recordId}') to validator quorum…`, "info");

    try {
      const result = await writeSourceFirewall(
        writeClient,
        "evaluate_record",
        [recordId],
        (txHash) => {
          onNotify(`Consensus transaction broadcast: ${txHash.slice(0, 10)}… Awaiting validator agreement…`, "info");
        }
      );
      onNotify(`Evaluation accepted by consensus: ${result.hash.slice(0, 10)}…`, "success");
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
      setUrlError("Valid HTTPS URL is required.");
      return;
    }
    if (!newRecordForm.recordId.trim()) {
      onNotify("Record ID is required.", "error");
      return;
    }

    if (!writeClient) {
      onNotify("Connect a browser wallet to submit a new record to the smart contract.", "error");
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
          onNotify(`Record creation broadcast: ${txHash.slice(0, 10)}… Awaiting block acceptance…`, "info");
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
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-obsidian)", display: "flex", flexDirection: "column" }}>
      {/* Workbench Navigation Topbar */}
      <header
        style={{
          borderBottom: "1px solid var(--border-hairline)",
          backgroundColor: "rgba(13, 15, 18, 0.95)",
          backdropFilter: "blur(12px)",
          height: "60px",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Breadcrumbs & Return */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onReturnLanding}
            className="btn-tactical"
            style={{ fontSize: "11px", padding: "5px 10px" }}
            title="Return to Landing Page"
          >
            <ArrowLeft size={13} />
            LANDING
          </button>
          <div style={{ height: "18px", width: "1px", backgroundColor: "var(--border-hairline)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.02em" }}>
              SOURCE<span style={{ color: "var(--accent-cleared)" }}>FIREWALL</span>
            </span>
            <span className="mono" style={{ color: "var(--text-dim)", fontSize: "12px" }}>
              // OPERATIONAL_DESK
            </span>
          </div>
        </div>

        {/* Center: Chain Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "4px 10px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-hairline)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span className="radar-dot" />
            <span style={{ color: "var(--text-main)" }}>{CHAIN_NAME}</span>
            <span style={{ color: "var(--text-dim)" }}>[ID: {CHAIN_ID}]</span>
          </div>

          {/* Mode Switcher */}
          <button
            onClick={onToggleDemoMode}
            className="btn-tactical"
            style={{
              fontSize: "10px",
              padding: "4px 8px",
              color: isDemoMode ? "var(--accent-amber)" : "var(--accent-cyan)",
              borderColor: isDemoMode ? "var(--accent-amber-border)" : "var(--accent-cyan-border)",
            }}
          >
            {isDemoMode ? "SAMPLE DATA MODE" : "LIVE CONTRACT MODE"}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-tactical"
            style={{ fontSize: "11px", padding: "5px 9px" }}
            title="Refresh Registry from On-Chain State"
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
                gap: "10px",
                padding: "4px 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-focus)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="radar-dot" />
                <span>
                  {walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}
                </span>
              </div>
              <span style={{ color: "var(--text-dim)" }}>|</span>
              <span style={{ color: "var(--accent-cleared)" }}>{walletBalance} GEN</span>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-primary"
              style={{ fontSize: "11px", padding: "6px 14px" }}
            >
              <Wallet size={13} />
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      {/* Main Split Workbench Container */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "360px 1fr", overflow: "hidden" }}>
        {/* Left Panel: Ingress Target Stream & Queue */}
        <aside
          style={{
            borderRight: "1px solid var(--border-hairline)",
            backgroundColor: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 60px)",
            overflowY: "auto",
          }}
        >
          {/* Action Header */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border-hairline)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)" }}>
                INGRESS STREAM ({records.length})
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
                style={{ fontSize: "11px", padding: "5px 10px" }}
              >
                <Plus size={13} />
                NEW TARGET
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "var(--text-dim)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search record ID, URL, or label…"
                className="tactical-input"
                style={{ paddingLeft: "32px", fontSize: "11px" }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
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
                      padding: "4px 2px",
                      fontSize: "9px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      backgroundColor: isSelected ? "var(--bg-surface-alt)" : "transparent",
                      border: "1px solid",
                      borderColor: isSelected ? "var(--border-focus)" : "transparent",
                      color: isSelected ? "var(--text-main)" : "var(--text-dim)",
                    }}
                  >
                    {filter} ({badgeCount})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Record Queue Cards */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                No records match current filter.
              </div>
            ) : (
              filteredRecords.map((r) => {
                const isSelected = r.record_id === activeRecord?.record_id;
                return (
                  <div
                    key={r.record_id}
                    onClick={() => setSelectedRecordId(r.record_id)}
                    style={{
                      padding: "12px",
                      marginBottom: "6px",
                      backgroundColor: isSelected ? "var(--bg-surface-alt)" : "#090b0e",
                      border: "1px solid",
                      borderColor: isSelected ? "var(--border-focus)" : "var(--border-hairline)",
                      borderLeft: isSelected ? "3px solid var(--accent-cyan)" : "1px solid var(--border-hairline)",
                      cursor: "pointer",
                      transition: "all 0.1s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-main)" }}>
                        {r.record_id}
                      </span>
                      <span className={`badge-status ${r.state.toLowerCase()}`}>
                        {r.state}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.source_label || "Untitled Target"}
                    </div>

                    <div
                      className="mono"
                      style={{
                        fontSize: "10px",
                        color: "var(--text-dim)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: "8px",
                      }}
                    >
                      {r.source_url}
                    </div>

                    {/* Threat Counters */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="badge-severity high">H: {r.high_count}</span>
                      <span className="badge-severity medium">M: {r.medium_count}</span>
                      <span className="badge-severity low">L: {r.low_count}</span>
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                        {r.decision}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center/Right Panel: Active Forensic Canvas */}
        <main
          style={{
            height: "calc(100vh - 60px)",
            overflowY: "auto",
            padding: "24px 32px 48px",
            backgroundColor: "var(--bg-obsidian)",
          }}
        >
          {activeRecord ? (
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
              {/* Header Clearance Status Banner */}
              {activeRecord.state === "QUARANTINED" && (
                <div
                  className="hazard-stripe-quarantine"
                  style={{
                    padding: "20px 24px",
                    borderRadius: "2px",
                    marginBottom: "24px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-quarantined)", marginBottom: "4px" }}>
                        <ShieldAlert size={20} />
                        <span className="mono" style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em" }}>
                          FAIL-CLOSED PERIMETER // RECORD QUARANTINED
                        </span>
                      </div>
                      <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "6px 0 8px" }}>
                        Clearance Denied: {activeRecord.decision}
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5, maxWidth: "700px" }}>
                        {activeRecord.summary || "One or more medium/high severity adversarial findings detected. Downstream agent access barred."}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "2px" }}>
                        ON-CHAIN CALL: is_safe()
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--accent-quarantined)" }}>
                        FALSE
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeRecord.state === "CLEARED" && (
                <div
                  className="emerald-glow-cleared"
                  style={{
                    padding: "20px 24px",
                    borderRadius: "2px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cleared)", marginBottom: "4px" }}>
                        <ShieldCheck size={20} />
                        <span className="mono" style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em" }}>
                          CLEARANCE APPROVED // AGENT INGRESS SAFE
                        </span>
                      </div>
                      <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "6px 0 8px" }}>
                        Source Verified: {activeRecord.decision}
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5, maxWidth: "700px" }}>
                        {activeRecord.summary || "Zero high or medium severity threats detected. Source content verified across consensus nodes."}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "2px" }}>
                        ON-CHAIN CALL: is_safe()
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--accent-cleared)" }}>
                        TRUE
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeRecord.state === "SUBMITTED" && (
                <div
                  className="amber-glow-submitted"
                  style={{
                    padding: "20px 24px",
                    borderRadius: "2px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-amber)", marginBottom: "4px" }}>
                        <Clock size={18} />
                        <span className="mono" style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em" }}>
                          AWAITING CONSENSUS EVALUATION
                        </span>
                      </div>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "4px 0" }}>
                        Target registered. Multi-validator consensus pending.
                      </h2>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                        Click below to trigger non-deterministic web rendering and 5-point adversarial evaluation across the validator quorum.
                      </p>
                    </div>

                    <button
                      onClick={() => handleEvaluate(activeRecord.record_id)}
                      disabled={isEvaluating}
                      className="btn-primary"
                      style={{ padding: "10px 18px", fontSize: "12px", backgroundColor: "var(--accent-amber)", color: "#000", borderColor: "var(--accent-amber)" }}
                    >
                      {isEvaluating && evaluatingRecordId === activeRecord.record_id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          RUNNING CONSENSUS…
                        </>
                      ) : (
                        <>
                          <Terminal size={14} />
                          RUN CONSENSUS EVALUATION
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Target Identification & Purpose Card */}
              <div className="tactical-box" style={{ padding: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-hairline)", paddingBottom: "12px", marginBottom: "16px" }}>
                  <div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "2px" }}>
                      RECORD IDENTIFIER
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono" style={{ fontSize: "16px", fontWeight: 800 }}>
                        {activeRecord.record_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(activeRecord.record_id, "recId")}
                        style={{ color: copiedField === "recId" ? "var(--accent-cleared)" : "var(--text-dim)" }}
                        title="Copy ID"
                      >
                        {copiedField === "recId" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <a
                      href={activeRecord.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactical"
                      style={{ fontSize: "11px", padding: "6px 12px" }}
                    >
                      SOURCE TARGET <ExternalLink size={12} />
                    </a>
                    <a
                      href={contractUrl(CONTRACT_ADDRESS)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactical"
                      style={{ fontSize: "11px", padding: "6px 12px" }}
                    >
                      REGISTRY CONTRACT <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px" }}>
                      TARGET LABEL
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{activeRecord.source_label}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px" }}>
                      DOWNSTREAM AGENT PURPOSE
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.45 }}>
                      {activeRecord.agent_purpose || "General read-only research assistant."}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Threat Vector Breakdown Grid */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)" }}>
                    5-POINT THREAT VECTOR ANALYSIS
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                    Consensus agreement: 100%
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeRecord.findings.length === 0 ? (
                    <div
                      style={{
                        padding: "24px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-hairline)",
                        textAlign: "center",
                        color: "var(--text-dim)",
                        fontSize: "12px",
                      }}
                    >
                      No findings recorded yet. Execute consensus evaluation to generate threat breakdown.
                    </div>
                  ) : (
                    activeRecord.findings.map((f, i) => {
                      const meta = CATEGORY_META[f.category] || { label: f.category, short: f.category };
                      const isHigh = f.severity === "HIGH";
                      const isMed = f.severity === "MEDIUM";
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "16px 20px",
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid",
                            borderColor: isHigh
                              ? "var(--accent-quarantined-border)"
                              : isMed
                              ? "var(--accent-amber-border)"
                              : "var(--border-hairline)",
                            borderLeft: isHigh
                              ? "3px solid var(--accent-quarantined)"
                              : isMed
                              ? "3px solid var(--accent-amber)"
                              : "3px solid var(--accent-cleared)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontWeight: 700, fontSize: "13px" }}>{meta.label}</span>
                              <span className={`badge-severity ${f.severity.toLowerCase()}`}>
                                {f.severity}
                              </span>
                            </div>
                            <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                              CONFIDENCE: {f.confidence}
                            </span>
                          </div>

                          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, margin: "6px 0 10px" }}>
                            {f.explanation}
                          </p>

                          {f.evidence_quote && (
                            <div
                              style={{
                                backgroundColor: "#060708",
                                borderLeft: "2px solid var(--border-focus)",
                                padding: "8px 12px",
                                marginBottom: "8px",
                                fontSize: "11px",
                                color: isHigh ? "#fca5a5" : "#e2e8f0",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              “{f.evidence_quote}”
                            </div>
                          )}

                          <div className="mono" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                            SOURCE POINTER // {f.source_pointer || "Not specified"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cryptographic Proof & Receipt Drawer */}
              <div className="tactical-box" style={{ padding: "20px" }}>
                <div className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", marginBottom: "14px" }}>
                  CRYPTOGRAPHIC RECEIPT & PROOF TELEMETRY
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "11px" }}>
                  <div>
                    <span className="mono" style={{ color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                      CONTENT SHA-256 DIGEST:
                    </span>
                    <span className="mono" style={{ color: "var(--accent-cyan)", wordBreak: "break-all" }}>
                      {activeRecord.source_digest || "Pending execution"}
                    </span>
                  </div>

                  <div>
                    <span className="mono" style={{ color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                      RESULT FINGERPRINT:
                    </span>
                    <span className="mono" style={{ color: "var(--text-muted)", wordBreak: "break-all" }}>
                      {activeRecord.result_fingerprint || "00000000000000000000000000000000"}
                    </span>
                  </div>

                  <div>
                    <span className="mono" style={{ color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                      RECORD OWNER (CALLER):
                    </span>
                    <span className="mono" style={{ color: "var(--text-muted)", wordBreak: "break-all" }}>
                      {activeRecord.owner || CONTRACT_ADDRESS}
                    </span>
                  </div>

                  <div>
                    <span className="mono" style={{ color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                      CONSENSUS EVALUATION ATTEMPTS:
                    </span>
                    <span className="mono" style={{ color: "var(--text-main)" }}>
                      {activeRecord.evaluation_attempts} attempts recorded
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "64px", color: "var(--text-dim)" }}>
              No record selected. Select a target from the left queue.
            </div>
          )}
        </main>
      </div>

      {/* Intake Modal: Register New Inspection Target */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content tactical-box" onClick={(e) => e.stopPropagation()} style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-hairline)", paddingBottom: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} style={{ color: "var(--accent-cleared)" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>REGISTER NEW INGRESS TARGET</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ color: "var(--text-dim)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
                    RECORD ID // UNIQUE IDENTIFIER
                  </label>
                  <input
                    type="text"
                    value={newRecordForm.recordId}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, recordId: e.target.value })}
                    placeholder="source-001"
                    className="tactical-input"
                    required
                  />
                </div>

                <div>
                  <label className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
                    TARGET SOURCE URL (MUST BE PUBLIC HTTPS)
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
                  <label className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
                    SOURCE LABEL
                  </label>
                  <input
                    type="text"
                    value={newRecordForm.label}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, label: e.target.value })}
                    placeholder="E.g., Competitor Threat Report"
                    className="tactical-input"
                    required
                  />
                </div>

                <div>
                  <label className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
                    DOWNSTREAM AGENT PURPOSE
                  </label>
                  <textarea
                    value={newRecordForm.purpose}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, purpose: e.target.value })}
                    placeholder="What is the consuming agent permitted to do with this source?"
                    className="tactical-input"
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-hairline)" }}>
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
                      <RefreshCw size={14} className="animate-spin" />
                      SUBMITTING ON-CHAIN…
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      CREATE RECORD
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
