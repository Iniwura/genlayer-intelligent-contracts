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

Result: 278 packages installed; Vite production build passed with 469 modules transformed. Vite emitted only a bundle-size advisory for the GenLayer client chunk.

## Test coverage

The direct Studio-runner tests cover creation and indexing, owner checks, URL and bounded-input rejection, duplicate IDs, clean allow, medium/high quarantine, empty/unavailable/oversized source, evaluator transport failure, malformed evaluator output, secret redaction, consensus shape checks, and terminal-state behavior.

## Pending release evidence

- Commit SHA: to be recorded after commit.
- GitHub branch URL: to be recorded after push.
- Vercel production URL: to be recorded after deployment and verification.
- On-chain transaction hashes: none; any future GEN/on-chain action requires explicit user approval with exact transaction, purpose, estimated total cost, and maximum spend shown first.
