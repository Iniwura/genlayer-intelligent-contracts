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

After an operator has performed a verified deployment on the configured network and set `VITE_SOURCEFIREWALL_CONTRACT_ADDRESS` with the matching network SDK:

1. Connect a wallet on the configured network. The current checked-in live adapter is Bradbury-specific; a Studio Next run requires the matching `genlayer-js` release-candidate adapter and `studioDevnet` chain preset.
2. Create a record with an HTTPS public source URL, a short label, and the downstream agent purpose.
3. Wait for the accepted transaction receipt. The record should appear as `SUBMITTED`.
4. Evaluate the record. The contract moves through `EVALUATING`, then returns and persists `CLEARED`, `QUARANTINED`, or `UNRESOLVED` when consensus accepts the result. A validator disagreement is a failed protocol-level evaluation; it is not an accepted `ALLOW` result.
5. Verify the on-chain read by refreshing the desk and opening the record again.
6. For a failure-path demo, use a source that is empty, unavailable, oversized, or produces a malformed evaluator response. The expected result is `UNRESOLVED`, never `ALLOW`.

The live flow is intentionally not simulated by the frontend. A deployed address and any transaction hashes must come from a verified operator action.
