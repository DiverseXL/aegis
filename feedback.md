# Feedback for iExec — Nox Protocol
### WTF Hackathon Summer Edition — from the Aegis team

This document captures real friction points, gotchas, and confirmed behaviors we
encountered while building **Aegis** — a confidential DAO treasury & payroll system —
on Nox. Everything here was verified directly against source code, live testing, or
official docs before being written down; nothing is speculative.

---

## 📋 Summary

| Topic | Severity | Status |
|---|---|---|
| Networks page renders via JS, not scraper/LLM-readable | Medium | Reported below |
| Chain support unclear from docs alone | Medium | ✅ Resolved — see below |
| Sablier-style protocols can't be wrapped, must be reimplemented | High (conceptual) | Documented below |
| ACL grants are permanent, no revoke function | High | ✅ Worked around, documented |
| Compiler version conflict between two core packages | High | ✅ Resolved, documented |
| `confidentialTransfer` vs `confidentialTransferFrom` ACL asymmetry | High | ✅ Resolved, documented |
| `_mint` already grants recipient admin/decrypt access | Medium | ✅ Clarified |
| `subgraphUrl` required but undocumented | Medium | ✅ Resolved, documented |
| `Nox.add(handle, 0)` as ACL-isolation pattern | — | ✅ Confirmed working as designed |

---

## 1. Documentation

**Issue:** The docs site (docs.noxprotocol.io) renders some pages — notably the
**Networks** page — via client-side JavaScript. Static tools, scrapers, and LLM
agents fetching the page directly receive an empty shell instead of the actual
content. Pages with an "Are you an LLM? Read the .md version" banner work great,
but not every page has this — the Networks page in particular doesn't.

**Suggestion:** Expose an `.md`/`.json` equivalent for the Networks page too, or
ensure the LLM-readable version is reachable without JS execution.

**What worked well:** The arithmetic, ACL, and ERC-7984 guides were clear, accurate,
and had working code samples we could build against directly with no surprises
during compilation.

---

## 2. Chain / Network Clarity ✅ Resolved

**Issue:** We initially found conflicting signals about which testnet Nox is live on
(Arbitrum Sepolia vs. Ethereum Sepolia — the latter required by this hackathon's
judging criteria).

**Resolution:** Confirmed directly from `Nox.sol`'s source metadata
(`@iexec-nox/nox-protocol-contracts`) that `NoxCompute` address resolution supports:

| Chain | Chain ID | NoxCompute Address |
|---|---|---|
| Hardhat local dev | `31337` | `0x75C6AF4430cc474b1bb9b8540b7E46D6f8e1C685` |
| Arbitrum Sepolia | `421614` | `0xd464B198f06756a1d00be223634b85E0a731c229` |
| Ethereum Sepolia | `11155111` | `0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF` |

**Suggestion:** Surface this table statically in the main setup guide — we had to
audit package internals to confirm chain compatibility, which shouldn't be necessary
for a hard scoring requirement in a hackathon.

---

## 3. Protocol / Architecture Observations

**Wrapping vs. reimplementing:** "Add privacy on top of an existing protocol without
modifying it" (the hackathon's core ask) works cleanly for protocols whose only
sensitive data is a *value being moved* (token swaps, transfers). It does **not**
work for protocols like Sablier, whose core contracts store and expose vesting math
(deposited/withdrawn/streamed amounts) as plaintext public getters by design — there's
no way to wrap that contract with encrypted inputs, since its function signatures only
accept plaintext `uint128`/`uint256`.

**Suggestion:** Call this out explicitly in future hackathon briefs: *"protocols with
public accounting as their core function need to be reimplemented with confidential
primitives, not wrapped."*

**What worked well:** `Nox.mul`/`Nox.div` on encrypted types made confidential
linear-vesting math straightforward to implement once confirmed — this was the single
most useful reference page in our entire build.

**Suggestion:** A minimal end-to-end "confidential Sablier-style stream" reference
example in the docs would save future builders the exact investigation we went through.

---

## 4. ACL Model

### 4.1 No revoke function ✅ Worked around

