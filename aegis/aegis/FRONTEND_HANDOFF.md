# Aegis — Frontend Integration Guide

Everything you need to build the dashboard against the deployed contracts and
agents. Ask in [repo/team channel] if anything here is unclear or out of date.

## Deployed Contracts (Ethereum Sepolia)

| Contract | Address | Explorer |
|---|---|---|
| MockERC20 (Aegis Mock USDC) | `0x8c54d36d022BA2c9684c2c77e48d3D961B6ef507` | [Etherscan](https://sepolia.etherscan.io/address/0x8c54d36d022ba2c9684c2c77e48d3d961b6ef507#code) |
| AegisVault | `0xb9dC5Aebe33f7b1F74971C0F87164eD018f69C66` | [Etherscan](https://sepolia.etherscan.io/address/0xb9dc5aebe33f7b1f74971c0f87164ed018f69c66#code) |
| AegisStream | `0xd4AC9ef480a60215b0aDe26c85716A0B5A87Ecf1` | [Etherscan](https://sepolia.etherscan.io/address/0xd4ac9ef480a60215b0ade26c85716a0b5a87ecf1#code) |

Deployer / initial Payout Guardian address: `0x0Ec656e175B83CE60048445E56764b8c03dfce59`
Nox `NoxCompute` on Ethereum Sepolia: `0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF`

All contracts are verified on Etherscan, Blockscout, and Sourcify — ABIs are
publicly readable directly from any of those, or from `artifacts/contracts/*.sol/*.json`
after running `npx hardhat compile` locally.

## The Core User Flow to Build

This is the one flow that matters most for the demo:

1. **Wrap treasury funds** — DAO admin approves + calls `AegisVault.wrap(to, amount)`
   to convert plain MockERC20 into confidential `aTREASURY` tokens.
2. **Create a stream** — DAO admin (as vault holder) sets `AegisStream` as an
   operator on the vault token (`setOperator(streamAddress, expiryTimestamp)`),
   then calls `AegisStream.createStream(asset, recipient, encryptedAmount, proof, startTime, duration)`.
   The amount must be encrypted client-side first (see JS SDK section below).
3. **Recipient claims** — recipient calls `AegisStream.withdraw(streamId)` any
   time after `startTime`; gets the linearly-vested portion.
4. **Auditor gets a disclosure** — DAO admin calls
   `AegisStream.discloseToAuditor(streamId, auditorAddress)`; this grants the
   auditor decrypt access to a **frozen snapshot** of the withdrawn amount at
   that moment (not a live view — see note below).
5. **Auditor decrypts** — auditor uses the JS SDK's `decrypt()` on the
   `snapshotHandle` emitted in the `DisclosureGranted` event.

## Important: everything money-related is encrypted

Balances and stream amounts are NOT plain numbers on-chain — they're `bytes32`
handles pointing to encrypted values. You cannot just read a balance and display
it; you need the **Nox JS SDK** to encrypt inputs before sending transactions and
decrypt outputs after reading them.

### JS SDK setup

```bash
npm install @iexec-nox/handle
```

```typescript
import { createViemHandleClient } from '@iexec-nox/handle';

const handleClient = await createViemHandleClient(walletClient, {
  smartContractAddress: '0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF', // NoxCompute Sepolia
  gatewayUrl: '<ask team — same one used in agents/payoutGuardian.ts .env>',
  subgraphUrl: 'https://api.thegraph.com/subgraphs/id/9CsccKwvgYFo72zZeU4k4wj2NEBLdWhVE3EUandgmzgo',
});
```

**Encrypting an amount before sending a transaction** (e.g. for `createStream`):
```typescript
const { handle, handleProof } = await handleClient.encryptInput(
  1000n,          // the plaintext amount as a bigint
  'uint256',       // NOT 'euint256' — plaintext type name, common mistake
  streamContractAddress
);
// pass `handle` and `handleProof` as the encryptedAmount/proof args to createStream()
```

**Decrypting a value you're authorized to view** (e.g. your own balance, or a
disclosed snapshot):
```typescript
const { value } = await handleClient.decrypt(theHandleBytes32);
// value is a bigint
```

**Critical gotcha:** `decrypt()` must be called with a `HandleClient` built from
the **actual wallet that has ACL access** to that handle — a recipient can only
decrypt their own balance handle, an auditor can only decrypt their own disclosed
snapshot handle. Calling `decrypt()` with the wrong wallet client will throw an
ACL authorization error. Build a fresh `HandleClient` per connected user's wallet,
not one shared instance for the whole app.

## Reading balances/amounts (view functions)

```typescript
// Get a handle (not the value itself — still needs decrypt())
const handle = await streamContract.read.getStreamTotalAmount([streamId]);
```

There is currently **no function to read plaintext amounts directly** — by
design. Any UI element showing "amount: X" requires the connected wallet to
have real decrypt access to that specific handle, or it should show "🔒 hidden"
if they don't.

## Events to listen for (for the "flight recorder" activity feed)

```solidity
event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, address asset);
event StreamWithdrawn(uint256 indexed streamId, address indexed recipient);
event DisclosureGranted(uint256 indexed streamId, address indexed auditor, address indexed requestedBy, bytes32 snapshotHandle, uint256 timestamp);
```

None of these leak amounts — they're safe to display publicly as an activity
log exactly as-is (that's the whole "private money, public logic" pitch).

## Off-chain agents (context, not required to integrate directly for MVP)

- `agents/payoutGuardian.ts` — watches `StreamCreated`, flags anomalies. Runs
  as a separate Node process, not something the frontend calls directly.
- `agents/disclosureAgent.ts` — same pattern, triggers/logs disclosures.
- `agents/policyParsingAgent.ts` — converts plain-English policy to config,
  human-reviewed before use. Not yet tested against a live API (no funded key).

If there's time, a nice frontend addition is a read-only view of the Guardian's
flag log or the Disclosure agent's audit trail, but this is NOT required for
the core demo flow above.

## Nice-to-have utilities

`utils/ensResolver.ts` — resolves addresses to ENS names for friendlier display
(e.g. show "vitalik.eth" instead of "0xd8dA6BF2..."). Falls back to a shortened
address if no ENS name exists. Read-only, no wallet needed — safe to call
anywhere you're displaying an address (recipient, auditor, sender, etc).

## Known limitations to be aware of

- Only ETH Sepolia is targeted (per hackathon requirement) — no multi-chain.
- No factory pattern — `AegisStream`/`AegisVault` are deployed once, not
  per-DAO. Fine for demo purposes.
- Self-disclosure is blocked (`auditor != recipient`), but there's no on-chain
  allowlist of approved auditors yet — any non-recipient address can be
  disclosed to. Worth a frontend-side confirmation dialog ("are you sure this
  is the right auditor address?") given there's no undo.

## Questions / where to check things yourself

- Full contract source: `contracts/AegisVault.sol`, `contracts/AegisStream.sol`
- Working test examples showing every function call pattern:
  `test/AegisVault.test.ts`, `test/AegisStream.test.ts`,
  `test/AegisStream.disclosure.test.ts` — these are the most reliable
  reference for exact function signatures and call patterns, since they're
  proven to actually work end-to-end.
- `feedback.md` — documents every Nox-specific gotcha we hit; worth a skim if
  something behaves unexpectedly.
