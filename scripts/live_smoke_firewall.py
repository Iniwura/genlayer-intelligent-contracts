import json
import time
import genlayer_py
from genlayer_py.chains import studionet
from genlayer_py.types import TransactionStatus

CONTRACT_ADDRESS = "0x3b5E8363E513BD562063282830492963dD81953E"
DEPLOYMENT_TX = "0xd29f4293365f096c9cc817c424f1a2c81c41e4a9353fa93af6fd89a52cf3aa08"
ENDPOINT = "https://studio.genlayer.com/api"

print(f"=== SourceFirewall Live On-Chain Smoke Test ===")
print(f"Target Contract: {CONTRACT_ADDRESS}")
print(f"Deployment Tx: {DEPLOYMENT_TX}")
print(f"RPC Endpoint: {ENDPOINT}")

operator = genlayer_py.create_account()
client = genlayer_py.create_client(chain=studionet, endpoint=ENDPOINT, account=operator)

print(f"Operator Address: {operator.address}")
client.fund_account(operator.address, 1000000000000000000)
balance = client.get_balance(operator.address)
print(f"Funded Balance: {balance} wei")

# 1. Call create_record
record_id = "rec-live-001"
source_url = "https://raw.githubusercontent.com/Iniwura/semantic-breach-registry/main/README.md"
source_label = "Semantic Registry Doc"
agent_purpose = "Security Audit"

print(f"\n--- Submitting create_record for '{record_id}' ---")
tx_create_hash = client.write_contract(
    address=CONTRACT_ADDRESS,
    function_name="create_record",
    args=[record_id, source_url, source_label, agent_purpose],
    account=operator,
)
print(f"create_record Transaction Hash: {tx_create_hash}")

print("Waiting for create_record ACCEPTED receipt...")
create_receipt = client.wait_for_transaction_receipt(
    tx_create_hash,
    status=TransactionStatus.ACCEPTED,
    interval=3000,
    retries=40,
)
print(f"create_record Receipt Status: {create_receipt.get('status_name')} ({create_receipt.get('status')})")

# 2. Call evaluate_record
print(f"\n--- Submitting evaluate_record for '{record_id}' ---")
tx_eval_hash = client.write_contract(
    address=CONTRACT_ADDRESS,
    function_name="evaluate_record",
    args=[record_id],
    account=operator,
)
print(f"evaluate_record Transaction Hash: {tx_eval_hash}")

print("Waiting for evaluate_record consensus receipt (validators fetching URL and running LLM evaluation)...")
eval_receipt = client.wait_for_transaction_receipt(
    tx_eval_hash,
    status=TransactionStatus.ACCEPTED,
    interval=5000,
    retries=60,
)
print(f"evaluate_record Receipt Status: {eval_receipt.get('status_name')} ({eval_receipt.get('status')})")

# 3. Query record state and safety
print(f"\n--- Querying on-chain state ---")
record_data = client.read_contract(
    address=CONTRACT_ADDRESS,
    function_name="get_record",
    args=[record_id],
)
print(f"get_record result:")
print(json.dumps(record_data, indent=2, default=str))

is_safe_result = client.read_contract(
    address=CONTRACT_ADDRESS,
    function_name="is_safe",
    args=[record_id],
)
print(f"\nis_safe('{record_id}'): {is_safe_result}")

total_count = client.read_contract(
    address=CONTRACT_ADDRESS,
    function_name="get_record_count",
    args=[],
)
print(f"get_record_count(): {total_count}")

# Output summary line for easy extraction
print("\n=== SMOKE TEST SUMMARY ===")
print(f"CONTRACT_ADDRESS={CONTRACT_ADDRESS}")
print(f"DEPLOYMENT_TX={DEPLOYMENT_TX}")
print(f"CREATE_TX={tx_create_hash}")
print(f"EVAL_TX={tx_eval_hash}")
print(f"IS_SAFE={is_safe_result}")
print(f"TOTAL_RECORDS={total_count}")
