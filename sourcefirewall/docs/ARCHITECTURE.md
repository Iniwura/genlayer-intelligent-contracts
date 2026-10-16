# SourceFirewall architecture

SourceFirewall is an inspection boundary between untrusted external content and downstream AI agents. It is intentionally narrower than CanaryGate, CorroborationGraph, and the existing content-policy contract:

- CanaryGate protects a workflow with authorization and delivery gates; SourceFirewall records whether a particular external source is safe to rely on.
- CorroborationGraph models relationships between sources and claims; SourceFirewall does not establish cross-source corroboration.
- The content-policy contract moderates submitted text against a user-defined policy; SourceFirewall fetches an external source, binds findings to its digest, and detects agent-directed hazards.

## Contract boundary

`SourceFirewall` accepts four bounded fields:

- `record_id`: 64 characters, ASCII letters/numbers plus `.`, `_`, and `-`.
- `source_url`: HTTPS only, at most 2,048 characters, no credentials or fragment, canonicalized host, and rejected private, loopback, local, metadata, multicast, reserved, or unspecified targets.
- `source_label`: at most 128 characters.
- `agent_purpose`: at most 900 characters.

The fetched body is bounded to 12,000 UTF-8 bytes. The evaluator must return exactly one finding for each category, with bounded evidence, pointer, explanation, severity, and confidence:

1. `PROMPT_INJECTION`
2. `INSTRUCTION_HIJACKING`
3. `SECRET_EXFILTRATION`
4. `MALICIOUS_TOOL_REDIRECTION`
5. `UNSUPPORTED_CLAIM`

The stored source digest is SHA-256 of the fetched UTF-8 bytes. Result fingerprints bind the record ID, source URL, source digest, final state, decision, findings, and summary.

## State machine

```text
SUBMITTED --owner evaluate_record--> EVALUATING
EVALUATING --valid consensus, no medium/high findings--> CLEARED / ALLOW
EVALUATING --valid consensus, medium findings--> QUARANTINED / REVIEW
EVALUATING --valid consensus, high findings--> QUARANTINED / BLOCK
EVALUATING --unavailable, oversized, empty, malformed, or invalid consensus--> UNRESOLVED / UNRESOLVED
```

Only `CLEARED` plus `ALLOW` makes `is_safe(record_id)` true. `EVALUATING`, `QUARANTINED`, and `UNRESOLVED` are not safe. Records are terminal after evaluation in v1; retry behavior is deliberately not implicit.

## Consensus and fail-closed behavior

The leader evaluates the bounded source with `gl.nondet.web.render(..., mode="text")` and a structured JSON prompt. The validator evaluates the same snapshot again and accepts only the normalized state, decision, source digest, severity counts, and category/severity shape. Wording is not treated as consensus-critical.

Any source transport failure, empty body, oversized body, evaluator failure, malformed output, invalid category/severity shape, missing evidence for a medium/high finding, or disagreement is persisted as `UNRESOLVED`. Secret-looking evidence snippets are redacted before storage. The contract never treats an unresolved record as safe.

## Frontend integration

`sourcefirewall/app` is a reviewer desk. Without `VITE_SOURCEFIREWALL_CONTRACT_ADDRESS`, it displays two clearly labeled example records and does not claim they are on-chain. With a configured address, it reads the record index and records, connects a browser wallet on Bradbury for `create_record` and `evaluate_record`, waits for an `ACCEPTED` receipt, and displays the resulting record state and explorer link.

The UI is evidence-oriented: state and decision are separate, every finding includes a source pointer and quote, the source digest is shown, and unresolved/error states are explicit.
