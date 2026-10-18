import React from "react";
import { CHAIN_ID, CONTRACT_ADDRESS } from "../api";

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
    <header className="site-nav">
      <div className="container site-nav-inner">
        {/* Brand */}
        <div
          style={{ cursor: "pointer" }}
          onClick={() => onSelectView("INTERCEPTOR")}
        >
          <div className="brand-title-compact">SourceFirewall // Protocol</div>
        </div>

        {/* Numbered Pill Navigation (Moore Style) */}
        <nav className="nav-links-row">
          <button
            className={`nav-link-item ${currentView === "INTERCEPTOR" ? "active" : ""}`}
            onClick={() => onSelectView("INTERCEPTOR")}
          >
            <span className="nav-num-pill">01</span>
            <span>Interceptor</span>
          </button>

          <button
            className={`nav-link-item ${currentView === "WORKBENCH" ? "active" : ""}`}
            onClick={() => onSelectView("WORKBENCH")}
          >
            <span className="nav-num-pill">02</span>
            <span>Workbench</span>
          </button>

          <button
            className={`nav-link-item ${currentView === "SDK" ? "active" : ""}`}
            onClick={() => onSelectView("SDK")}
          >
            <span className="nav-num-pill">03</span>
            <span>SDK</span>
          </button>

          <button
            className={`nav-link-item ${currentView === "ARCHITECTURE" ? "active" : ""}`}
            onClick={() => onSelectView("ARCHITECTURE")}
          >
            <span className="nav-num-pill">04</span>
            <span>Architecture</span>
          </button>
        </nav>

        {/* Network & Wallet Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="nav-status-pill">
            <span className="nav-status-dot" />
            <span>STUDIONET [{CHAIN_ID}]</span>
          </div>

          <button
            className="btn-minimal-outline"
            onClick={onToggleDemoMode}
            title="Toggle between cached demo telemetry and live RPC queries"
          >
            {isDemoMode ? "DEMO" : "LIVE RPC"}
          </button>

          {walletAccount ? (
            <div className="btn-minimal-outline">
              {walletAccount.slice(0, 6)}…{walletAccount.slice(-4)} | {walletBalance} GEN
            </div>
          ) : (
            <button className="btn-minimal-white" onClick={onConnectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
