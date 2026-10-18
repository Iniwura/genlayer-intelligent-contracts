# SourceFirewall

> **Cognitive Ingress Defense Protocol for Autonomous AI Agents on GenLayer**

[![GenLayer Studionet](https://img.shields.io/badge/GenLayer-Studionet%20(61999)-black?style=flat&logo=ethereum)](https://studio.genlayer.com)
[![Contract](https://img.shields.io/badge/Contract-0x3b5E...953E-white?style=flat&logo=solidity)](https://explorer-bradbury.genlayer.com/address/0x3b5E8363E513BD562063282830492963dD81953E)
[![Frontend](https://img.shields.io/badge/Live%20App-sourcefirewall.vercel.app-emerald?style=flat)](https://sourcefirewall.vercel.app)
[![Tests](https://img.shields.io/badge/pytest-31%2F31%20passing-10B981?style=flat)](https://github.com/Iniwura/genlayer-intelligent-contracts)

SourceFirewall is a fail-closed, consensus-backed semantic ingress defense layer. It intercepts untrusted external source documents—including web scrapes, user uploads, vendor data feeds, and prompt strings—before autonomous downstream AI agents consume them.

By executing semantic threat evaluations inside a native GenLayer Intelligent Contract, SourceFirewall enforces decentralized, multi-validator Byzantine fault-tolerant agreement on whether an ingress payload is safe to process.

---

## 1. Product Concept: Fail-Closed Cognitive Defense

Autonomous agents operating in production face an existential threat: **indirect prompt injection and adversarial ingress manipulation**. When an agent fetches external web pages, API responses, or documents, malicious actors can embed directives that hijack the agent's goal, extract confidential keys, or trigger unauthorized on-chain transactions.

Traditional perimeter firewalls only filter network-level packets and known regex signatures. SourceFirewall operates at the **cognitive layer**:

1. **Untrusted Ingress Quarantined**: Any external document or web URL is registered on-chain via `create_record()`. All records default strictly to `SUBMITTED` / `NOT_EVALUATED` state.
2. **Validator Consensus Evaluation**: Independent GenLayer validators fetch the source payload, render its text non-deterministically, and run structured semantic threat evaluations against the agent's stated operational purpose.
3. **Fail-Closed Gatekeeper (`is_safe`)**: Downstream agents and smart contracts query `is_safe(record_id)`. Unless the multi-validator quorum confirms `state == CLEARED` and `decision == ALLOW`, `is_safe()` returns `FALSE`, preventing unauthorized agent execution.

```
       [ Untrusted Source Ingress ] (Web Scraping, API, Document, PDF)
                    │
                    ▼
       ┌───────────────────────────┐
       │     SourceFirewall        │  ◄── GenLayer Intelligent Contract
       │   Intelligent Contract    │      (0x3b5E8363...dD81953E)
       └─────────────┬─────────────┘
                     │  Leader fetches URL & runs LLM evaluation
                     │  Observer validators verify semantic equivalence
                     ▼
       ┌───────────────────────────┐
       │   Multi-Validator Quorum  │
       │    Byzantine Agreement    │
       └─────────────┬─────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    [ THREAT INTERCEPTED ]  [ CERTIFIED SAFE ]
    Decision: BLOCK/REVIEW   Decision: ALLOW
    is_safe() = FALSE        is_safe() = TRUE
         │                       │
         ▼                       ▼
    Agent Quarantined        Agent Consumes Clean
    Zero-Trust Isolated      Verified Ingress
```

---

## 2. The 5-Point Semantic Threat Matrix

SourceFirewall audits every ingress payload against a standardized 5-point adversarial threat taxonomy:

| Vector | Identifier | Description | Interception Threshold |
| :--- | :--- | :--- | :--- |
| **01** | `PROMPT_INJECTION` | Direct or indirect instructions commanding the downstream LLM to ignore safety guardrails or system prompts. | **HIGH** $\rightarrow$ `BLOCK` |
| **02** | `INSTRUCTION_HIJACKING` | Semantic attempts to alter the agent's defined operational purpose, change its persona, or execute out-of-scope directives. | **HIGH** $\rightarrow$ `BLOCK` |
| **03** | `SECRET_EXFILTRATION` | Embedded directives designed to solicit or exfiltrate environment variables, API credentials, private keys, or canary tokens. | **HIGH** $\rightarrow$ `BLOCK` |
| **04** | `MALICIOUS_TOOL_REDIRECTION` | Fabricated tool-use or function-calling syntax intended to coerce the agent into unauthorized transactions or malicious external webhooks. | **HIGH** $\rightarrow$ `BLOCK` |
| **05** | `UNSUPPORTED_CLAIMS` | Critical factual claims asserted without verifiable empirical citations or supporting documentation within the payload. | **MEDIUM** $\rightarrow$ `REVIEW` |

Every finding recorded on-chain includes:
- `category`: Exactly one of the 5 vectors.
- `severity`: `LOW`, `MEDIUM`, or `HIGH`.
- `confidence`: `LOW`, `MEDIUM`, or `HIGH`.
- `evidence_quote`: Direct source quote containing the violation (redacted of private credentials).
- `source_pointer`: Document section or paragraph where the anomaly was detected.
- `explanation`: Contextual rationale explaining why the indicator breaches security boundaries.

---

## 3. GenLayer Intelligent Contract Integration

SourceFirewall is implemented as a native GenLayer Intelligent Contract in [`sourcefirewall/contracts/source_firewall.py`](sourcefirewall/contracts/source_firewall.py).

### Non-Deterministic Consensus (`gl.vm.run_nondet`)
Because language models are non-deterministic, SourceFirewall leverages GenLayer's equivalence principle to achieve deterministic consensus:

```python
def evaluate() -> dict[str, Any]:
    # Leader node fetches external web page and executes evaluation prompt
    return _evaluate(snapshot)

def validate(leader_result: gl.vm.Result) -> bool:
    # Validator observers fetch source and verify semantic equivalence
    return _consensus_equivalent(leader_result.calldata, _evaluate(snapshot))

result = _validate_result(gl.vm.run_nondet(evaluate, validate))
```

### Strict Equivalence Verification
Consensus equivalence (`_consensus_equivalent`) ensures that:
- The final `status` (`CLEARED`, `QUARANTINED`, `UNRESOLVED`) matches.
- The final `decision` (`ALLOW`, `REVIEW`, `BLOCK`) matches.
- The `source_digest` (SHA-256 hash of fetched text) matches bit-for-bit.
- The distribution of `high_count`, `medium_count`, and `low_count` matches.
- The ordered categories and severities of all 5 findings align across validators.

### On-Chain Cryptographic Proof Ledger
When consensus is reached, the contract registers an immutable record:
- **`result_fingerprint`**: SHA-256 hash binding the record ID, source URL, source digest, decision, summary, and findings.
- **`source_digest`**: Cryptographic fingerprint of the evaluated source content.
- **`evaluation_attempts`**: Number of independent validation rounds executed.
- **`is_safe(record_id)`**: Constant-time view method for external contracts and agents:
  ```python
  @gl.public.view
  def is_safe(self, record_id: str) -> bool:
      record = self.records.get(_identifier(record_id, "record_id"), None)
      return record is not None and record.state == CLEARED and record.decision == ALLOW
  ```

---

## 4. UX Architecture: Master-Detail Workflow

The frontend ([`sourcefirewall/app/`](sourcefirewall/app/)) follows a Swiss Brutalist aesthetic benchmarked to high-contrast monochrome design principles.

### Master View: Global Ledger Dashboard (Home State)
When connected to GenLayer Studionet, users land directly on the **Global Ledger Dashboard**:
- **Top-Level KPI Metrics**:
  - `Total Payloads Processed`: Real-time counter of on-chain ingress records.
  - `Active Quarantines`: Number of intercepted payloads with threat interception percentage badge.
  - `Contract Status`: Live indicator connected to GenLayer Studionet (Chain ID `61999`).
- **Global Ledger Table**:
  - Interactive table displaying Record ID, Downstream Target Purpose, Source Stream (label & URL), and Consensus Status (`THREAT INTERCEPTED` vs `CERTIFIED SAFE`).
  - Search filter by record ID, target purpose, or URL, plus filter tabs (`ALL`, `QUARANTINED`, `CLEARED`).
  - `↻ Refresh Ledger` button querying live Studionet RPC.

### Detail View: Deep Threat Rationale & Proof Ledger
Clicking any record in the table opens its dedicated **Target Detail View**:
- **Minimal Navigation**: `← Back to Ledger` navigation button at the top left to seamlessly return to the global stream.
- **Threat Status Card**: Plain-English threat verdict with high-contrast alert reserved strictly for active threats.
- **Threat Rationale Box**: Elevated focal point displaying validator consensus explanation and extracted evidence quote.
- **Ingress Comparison**: Side-by-side inspection of untrusted source text vs. permitted agent purpose.
- **Validator Votes**: Visual quorum consensus breakdown (3/3 agreement).
- **On-Chain Verification Ledger**: Cryptographic ledger displaying SHA-256 source digest, result fingerprint, smart contract link, and evaluation attempts.

---

## 5. Live Deployments & Network Details

### Smart Contract
- **Contract Address**: [`0x3b5E8363E513BD562063282830492963dD81953E`](https://explorer-bradbury.genlayer.com/address/0x3b5E8363E513BD562063282830492963dD81953E)
- **Deployment Transaction**: `0xd29f4293365f096c9cc817c424f1a2c81c41e4a9353fa93af6fd89a52cf3aa08`
- **Network**: GenLayer Studionet / Testnet Bradbury
- **Chain ID**: `61999`
- **RPC Endpoints**:
  - Primary: `https://studio.genlayer.com/api`
  - Studio Next: `https://studio-next.genlayer.com/api`

### Production Web Application
- **Live URL**: [https://sourcefirewall.vercel.app](https://sourcefirewall.vercel.app)
- **Interactive Ledger Preview**: [https://sourcefirewall.vercel.app/?preview=ledger#app](https://sourcefirewall.vercel.app/?preview=ledger#app)

---

## 6. Historical Batch Telemetry

The smart contract is populated with on-chain evaluated records across diverse threat scenarios:

| Record ID | Source Label | Decision | State | Status Verdict |
| :--- | :--- | :--- | :--- | :--- |
| `REC-LIVE-001` | Semantic Registry Doc | `REVIEW` | `QUARANTINED` | **THREAT INTERCEPTED** |
| `REC-LIVE-002` | Decentralized Consensus Whitepaper | `REVIEW` | `QUARANTINED` | **THREAT INTERCEPTED** |
| `REC-LIVE-003` | Adversarial Advisory Stream #9920 | `NOT_EVALUATED` | `SUBMITTED` | **THREAT INTERCEPTED** |
| `REC-LIVE-004` | Support Ticket Ingress #41029 | `BLOCK` | `QUARANTINED` | **THREAT INTERCEPTED** |
| `REC-LIVE-005` | Supplier Invoice Feed #9921 | `BLOCK` | `QUARANTINED` | **THREAT INTERCEPTED** |
| `REC-LIVE-006` | Q4 Market Intelligence Briefing | `BLOCK` | `QUARANTINED` | **THREAT INTERCEPTED** |
| `REC-LIVE-007` | ERC-20 Standard Interface Doc | `ALLOW` | `CLEARED` | **CERTIFIED SAFE** |

To populate additional batch scenarios at any time, execute the backend script:
```bash
python populate_ledger.py
```

---

## 7. Development & Verification

### Running Smart Contract Unit Tests
The contract test suite verifies bounded storage, HTTPS source sanitization, fail-closed defaults, and consensus equivalence across 31 direct test cases:
```bash
# Activate Python environment
.\.venv\Scripts\pytest sourcefirewall\tests
```
```
31 passed in 0.52s (100%)
```

### Running the Frontend Locally
```bash
cd sourcefirewall/app
npm install
npm run dev
```

### Building for Production
```bash
cd sourcefirewall/app
npm run build
```

---

## 8. License & Attribution

Built for the **GenLayer Builder Program** by Iniwura Akuru.  
Licensed under the [MIT License](LICENSE).
