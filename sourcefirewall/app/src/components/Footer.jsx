import React from "react";
import { CONTRACT_ADDRESS, EXPLORER_URL } from "../api";

export function Footer({ onSelectView }) {
  return (
    <footer className="cyber-footer">
      <div className="container footer-inner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px", color: "var(--text-white)", fontWeight: 700 }}>SourceFirewall</span>
            <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", padding: "2px 6px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
              v1.2-PRODUCTION
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "420px" }}>
            The decentralized cognitive ingress defense protocol for autonomous AI agents on GenLayer Studionet.
          </p>
        </div>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "12px" }}>
          <button onClick={() => onSelectView("INTERCEPTOR")} style={{ color: "var(--text-secondary)" }}>
            Live Interceptor
          </button>
          <button onClick={() => onSelectView("WORKBENCH")} style={{ color: "var(--text-secondary)" }}>
            SOC Workbench
          </button>
          <button onClick={() => onSelectView("SDK")} style={{ color: "var(--text-secondary)" }}>
            Developer SDK
          </button>
          <button onClick={() => onSelectView("ARCHITECTURE")} style={{ color: "var(--text-secondary)" }}>
            Architecture
          </button>
          <a
            href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#818CF8" }}
          >
            Contract Explorer ↗
          </a>
        </div>
      </div>

      <div className="container" style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "11px", color: "var(--text-dim)" }}>
        <span className="mono">GENLAYER STUDIONET // CHAIN ID 61999</span>
        <span className="mono">DEPLOYED AT {CONTRACT_ADDRESS}</span>
      </div>
    </footer>
  );
}
