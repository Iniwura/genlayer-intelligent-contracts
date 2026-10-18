import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export const CONTRACT_ADDRESS = (
  import.meta.env.VITE_SOURCEFIREWALL_CONTRACT_ADDRESS ||
  "0x3b5E8363E513BD562063282830492963dD81953E"
).trim();

export const BRADBURY_RPC =
  import.meta.env.VITE_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

export const EXPLORER_URL =
  testnetBradbury.blockExplorers?.default?.url || "https://explorer-bradbury.genlayer.com";

export const CHAIN_ID = testnetBradbury.id || 61999;
export const CHAIN_NAME = "GenLayer Studionet";

export const METHODS = Object.freeze({
  views: ["get_record", "get_record_count", "get_record_id_at", "is_safe"],
  writes: ["create_record", "evaluate_record"],
});

const latest = { transactionHashVariant: "latest-nonfinal" };
const VALID_STATES = new Set(["SUBMITTED", "EVALUATING", "CLEARED", "QUARANTINED", "UNRESOLVED"]);
const VALID_DECISIONS = new Set(["ALLOW", "REVIEW", "BLOCK", "NOT_EVALUATED", "UNRESOLVED"]);

export function configurationError() {
  if (!CONTRACT_ADDRESS) return "No deployed SourceFirewall address is configured.";
  if (!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS)) {
    return "VITE_SOURCEFIREWALL_CONTRACT_ADDRESS is not a valid 20-byte address.";
  }
  return "";
}

export function createReadClient() {
  return createClient({ chain: testnetBradbury, endpoint: BRADBURY_RPC });
}

export function createWriteClient(account) {
  if (!window.ethereum) throw new Error("No browser wallet provider was found.");
  return createClient({
    chain: testnetBradbury,
    endpoint: BRADBURY_RPC,
    account,
    provider: window.ethereum,
  });
}

function requireContract() {
  const error = configurationError();
  if (error && CONTRACT_ADDRESS) throw new Error(error);
  if (!CONTRACT_ADDRESS) {
    throw new Error("Connect a deployed SourceFirewall contract before sending a transaction.");
  }
}

function record(value) {
  return value instanceof Map ? Object.fromEntries(value) : value || {};
}

function list(value) {
  if (value instanceof Map) return [...value.values()];
  return Array.isArray(value) ? value : [];
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

export function normalizeRecord(raw) {
  const value = record(raw);
  const state = VALID_STATES.has(value.state) ? value.state : "UNRESOLVED";
  const decision = VALID_DECISIONS.has(value.decision) ? value.decision : "UNRESOLVED";
  return {
    record_id: String(value.record_id || ""),
    owner: String(value.owner || ""),
    source_url: String(value.source_url || ""),
    source_label: String(value.source_label || ""),
    agent_purpose: String(value.agent_purpose || ""),
    state,
    decision,
    source_digest: String(value.source_digest || ""),
    findings: list(value.findings).map((finding) => {
      const item = record(finding);
      return {
        category: String(item.category || ""),
        severity: String(item.severity || "LOW"),
        confidence: String(item.confidence || "LOW"),
        evidence_quote: String(item.evidence_quote || ""),
        source_pointer: String(item.source_pointer || ""),
        explanation: String(item.explanation || ""),
      };
    }),
    summary: String(value.summary || ""),
    error_code: String(value.error_code || ""),
    high_count: nonNegativeInteger(value.high_count),
    medium_count: nonNegativeInteger(value.medium_count),
    low_count: nonNegativeInteger(value.low_count),
    evaluation_attempts: nonNegativeInteger(value.evaluation_attempts),
    result_fingerprint: String(value.result_fingerprint || ""),
  };
}

export async function readSourceFirewall(client, functionName, args = []) {
  requireContract();
  if (!METHODS.views.includes(functionName)) {
    throw new Error(`Unsupported SourceFirewall view: ${functionName}`);
  }
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    ...latest,
  });
}

export async function loadRecords(client) {
  requireContract();
  const totalRaw = await readSourceFirewall(client, "get_record_count");
  const total = Number(totalRaw || 0);
  if (total === 0) return [];
  const ids = await Promise.all(
    Array.from({ length: total }, (_, index) =>
      readSourceFirewall(client, "get_record_id_at", [index + 1])
    )
  );
  const records = await Promise.all(
    ids.map((id) => readSourceFirewall(client, "get_record", [String(id)]))
  );
  return records.map(normalizeRecord).reverse();
}

export async function isSafeRecord(client, recordId) {
  try {
    return await readSourceFirewall(client, "is_safe", [String(recordId)]);
  } catch (err) {
    console.warn(`is_safe check failed for ${recordId}:`, err);
    return false;
  }
}

export async function writeSourceFirewall(client, functionName, args = [], onSubmitted) {
  requireContract();
  if (!METHODS.writes.includes(functionName)) {
    throw new Error(`Unsupported SourceFirewall write: ${functionName}`);
  }
  const hashResult = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n,
  });
  const hash =
    typeof hashResult === "string"
      ? hashResult
      : hashResult?.hash || hashResult?.transactionHash || hashResult?.transaction_hash;
  if (!hash) throw new Error("The wallet returned no transaction hash.");
  onSubmitted?.(hash);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 200,
  });
  return { hash, receipt };
}

function bradburyChainId() {
  return `0x${testnetBradbury.id.toString(16)}`;
}

export async function ensureBradbury(provider) {
  const expected = bradburyChainId();
  const current = await provider.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === expected.toLowerCase()) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: expected }],
    });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: expected,
          chainName: testnetBradbury.name,
          rpcUrls: testnetBradbury.rpcUrls.default.http,
          nativeCurrency: testnetBradbury.nativeCurrency,
          blockExplorerUrls: testnetBradbury.blockExplorers?.default?.url
            ? [testnetBradbury.blockExplorers.default.url]
            : [],
        },
      ],
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: expected }],
    });
  }
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("Install or enable a browser wallet (such as MetaMask) to interact with Bradbury.");
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const account = accounts?.[0];
  if (!account) throw new Error("The wallet did not return an account.");
  await ensureBradbury(window.ethereum);
  const balance = await getWalletBalance(account);
  return { account, client: createWriteClient(account), balance };
}

export async function getWalletBalance(account) {
  if (!window.ethereum || !account) return "0.00";
  try {
    const balanceHex = await window.ethereum.request({
      method: "eth_getBalance",
      params: [account, "latest"],
    });
    const wei = BigInt(balanceHex || "0x0");
    const whole = wei / 1000000000000000000n;
    const frac = (wei % 1000000000000000000n) / 100000000000000n;
    return `${whole}.${frac.toString().padStart(4, "0")}`;
  } catch (e) {
    console.warn("Could not fetch balance:", e);
    return "0.00";
  }
}

export function transactionUrl(hash) {
  return hash ? `${EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}` : "";
}

export function contractUrl(address = CONTRACT_ADDRESS) {
  return address ? `${EXPLORER_URL.replace(/\/$/, "")}/address/${address}` : "";
}

export function errorText(error) {
  if (!error) return "";
  if (error?.code === 4001 || /user rejected/i.test(error?.message || "")) {
    return "Wallet signature or transaction was rejected by user.";
  }
  return error?.shortMessage || error?.reason || error?.message || "The requested operation failed.";
}
