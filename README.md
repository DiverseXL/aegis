# Aegis — Confidential Treasury & Payroll OS for DAOs

Built for the iExec WTF Hackathon Summer Edition (Nox Protocol track).

## What it is
Aegis lets a DAO pay contributors — salaries, grants, bounties — through a
linear payment stream where the *amount* is confidential on-chain, while the
stream's existence, timing, and every automated decision made about it stay
fully auditable. Money is private; the logic that moves it is not.

## Why
Public blockchains expose every payout amount, forever, to anyone. That's a
dealbreaker for DAOs and companies that would otherwise use crypto-native
payroll: it leaks compensation, invites front-running on treasury moves, and
blocks institutional adoption. Aegis fixes the amount-privacy problem without
touching wallet UX or requiring recipients to do anything differently.

## Architecture
- **AegisVault** — wraps a DAO's treasury ERC-20 into a confidential ERC-7984
  token via iExec Nox (`ERC20ToERC7984Wrapper`). One-step wrap, two-step
  (encrypt-then-decrypt-proof) unwrap.
- **AegisStream** — a Sablier-inspired linear vesting stream, reimplemented
  natively with Nox's encrypted arithmetic (`Nox.mul`/`Nox.div` on `euint256`)
  since Sablier's own contracts only accept plaintext amounts and can't be
  wrapped directly. See `feedback.md` for why.
- **Agent layer** *(in progress)* — autonomous monitoring of stream creation
  and withdrawal for anomalies, selective-disclosure handling for auditors,
  and plain-English DAO policy parsing.
- **Frontend** *(in progress)* — flight-recorder style dashboard: live stream
  state, agent decisions and reasoning, disclosure event log.

## DAO Governance Compatibility
Aegis is designed to sit behind a Gnosis Safe (or any multisig) rather than a
single EOA. `AegisStream`'s `sender` field — set at stream creation — can be a
Safe's contract address directly; Safe's own multi-signer approval flow governs
who can trigger `createStream()` or `discloseToAuditor()` calls from it, with no
additional integration required on Aegis's side. A dedicated Safe module (for
richer proposal/voting UX around stream creation) is a natural roadmap item but
out of scope for this submission.

## Live Proof — Full End-to-End Flow on Ethereum Sepolia

Every claim below is a real, independently verifiable transaction — not a demo
script that only runs locally. This is the complete DAO payroll journey, executed
by an actual Gnosis Safe multisig, on live testnet infrastructure.

### Deployed & Verified Contracts

| Contract | Address | Verified On |
|---|---|---|
| MockERC20 (Aegis Mock USDC) | [`0x8c54d36d...`](https://sepolia.etherscan.io/address/0x8c54d36d022ba2c9684c2c77e48d3d961b6ef507#code) | Etherscan, Blockscout, Sourcify |
| AegisVault | [`0xb9dC5Aeb...`](https://sepolia.etherscan.io/address/0xb9dc5aebe33f7b1f74971c0f87164ed018f69c66#code) | Etherscan, Blockscout, Sourcify |
| AegisStream | [`0xd4AC9ef4...`](https://sepolia.etherscan.io/address/0xd4ac9ef480a60215b0ade26c85716a0b5a87ecf1#code) | Etherscan, Blockscout, Sourcify |
| Demo Gnosis Safe (1-of-1) | [`0x1c0780fa...`](https://sepolia.etherscan.io/address/0x1c0780facd4e295439c07fd69104f276de80dfb4) | Etherscan |

Nox `NoxCompute` on Ethereum Sepolia: `0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF`

### The Full Journey — Every Step On-Chain

| Step | What Happened | Transaction |
|---|---|---|
| 1. Safe wraps treasury funds | Safe batches `approve` + `wrap` + `setOperator` — all executed as one Safe multisig transaction, not a proxied EOA | [`0x4b177d82...`](https://sepolia.etherscan.io/tx/0x4b177d82952c3c40a7b6a3f42db7ae911a7d127f1e590b9421610eeacf511b31) |
| 2. Safe creates a confidential stream | Amount encrypted client-side, Nox proof correctly attributed to the **Safe** as owner, `createStream()` called directly by the Safe | [`0xab3627e9...`](https://sepolia.etherscan.io/tx/0xab3627e9b56daf8bd283c641be88bd93449af5fca164c046889ff43d813517ea) |
| 3. Recipient withdraws vested funds | Recipient claims their linearly-vested portion — amount stays encrypted on-chain throughout | [`0x891aba69...`](https://sepolia.etherscan.io/tx/0x891aba69fb84865c1e45ffb1aed5a4096f9bf9d872e1ea525b7276eb36476a36) |
| 4. Safe discloses to an auditor | Safe grants a **freshly generated, zero-balance wallet** a frozen snapshot of the withdrawn amount | [`0x892d9d01...`](https://sepolia.etherscan.io/tx/0x892d9d01f741926999f65ea16be7afec83497dcb7ff45db7e9eb286ad8f71e14) |
| 5. Auditor decrypts, gaslessly | The auditor wallet — which never held any ETH — successfully decrypts the disclosed amount via a signed, gasless request | Confirmed via `handleClient.decrypt()`, no transaction needed |

**Why this matters:** every step above proves a specific, hard-to-fake claim:
- Step 1-2 prove **real DAO governance compatibility** — this isn't a single-EOA
  toy, it's an actual multisig executing real transactions.
- Step 2's proof-of-ownership resolution (documented in `feedback.md` §6) proves
  the encryption layer correctly handles smart-contract-wallet senders, not just EOAs.
- Step 3 proves **the vesting math is genuinely encrypted** end-to-end, not
  simulated.
- Steps 4-5 prove **selective disclosure works exactly as designed**: a party with
  *zero* prior relationship to the system (no funds, no history) can be granted
  narrow, auditable access to exactly one historical data point — nothing more.

### Current Status & What's Left

- [x] Core contracts (Vault, Stream, selective disclosure) — built, tested, deployed, verified
- [x] Off-chain agents (Payout Guardian, Disclosure agent, Policy-parsing agent) — built
- [x] Gnosis Safe / DAO governance compatibility — proven live on-chain
- [ ] Frontend dashboard — in progress
- [ ] Demo video
- [ ] Policy-parsing agent — built and validated, not yet run against a live LLM API (pending funded API key)

We're building this transparently — see `feedback.md` for every real technical
challenge we hit and how we resolved it, not a sanitized summary.

## Setup
Requirements: Node.js 22+, Docker running locally.

```bash
npm install
npx hardhat test
```

## Deployment target
ETH Sepolia (per hackathon requirement). See `feedback.md` for a note on
verifying Nox network support before deploying.

## Credits / prior art
Confidential token design: iExec Nox Protocol (`@iexec-nox/nox-confidential-contracts`).
Streaming model inspired by Sablier's LockupLinear mechanics (public reference,
no code reused — see `feedback.md` for why direct wrapping wasn't possible).
