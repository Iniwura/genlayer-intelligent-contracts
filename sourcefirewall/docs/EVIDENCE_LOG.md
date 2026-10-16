# SourceFirewall evidence log

This log records verified local and repository evidence. It does not contain fabricated deployment or transaction proof.

## Starting state

- Source repository: `https://github.com/Iniwura/genlayer-intelligent-contracts`
- Working branch: `feat/sourcefirewall`
- Implementation subtree: `sourcefirewall/`
- Existing root contracts and unrelated work were preserved.
- No SourceFirewall GitHub or Vercel project existed at discovery time.
- No GEN spend, contract deployment, or paid/on-chain transaction has been attempted.

## Verified implementation checks

Commands run from the repository root:

```text
py -m pytest sourcefirewall\tests -q
```

Result: `26 passed`.

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

Result: dependencies installed; the hardened Vite `8.3.4` production build passed with 469 modules transformed locally. Vite emitted only a bundle-size advisory for the GenLayer client chunk. The later Vercel build passed with 462 modules transformed.

```text
npm audit --json
npm audit --omit=dev --json
```

Result after upgrading `vite` to `8.3.4` and `@vitejs/plugin-react` to `6.1.2`: both audits report zero vulnerabilities, including zero production vulnerabilities.

## Test coverage

The direct Studio-runner tests cover creation and indexing, owner checks, URL and bounded-input rejection, duplicate IDs, clean allow, medium/high quarantine, empty/unavailable/oversized source, evaluator transport failure, malformed evaluator output, secret redaction, consensus shape checks, and terminal-state behavior.

## Release evidence

- Implementation commit SHA: `793551f8255d6cd22ccf3c09c6247f1f19da86df`.
- Build-hardening commit SHA: `f94b5848896a9cbec9b80ea1a9142a28f76866c1`.
- GitHub branch: [feat/sourcefirewall](https://github.com/Iniwura/genlayer-intelligent-contracts/tree/feat/sourcefirewall).
- Vercel project: `sourcefirewall` (`prj_V1DnO8jP63LB1hgU2YLFD15DBAMw`), team `team_N0Gp9Gr5qfzo5WfYxVHm9rgp`.
- Production deployment: `dpl_4UBxtGpcpTxGEqjWawRXuSXYwFgH`, built from `feat/sourcefirewall` at `f94b5848896a9cbec9b80ea1a9142a28f76866c1`, state `READY`.
- Public URL: [sourcefirewall.vercel.app](https://sourcefirewall.vercel.app/). Live verification returned HTTP `200`; the deployed bundle contained `EXAMPLE MODE`, the hero copy, and the missing-contract warning.
- The evidence-log update is docs-only; the deployed application corresponds to the build-hardening commit above.
- On-chain transaction hashes: none; any future GEN/on-chain action requires explicit user approval with exact transaction, purpose, estimated total cost, and maximum spend shown first.
