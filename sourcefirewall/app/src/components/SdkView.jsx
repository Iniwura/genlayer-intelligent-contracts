import React, { useState } from "react";
import { CONTRACT_ADDRESS, CHAIN_ID } from "../api";

export function SdkView({ onNotify }) {
  const [activeLang, setActiveLang] = useState("python");

  const copyCode = (code) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      onNotify?.("Code copied to clipboard!", "success");
    }
  };

  const pythonCode = `from sourcefirewall import IngressGuard, IngressQuarantineException

# 1. Initialize firewall client connected to GenLayer Studionet
firewall = IngressGuard(
    contract_address="${CONTRACT_ADDRESS}",
    rpc_url="https://studio.genlayer.com/api",
    chain_id=${CHAIN_ID}
)

async def safe_agent_pipeline(untrusted_url: str, agent):
    """
    Guarantees fail-closed cognitive isolation. If external content has not
    been certified safe by GenLayer multi-validator quorum, execution halts.
    """
    # 2. Single-line deterministic on-chain query
    if not await firewall.is_safe(untrusted_url):
        raise IngressQuarantineException(
            f"Adversarial payload blocked by GenLayer Quorum: {untrusted_url}"
        )

    # 3. Safe to inject into agent prompt context or RAG memory
    certified_content = await fetch_source(untrusted_url)
    return await agent.run(input=certified_content)`;

  const tsCode = `import { SourceFirewallClient } from "@sourcefirewall/sdk";

// Initialize firewall with GenLayer Studionet contract
const firewall = new SourceFirewallClient({
  contractAddress: "${CONTRACT_ADDRESS}",
  chainId: ${CHAIN_ID},
  rpcUrl: "https://studio.genlayer.com/api"
});

export async function guardAgentIngress(targetUrl: string, agent: any) {
  // Query GenLayer on-chain certified status
  const isSafe = await firewall.isSafe(targetUrl);

  if (!isSafe) {
    console.warn("[SourceFirewall] Ingress quarantined: " + targetUrl);
    throw new Error("Ingress Quarantined: Adversarial intent detected by quorum.");
  }

  // Certified safe for cognitive intake
  return await agent.execute({ contextUrl: targetUrl });
}`;

  const contractCode = `# GenLayer Intelligent Contract (contracts/sourcefirewall.py)
import genlayer.py.storage as Storage
import genlayer.py.builders as Builders

class SourceFirewall:
    def __init__(self):
        self._records = Storage.Map()
        self._url_to_id = Storage.Map()

    @gl.public.view
    def is_safe(self, source_url: str) -> bool:
        """
        Deterministic view method callable by any downstream agent contract.
        Guarantees fail-closed default: unknown or quarantined URLs return False.
        """
        record_id = self._url_to_id.get(source_url)
        if not record_id:
            return False  # Fail-closed default
        record = self._records[record_id]
        return record.state == "CLEARED" and record.decision == "ALLOW"`;

  return (
    <div className="container" style={{ padding: "40px 24px 80px" }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div className="hero-tag">
          <span>DEVELOPER SDK & ON-CHAIN GATEWAY</span>
        </div>
        <h1 style={{ fontSize: "36px", fontWeight: 700, color: "var(--text-white)", marginBottom: "14px" }}>
          Fail-Closed Security for Agent Loops
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "680px", margin: "0 auto" }}>
          Integrate GenLayer cognitive protection into LangChain, AutoGen, CrewAI, or raw OpenAI/Anthropic pipelines in under 3 minutes.
        </p>
      </div>

      {/* Code Terminal */}
      <div className="code-terminal-card">
        <div className="code-terminal-header">
          <div className="code-tabs">
            <button
              className={`code-tab-btn ${activeLang === "python" ? "active" : ""}`}
              onClick={() => setActiveLang("python")}
            >
              Python (LangChain / AutoGen)
            </button>
            <button
              className={`code-tab-btn ${activeLang === "ts" ? "active" : ""}`}
              onClick={() => setActiveLang("ts")}
            >
              TypeScript / Node.js
            </button>
            <button
              className={`code-tab-btn ${activeLang === "contract" ? "active" : ""}`}
              onClick={() => setActiveLang("contract")}
            >
              GenLayer Contract (Python)
            </button>
          </div>

          <button
            className="btn-cyber-outline"
            style={{ fontSize: "11px", padding: "4px 10px" }}
            onClick={() =>
              copyCode(
                activeLang === "python" ? pythonCode : activeLang === "ts" ? tsCode : contractCode
              )
            }
          >
            📋 Copy Code
          </button>
        </div>

        <pre className="code-body">
          <code>
            {activeLang === "python" && pythonCode}
            {activeLang === "ts" && tsCode}
            {activeLang === "contract" && contractCode}
          </code>
        </pre>
      </div>

      {/* Quick Setup Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <div className="cyber-card" style={{ padding: "24px" }}>
          <div className="mono" style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>STEP 01</div>
          <h3 style={{ fontSize: "16px", color: "var(--text-white)", marginBottom: "8px" }}>Install SDK</h3>
          <div className="mono" style={{ background: "var(--bg-sunken)", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#818CF8", marginBottom: "8px" }}>
            pip install sourcefirewall
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Compatible with Python 3.10+, asyncio, and all major LLM orchestration frameworks.
          </p>
        </div>

        <div className="cyber-card" style={{ padding: "24px" }}>
          <div className="mono" style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>STEP 02</div>
          <h3 style={{ fontSize: "16px", color: "var(--text-white)", marginBottom: "8px" }}>Configure Contract</h3>
          <div className="mono" style={{ background: "var(--bg-sunken)", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "var(--cleared-emerald)", marginBottom: "8px" }}>
            CHAIN_ID = 61999
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Deployed on GenLayer Studionet with instant non-blocking state reads.
          </p>
        </div>

        <div className="cyber-card" style={{ padding: "24px" }}>
          <div className="mono" style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>STEP 03</div>
          <h3 style={{ fontSize: "16px", color: "var(--text-white)", marginBottom: "8px" }}>Fail-Closed Gate</h3>
          <div className="mono" style={{ background: "var(--bg-sunken)", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#F43F5E", marginBottom: "8px" }}>
            assert is_safe(url)
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Halts execution automatically before adversarial payloads touch downstream agent context.
          </p>
        </div>
      </div>
    </div>
  );
}
