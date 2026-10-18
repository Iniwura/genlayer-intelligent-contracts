#!/usr/bin/env python3
"""
Populate GenLayer SourceFirewall Smart Contract with Historical Batch Data.
Target Contract: 0x3b5E8363E513BD562063282830492963dD81953E (Chain ID 61999)
"""

import sys
import time
import json
import argparse
import genlayer_py
from genlayer_py.chains import studionet
from genlayer_py.types import TransactionStatus

CONTRACT_ADDRESS = "0x3b5E8363E513BD562063282830492963dD81953E"
PRIMARY_RPC = "https://studio-next.genlayer.com/api"
FALLBACK_RPC = "https://studio.genlayer.com/api"

BATCH_PAYLOADS = [
    {
        "record_id": "rec-live-002",
        "source_label": "Decentralized Consensus Whitepaper",
        "source_url": "https://raw.githubusercontent.com/Iniwura/genlayer-intelligent-contracts/main/fixtures/clean_consensus_paper.txt",
        "agent_purpose": "Autonomous market research agent summarizing BFT mechanisms and equivalent consensus.",
        "expected_category": "CLEAN_DOCUMENT",
    },
    {
        "record_id": "rec-live-003",
        "source_label": "Adversarial Advisory Stream #9920",
        "source_url": "https://raw.githubusercontent.com/Iniwura/genlayer-intelligent-contracts/main/fixtures/jailbreak_prompt_injection.txt",
        "agent_purpose": "Security compliance assistant evaluating safety boundaries on public technical advisories.",
        "expected_category": "PROMPT_INJECTION",
    },
    {
        "record_id": "rec-live-004",
        "source_label": "Support Ticket Ingress #41029",
        "source_url": "https://raw.githubusercontent.com/Iniwura/genlayer-intelligent-contracts/main/fixtures/canary_secret_leak.txt",
        "agent_purpose": "Automated customer support routing assistant verifying payment webhooks.",
        "expected_category": "SECRET_EXFILTRATION",
    },
    {
        "record_id": "rec-live-005",
        "source_label": "Supplier Invoice Feed #9921",
        "source_url": "https://raw.githubusercontent.com/Iniwura/genlayer-intelligent-contracts/main/fixtures/tool_redirection_hijack.txt",
        "agent_purpose": "Autonomous accounting agent verifying vendor invoices and payment schedules.",
        "expected_category": "TOOL_REDIRECTION",
    },
    {
        "record_id": "rec-live-006",
        "source_label": "Q4 Market Intelligence Briefing",
        "source_url": "https://raw.githubusercontent.com/Iniwura/genlayer-intelligent-contracts/main/fixtures/unsupported_claims_brief.txt",
        "agent_purpose": "Risk assessment agent checking protocol vulnerability claims against formal audit evidence.",
        "expected_category": "UNSUPPORTED_CLAIMS",
    },
    {
        "record_id": "rec-live-007",
        "source_label": "ERC-20 Standard Interface Doc",
        "source_url": "https://raw.githubusercontent.com/Iniwura/genlayer-intelligent-contracts/main/fixtures/clean_erc20_token_spec.txt",
        "agent_purpose": "Smart contract developer assistant validating token interface compliance.",
        "expected_category": "CLEAN_DOCUMENT",
    },
]


def resolve_client(requested_endpoint):
    """
    Connect to requested GenLayer RPC endpoint.
    If the target contract does not exist on that endpoint, fall back to the live contract endpoint.
    """
    operator = genlayer_py.create_account()
    print(f"[*] Generated operator address: {operator.address}")

    endpoint = requested_endpoint
    print(f"[*] Connecting to GenLayer RPC: {endpoint}")
    client = genlayer_py.create_client(chain=studionet, endpoint=endpoint, account=operator)

    try:
        client.read_contract(address=CONTRACT_ADDRESS, function_name="get_record_count", args=[])
        print(f"[+] Verified contract {CONTRACT_ADDRESS} on {endpoint}")
    except Exception as e:
        print(f"[!] Target contract not found or unreachable on {endpoint}: {e}")
        if endpoint != FALLBACK_RPC:
            print(f"[*] Falling back to active deployment RPC: {FALLBACK_RPC}")
            endpoint = FALLBACK_RPC
            client = genlayer_py.create_client(chain=studionet, endpoint=endpoint, account=operator)
            count = client.read_contract(address=CONTRACT_ADDRESS, function_name="get_record_count", args=[])
            print(f"[+] Connected to {endpoint}. Current contract record count: {count}")

    print(f"[*] Funding operator account on {endpoint}…")
    for attempt in range(3):
        try:
            client.fund_account(operator.address, 1000000000000000000)
            time.sleep(1)
            bal = client.get_balance(operator.address)
            print(f"[+] Account funded with {bal} wei")
            break
        except Exception as e:
            print(f"[!] Funding attempt {attempt + 1} notice: {e}")
            time.sleep(2)

    return client, operator, endpoint


