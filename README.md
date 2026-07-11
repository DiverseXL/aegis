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

## Status
- [x] AegisVault (confidential treasury wrapper)
- [x] AegisStream (confidential linear vesting)
- [x] discloseToAuditor (selective disclosure via frozen snapshots)
- [x] payoutGuardian.ts (off-chain anomaly watcher)
- [x] disclosureAgent.ts (off-chain disclosure trigger + audit log)
- [x] Tests passing end-to-end against real Docker-backed Nox stack
- [x] Deployed to Ethereum Sepolia
- [x] Etherscan/Blockscout/Sourcify source verification
- [ ] Policy-parsing agent
- [ ] Frontend dashboard

## Deployed Contracts (Ethereum Sepolia)

All contracts verified on Etherscan, Blockscout, and Sourcify.

| Contract    | Address                                      |
|-------------|-----------------------------------------------|
| MockERC20 (Aegis Mock USDC) | [`0x8c54d36d022BA2c9684c2c77e48d3D961B6ef507`](https://sepolia.etherscan.io/address/0x8c54d36d022ba2c9684c2c77e48d3d961b6ef507#code) |
| AegisVault  | [`0xb9dC5Aebe33f7b1F74971C0F87164eD018f69C66`](https://sepolia.etherscan.io/address/0xb9dc5aebe33f7b1f74971c0f87164ed018f69c66#code) |
| AegisStream | [`0xd4AC9ef480a60215b0aDe26c85716A0B5A87Ecf1`](https://sepolia.etherscan.io/address/0xd4ac9ef480a60215b0ade26c85716a0b5a87ecf1#code) |

Deployer / initial Payout Guardian: `0x0Ec656e175B83CE60048445E56764b8c03dfce59`

Nox's `NoxCompute` contract on Ethereum Sepolia (used automatically by `Nox.sol`'s chain-aware resolver): `0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF`

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
