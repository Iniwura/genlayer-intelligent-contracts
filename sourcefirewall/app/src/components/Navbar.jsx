import React from "react";
import { CHAIN_NAME, CHAIN_ID, CONTRACT_ADDRESS } from "../api";

export function Navbar({
  currentView,
  onSelectView,
  isDemoMode,
  onToggleDemoMode,
  walletAccount,
  walletBalance,
  onConnectWallet,
}) {
  return (
    <header className="cyber-nav">
      <div className="container cyber-nav-inner">
        {/* Brand */}
        <div
          className="brand-wrapper"
          onClick={() => onSelectView("INTERCEPTOR")}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-shield-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="brand-text-block">
            <div className="brand-title">SourceFirewall</div>
            <div className="brand-subtitle">Autonomous AI Ingress Protocol</div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="nav-tabs-segmented">
          <button
            className={`nav-tab-btn ${currentView === "INTERCEPTOR" ? "active" : ""}`}
            onClick={() => onSelectView("INTERCEPTOR")}
          >
            <span>⚡</span>
            <span>Live Interceptor</span>
          </button>
          <button
            className={`nav-tab-btn ${currentView === "WORKBENCH" ? "active" : ""}`}
            onClick={() => onSelectView("WORKBENCH")}
          >
            <span>🛡️</span>
            <span>SOC Workbench</span>
          </button>
          <button
            className={`nav-tab-btn ${currentView === "SDK" ? "active" : ""}`}
            onClick={() => onSelectView("SDK")}
          >
            <span>💻</span>
            <span>Developer SDK</span>
          </button>
          <button
            className={`nav-tab-btn ${currentView === "ARCHITECTURE" ? "active" : ""}`}
            onClick={() => onSelectView("ARCHITECTURE")}
          >
            <span>📐</span>
            <span>Architecture</span>
          </button>
        </nav>

        {/* Status & Wallet Actions */}
        <div className="nav-actions">
          {/* Network Indicator */}
          <div className="network-pill" title={`Chain ID: ${CHAIN_ID} | Contract: ${CONTRACT_ADDRESS}`}>
            <span className="beacon-dot" />
            <span>Studionet [61999]</span>
          </div>

          {/* Mode Switcher */}
          <button
            className="btn-cyber-outline mono"
            onClick={onToggleDemoMode}
            style={{ fontSize: "11px", padding: "5px 10px" }}
            title="Toggle between cached simulation telemetry and live GenLayer RPC queries"
          >
            {isDemoMode ? "DEMO DATA" : "LIVE RPC"}
          </button>

          {/* Wallet Action */}
          {walletAccount ? (
            <div
              className="btn-cyber-outline mono"
              style={{
                borderColor: "rgba(99, 102, 241, 0.4)",
                color: "#C7D2FE",
                fontSize: "12px",
              }}
            >
              <span>{walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}</span>
              <span style={{ color: "var(--text-dim)" }}>|</span>
              <span style={{ color: "var(--cleared-emerald)" }}>{walletBalance} GEN</span>
            </div>
          ) : (
            <button className="btn-cyber-primary" onClick={onConnectWallet}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h0M2 10h20" />
              </svg>
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
