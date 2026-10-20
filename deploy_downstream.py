#!/usr/bin/env python3
"""
Deploy DownstreamAgent contract to GenLayer Studionet.
Links DownstreamAgent to the live SourceFirewall contract: 0x3b5E8363E513BD562063282830492963dD81953E
"""

import sys
import time
from pathlib import Path
import genlayer_py
from genlayer_py.chains import studionet
from genlayer_py.types import TransactionStatus

FIREWALL_ADDRESS = "0x3b5E8363E513BD562063282830492963dD81953E"
ENDPOINTS = [
    "https://studio-next.genlayer.com/api",
    "https://studio.genlayer.com/api",
]

def main():
    print("=== DEPLOYING DOWNSTREAM AGENT TO GENLAYER STUDIONET ===")
    
    code = Path("contracts/downstream_agent.py").read_text(encoding="utf-8")
    print(f"[*] Loaded DownstreamAgent contract ({len(code)} bytes)")

    for endpoint in ENDPOINTS:
        print(f"\n[*] Trying RPC endpoint: {endpoint}")
        try:
            operator = genlayer_py.create_account()
            print(f"[*] Operator account: {operator.address}")
            
            client = genlayer_py.create_client(chain=studionet, endpoint=endpoint, account=operator)
            
            # Fund operator
            print("[*] Funding operator account with 1 GEN…")
            client.fund_account(operator.address, 1000000000000000000)
            time.sleep(1)
            bal = client.get_balance(operator.address)
            print(f"[+] Funded! Balance: {bal}")
            
            # Verify firewall address is reachable
            try:
                count = client.read_contract(address=FIREWALL_ADDRESS, function_name="get_record_count", args=[])
                print(f"[+] Verified SourceFirewall at {FIREWALL_ADDRESS} (total records: {count})")
            except Exception as e:
                print(f"[!] Warning: Could not read record count from firewall on {endpoint}: {e}")

            # Deploy contract
            print(f"[*] Submitting contract deployment transaction (firewall_address={FIREWALL_ADDRESS})…")
            deploy_tx = client.deploy_contract(
                code=code,
                args=[FIREWALL_ADDRESS],
                leader_only=True,
            )
            print(f"[+] Deployment transaction sent! Hash: {deploy_tx}")
            
            # Wait for receipt
            print("[*] Awaiting transaction confirmation and contract address…")
            for _ in range(30):
                receipt = client.get_transaction_by_hash(deploy_tx)
                status = receipt.get("status")
                print(f"    Current status: {status}")
                if status in (TransactionStatus.ACCEPTED, "ACCEPTED", "FINALIZED", "SUCCESS"):
                    contract_addr = receipt.get("contract_address") or receipt.get("contractAddress")
                    print(f"\n[SUCCESS] DownstreamAgent successfully deployed!")
                    print(f"Contract Address: {contract_addr}")
                    print(f"Linked Firewall:  {FIREWALL_ADDRESS}")
                    print(f"Network:          GenLayer Studionet (Chain ID 61999)")
                    return contract_addr
                elif status in (TransactionStatus.UNDETERMINED, "UNDETERMINED", "CANCELED", "FAILED"):
                    print(f"[!] Deployment transaction ended with status {status}: {receipt}")
                    break
                time.sleep(3)
                
        except Exception as e:
            print(f"[!] Failed on {endpoint}: {e}")
            continue

    print("\n[!] Could not deploy on available endpoints.")
    sys.exit(1)

if __name__ == "__main__":
    main()
