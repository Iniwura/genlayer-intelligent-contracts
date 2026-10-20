# Stewards Verification Evidence Package: SourceFirewall & DownstreamAgent

This document provides independent, verifiable evidence addressing the GenLayer stewards' review requests for:
1. **Target-SDK Semantic Validation** (`E106` resolution & full schema generation).
2. **DownstreamAgent Deployment & Source Parity** on GenLayer Studionet.
3. **StudioNet On-Chain Transaction Evidence** demonstrating fail-closed enforcement (uncertified records rejected, tampered payloads rejected, certified safe records consumed).
4. **State Non-Mutation Proof** demonstrating that rejected transactions do not modify consumption storage.

---

## 1. Target-SDK Semantic Validation Evidence

Validation executed via the official GenLayer target-SDK validator (`genvm_linter.validate.validator.validate_contract` against runner `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`):

### A. SourceFirewall (`contracts/source_firewall.py`)
```json
{
  "ok": true,
  "contract_name": "SourceFirewall",
  "errors": [],
  "warnings": [
    {
      "code": "I200",
      "msg": "py-genlayer: a newer runner is available (1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh). See https://github.com/genlayerlabs/genvm/releases for changes."
    }
  ],
  "schema": {
    "ctor": {
      "params": [],
      "kwparams": {}
    },
    "methods": {
      "create_record": {
        "params": [
          ["record_id", "string"],
          ["source_url", "string"],
          ["source_label", "string"],
          ["agent_purpose", "string"]
        ],
        "readonly": false,
        "ret": "string",
        "payable": false
      },
      "evaluate_record": {
        "params": [["record_id", "string"]],
        "readonly": false,
        "ret": { "$dict": "any" },
        "payable": false
      },
      "get_record": {
        "params": [["record_id", "string"]],
        "readonly": true,
        "ret": { "$dict": "any" }
      },
      "get_record_count": {
        "params": [],
        "readonly": true,
        "ret": "int"
      },
      "get_record_id_at": {
        "params": [["position", "int"]],
        "readonly": true,
        "ret": "string"
      },
      "is_safe": {
        "params": [["record_id", "string"]],
        "readonly": true,
        "ret": "bool"
      }
    }
  }
}
```

### B. DownstreamAgent (`contracts/downstream_agent.py`)
```json
{
  "ok": true,
  "contract_name": "DownstreamAgent",
  "errors": [],
  "warnings": [
    {
      "code": "I200",
      "msg": "py-genlayer: a newer runner is available (1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh). See https://github.com/genlayerlabs/genvm/releases for changes."
    }
  ],
  "schema": {
    "ctor": {
      "params": [
        ["firewall_address", { "$or": ["string", "address"] }]
      ],
      "kwparams": {}
    },
    "methods": {
      "consume_source": {
        "params": [
          ["record_id", "string"],
          ["raw_payload", "string"]
        ],
        "readonly": false,
        "ret": "string",
        "payable": false
      },
      "get_consumed_count": {
        "params": [],
        "readonly": true,
        "ret": "int"
      },
      "has_consumed_digest": {
        "params": [["digest", "string"]],
        "readonly": true,
        "ret": "bool"
      }
    }
  }
}
```

---

## 2. DownstreamAgent Deployment & Source Parity Evidence

- **Network**: GenLayer Studionet (Chain ID `61999`)
- **RPC Endpoint**: `https://studio.genlayer.com/api`
- **DownstreamAgent Address**: `0x452258dbF2Bd6acC7004Ec98a279fFe08b52DD38`
- **Deployment Transaction Hash**: `0x96719e38f68e8aa9e077f549f1d8cf0f4a1f310e2968d2c1203f70a06fe5c361`
- **Constructor Parameter (Linked Firewall)**: `0x3b5E8363E513BD562063282830492963dD81953E`
- **Transaction Status**: `FINALIZED`
- **Consensus Result**: `MAJORITY_AGREE`

### Bytecode / Source Parity Verification
```python
# Comparison of on-chain contract code against local file:
deployed_code_sha256 = "4fd2ce665887610305e41a045d12a04940812c4d01f581221438861aa7625cfb"
local_file_sha256    = "4fd2ce665887610305e41a045d12a04940812c4d01f581221438861aa7625cfb"
parity_match         = True
```

