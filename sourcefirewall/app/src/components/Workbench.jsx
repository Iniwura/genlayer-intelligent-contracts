import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Search,
  Plus,
  RefreshCw,
  Wallet,
  ArrowLeft,
  Terminal,
  Clock,
  X,
  LayoutList,
  Table as TableIcon,
  CheckCircle2,
  Lock,
  Sparkles,
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
  PROMPT_INJECTION: { label: "Prompt Injection", short: "INJECTION", weight: 95 },
  INSTRUCTION_HIJACKING: { label: "Instruction Hijacking", short: "HIJACK", weight: 90 },
  SECRET_EXFILTRATION: { label: "Secret Exfiltration", short: "EXFILTRATION", weight: 85 },
  MALICIOUS_TOOL_REDIRECTION: { label: "Tool Redirection", short: "REDIRECTION", weight: 80 },
  UNSUPPORTED_CLAIM: { label: "Unsupported Claim", short: "UNSUPPORTED", weight: 40 },
};

const PRESET_INTAKE_TARGETS = [
  {
    label: "Malicious Injection",
    recordId: "target-injection-99",
    url: "https://raw.githubusercontent.com/Iniwura/semantic-breach-registry/main/README.md",
    name: "CVE Analysis & Injection Sample",
    purpose: "Evaluate technical security claims without compromising assistant state.",
  },
  {
    label: "Exfiltration Probe",
    recordId: "target-exfil-04",
    url: "https://raw.githubusercontent.com/Iniwura/source-firewall/main/test/fixtures/exfiltration.txt",
    name: "Confidential Credential Harvest",
    purpose: "Verify firewall intercept of unauthorized API key forwarding.",
  },
  {
    label: "Benign Research",
    recordId: "target-benign-01",
    url: "https://raw.githubusercontent.com/Iniwura/source-firewall/main/README.md",
    name: "Architecture Whitepaper v1.2",
    purpose: "Ingest architecture diagrams and contract interfaces.",
  },
];

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
  const [viewDensity, setViewDensity] = useState("TABLE"); // "TABLE" vs "CARDS"
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
    setNewRecordForm((prev) => ({ ...prev, url: value }));
    if (!value.startsWith("https://")) {
      setUrlError("SourceFirewall requires an HTTPS source URL.");
    } else {
      setUrlError("");
    }
  };

  const applyPreset = (preset) => {
    setNewRecordForm({
      recordId: `${preset.recordId}-${Math.floor(Math.random() * 89 + 10)}`,
      label: preset.name,
      url: preset.url,
      purpose: preset.purpose,
    });
    setUrlError("");
  };

  // Handle Consensus Evaluation
  const handleEvaluate = async (recordId) => {
    if (!writeClient) {
      onNotify("Connect a browser wallet on GenLayer Studionet to execute consensus evaluation.", "error");
      return;
    }
    setIsEvaluating(true);
    setEvaluatingRecordId(recordId);
    onNotify(`Broadcasting evaluate_record('${recordId}') to validator quorum…`, "info");

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
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Workbench Header Topbar */}
      <header
        style={{
          borderBottom: "var(--border-specular)",
          backgroundColor: "rgba(13, 16, 21, 0.95)",
          backdropFilter: "blur(12px)",
          height: "60px",
          padding: "0 24px",
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
            style={{ fontSize: "11px", padding: "6px 12px" }}
            title="Return to Landing Page"
          >
            <ArrowLeft size={13} />
            OVERVIEW
          </button>
          <div style={{ height: "16px", width: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="display-font"
              style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.02em" }}
            >
              SOURCE<span style={{ color: "var(--accent-cyan)" }}>FIREWALL</span>
            </span>
            <span className="mono" style={{ color: "var(--dim)", fontSize: "11px" }}>
              // WORKBENCH
            </span>
          </div>
        </div>

        {/* Center: Chain Status Badge & Mode */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              backgroundColor: "var(--surface-deep)",
              border: "var(--border-specular)",
              borderRadius: "9999px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span className="health-dot" />
            <span style={{ color: "var(--paper)" }}>{CHAIN_NAME}</span>
            <span style={{ color: "var(--dim)" }}>[ID: {CHAIN_ID}]</span>
          </div>

          <button
            onClick={onToggleDemoMode}
            className="btn-tactical"
            style={{
              fontSize: "10px",
              padding: "5px 10px",
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
            style={{ fontSize: "11px", padding: "6px 10px" }}
            title="Refresh Registry from On-Chain State"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
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
                padding: "5px 14px",
                backgroundColor: "var(--surface-deep)",
                border: "var(--border-specular-active)",
                borderRadius: "var(--radius-inner)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="health-dot" />
                <span>
                  {walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}
                </span>
              </div>
              <span style={{ color: "var(--dim)" }}>|</span>
              <span style={{ color: "var(--accent-cleared)", fontWeight: 700 }}>
                {walletBalance} GEN
              </span>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-primary"
              style={{ fontSize: "11px", padding: "7px 16px" }}
            >
              <Wallet size={13} />
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      {/* Split Workbench Grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "380px 1fr", overflow: "hidden" }}>
        {/* Left Panel: Ingress Stream & Queue (380px) */}
        <aside
          style={{
            borderRight: "var(--border-specular)",
            backgroundColor: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 60px)",
            overflowY: "auto",
          }}
        >
          {/* Action Header */}
          <div style={{ padding: "16px 18px", borderBottom: "var(--border-specular)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span className="eyebrow-tactical">
                INGRESS STREAM ({records.length})
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setViewDensity(viewDensity === "TABLE" ? "CARDS" : "TABLE")}
                  className="btn-tactical"
                  style={{ padding: "5px 8px", fontSize: "10px" }}
                  title="Toggle Ledger Table vs Card Stream"
                >
                  {viewDensity === "TABLE" ? <LayoutList size={13} /> : <TableIcon size={13} />}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                  style={{ fontSize: "10px", padding: "6px 12px" }}
                >
                  <Plus size={13} />
                  INTAKE TARGET
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--dim)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search record ID, URL, or label…"
                className="tactical-input"
                style={{ paddingLeft: "34px", fontSize: "11px" }}
              />
            </div>

            {/* Framer-grade Filter Tabs with layoutId animated sliding pill */}
            <div
              style={{
                display: "flex",
                gap: "2px",
                marginTop: "12px",
                padding: "3px",
                backgroundColor: "var(--surface-deep)",
                borderRadius: "8px",
                border: "var(--border-specular-soft)",
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
                      padding: "6px 2px",
                      fontSize: "9px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: isSelected ? "#ffffff" : "var(--muted)",
                      zIndex: 1,
                      textAlign: "center",
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeWorkbenchFilter"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          borderRadius: "6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
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

          {/* Record Queue View */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--dim)", fontSize: "12px" }}>
                No records match current filter.
              </div>
            ) : viewDensity === "TABLE" ? (
              /* DENSE LEDGER TABLE VIEW */
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th style={{ width: "42%" }}>TARGET / ID</th>
                      <th style={{ width: "28%" }}>RISKS</th>
                      <th style={{ width: "30%", textAlign: "right" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r) => {
                      const isSelected = r.record_id === activeRecord?.record_id;
                      return (
                        <tr
                          key={r.record_id}
                          className={isSelected ? "selected" : ""}
                          onClick={() => setSelectedRecordId(r.record_id)}
                        >
                          <td>
                            <div className="mono" style={{ fontSize: "11px", fontWeight: 700, color: isSelected ? "var(--paper-bright)" : "var(--paper)" }}>
                              {r.record_id}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--muted)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "130px",
                              }}
                            >
                              {r.source_label}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "3px" }}>
                              <span className="badge-severity high">{r.high_count}</span>
                              <span className="badge-severity medium">{r.medium_count}</span>
                              <span className="badge-severity low">{r.low_count}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`badge-status ${r.state.toLowerCase()}`}>
                              {r.state}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* STREAM CARD VIEW */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredRecords.map((r) => {
                  const isSelected = r.record_id === activeRecord?.record_id;
                  return (
                    <motion.div
                      key={r.record_id}
                      onClick={() => setSelectedRecordId(r.record_id)}
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        padding: "12px 14px",
                        backgroundColor: isSelected ? "var(--surface-raised)" : "var(--surface)",
                        border: isSelected ? "1px solid rgba(6, 182, 212, 0.4)" : "var(--border-specular)",
                        borderRadius: "10px",
                        boxShadow: isSelected
                          ? "0 0 0 1px rgba(6, 182, 212, 0.3), 0 8px 24px -4px rgba(6, 182, 212, 0.2)"
                          : "var(--card-shadow)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span className="mono" style={{ fontSize: "11px", fontWeight: 700, color: isSelected ? "var(--accent-cyan)" : "var(--paper)" }}>
                          {r.record_id}
                        </span>
                        <span className={`badge-status ${r.state.toLowerCase()}`}>
                          {r.state}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--paper)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.source_label || "Untitled Target"}
                      </div>

                      <div
                        className="mono"
                        style={{
                          fontSize: "10px",
                          color: "var(--dim)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "10px",
                        }}
                      >
                        {r.source_url}
                      </div>

                      {/* Threat Counters & Decision */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "8px", borderTop: "var(--border-specular-soft)" }}>
                        <span className="badge-severity high">H: {r.high_count}</span>
                        <span className="badge-severity medium">M: {r.medium_count}</span>
                        <span className="badge-severity low">L: {r.low_count}</span>
                        <span style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--dim)" }}>
                          {r.decision}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Center/Right Panel: Active Forensic Canvas */}
        <main
          style={{
            height: "calc(100vh - 60px)",
            overflowY: "auto",
            padding: "28px 36px 64px",
            backgroundColor: "var(--bg)",
          }}
        >
          {activeRecord ? (
            <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
              {/* CONNECTED LIFECYCLE RAIL (Stages 01 - 04) */}
              <div className="lifecycle-rail">
                {/* Step 1 */}
                <div className="rail-step complete">
                  <div className="rail-step-header">
                    <span>STAGE // 01</span>
                    <CheckCircle2 size={13} style={{ color: "var(--accent-cleared)" }} />
                  </div>
                  <div className="rail-step-title">Intake Registered</div>
                  <div className="rail-step-detail">ID: {activeRecord.record_id}</div>
                </div>

                {/* Step 2 */}
                <div className="rail-step complete">
                  <div className="rail-step-header">
                    <span>STAGE // 02</span>
                    <CheckCircle2 size={13} style={{ color: "var(--accent-cleared)" }} />
                  </div>
                  <div className="rail-step-title">Bounded 16KB Fetch</div>
                  <div className="rail-step-detail">SHA-256 Digest Bound</div>
                </div>

                {/* Step 3 */}
                <div
                  className={`rail-step ${
                    activeRecord.state === "SUBMITTED"
                      ? "active"
                      : activeRecord.state === "EVALUATING"
                      ? "active"
                      : "complete"
                  }`}
                >
                  <div className="rail-step-header">
                    <span>STAGE // 03</span>
                    {activeRecord.state === "SUBMITTED" ? (
                      <span className="health-dot amber" />
                    ) : (
                      <CheckCircle2 size={13} style={{ color: "var(--accent-cleared)" }} />
                    )}
                  </div>
                  <div className="rail-step-title">Quorum Consensus</div>
                  <div className="rail-step-detail">
                    {activeRecord.state === "SUBMITTED" ? "Awaiting Quorum" : "gl.eq_principle"}
                  </div>
                </div>

                {/* Step 4 */}
                <div
                  className={`rail-step ${
                    activeRecord.state === "QUARANTINED"
                      ? "quarantined-step"
                      : activeRecord.state === "CLEARED"
                      ? "complete"
                      : ""
                  }`}
                >
                  <div className="rail-step-header">
                    <span>STAGE // 04</span>
                    {activeRecord.state === "QUARANTINED" ? (
                      <ShieldAlert size={13} style={{ color: "var(--accent-quarantined)" }} />
                    ) : activeRecord.state === "CLEARED" ? (
                      <ShieldCheck size={13} style={{ color: "var(--accent-cleared)" }} />
                    ) : (
                      <Lock size={13} style={{ color: "var(--dim)" }} />
                    )}
                  </div>
                  <div className="rail-step-title">Quarantine Boundary</div>
                  <div
                    className="rail-step-detail"
                    style={{
                      color:
                        activeRecord.state === "QUARANTINED"
                          ? "var(--accent-quarantined)"
                          : activeRecord.state === "CLEARED"
                          ? "var(--accent-cleared)"
                          : "var(--muted)",
                      fontWeight: 700,
                    }}
                  >
                    is_safe() = {activeRecord.state === "CLEARED" ? "TRUE" : "FALSE"}
                  </div>
                </div>
              </div>

              {/* Clearance Status Banner with Framer Ambient Wash */}
              {activeRecord.state === "QUARANTINED" && (
                <div
                  className="ambient-crimson-wash"
                  style={{
                    padding: "24px 28px",
                    borderRadius: "var(--radius-card)",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-quarantined)", marginBottom: "6px" }}>
                        <ShieldAlert size={22} />
                        <span className="eyebrow-tactical" style={{ color: "var(--accent-quarantined)" }}>
                          FAIL-CLOSED PERIMETER // RECORD QUARANTINED
                        </span>
                      </div>
                      <h2 className="display-font" style={{ fontSize: "24px", fontWeight: 800, margin: "6px 0 8px", letterSpacing: "-0.02em" }}>
                        Clearance Denied: {activeRecord.decision}
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5, maxWidth: "680px" }}>
                        {activeRecord.summary || "One or more medium/high severity adversarial findings detected. Downstream agent access barred."}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      <div className="eyebrow-tactical" style={{ color: "var(--dim)", marginBottom: "4px" }}>
                        ON-CHAIN: is_safe()
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-quarantined)", letterSpacing: "-0.03em" }}>
                        FALSE
                      </div>
                      <div className="mono" style={{ fontSize: "10px", color: "var(--dim)", marginTop: "4px" }}>
                        AGENT ACCESS BLOCKED
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeRecord.state === "CLEARED" && (
                <div
                  className="ambient-emerald-wash"
                  style={{
                    padding: "24px 28px",
                    borderRadius: "var(--radius-card)",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cleared)", marginBottom: "6px" }}>
                        <ShieldCheck size={22} />
                        <span className="eyebrow-tactical" style={{ color: "var(--accent-cleared)" }}>
                          CLEARANCE APPROVED // AGENT INGRESS SAFE
                        </span>
                      </div>
                      <h2 className="display-font" style={{ fontSize: "24px", fontWeight: 800, margin: "6px 0 8px", letterSpacing: "-0.02em" }}>
                        Source Verified: {activeRecord.decision}
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5, maxWidth: "680px" }}>
                        {activeRecord.summary || "Zero high or medium severity threats detected. Source content verified across consensus nodes."}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      <div className="eyebrow-tactical" style={{ color: "var(--dim)", marginBottom: "4px" }}>
                        ON-CHAIN: is_safe()
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-cleared)", letterSpacing: "-0.03em" }}>
                        TRUE
                      </div>
                      <div className="mono" style={{ fontSize: "10px", color: "var(--dim)", marginTop: "4px" }}>
                        INGRESS PERMITTED
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeRecord.state === "SUBMITTED" && (
                <div
                  className="ambient-amber-wash"
                  style={{
                    padding: "24px 28px",
                    borderRadius: "var(--radius-card)",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-amber)", marginBottom: "6px" }}>
                        <Clock size={20} />
                        <span className="eyebrow-tactical" style={{ color: "var(--accent-amber)" }}>
                          AWAITING CONSENSUS EVALUATION
                        </span>
                      </div>
                      <h2 className="display-font" style={{ fontSize: "22px", fontWeight: 800, margin: "4px 0 6px", letterSpacing: "-0.02em" }}>
                        Target registered. Quorum verification pending.
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, maxWidth: "640px" }}>
                        Execute non-deterministic web rendering and 5-point adversarial threat evaluation across the validator quorum.
                      </p>
                    </div>

                    <button
                      onClick={() => handleEvaluate(activeRecord.record_id)}
                      disabled={isEvaluating}
                      className="btn-primary"
                      style={{
                        padding: "12px 22px",
                        fontSize: "12px",
                        background: "var(--accent-amber)",
                        color: "#000000",
                        borderColor: "var(--accent-amber)",
                        boxShadow: "0 0 24px rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      {isEvaluating && evaluatingRecordId === activeRecord.record_id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          RUNNING CONSENSUS…
                        </>
                      ) : (
                        <>
                          <Terminal size={14} />
                          EXECUTE CONSENSUS
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Target Identification & Purpose Card */}
              <div className="tactical-box" style={{ padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "var(--border-specular-soft)", paddingBottom: "14px", marginBottom: "18px" }}>
                  <div>
                    <div className="eyebrow-tactical" style={{ marginBottom: "4px" }}>
                      RECORD IDENTIFIER
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono" style={{ fontSize: "18px", fontWeight: 800, color: "var(--paper-bright)" }}>
                        {activeRecord.record_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(activeRecord.record_id, "recId")}
                        style={{ color: copiedField === "recId" ? "var(--accent-cleared)" : "var(--dim)" }}
                        title="Copy ID"
                      >
                        {copiedField === "recId" ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <a
                      href={activeRecord.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactical"
                      style={{ fontSize: "11px", padding: "6px 14px" }}
                    >
                      SOURCE TARGET <ExternalLink size={12} />
                    </a>
                    <a
                      href={contractUrl(CONTRACT_ADDRESS)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactical"
                      style={{ fontSize: "11px", padding: "6px 14px" }}
                    >
                      REGISTRY CONTRACT <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <div className="eyebrow-tactical" style={{ marginBottom: "6px" }}>
                      TARGET LABEL
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--paper)" }}>
                      {activeRecord.source_label}
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow-tactical" style={{ marginBottom: "6px" }}>
                      DOWNSTREAM AGENT PURPOSE
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                      {activeRecord.agent_purpose || "General read-only research assistant."}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Threat Vector Breakdown with Visual Meter Bars */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="eyebrow-tactical">
                      5-POINT ADVERSARIAL THREAT VECTOR ANALYSIS
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--dim)" }}>
                    Quorum agreement: 100% // gl.eq_principle
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeRecord.findings.length === 0 ? (
                    <div
                      className="sunken-pit"
                      style={{
                        padding: "36px 24px",
                        textAlign: "center",
                        color: "var(--dim)",
                        fontSize: "13px",
                      }}
                    >
                      No threat findings recorded yet. Execute consensus evaluation to generate adversarial vector report.
                    </div>
                  ) : (
                    activeRecord.findings.map((f, i) => {
                      const meta = CATEGORY_META[f.category] || { label: f.category, short: f.category, weight: 50 };
                      const isHigh = f.severity === "HIGH";
                      const isMed = f.severity === "MEDIUM";

                      // Parse confidence as numeric percentage
                      const confNum = parseInt(f.confidence, 10) || 85;
                      const severityPercent = isHigh ? 100 : isMed ? 65 : 30;

                      return (
                        <div
                          key={i}
                          className="framer-card"
                          style={{
                            padding: "18px 22px",
                            borderLeft: isHigh
                              ? "3px solid var(--accent-quarantined)"
                              : isMed
                              ? "3px solid var(--accent-amber)"
                              : "3px solid var(--accent-cleared)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--paper-bright)" }}>
                                {meta.label}
                              </span>
                              <span className={`badge-severity ${f.severity.toLowerCase()}`}>
                                {f.severity}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="mono" style={{ fontSize: "11px", color: "var(--muted)" }}>
                                CONFIDENCE:
                              </span>
                              <span className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-cyan)" }}>
                                {f.confidence}
                              </span>
                            </div>
                          </div>

                          {/* Visual Meter Bar */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--dim)", marginBottom: "4px" }}>
                                <span>THREAT SEVERITY</span>
                                <span style={{ color: isHigh ? "var(--accent-quarantined)" : isMed ? "var(--accent-amber)" : "var(--accent-cleared)" }}>
                                  {severityPercent}%
                                </span>
                              </div>
                              <div className="threat-meter-track">
                                <div
                                  className="threat-meter-fill"
                                  style={{
                                    width: `${severityPercent}%`,
                                    backgroundColor: isHigh
                                      ? "var(--accent-quarantined)"
                                      : isMed
                                      ? "var(--accent-amber)"
                                      : "var(--accent-cleared)",
                                    boxShadow: isHigh
                                      ? "0 0 10px rgba(239, 68, 68, 0.5)"
                                      : isMed
                                      ? "0 0 10px rgba(245, 158, 11, 0.5)"
                                      : "0 0 10px rgba(16, 185, 129, 0.5)",
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--dim)", marginBottom: "4px" }}>
                                <span>CONSENSUS CERTAINTY</span>
                                <span style={{ color: "var(--accent-cyan)" }}>{confNum}%</span>
                              </div>
                              <div className="threat-meter-track">
                                <div
                                  className="threat-meter-fill"
                                  style={{
                                    width: `${confNum}%`,
                                    backgroundColor: "var(--accent-cyan)",
                                    boxShadow: "0 0 10px rgba(6, 182, 212, 0.5)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5, margin: "8px 0 12px" }}>
                            {f.explanation}
                          </p>

                          {/* Sunken Evidence Quote */}
                          {f.evidence_quote && (
                            <div
                              className="sunken-pit"
                              style={{
                                borderLeft: isHigh
                                  ? "2px solid var(--accent-quarantined)"
                                  : "2px solid var(--accent-cyan)",
                                padding: "10px 14px",
                                marginBottom: "10px",
                                fontSize: "11px",
                                color: isHigh ? "#fca5a5" : "var(--paper)",
                                fontFamily: "var(--font-mono)",
                                lineHeight: 1.5,
                              }}
                            >
                              <span style={{ color: "var(--dim)", marginRight: "6px" }}>RAW_EXTRACT //</span>
                              “{f.evidence_quote}”
                            </div>
                          )}

                          <div className="mono" style={{ fontSize: "10px", color: "var(--dim)" }}>
                            SOURCE POINTER // {f.source_pointer || "Direct payload"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cryptographic Proof & Receipt Drawer */}
              <div
                className="tactical-box"
                style={{
                  padding: "24px",
                  borderLeft:
                    activeRecord.state === "QUARANTINED"
                      ? "3px solid var(--accent-quarantined)"
                      : activeRecord.state === "CLEARED"
                      ? "3px solid var(--accent-cleared)"
                      : "var(--border-specular)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div className="eyebrow-tactical">
                    CRYPTOGRAPHIC RECEIPT &amp; PROOF TELEMETRY
                  </div>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--accent-cyan)" }}>
                    GENLAYER IMMUTABLE AUDIT TRAIL
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "11px" }}>
                  <div>
                    <span className="eyebrow-tactical" style={{ color: "var(--dim)", display: "block", marginBottom: "4px" }}>
                      CONTENT SHA-256 DIGEST:
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="mono" style={{ color: "var(--accent-cyan)", wordBreak: "break-all" }}>
                        {activeRecord.source_digest || "Pending execution"}
                      </span>
                      {activeRecord.source_digest && (
                        <button
                          onClick={() => copyToClipboard(activeRecord.source_digest, "digest")}
                          style={{ color: copiedField === "digest" ? "var(--accent-cleared)" : "var(--dim)" }}
                          title="Copy Digest"
                        >
                          {copiedField === "digest" ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="eyebrow-tactical" style={{ color: "var(--dim)", display: "block", marginBottom: "4px" }}>
                      RESULT FINGERPRINT:
                    </span>
                    <span className="mono" style={{ color: "var(--muted)", wordBreak: "break-all" }}>
                      {activeRecord.result_fingerprint || "00000000000000000000000000000000"}
                    </span>
                  </div>

                  <div>
                    <span className="eyebrow-tactical" style={{ color: "var(--dim)", display: "block", marginBottom: "4px" }}>
                      RECORD OWNER (CALLER):
                    </span>
                    <span className="mono" style={{ color: "var(--muted)", wordBreak: "break-all" }}>
                      {activeRecord.owner || CONTRACT_ADDRESS}
                    </span>
                  </div>

                  <div>
                    <span className="eyebrow-tactical" style={{ color: "var(--dim)", display: "block", marginBottom: "4px" }}>
                      CONSENSUS EVALUATION ATTEMPTS:
                    </span>
                    <span className="mono" style={{ color: "var(--paper-bright)" }}>
                      {activeRecord.evaluation_attempts} attempts recorded
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px", color: "var(--dim)" }}>
              No record selected. Select an ingress target from the left stream.
            </div>
          )}
        </main>
      </div>

      {/* Target Intake Modal with Framer-motion Spring Entrance */}
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
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 350 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ padding: "32px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "var(--border-specular-soft)", paddingBottom: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(6, 182, 212, 0.12)",
                      border: "1px solid rgba(6, 182, 212, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="display-font" style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                      REGISTER INGRESS TARGET
                    </h3>
                    <p style={{ fontSize: "11px", color: "var(--dim)", margin: 0 }}>
                      On-chain intake quarantine via GenLayer Intelligent Contract
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ color: "var(--dim)", padding: "4px" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div style={{ marginBottom: "20px" }}>
                <div className="eyebrow-tactical" style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={11} style={{ color: "var(--accent-cyan)" }} />
                  LOAD PRESET SCENARIO
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {PRESET_INTAKE_TARGETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="btn-tactical"
                      style={{ fontSize: "10px", padding: "5px 10px" }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateRecord}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label className="eyebrow-tactical" style={{ display: "block", marginBottom: "6px" }}>
                      RECORD ID // UNIQUE IDENTIFIER
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
                    <label className="eyebrow-tactical" style={{ display: "block", marginBottom: "6px" }}>
                      TARGET SOURCE URL (PUBLIC HTTPS ONLY)
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
                      <div className="mono" style={{ color: "var(--accent-quarantined)", fontSize: "11px", marginTop: "4px" }}>
                        {urlError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="eyebrow-tactical" style={{ display: "block", marginBottom: "6px" }}>
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
                    <label className="eyebrow-tactical" style={{ display: "block", marginBottom: "6px" }}>
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "var(--border-specular-soft)" }}>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
