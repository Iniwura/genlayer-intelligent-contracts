# SourceFirewall evidence log

This log records verified local, repository, and public-release evidence. It does not contain fabricated deployment or transaction proof. GEN spending and on-chain writes remain approval-gated.

## Starting state

- Source repository: `https://github.com/Iniwura/genlayer-intelligent-contracts`
- Working branch: `feat/sourcefirewall`
- Implementation subtree: `sourcefirewall/`
- Starting commit for this audit: `f0dce4ccf9cbc51e9f769a7bacb18cb8b5191874` (`Record SourceFirewall release evidence`).
- Existing root contracts and unrelated work were preserved.
- No SourceFirewall contract deployment, contract write, paid transaction, or GEN spend has been attempted.

## Confirmed contract/runtime findings

- SourceFirewall uses the modern Studio Dev/Next-style API and pins runner identifier `1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh`; Direct Mode resolves it from the cached `v0.3.0-rc7` bundle.
- The cached pinned SDK contains `genlayer/_internal/get_schema.py` and does not contain `genlayer/py/get_schema.py`.
- Installed `genvm-linter` is `0.11.0`; its semantic loader hard-imports the legacy `genlayer.py.get_schema` path. The combined-check failure is a linter/SDK layout mismatch, not a contract import failure and not a reason to add a shim.
- The supported local Studio validation path is Direct Mode through `genlayer-test 0.29.2`, with the cached Studio SDK paths loaded by `tests/conftest.py`.
- The current `gl.nondet.web.render` API does not expose a final redirect URL or redirect policy. Submitted-URL validation and digest binding remain active, but final redirect destination enforcement is a pre-production blocker.

## Verified implementation checks

Commands run from the repository root:

```text
py -m pytest sourcefirewall\tests -q
```

Result: `31 passed`.

```text
$env:PYTHONUTF8='1'; & 'C:\Users\DELL 7400\AppData\Local\Programs\Python\Python314\Scripts\genvm-lint.exe' check sourcefirewall\contracts\source_firewall.py
```

Result: the fast AST stage passed (`3 checks`), then the combined command exited `1` because the linter's semantic SDK validation could not load the current SDK layout and reported `No module named 'genlayer.py'`; this is a tool/runtime mismatch, not a claimed validation pass.

```text
$env:PYTHONUTF8='1'; & 'C:\Users\DELL 7400\AppData\Local\Programs\Python\Python314\Scripts\genvm-lint.exe' lint sourcefirewall\contracts\source_firewall.py
```

Result: exit `0`, `Lint passed (3 checks)`.

```text
$env:PATH='C:\Users\DELL 7400\AppData\Local\Programs\Python\Python314\Scripts;' + $env:PATH; $env:PYTHONUTF8='1'; & 'C:\Users\DELL 7400\AppData\Local\Programs\Python\Python314\Scripts\genvm-lint.exe' typecheck sourcefirewall\contracts\source_firewall.py --json
```

Result: `ok: true`, zero diagnostics.

```text
npm install --no-audit --no-fund
npm run build
```

Result: the hardened Vite `8.3.4` production build passed with 462 modules transformed. Vite emitted only a bundle-size advisory for the GenLayer client chunk.

```text
npm audit --json
npm audit --omit=dev --json
```

Result after upgrading `vite` to `8.3.4` and `@vitejs/plugin-react` to `6.1.2`: both audits report zero vulnerabilities, including zero production vulnerabilities.

## Test coverage

The direct Studio-runner tests cover creation and indexing, owner checks, URL and bounded-input rejection, credential-bearing query rejection, duplicate IDs, clean allow, medium/high quarantine, empty/unavailable/oversized source, evaluator transport failure, malformed evaluator output, secret redaction across model fields, source-digest drift, malformed consensus counts, consensus shape checks, and terminal-state behavior.

## Current audit changes

- Rejected obvious credential-bearing URL query keys, including access tokens and cloud signature parameters, before public on-chain storage.
- Redacted common credential forms in summaries, evidence quotes, source pointers, and explanations; added coverage for bearer-token leakage.
- Required consensus count fields to be non-negative integers; added coverage for malformed boolean counts.
- Added validator regressions for source digest changes between leader and validator and for malformed consensus output. Validator disagreement is accurately documented as a failed `run_nondet` evaluation; it cannot yield an accepted `ALLOW` result.
- Hardened frontend normalization so unknown states/decisions and invalid numeric counters render fail-closed, and fixed transaction links to retain the actual submitted hash rather than parse a truncated toast message.
- Reconciled root README/manual-paste documentation with the repo-first workflow and added `docs/DEPLOYMENT_PLAN.md`.

