import React from "react";
import { CONTRACT_ADDRESS, EXPLORER_URL, CHAIN_ID } from "../api";

export function Footer({ onSelectView }) {
  return (
    <footer className="minimal-footer">
      <div className="container">
        <div className="minimal-footer-row">
          <div>
            <span style={{ fontWeight: 700, color: "var(--color-white)", letterSpacing: "0.1em" }}>
              SOURCEFIREWALL
            </span>
            <span style={{ marginLeft: "12px", color: "var(--color-dim)" }}>
              COGNITIVE INGRESS DEFENSE PROTOCOL
            </span>
          </div>

          <div style={{ display: "flex", gap: "24px" }}>
            <button onClick={() => onSelectView("INTERCEPTOR")}>01 Interceptor</button>
            <button onClick={() => onSelectView("WORKBENCH")}>02 Workbench</button>
            <button onClick={() => onSelectView("SDK")}>03 SDK</button>
            <button onClick={() => onSelectView("ARCHITECTURE")}>04 Architecture</button>
            <a
              href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--color-white)" }}
            >
              Contract Explorer ↗
            </a>
          </div>
        </div>

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-hairline)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", color: "var(--color-dim)" }}>
          <span>GENLAYER STUDIONET // CHAIN ID {CHAIN_ID}</span>
          <span>INTELLIGENT CONTRACT: {CONTRACT_ADDRESS}</span>
          <span>© 2026 SOURCEFIREWALL PROTOCOL</span>
        </div>
      </div>
    </footer>
  );
}
