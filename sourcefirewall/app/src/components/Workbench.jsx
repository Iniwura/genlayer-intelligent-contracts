import React, { useState, useMemo } from "react";
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
  FileCode,
  Clock,
  X,
  LayoutList,
  Table as TableIcon,
  CheckCircle2,
  Lock,
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
      onNotify("Connect a browser wallet (such as MetaMask) on GenLayer Studionet to execute on-chain evaluation.", "error");
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Workbench Header Topbar */}
      <header
        style={{
          borderBottom: "var(--line)",
          backgroundColor: "var(--surface)",
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
            style={{ fontSize: "10px", padding: "5px 10px" }}
            title="Return to Landing Page"
          >
            <ArrowLeft size={12} />
            LANDING
          </button>
          <div style={{ height: "16px", width: "1px", backgroundColor: "var(--line-color)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="display-font"
              style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.02em" }}
            >
              SOURCE<span style={{ color: "var(--accent-cleared)" }}>FIREWALL</span>
            </span>
            <span className="mono" style={{ color: "var(--dim)", fontSize: "11px" }}>
              // OPERATIONAL_DESK
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
              padding: "4px 10px",
              backgroundColor: "var(--surface-deep)",
              border: "var(--line)",
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
                backgroundColor: "var(--surface-deep)",
                border: "var(--line-focus)",
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
              style={{ fontSize: "11px", padding: "6px 14px" }}
            >
              <Wallet size={12} />
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      {/* Split Workbench Grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "390px 1fr", overflow: "hidden" }}>
        {/* Left Panel: Ingress Stream & Queue */}
        <aside
          style={{
            borderRight: "var(--line)",
            backgroundColor: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 92px)",
            overflowY: "auto",
          }}
        >
          {/* Action Header */}
          <div style={{ padding: "16px 20px", borderBottom: "var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span className="eyebrow-tactical">
                INGRESS STREAM ({records.length})
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setViewDensity(viewDensity === "TABLE" ? "CARDS" : "TABLE")}
                  className="btn-tactical"
                  style={{ padding: "4px 8px", fontSize: "10px" }}
                  title="Toggle Ledger Table vs Card Stream"
                >
                  {viewDensity === "TABLE" ? <LayoutList size={12} /> : <TableIcon size={12} />}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                  style={{ fontSize: "10px", padding: "5px 10px" }}
                >
                  <Plus size={12} />
                  NEW TARGET
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "11px", color: "var(--dim)" }} />
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
                      fontWeight: 700,
                      backgroundColor: isSelected ? "var(--surface-raised)" : "transparent",
                      border: isSelected ? "var(--line-focus)" : "1px solid transparent",
                      color: isSelected ? "var(--paper)" : "var(--muted)",
                      transition: "all var(--motion-fast) var(--ease-surgical)",
                    }}
                  >
                    {filter} ({badgeCount})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Record Queue View */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--dim)", fontSize: "12px" }}>
                No records match current filter.
              </div>
            ) : viewDensity === "TABLE" ? (
              /* DENSE LEDGER TABLE VIEW (Dissent Standard) */
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
                            <div className="mono" style={{ fontSize: "11px", fontWeight: 700 }}>
                              {r.record_id}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--muted)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "140px",
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
              filteredRecords.map((r) => {
                const isSelected = r.record_id === activeRecord?.record_id;
                return (
                  <div
                    key={r.record_id}
                    onClick={() => setSelectedRecordId(r.record_id)}
                    style={{
                      padding: "12px 14px",
                      marginBottom: "6px",
                      backgroundColor: isSelected ? "var(--surface-raised)" : "var(--surface-deep)",
                      border: isSelected ? "var(--line-focus)" : "var(--line)",
                      borderLeft: isSelected ? "3px solid var(--accent-cyan)" : "var(--line)",
                      cursor: "pointer",
                      transition: "all var(--motion-fast) var(--ease-surgical)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="mono" style={{ fontSize: "11px", fontWeight: 700 }}>
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
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--dim)" }}>
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
            height: "calc(100vh - 92px)",
            overflowY: "auto",
            padding: "24px 32px 48px",
            backgroundColor: "var(--bg)",
          }}
        >
          {activeRecord ? (
            <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
              {/* CONNECTED LIFECYCLE RAIL (Veil & ConsentGate Standard) */}
              <div className="lifecycle-rail">
                {/* Step 1 */}
                <div className="rail-step complete">
                  <div className="rail-step-header">
                    <span>STAGE // 01</span>
                    <CheckCircle2 size={12} style={{ color: "var(--accent-cleared)" }} />
                  </div>
                  <div className="rail-step-title">Intake Registered</div>
                  <div className="rail-step-detail">ID: {activeRecord.record_id}</div>
                </div>

                {/* Step 2 */}
                <div className="rail-step complete">
                  <div className="rail-step-header">
                    <span>STAGE // 02</span>
                    <CheckCircle2 size={12} style={{ color: "var(--accent-cleared)" }} />
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
                      <CheckCircle2 size={12} style={{ color: "var(--accent-cleared)" }} />
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
                      <ShieldAlert size={12} style={{ color: "var(--accent-quarantined)" }} />
                    ) : activeRecord.state === "CLEARED" ? (
                      <ShieldCheck size={12} style={{ color: "var(--accent-cleared)" }} />
                    ) : (
                      <Lock size={12} style={{ color: "var(--dim)" }} />
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

              {/* Clearance Status Banner */}
              {activeRecord.state === "QUARANTINED" && (
                <div
                  className="hazard-stripe-quarantine"
                  style={{
                    padding: "20px 24px",
                    borderRadius: "2px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-quarantined)", marginBottom: "4px" }}>
                        <ShieldAlert size={20} />
                        <span className="eyebrow-tactical" style={{ color: "var(--accent-quarantined)" }}>
                          FAIL-CLOSED PERIMETER // RECORD QUARANTINED
                        </span>
                      </div>
                      <h2 className="display-font" style={{ fontSize: "22px", fontWeight: 800, margin: "6px 0 8px" }}>
                        Clearance Denied: {activeRecord.decision}
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5, maxWidth: "700px" }}>
                        {activeRecord.summary || "One or more medium/high severity adversarial findings detected. Downstream agent access barred."}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      <div className="eyebrow-tactical" style={{ color: "var(--dim)", marginBottom: "2px" }}>
                        ON-CHAIN CALL: is_safe()
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-quarantined)" }}>
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
                        <span className="eyebrow-tactical" style={{ color: "var(--accent-cleared)" }}>
                          CLEARANCE APPROVED // AGENT INGRESS SAFE
                        </span>
                      </div>
                      <h2 className="display-font" style={{ fontSize: "22px", fontWeight: 800, margin: "6px 0 8px" }}>
                        Source Verified: {activeRecord.decision}
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5, maxWidth: "700px" }}>
                        {activeRecord.summary || "Zero high or medium severity threats detected. Source content verified across consensus nodes."}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      <div className="eyebrow-tactical" style={{ color: "var(--dim)", marginBottom: "2px" }}>
                        ON-CHAIN CALL: is_safe()
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-cleared)" }}>
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
                        <span className="eyebrow-tactical" style={{ color: "var(--accent-amber)" }}>
                          AWAITING CONSENSUS EVALUATION
                        </span>
                      </div>
                      <h2 className="display-font" style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0" }}>
                        Target registered. Multi-validator consensus pending.
                      </h2>
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "var(--line)", paddingBottom: "12px", marginBottom: "16px" }}>
                  <div>
                    <div className="eyebrow-tactical" style={{ marginBottom: "2px" }}>
                      RECORD IDENTIFIER
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono" style={{ fontSize: "16px", fontWeight: 800 }}>
                        {activeRecord.record_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(activeRecord.record_id, "recId")}
                        style={{ color: copiedField === "recId" ? "var(--accent-cleared)" : "var(--dim)" }}
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
                      style={{ fontSize: "10px", padding: "6px 12px" }}
                    >
                      SOURCE TARGET <ExternalLink size={12} />
                    </a>
                    <a
                      href={contractUrl(CONTRACT_ADDRESS)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactical"
                      style={{ fontSize: "10px", padding: "6px 12px" }}
                    >
                      REGISTRY CONTRACT <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <div className="eyebrow-tactical" style={{ marginBottom: "4px" }}>
                      TARGET LABEL
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{activeRecord.source_label}</div>
                  </div>
                  <div>
                    <div className="eyebrow-tactical" style={{ marginBottom: "4px" }}>
                      DOWNSTREAM AGENT PURPOSE
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.45 }}>
                      {activeRecord.agent_purpose || "General read-only research assistant."}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Threat Vector Breakdown */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span className="eyebrow-tactical">
                    5-POINT THREAT VECTOR ANALYSIS
                  </span>
                  <span className="mono" style={{ fontSize: "10px", color: "var(--dim)" }}>
                    Quorum agreement: 100%
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {activeRecord.findings.length === 0 ? (
                    <div
                      style={{
                        padding: "24px",
                        backgroundColor: "var(--surface)",
                        border: "var(--line)",
                        textAlign: "center",
                        color: "var(--dim)",
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
                            backgroundColor: "var(--surface)",
                            border: isHigh
                              ? "1px solid var(--accent-quarantined-border)"
                              : isMed
                              ? "1px solid var(--accent-amber-border)"
                              : "var(--line)",
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
                            <span className="mono" style={{ fontSize: "10px", color: "var(--dim)" }}>
                              CONFIDENCE: {f.confidence}
                            </span>
                          </div>

                          <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, margin: "6px 0 10px" }}>
                            {f.explanation}
                          </p>

                          {f.evidence_quote && (
                            <div
                              style={{
                                backgroundColor: "var(--surface-deep)",
                                borderLeft: "2px solid var(--line-active)",
                                padding: "8px 12px",
                                marginBottom: "8px",
                                fontSize: "11px",
                                color: isHigh ? "#fca5a5" : "var(--paper)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              “{f.evidence_quote}”
                            </div>
                          )}

                          <div className="mono" style={{ fontSize: "9px", color: "var(--dim)" }}>
                            SOURCE POINTER // {f.source_pointer || "Not specified"}
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
                  padding: "20px",
                  borderLeft:
                    activeRecord.state === "QUARANTINED"
                      ? "3px solid var(--accent-quarantined)"
                      : activeRecord.state === "CLEARED"
                      ? "3px solid var(--accent-cleared)"
                      : "var(--line)",
                }}
              >
                <div className="eyebrow-tactical" style={{ marginBottom: "14px" }}>
                  CRYPTOGRAPHIC RECEIPT &amp; PROOF TELEMETRY
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "11px" }}>
                  <div>
                    <span className="eyebrow-tactical" style={{ color: "var(--dim)", display: "block", marginBottom: "4px" }}>
                      CONTENT SHA-256 DIGEST:
                    </span>
                    <span className="mono" style={{ color: "var(--accent-cyan)", wordBreak: "break-all" }}>
                      {activeRecord.source_digest || "Pending execution"}
                    </span>
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
                    <span className="mono" style={{ color: "var(--paper)" }}>
                      {activeRecord.evaluation_attempts} attempts recorded
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "64px", color: "var(--dim)" }}>
              No record selected. Select a target from the left queue.
            </div>
          )}
        </main>
      </div>

      {/* Intake Modal: Register New Inspection Target */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content tactical-box" onClick={(e) => e.stopPropagation()} style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "var(--line)", paddingBottom: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} style={{ color: "var(--accent-cleared)" }} />
                <h3 className="display-font" style={{ fontSize: "16px", fontWeight: 700 }}>
                  REGISTER NEW INGRESS TARGET
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ color: "var(--dim)" }}>
                <X size={18} />
              </button>
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
                    placeholder="source-001"
                    className="tactical-input"
                    required
                  />
                </div>

                <div>
                  <label className="eyebrow-tactical" style={{ display: "block", marginBottom: "6px" }}>
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
                  <label className="eyebrow-tactical" style={{ display: "block", marginBottom: "6px" }}>
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
                  <label className="eyebrow-tactical" style={{ display: "block", marginBottom: "6px" }}>
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

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "var(--line)" }}>
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
