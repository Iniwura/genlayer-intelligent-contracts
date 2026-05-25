# genlayer-intelligent-contracts

Smart contracts built on [GenLayer](https://genlayer.com) Bradbury Testnet as part of the Builder Program.

These contracts demonstrate GenLayer's core capability: combining **live web data fetching**, **LLM reasoning**, and **on-chain state** — all verified through Optimistic Democracy consensus.

---

## Contracts

### 1. Crypto Price Checker (`crypto_price_checker.py`)
Fetches the live price of any cryptocurrency from CoinGecko, uses an LLM to parse the response, and stores an ABOVE/BELOW/EQUAL status on-chain relative to a user-defined target.

**Deploy:** No constructor args needed  
**Call:** `check_price("bitcoin", 60000)`  
**Read:** `get_last_result()`

### 2. AI Content Moderator (`content_moderator.py`)
Accepts user-submitted text and uses an LLM to evaluate it against a custom ruleset, returning APPROVED or REJECTED on-chain with a reason.

**Deploy:** Pass your moderation rules as a string, e.g. `"No hate speech. No spam."`  
**Call:** `moderate("text to review")`  
**Read:** `get_last_verdict()`

---

## How to Deploy

1. Open [GenLayer Studio](https://studio.genlayer.com)
2. Create a new file and paste the contract code
3. Click **Deploy**
4. Interact via the Constructor Inputs panel on the left

## Network
- **Testnet:** Bradbury
- **Language:** Python (GenVM runtime)
- **SDK:** `py-genlayer`

## Research
These contracts are referenced in my performance benchmarking article:  
[Performance Benchmarking of GenLayer Intelligent Contracts](https://medium.com/@iniwuraakuru/performance-benchmarking-of-genlayer-intelligent-contracts-execution-patterns-llm-response-0069f2660ce4)

---

*Built by Iniwura Akuru — GenLayer Builder Program, May 2026*
