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
- Vercel project: `sourcefirewall` (`prj_V1DnO8jP63LB1hgU2YLFD15DBAMw`), team `team_N0Gp9Gr5qfzo5WfYxVHm9rgp`.
- Prior production deployment: `dpl_4UBxtGpcpTxGEqjWawRXuSXYwFgH`, built from `feat/sourcefirewall` at `f94b5848896a9cbec9b80ea1a9142a28f76866c1`, state `READY`.
- Current production deployment: `dpl_F5Jj2AUyRHkjtZQgndMsD4CXhmSC`, target `production`, state `READY`, built from `feat/sourcefirewall` at `a73a3e8f6518f8fbecb56de90d544b15b4e42908`.
- Current public URL: [sourcefirewall.vercel.app](https://sourcefirewall.vercel.app/). Live verification returned HTTP `200`; the deployed HTML referenced the current Vite bundle, and the fetched bundle contained `EXAMPLE MODE`, the missing-address message, `View transaction`, and `BRADBURY LINKED` strings.
- On-chain transaction hashes: none; any future GEN/on-chain action requires explicit user approval with exact transaction, purpose, estimated total cost, and maximum spend shown first.