## Network and SDK preparation evidence

- Current official network details identify Studio Devnet as `https://studio-dev.genlayer.com/api`, chain ID `61997`, currency `GEN`, with temporary/reset-prone state and a required matching `studioDevnet` / `studio-dev` release-candidate preset.
- The installed frontend `genlayer-js 1.2.0` exports no Studio Devnet preset; it remains Bradbury-specific in the checked-in adapter.
- `npm view genlayer-js dist-tags versions --json` reports `latest: 1.1.8` and `rc: 2.0.0-rc.1`.
- The published `genlayer-js@2.0.0-rc.1` package was inspected without installing it into the app: it exports `studioDevnet`, `deployContract`, `writeContract`, `estimateTransactionFeesForWrite`, and finalized receipt waiting. The exact SDK/runtime pairing must still be validated against the active Studio Dev deployment before release.
- `docs/DEPLOYMENT_PLAN.md` contains the prepared, non-submitted deploy/write/fee-estimation/post-write verification sequence.

## Release evidence

- Implementation commit SHA: `793551f8255d6cd22ccf3c09c6247f1f19da86df`.
- Build-hardening commit SHA: `f94b5848896a9cbec9b80ea1a9142a28f76866c1`.
- Audit-fix commit SHA: `a73a3e8f6518f8fbecb56de90d544b15b4e42908` (`Harden SourceFirewall audit boundaries`).
- GitHub branch: [feat/sourcefirewall](https://github.com/Iniwura/genlayer-intelligent-contracts/tree/feat/sourcefirewall).
- Deployed Contract Address: `0x3b5E8363E513BD562063282830492963dD81953E`.
- Deployment Transaction Hash: `0xd29f4293365f096c9cc817c424f1a2c81c41e4a9353fa93af6fd89a52cf3aa08` (Status: `ACCEPTED`, Result: `MAJORITY_AGREE`).
- Live Smoke Test Transactions:
  - `create_record`: `0x9de3a5bb9cff4aa1b78e4ed8cf392461c52ebff3dfdc6c26309b507c6dad8448` (Status: `ACCEPTED`, Record ID: `rec-live-001`).
  - `evaluate_record`: `0x1587bf507077be5afd69f19bef84be7e8b265c2f48ecb3ab4e10105c3800db05` (Status: `ACCEPTED`, Quorum Decision: `REVIEW`, State: `QUARANTINED`, `is_safe`: `False`).
- Vercel project: `sourcefirewall` (`prj_V1DnO8jP63LB1hgU2YLFD15DBAMw`), team `team_N0Gp9Gr5qfzo5WfYxVHm9rgp`.
- Current production deployment: Built from `feat/sourcefirewall` with live contract address `0x3b5E8363E513BD562063282830492963dD81953E` and RPC `https://studio.genlayer.com/api`.
- Frontend Blank Screen Resolution:
  - Root cause: In `main.jsx`, `React.createRoot` was called directly from the `react` namespace instead of `createRoot` imported from `react-dom/client`. In React 18, `React.createRoot` is `undefined`, causing an immediate uncaught `TypeError` that prevented component mounting.
  - Fix applied: Imported `createRoot` from `react-dom/client`, configured `define: { global: 'globalThis' }` in `vite.config.js` for Web3 polyfill compatibility, and wrapped the application root in a resilient `ErrorBoundary`.
- Production-Grade Two-Stage Frontend Architecture:
  - Architecture: Rebuilt from single-screen prototype into a comprehensive two-stage application:
    1. Editorial & Industrial Marketing Landing Page (`LANDING`): Micro-badge ingress security, high-impact typography, 4-step interactive security pipeline, live on-chain telemetry strip (contract address, quorum, strict equality principle), 5 threat family matrix, and runtime consensus vs local guardrails comparison.
    2. Operational Threat Desk & Ingress Terminal (`WORKBENCH`): Searchable and filterable queue, active forensic canvas, hazard-striped quarantine framing (`is_safe: FALSE`) and emerald neon clearance (`is_safe: TRUE`), 5-point threat vector breakdown with source pointers and evidence quotes, cryptographic receipt drawer (SHA-256 digest, fingerprint), live transaction evaluation button (`evaluate_record`), and modal target intake (`create_record`).
  - Visual Design System: Anchored to `monodrift.framer.website` and `riwadesign.framer.website` using deep tactical obsidian `#08090a`, card surface `#0d0f12`, technical corner crosshair accents, radar status pulses, and monospace telemetry.
  - Dependencies: Integrated `lucide-react`, `clsx`, and `tailwind-merge`.
- Dissent & Veil Gold-Standard UI Upgrade:
  - Typography: Space Grotesk (600, 700, 800) display headers with tight negative tracking (-0.05em), JetBrains Mono (400, 500, 700) for telemetry, and Inter for neutral body copy.
  - Surface Elevation Stack: Bounded `.site-frame` (1440px max-width, 16px margins, hairline borders, corner tick crosshairs, box-shadow) over obsidian base `#08090a`, sunken pit `#050606`, card surface `#0d0f12`, and raised layer `#12151a`.
  - Tactical Primitives: Connected horizontal `lifecycle-rail` with past, active, and quarantine states; dual-mode Ingress Stream featuring a fixed-column dense ledger table (`.ledger-table`) with row hover states; health dots with wash rings (`box-shadow: 0 0 0 3px`); sticky cryptographic receipt drawer with left accent border; and cubic-bezier surgical transitions (`--ease-surgical: cubic-bezier(0.2, 0, 0, 1)`).
- Current public URL: [sourcefirewall.vercel.app](https://sourcefirewall.vercel.app/). Application exits EXAMPLE MODE and links directly to on-chain state.
- Framer-Grade SaaS Visual Elevation:
  - Animation & Physics: Integrated `framer-motion` for fluid motion springs, layout animations, and physics-driven spring modals (`transition: { type: "spring", damping: 26, stiffness: 350 }`).
  - Framer Dark-Mode Surface Craft: `#090b0e` base canvas with 24px subtle dot matrix, elevated `#0d1015` cards with specular hairline borders (`border: 1px solid rgba(255, 255, 255, 0.08)` and inset `1px 0 rgba(255, 255, 255, 0.08)` top lighting), and `#050608` sunken telemetry pits.
  - Ambient Radial Lighting: Dynamic radial color washes behind status clearances (`ambient-crimson-wash` for quarantined states, `ambient-emerald-wash` for cleared records, `ambient-amber-wash` for pending evaluations) with glowing micro-pills.
  - Ingress Tester & Bento Layout: Interactive live Ingress Tester directly in the landing hero with preset chips for Malicious Injection, Secret Exfiltration, and Clean Docs. 12-column Bento Grid detailing 16KB bounded intake, LLM-powered non-deterministic consensus, fail-closed boundaries, and immutable audit logs.
  - Operational Threat Desk Workbench: 380px left panel with fluid filter selection pills animated via `framer-motion` (`layoutId="activeWorkbenchFilter"`), interactive ledger table / card stream toggling, 5-point adversarial threat vector cards featuring dual visual progress meters (Threat Severity % and Consensus Certainty %), sunken quote extracts, and preset target injection in the spring intake modal.
- Ruthless Minimalist Overhaul (Dark X, Setrex, and Nexus benchmark):
  - Palette & Lighting Restraint: Stripped out all loud meter bars, glowing rings, and hazard stripes. Enforced strict `#060709` monochrome canvas, specular hairline glass (`rgba(255, 255, 255, 0.02)` with `border-top: 1px solid rgba(255, 255, 255, 0.12)`), `#EDEDED` headings, `#A1A1AA` body copy, and `#71717A` captions. Status accents are strictly restricted to `#10B981` (Cleared) and `#EF4444` (Quarantined) on status dots and subtle text pills.
  - Typography: Space Grotesk display headlines (`clamp(48px, 6.5vw, 80px)` with tight `-0.05em` tracking), JetBrains Mono telemetry (`11px; letter-spacing: 0.12em; text-transform: uppercase;`), and Inter body copy.
  - Landing Page Strip-Down: Streamlined into 3 clean, airy sections:
    1. Hero: Centered with kicker pill ("STUDIONET 61999 // ON-CHAIN INGRESS SECURITY"), giant display headline, subhead, primary white CTA button ("Open Threat Terminal"), and secondary contract link.
    2. Hero Product Frame: 1180px centered desktop window mockup with top chrome dots (`red`, `amber`, `green`), address bar, and interactive preview toggling between Malicious Injection and Verified Clean targets.
    3. 3-Column Editorial Features: Hairline-divided columns with large monospace numerals `01`, `02`, `03` for 16KB Bounded Intake, Consensus Quorum, and Fail-Closed Gate.
  - Workbench Refinement: High-density calm instrument featuring 360px left ledger table, domain/ID rows, minimal status pills, framer-motion sliding filter pill, clean status header card with top specular line, hairline-separated 5-point threat vector list with verbatim extracts in sunken `#030405` code blocks, and 4-column cryptographic proof strip.



