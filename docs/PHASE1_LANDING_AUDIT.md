# Phase 1 Landing Page Audit: Translating Meridian Agency into SourceFirewall

## 1. Reference Deconstruction: Meridian Agency (`https://meridianagency.framer.ai/`)

Meridian is not just a "dark theme"; it is an exercise in **deliberate editorial restraint, spatial rhythm, and typographic authority**:
- **Typography as Architecture**: Display headlines pair high-contrast italic serifs (`Instrument Serif`) with crisp, geometrical modern letterforms (`Space Grotesk` / `Host Grotesk`). Micro-metadata (`JetBrains Mono`, 10px-11px, `tracking-[0.2em]`) acts as precise architectural annotation.
- **Asymmetrical Hero Composition**: The hero is never an empty text void. An authoritative editorial hook on the left is counterbalanced by an immediate, tactile showcase of real work on the right or directly below the fold, creating a dynamic diagonal tension.
- **Whisper-Thin Structure**: Containers avoid heavy dropshadows, garish borders, or glowing neon gradients. Structural boundaries are defined by hairline dividers (`1px solid #1C1C1F`) and subtle surface shifts (`#09090B` base vs `#0C0C0E` raised).
- **Varied Section Pacing**: Content alternates between high-impact full-bleed typography, multi-column process grids, deep-dive interactive showcases, and quiet architectural metadata strips.
- **Immediate Value Communication**: Essential information is parsed in under 3 seconds using clear data tags, status badges, and compact summaries rather than dense text walls.

---

## 2. Mapping to SourceFirewall: Identity as an Editorial Security Product

SourceFirewall is an **Ingress Quarantine Protocol** running as an Intelligent Contract on GenLayer Studionet (`0x3b5E8363E513BD562063282830492963dD81953E`). It autonomously intercepts untrusted web inputs, enforces a 16KB payload ceiling, executes 5-point adversarial consensus across validator nodes, and exposes a fail-closed `is_safe()` gate to downstream AI agents.

### Translating Core Principles to SourceFirewall:

| Meridian Principle | SourceFirewall Implementation |
| :--- | :--- |
| **Oversized Serif / Sans Tension** | `"Provably Secure"` in italic `Instrument Serif`, paired with `"AI Ingress."` in structured `Space Grotesk`. |
| **Micro-Metadata Annotations** | `INGRESS DEFENSE PROTOCOL // RUNTIME CONSENSUS`, `STUDIONET [61999]`, `16KB CEILING`. |
| **Warm Obsidian & Ivory Palette** | Base `#09090B`, elevated `#0C0C0E`, hairline `#1C1C1F`, text `#F4F1EA` (ivory) and `#8F8E8A` (stone). |
| **Tactile Status Accents** | Pure ivory for `CLEARED` verification, restrained terracotta (`#c25e4a`) for `QUARANTINED` adversarial blocks. No neon greens or purples. |
| **Product-Led Hero Showcase** | The Live Ingress Evaluation Console sits right inside the hero above the fold, demonstrating payload interception in real time. |

---

## 3. Specific Design Solutions

### A. Deliberate, Visually Balanced Hero Composition
- **Previous defect**: The hero had a single H1 floating alone in 140px of vertical space, leaving the right side empty and requiring visitors to scroll deep into the page to see what the product actually does.
- **Redesign solution**: A balanced 2-column desktop composition (`1fr 1fr` grid on 1280px container):
  - **Left Column**: Authoritative kicker (`INGRESS DEFENSE PROTOCOL // RUNTIME CONSENSUS`), oversized headline (`Provably Secure AI Ingress.`), a 1-sentence value hook, three authentic telemetry figures (`16KB Ceiling`, `5-Point Quorum`, `Fail-Closed Gate`), and dual actions (`Enter Studio Terminal` ivory pill + contract explorer link).
  - **Right Column**: The **Live Ingress Interceptor Console**, featuring interactive switching between **Sample 01 (Adversarial Injection)** and **Sample 02 (Verified Docs)**.

### B. Compelling Visual Representation of the Actual Product Above the Fold
- The **Live Ingress Interceptor Console** renders:
  1. **Ingress Source Header**: Real-time URL and 16KB bounded payload snippet.
  2. **Consensus Quorum Threat Matrix**: Live status indicators for the 5 canonical threats (Prompt Injection, Instruction Hijacking, Secret Exfiltration, Tool Redirection, Unsupported Claims).
  3. **On-Chain Decision Badge**: High-contrast, card-free certificate showing `QUARANTINED` vs `CLEARED` alongside the exact on-chain boolean `is_safe() = false / true`.
  4. **Cryptographic Proof**: Truncated SHA-256 payload digest and direct link to inspect in the Studio Terminal.

### C. Immediate Communication of Product Value Without Long Paragraphs
- High-level value is absorbed in seconds via:
  - The 3-figure technical telemetry strip: `16KB Ingress Ceiling`, `5-Vector Multi-Validator Quorum`, `Fail-Closed is_safe() State`.
  - The interactive proof toggle: Clicking between "Sample 01 // Adversarial" and "Sample 02 // Verified Docs" instantly shows the contract in action without reading a word of documentation.
  - Clear visual contrast between quarantined (muted terracotta) and cleared (warm ivory) outcomes.

### D. Strong Section Rhythm & Transitions
The page unfolds with intentional tempo changes:
1. **Studio Header**: Sticky 72px bar with logo, network indicator, and direct terminal entry.
2. **Hero & Interactive Interceptor**: High-impact two-column composition with live product visual.
3. **The 4-Stage Ingress Pipeline**: A full-bleed hairline grid detailing the execution flow:
   - `01 / BOUNDED INGESTION` (16KB Ceiling & Canonical URL Normalization)
   - `02 / RUNTIME CONSENSUS` (Multi-Validator Cognitive Evaluation)
   - `03 / FAIL-CLOSED GATE` (Deterministic `is_safe()` Boolean State)
   - `04 / AGENT EXECUTION` (Safe Context Intake by Downstream AI Agents)
4. **The 5-Point Threat Vector Specification**: Detailed breakdown of the adversarial threats evaluated on-chain.
5. **Network & Contract Infrastructure**: Authentic Studionet configuration, contract address `0x3b5E8363E513BD562063282830492963dD81953E`, and live record counter.
6. **Architectural FAQ Accordion**: Resolving developer questions with whisper-thin expandable rows.
7. **Editorial Outro & Studio Footer**: Monumental serif CTA and understated studio metadata.

---

## 4. Technical Guardrails & Scope Isolation
- `src/Workbench.jsx` remains untouched.
- All styles adhere to `--bg-obsidian: #09090B`, `--border-line: 1px solid #1C1C1F`, and the defined typography tokens.
- No artificial features, fake metrics, or external vendor integrations are introduced.
- Responsive breakpoints tested at 1440px, 1280px, and 390px widths.
