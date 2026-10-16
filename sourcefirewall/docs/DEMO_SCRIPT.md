# SourceFirewall demo script

## Reviewer flow (no wallet required)

1. Open the deployed frontend.
2. Confirm the top banner says `EXAMPLE MODE` when no contract address is configured.
3. Select the suspicious source in the review queue.
4. Show that the record is `QUARANTINED`, with a `BLOCK` decision, a source digest, and findings for prompt injection, instruction hijacking, and secret exfiltration.
5. Open the finding rows and point to the bounded evidence quote and source pointer. The sample token is visibly redacted.
6. Select the clean source and show `CLEARED` / `ALLOW` plus five low-severity category rows.
7. Use the protocol panel to explain that unresolved evaluation is blocked from downstream use.

## Live contract flow

After an operator has deployed the contract and configured `VITE_SOURCEFIREWALL_CONTRACT_ADDRESS`:

1. Connect a wallet on GenLayer Bradbury.
2. Create a record with an HTTPS public source URL, a short label, and the downstream agent purpose.
3. Wait for the accepted transaction receipt. The record should appear as `SUBMITTED`.
4. Evaluate the record. The contract moves through `EVALUATING`, then persists `CLEARED`, `QUARANTINED`, or `UNRESOLVED`.
5. Verify the on-chain read by refreshing the desk and opening the record again.
6. For a failure-path demo, use a source that is empty, unavailable, oversized, or produces a malformed evaluator response. The expected result is `UNRESOLVED`, never `ALLOW`.

The live flow is intentionally not simulated by the frontend. A deployed address and any transaction hashes must come from a verified operator action.
