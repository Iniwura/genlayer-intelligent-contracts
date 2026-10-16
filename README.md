# genlayer-intelligent-contracts

This repository contains older Bradbury examples from the GenLayer Builder Program and the SourceFirewall Studio Next workstream. SourceFirewall is kept under `sourcefirewall/` so its contract, direct-mode tests, frontend, and release evidence can evolve without rewriting the unrelated examples.

---

## Contracts

### 0. SourceFirewall (`sourcefirewall/`)

SourceFirewall is a fail-closed, consensus-backed inspection boundary for untrusted external content. It stores bounded source metadata, a source digest, exactly five structured risk categories, evidence pointers, and an explicit lifecycle state before downstream agents rely on a source.

The SourceFirewall contract, direct-mode tests, reviewer desk, and release evidence live in [`sourcefirewall/`](sourcefirewall/). See the [architecture](sourcefirewall/docs/ARCHITECTURE.md), [demo script](sourcefirewall/docs/DEMO_SCRIPT.md), [deployment plan](sourcefirewall/docs/DEPLOYMENT_PLAN.md), and [evidence log](sourcefirewall/docs/EVIDENCE_LOG.md).

The frontend deliberately runs in labeled **EXAMPLE MODE** until a deployed contract address is supplied. Contract deployment and any on-chain transaction remain an operator-controlled step.

### 1. Crypto Price Checker (`crypto_price_checker.py`)
Fetches the live price of any cryptocurrency from CoinGecko, uses an LLM to parse the response, and stores an ABOVE/BELOW/EQUAL status on-chain relative to a user-defined target.

**Deploy:** No constructor args needed  
**Call:** `check_price("bitcoin", 60000)`  
**Read:** `get_last_result()`

These two root-level contracts are legacy examples. Their historical Bradbury/manual-interaction notes do not describe the SourceFirewall workflow or prove that either contract is currently deployed.

### 2. AI Content Moderator (`content_moderator.py`)
Accepts user-submitted text and uses an LLM to evaluate it against a custom ruleset, returning APPROVED or REJECTED on-chain with a reason.

**Deploy:** Pass your moderation rules as a string, e.g. `"No hate speech. No spam."`  
**Call:** `moderate("text to review")`  
**Read:** `get_last_verdict()`

---

## SourceFirewall workflow

SourceFirewall follows the repo-first Studio Next workflow:

1. Work from `sourcefirewall/contracts/source_firewall.py` and keep its pinned `Depends` header aligned with the Studio Next release candidate being validated.
2. Install the pinned Python requirements and run the direct Studio tests in `sourcefirewall/tests/`. Direct Mode loads the cached Studio-compatible SDK and exercises the contract without sending network transactions.
3. Run the fast linter and typecheck. The combined semantic linter currently reports `No module named 'genlayer.py'` because linter `0.11.0` expects the legacy SDK package layout while the pinned Studio Next SDK exposes `genlayer._internal` and `genlayer.*`; this is recorded as an unresolved tool mismatch, not hidden by a compatibility shim.
4. Build the reviewer desk in `sourcefirewall/app/`. It remains labeled **EXAMPLE MODE** until a verified contract address is configured.
5. Use the matching Studio Next/Studio-dev release-candidate CLI or Studio integration only after the local contract checks pass. Do not paste an untracked copy into Studio, and do not call the app live until a finalized deployment and post-write reads are verified.

## Network status and release boundary

- **Studio development preview / Studio Next:** canonical RPC `https://studio-dev.genlayer.com/api`, chain ID `61997`. It is temporary/reset-prone and requires a matching release-candidate SDK or CLI; no SourceFirewall deployment is claimed here.
- **Studionet:** canonical RPC `https://studio.genlayer.com/api`, chain ID `61999`. This is the stable integration network recommended for ordinary testing.
- **Bradbury:** canonical RPC `https://rpc-bradbury.genlayer.com`, chain ID `4221`. The current optional browser-wallet adapter is Bradbury-specific for compatibility with the installed `genlayer-js 1.2.0`; it is not proof that SourceFirewall is deployed there.

The public reviewer desk is a Vercel-hosted example UI with no verified SourceFirewall contract address. Deployment, contract writes, and GEN spend remain operator-controlled and are documented as a prepared plan only.

## Research
These contracts are referenced in my performance benchmarking article:  
[Performance Benchmarking of GenLayer Intelligent Contracts](https://medium.com/@iniwuraakuru/performance-benchmarking-of-genlayer-intelligent-contracts-execution-patterns-llm-response-0069f2660ce4)

---

*Built by Iniwura Akuru — GenLayer Builder Program, May 2026*