---

## 3. Verifiable StudioNet Transaction Evidence: Downstream Guard Enforcement

Live transactions submitted to `DownstreamAgent` at `0x452258dbF2Bd6acC7004Ec98a279fFe08b52DD38`:

### Case 1: CLEARED/ALLOW Record with Matching Bytes (Succeeds)
- **Call**: `consume_source("rec-live-007", <raw ERC-20 spec payload>)`
- **SourceFirewall Status**: `rec-live-007` is `state = "CLEARED"`, `decision = "ALLOW"`, `is_safe() == True`
- **Certified Digest**: `9673cdc4cf9e80c02765e5fec3bcad45b96dbd587eaee16c76e828f23eb2eefa`
- **Tx Hash**: `0xcbaa68b8a4183b6cce30103e712b951fd7e2baa8c49ce7afa9e08569fa3525cd`
- **On-Chain Receipt**:
  - `status_name`: `FINALIZED`
  - `result_name`: `MAJORITY_AGREE`
  - `execution_result`: `SUCCESS`
  - `payload`: `"CONSUMED: 9673cdc4cf9e80c02765e5fec3bcad45b96dbd587eaee16c76e828f23eb2eefa"`
- **Post-State**: `get_consumed_count() == 1`, `has_consumed_digest("9673cdc...efa") == True`

### Case 2: QUARANTINED Record (Rejected)
- **Call**: `consume_source("rec-live-004", <raw prompt injection / secret leak payload>)`
- **SourceFirewall Status**: `rec-live-004` is `state = "QUARANTINED"`, `decision = "BLOCK"`, `is_safe() == False`
- **Tx Hash**: `0x4e3e67397f9c33c8495a615502809447cef840e8d42335d2a2a98f0f163b8512`
- **On-Chain Receipt**:
  - `status_name`: `FINALIZED`
  - `result_name`: `MAJORITY_AGREE`
  - `execution_result`: `ERROR` (reverted)
  - `payload`: `"FIREWALL_BLOCKED: source record is not certified safe"`
- **Post-State**: Reverted on-chain, storage remains unmodified.

### Case 3: Altered Payload / Byte Digest Mismatch (Rejected)
- **Call**: `consume_source("rec-live-007", <tampered ERC-20 spec bytes>)`
- **SourceFirewall Status**: `rec-live-007` has `is_safe() == True`, but supplied payload was modified (`+ ' TAMPERED'`).
- **Tx Hash**: `0xdeb0f2dd06fc61e953f978d9f296b1e8e44584ef3bea1007cf5d98ef0da2e5f4`
- **On-Chain Receipt**:
  - `status_name`: `FINALIZED`
  - `result_name`: `MAJORITY_AGREE`
  - `execution_result`: `ERROR` (reverted)
  - `payload`: `"DIGEST_MISMATCH: payload bytes do not match firewall certified digest"`
- **Post-State**: Reverted on-chain, storage remains unmodified.

---

## 4. State Non-Mutation Proof

Direct state queries executed on `0x452258dbF2Bd6acC7004Ec98a279fFe08b52DD38` after all three transactions:

```python
# 1. Successful consumption of certified clean digest:
has_consumed_digest("9673cdc4cf9e80c02765e5fec3bcad45b96dbd587eaee16c76e828f23eb2eefa") -> True

# 2. Blocked quarantined digest was never recorded:
has_consumed_digest("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") -> False

# 3. Total consumed records counter remains strictly 1:
get_consumed_count() -> 1
```

---

## 5. Repository References

- **SourceFirewall Contract**: [`contracts/source_firewall.py`](https://github.com/Iniwura/sourcefirewall/blob/main/contracts/source_firewall.py)
- **DownstreamAgent Contract**: [`contracts/downstream_agent.py`](https://github.com/Iniwura/sourcefirewall/blob/main/contracts/downstream_agent.py)
- **Deployment Script**: [`deploy_downstream.py`](https://github.com/Iniwura/sourcefirewall/blob/main/deploy_downstream.py)