def populate_batch(endpoint=PRIMARY_RPC):
    print("=" * 70)
    print("  SOURCEFIREWALL: BATCH HISTORICAL INGRESS POPULATION")
    print(f"  Target Contract : {CONTRACT_ADDRESS}")
    print(f"  Target Network  : GenLayer Studionet (Chain ID 61999)")
    print(f"  Target RPC      : {endpoint}")
    print("=" * 70)

    client, operator, active_rpc = resolve_client(endpoint)

    initial_count = 0
    try:
        initial_count = client.read_contract(address=CONTRACT_ADDRESS, function_name="get_record_count", args=[])
        print(f"\n[+] Initial record count on contract: {initial_count}")
    except Exception as e:
        print(f"[!] Could not query initial count: {e}")

    results = []

    for idx, item in enumerate(BATCH_PAYLOADS, 1):
        rec_id = item["record_id"]
        label = item["source_label"]
        url = item["source_url"]
        purpose = item["agent_purpose"]

        print(f"\n[{idx}/{len(BATCH_PAYLOADS)}] Processing Record: {rec_id.upper()} ({item['expected_category']})")
        print(f"    Label   : {label}")
        print(f"    URL     : {url}")
        print(f"    Purpose : {purpose[:80]}…")

        # Step 1: Check if already registered
        already_exists = False
        existing_owner = None
        existing_state = None
        try:
            existing = client.read_contract(address=CONTRACT_ADDRESS, function_name="get_record", args=[rec_id])
            if existing and existing.get("record_id") == rec_id:
                already_exists = True
                existing_owner = existing.get("owner")
                existing_state = existing.get("state")
                print(f"    [i] Record {rec_id} already exists with state: {existing_state}")
        except Exception:
            already_exists = False

        if not already_exists:
            print(f"    [-] Calling create_record…")
            try:
                tx_create = client.write_contract(
                    address=CONTRACT_ADDRESS,
                    function_name="create_record",
                    args=[rec_id, url, label, purpose],
                    account=operator,
                )
                print(f"    [-] create_record tx: {tx_create}")
                print(f"    [-] Waiting for create_record confirmation…")
                create_receipt = client.wait_for_transaction_receipt(
                    tx_create,
                    status=TransactionStatus.ACCEPTED,
                    interval=2000,
                    retries=30,
                )
                print(f"    [+] Record created! Receipt status: {create_receipt.get('status_name')}")
                existing_owner = operator.address.lower()
                existing_state = "SUBMITTED"
            except Exception as e:
                print(f"    [!] Error creating record {rec_id}: {e}")
                continue

        # Step 2: Call evaluate_record if owned by operator and awaiting evaluation
        if existing_state in ("SUBMITTED", None) and (existing_owner is None or existing_owner == operator.address.lower()):
            print(f"    [-] Calling evaluate_record (validator quorum inspection)…")
            try:
                tx_eval = client.write_contract(
                    address=CONTRACT_ADDRESS,
                    function_name="evaluate_record",
                    args=[rec_id],
                    account=operator,
                )
                print(f"    [-] evaluate_record tx: {tx_eval}")
                print(f"    [-] Waiting for validator consensus…")
                eval_receipt = client.wait_for_transaction_receipt(
                    tx_eval,
                    status=TransactionStatus.ACCEPTED,
                    interval=3000,
                    retries=60,
                )
                print(f"    [+] Evaluation confirmed! Status: {eval_receipt.get('status_name')}")
            except Exception as e:
                print(f"    [!] Note on evaluate_record for {rec_id}: {e}")

        # Step 3: Fetch updated record
        try:
            time.sleep(1)
            rec_data = client.read_contract(address=CONTRACT_ADDRESS, function_name="get_record", args=[rec_id])
            is_safe = client.read_contract(address=CONTRACT_ADDRESS, function_name="is_safe", args=[rec_id])
            status_display = "CERTIFIED SAFE" if is_safe else "THREAT INTERCEPTED"
            print(f"    [>>>] Consensus Result: {status_display} [State: {rec_data.get('state')}, Decision: {rec_data.get('decision')}]")
            results.append({
                "record_id": rec_id,
                "label": label,
                "is_safe": is_safe,
                "state": rec_data.get("state"),
                "decision": rec_data.get("decision"),
                "high_count": rec_data.get("high_count"),
                "medium_count": rec_data.get("medium_count"),
                "summary": rec_data.get("summary", "")[:120] + "…",
            })
        except Exception as e:
            print(f"    [!] Error reading updated record {rec_id}: {e}")

    # Summary
    try:
        final_count = client.read_contract(address=CONTRACT_ADDRESS, function_name="get_record_count", args=[])
    except Exception:
        final_count = len(results)

    print("\n" + "=" * 70)
    print("  BATCH INGRESS POPULATION SUMMARY")
    print(f"  Total Records on Contract: {final_count} (was {initial_count})")
    print(f"  RPC Endpoint Used        : {active_rpc}")
    print("=" * 70)
    for r in results:
        status_tag = "CERTIFIED SAFE   " if r["is_safe"] else "THREAT INTERCEPTED"
        print(f"  [{r['record_id'].upper()}] {status_tag} | {r['decision']} | {r['label']}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Populate SourceFirewall with historical batch data.")
    parser.add_argument("--endpoint", default=PRIMARY_RPC, help=f"GenLayer RPC endpoint (default: {PRIMARY_RPC})")
    args = parser.parse_args()
    populate_batch(args.endpoint)
