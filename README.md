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
- [ ] Tests passing end-to-end (blocked on local Docker setup for the Nox
      offchain stack — required for encrypt/decrypt test execution)
- [ ] Agent layer
- [ ] Frontend dashboard
- [ ] ETH Sepolia deployment (see `feedback.md` re: chain verification)

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