`Nox.addViewer()` grants are **permanent by design** — there is no `removeViewer`/revoke
function. This makes sense given the off-chain Handle Gateway model (a viewer could
have already decrypted and stored the value once granted), but it's a genuinely
non-obvious constraint for anyone designing selective-disclosure or auditor-access
features. We initially assumed grant/revoke was possible and had to redesign around
**"migrate to a fresh handle for each new disclosure window"** instead.

**Suggestion:** A callout in the Manage Viewers guide (*"there is no revoke — see this
pattern for time-boxed disclosure instead"*) would save a design iteration.

### 4.2 `Nox.add(handle, 0)` as an isolation pattern ✅ Confirmed

We verified the Managing Viewers guide's recommended pattern for creating an
independent, freshly-ACL'd copy of an encrypted value
(`Nox.add(existingHandle, Nox.toEuint256(0))`) — used for Aegis's selective-disclosure
snapshot design. Confirmed this guarantees a genuinely new, distinct handle rather than
a potential no-op optimization, which was a real security-relevant assumption given the
no-revoke model above.

**Suggestion:** This is documented, but somewhat indirectly — cross-referencing it from
the "Managing Public Decryption" or ACL overview pages would make it easier to find.

### 4.3 `_mint` already grants recipient access ✅ Clarified

Contrary to what we initially assumed from the ACL overview page, `_mint` (called
internally by `ERC20ToERC7984Wrapper.wrap()`) already performs both `Nox.allowThis()`
(admin access for the calling contract) and `Nox.allow(newBalance, to)` (admin *and*
decrypt rights for the recipient) on the new balance handle. Recipients of
minted/wrapped tokens already have decrypt access out of the box — no additional
`addViewer()` call needed.

**Suggestion:** Confirming this in the "Create a Confidential ERC-7984 Token" guide
would save the investigation time we spent reading `ERC7984Base.sol`'s internal
`_update` logic directly.

### 4.4 `confidentialTransfer` vs `confidentialTransferFrom` asymmetry ✅ Resolved

`confidentialTransfer(to, amount)` does **not** grant the caller any ACL access on the
returned handle. `confidentialTransferFrom(from, to, amount)` **does**, via an internal
`Nox.allowTransient(transferred, msg.sender)`. This is a sensible design choice
(distinguishing self-transfers from operator-mediated ones), but it's a real gotcha for
anyone building logic that needs to act on a transfer's result handle. We had to
explicitly route self-transfers through `confidentialTransferFrom` (with
`from == address(this)`) purely to obtain the transient grant.

**Suggestion:** Document this explicitly in the ERC-7984 "Operators" or main transfer
section.

---

## 5. SDK & Tooling

### 5.1 Compiler version conflict between packages ✅ Resolved

`@iexec-nox/nox-protocol-contracts` (`Nox.sol`, `INoxCompute.sol`, `Compute.sol`,
`ACL.sol`, `Common.sol`) all declare `pragma solidity ^0.8.35`, while
`@iexec-nox/nox-confidential-contracts` (`ERC7984Base.sol`,
`ERC20ToERC7984WrapperBase.sol`, `ERC20ToERC7984Wrapper.sol`) declare `^0.8.28`. Both
packages are dependencies of each other in any real confidential-token contract, so a
consuming project **must** target `0.8.35` (or higher) to satisfy both. Targeting
`0.8.28` alone breaks compilation with `HHE909` ("No solc version enabled in this
profile is compatible with a dependency of this file").

**Suggestion:** A note in the Hardhat setup guide clarifying the actual minimum
compiler version needed when both packages are used together would prevent this.

### 5.2 Missing subgraph URL ✅ Resolved

`HandleClientConfig.subgraphUrl` is a **required** field for `createViemHandleClient`,
but the docs have no reference to it anywhere — not in the JS SDK guide, Getting
Started, or Networks page. We found the actual endpoint via general web search:
*"Nox Protocol Indexer - Ethereum Sepolia"* on The Graph Explorer, subgraph ID
`9CsccKwvgYFo72zZeU4k4wj2NEBLdWhVE3EUandgmzgo`.

**Suggestion:** Publish this directly in the JS SDK reference alongside the other
config fields — ideally one official URL per supported network, matching the Networks
page's chain list.

### 5.3 Handle Gateway `owner` field is unauthenticated at request time

The `encryptInput()` JS SDK sends `owner` to the Handle Gateway (`/v0/secrets`) as
a plain, unverified string in the JSON body — the Gateway does **not** check that
the calling wallet actually controls the claimed `owner` address. The `owner` is
simply embedded into the EIP-712 proof alongside `handle`, `app`, and `createdAt`,
then signed by the Gateway.

Security is enforced entirely on-chain later — `Compute.sol`'s `validateInputProof`
checks `ownerInProof == owner` (where `owner` = `msg.sender` from the calling
contract's `Nox.fromExternal()`) — not at encryption request time.

**Why this matters:** We initially assumed the Gateway itself authenticated the
`owner` claim, and had to trace through `encryptInput.ts`, `ApiService.post()`, and
`makeCall()` to confirm the HTTP request carries no signature or auth header.
This is a reasonable design once understood (the Gateway doesn't need to validate
`owner` because on-chain `msg.sender` matching gates actual usage), but it is
non-obvious. A callout in the JS SDK's `encryptInput()` reference docs — clarifying
that `owner` is a claim resolved by on-chain validation, not something the Gateway
itself verifies — would save future builders the same investigation.

---## 6. Encrypting on Behalf of a Smart Contract (e.g. Gnosis Safe)

We integrated Aegis with a real Gnosis Safe on Sepolia (proving DAO-multisig
compatibility) and hit a genuine, non-obvious integration challenge worth
documenting for future Nox + Safe/smart-account builders.

**The problem:** `encryptInput()`'s resulting proof embeds an `owner` field — read
via `blockchainService.getAddress()`, which resolves to whatever EOA wallet is
connected. This `owner` is later checked on-chain against `msg.sender` when the
proof is consumed (`Compute.sol`: `require(ownerInProof == owner)`, where `owner`
is `msg.sender` as seen by `NoxCompute`). If a Safe calls `createStream()`, the
Safe *is* `msg.sender` on-chain — but the EOA that ran the off-chain `encryptInput()`
script is necessarily a plain wallet, since a Safe (a smart contract with no private
key) cannot execute JS SDK code. This mismatch causes an on-chain "Owner mismatch"
revert unless addressed.

**What we found investigating this:** the Handle Gateway's `/v0/secrets` endpoint
accepts `owner` as a **plain, self-reported JSON field with no signature or
authentication binding it to the caller** — confirmed by tracing `encryptInput.ts`
and `ApiService.post`/`makeCall` end to end; there is no `signTypedData`,
`personal_sign`, or any cryptographic challenge involving `owner` anywhere in the
encryption request path (signing only happens during `decrypt()`, and separately
when the Gateway signs its *own* response for client-side attestation).

**The fix:** override the wallet client's `getAddresses()` to report the target
smart contract's address (e.g. the Safe) before calling `encryptInput()`. Since the
Gateway trusts `owner` at face value and the actual security boundary is the later
on-chain `ownerInProof == msg.sender` check, this correctly produces a proof that
validates when the Safe (not the EOA) submits the transaction.

**Suggestion:** This is a completely valid and necessary pattern for any DAO/smart-
account integration (Safe, Account Abstraction wallets, etc.), but it's non-obvious
and easy to get wrong in the *other* direction (assuming the Gateway authenticates
`owner`, when it doesn't). Worth an explicit guide: *"Encrypting values on behalf of
a smart contract wallet"* — covering exactly this override pattern — since any
serious DAO-facing Nox integration will need it.

---

## Closing note

None of the above is a criticism of Nox's core design — the primitives themselves
(Handles, ACLs, encrypted arithmetic) are well thought out and, once understood,
 genuinely pleasant to build against. Every issue here is a **documentation
discoverability** problem, not a protocol design flaw. We hope this is useful as
iExec continues building out Nox's docs and tooling.

— The Aegis team ([github.com/DiverseXL/aegis](https://github.com/DiverseXL/aegis))