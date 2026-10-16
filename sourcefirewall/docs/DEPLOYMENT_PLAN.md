# SourceFirewall Studio Next deployment plan

This is a preparation document only. No deployment, contract write, wallet signing, or GEN-spending transaction has been submitted for SourceFirewall.

## Target network

The intended Studio Next validation target is the Studio development preview (also called Studio Devnet), not Bradbury and not the stable Studionet preset:

- Canonical GenLayer RPC: `https://studio-dev.genlayer.com/api`
- Chain ID: `61997`
- Currency: `GEN`
- Explorer: `https://explorer-studio-dev.genlayer.com`
- Faucet: built into the Studio Devnet account selector
- Persistence: temporary; resets and availability changes are expected

GenLayer's network documentation says to use the matching release-candidate SDK or CLI and its explicit `studioDevnet` / `studio-dev` preset. The browser alias, if enabled, does not change the canonical RPC used by integrations.

## Compatibility gate

The contract header pins the Studio Dev runner identifier `1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh`; the local Direct Mode harness resolves that runner from the cached `v0.3.0-rc7` bundle. The direct contract suite passes against that runtime.

The current frontend lockfile contains `genlayer-js 1.2.0`. Its installed chain exports contain Bradbury and Studionet but no Studio Devnet preset, so it must not be pointed at chain `61997` by changing only an RPC environment variable. The published npm `rc` tag is currently `genlayer-js 2.0.0-rc.1`, and that package exports `studioDevnet` plus the fee-aware client methods. Before a live release, pin the matching SDK release that Studio Dev actually serves and verify its contract ABI and transaction behavior against the pinned Python runner. Do not silently upgrade the current app during a paid release.

The combined `genvm-lint check` remains blocked by linter `0.11.0` importing legacy `genlayer.py.get_schema` while the pinned modern SDK exposes `genlayer._internal.get_schema`. This is a tooling mismatch to resolve with a compatible linter/SDK pair; it is not a reason to add a shim to the contract.

## Planned calls (not submitted)

1. Re-run the local direct tests, fast lint, typecheck, frontend build, and audit on the exact commit to release.
2. Obtain the matching Studio Devnet CLI/SDK and set the explicit `studio-dev` network. The CLI deployment shape documented by GenLayer is:

   ```text
   genlayer network set studio-dev
   genlayer deploy --contract sourcefirewall/contracts/source_firewall.py
   ```

   If the release-candidate CLI does not expose that alias, use the canonical RPC explicitly rather than relabeling another network:

   ```text
   genlayer deploy --contract sourcefirewall/contracts/source_firewall.py --rpc https://studio-dev.genlayer.com/api
   ```

3. Record the returned deployment transaction hash and contract address. Wait for the network's finalized/success state; a submitted hash alone is not deployment proof.
4. For the frontend, create a `genlayer-js 2.0.0-rc.1`-compatible client with the `studioDevnet` chain preset. Configure the verified address, canonical RPC/preset, chain ID, and Studio Dev explorer URL as environment-specific values. Keep the app in EXAMPLE MODE until all four values are verified together.
5. For writes, use the SDK's fee-aware calls:

   - `deployContract({ code, args, fees })` for deployment when using the JS client;
   - `writeContract({ address, functionName: "create_record", args: [recordId, sourceUrl, sourceLabel, agentPurpose], fees })`;
   - `writeContract({ address, functionName: "evaluate_record", args: [recordId], fees })`.

   Wait for the finalized receipt using the SDK's `waitForTransactionReceipt({ hash, waitUntil: "finalized" })` path. Use `latest-nonfinal` only for responsive reads, never as proof of finality.

## Fee estimation and approval gate

No current GEN fee estimate has been requested because no wallet or paid transaction is being prepared in this audit. The approved preparation sequence is:

1. Add representative fee-profile coverage for deployment, `create_record`, and `evaluate_record`, including the web/LLM path.
2. Run the Studio/RC fee-reporting test path with `gltest --fee-profile` and preserve the generated `fee-profile.json` outside secrets.
3. Use `genlayer-js` v2's `estimateTransactionFeesForWrite` (or the matching RC equivalent) with the target contract/method and current network policy. The returned `distribution` and `feeValue` are the values that would be passed to `writeContract`; unused fee budget is refunded at finalization, but the wallet must cover the reserved fee deposit and any separate user value.
4. Before signing anything, show the exact calldata/code hash, target network and chain ID, current fee quote, reserved fee deposit, any value transfer, expected total, and a maximum GEN spend. Stop until the user explicitly approves that exact transaction.

The approval boundary applies separately to deployment, `create_record`, and `evaluate_record`; approval for one does not authorize another.

## Post-deployment verification

After approval and only after a finalized deployment:

1. Read the deployment receipt and verify the contract address on the Studio Devnet explorer and RPC.
2. Read the contract schema/code and confirm the deployed source matches the reviewed commit and `sourcefirewall.v1` schema.
3. Read `get_record_count` and confirm the initial state.
4. Submit one clean `create_record`, wait for finalized status, then read `get_record` and verify `SUBMITTED`, `NOT_EVALUATED`, and the zero digest.
5. Submit `evaluate_record` for that record, wait for finalized status, then read `get_record` and verify the persisted digest, five findings, counts, result fingerprint, and one of `CLEARED`, `QUARANTINED`, or `UNRESOLVED`.
6. Verify `is_safe` is true only for `CLEARED`/`ALLOW`; it must be false for `SUBMITTED`, `EVALUATING`, `QUARANTINED`, and `UNRESOLVED`.
7. Capture every finalized transaction hash, the contract address, post-write reads, SDK/runtime versions, and the deployed frontend URL in `EVIDENCE_LOG.md`. If any read or receipt cannot be verified, report the blocker and leave the frontend in EXAMPLE MODE.

References: [GenLayer networks](https://docs.genlayer.com/developers/networks), [network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [CLI deployment](https://docs.genlayer.com/developers/intelligent-contracts/deploying/cli-deployment), [Direct Mode](https://docs.genlayer.com/api-references/genlayer-test/direct), and [fees and transaction policy](https://docs.genlayer.com/developers/decentralized-applications/fees-and-transaction-kit).
