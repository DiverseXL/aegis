# Feedback for iExec — Nox Protocol (WTF Hackathon Summer Edition)

## Documentation
- The docs site (docs.noxprotocol.io) renders content via JavaScript for card-based pages
  (e.g. the Networks page), which means static tools/scrapers/LLM agents fetching the page
  directly get an empty shell instead of the actual chain list. Pages with an "Are you an LLM?
  read the .md version" banner work great for direct content, but not every page seems to have
  this — the Networks page in particular. Recommend either exposing an .md/.json equivalent for
  the Networks page too, or ensuring the LLM-readable version is reachable without JS execution.
- Excellent: the arithmetic, ACL, and ERC-7984 guides were clear, accurate, and had working
  code samples we could build against directly with no surprises during compilation.

## Chain / network clarity
- We initially found conflicting signals about which testnet Nox is live on (Arbitrum Sepolia
  vs. Ethereum Sepolia — the latter required by this hackathon's judging criteria). Would be
  helpful if the docs had one canonical, static (non-JS-rendered) page confirming exact deployed
  chains and contract addresses per network, especially during a hackathon where the target
  chain is a hard scoring requirement.
- *Resolution detail:* We eventually confirmed directly from the `Nox.sol` source code metadata (in `@iexec-nox/nox-protocol-contracts`) that the `NoxCompute` address resolution supports **Hardhat local development chain (31337)**, **Arbitrum Sepolia (421614)**, and **Ethereum Sepolia (11155111)**. Surfacing this list statically in the main setup guides would save builders from having to audit package code internals to confirm chain compatibility.


## Protocol / architecture observations
- Building "privacy on top of an existing protocol without modifying it" (the hackathon's core
  ask) works cleanly for protocols whose only sensitive data is a *value being moved* (e.g. token
  swaps, transfers). It does NOT work for protocols like Sablier, whose core contracts store and
  expose vesting math (deposited/withdrawn/streamed amounts) as plaintext public getters by
  design — there's no way to "wrap" that contract with encrypted inputs, since its function
  signatures only accept plaintext uint128/uint256. Worth calling this out explicitly in future
  hackathon briefs: "protocols with public accounting as their core function need to be
  reimplemented with confidential primitives, not wrapped."
- The `Nox.div`/`Nox.mul` arithmetic on encrypted types made confidential linear-vesting math
  straightforward to implement once confirmed — this was the single most useful reference page
  for us in the entire build.

## Suggestions
- A minimal end-to-end "confidential Sablier-style stream" reference example in the docs
  would likely save future builders the exact investigation we just went through.

## ACL model observations
- `Nox.addViewer()` grants are permanent by design — there is no `removeViewer`/revoke
  function. This makes sense given the off-chain Handle Gateway model (a viewer could
  have already decrypted and stored the value once granted), but it's a genuinely
  non-obvious constraint for anyone designing a selective-disclosure or auditor-access
  feature. We initially assumed grant/revoke was possible and had to redesign around
  "migrate to a fresh handle for each new disclosure window" instead. A callout in the
  Manage Viewers guide (e.g. "there is no revoke — see this pattern for time-boxed
  disclosure instead") would have saved us a design iteration.

## SDK & Tooling Observations

### Compiler version conflict between packages
- `@iexec-nox/nox-protocol-contracts` (Nox.sol, INoxCompute.sol, Compute.sol, ACL.sol, Common.sol) all declare `pragma solidity ^0.8.35`, while `@iexec-nox/nox-confidential-contracts` (ERC7984Base.sol, ERC20ToERC7984WrapperBase.sol, ERC20ToERC7984Wrapper.sol) declare `pragma solidity ^0.8.28`. Both packages are dependencies of each other in practice (any confidential token contract imports both), so a consuming project MUST target `0.8.35` (or higher) to satisfy both. Targetting `0.8.28` alone breaks compilation with Hardhat error `HHE909` ("No solc version enabled in this profile is compatible with a dependency of this file"). This wasn't obvious from either package's individual docs. A quick note in the Hardhat setup guide clarifying the actual minimum compiler version needed when both packages are used together would prevent this pitfall.

### confidentialTransfer vs confidentialTransferFrom ACL asymmetry
- `confidentialTransfer(to, amount)` does NOT grant the caller any ACL access on the returned handle. Conversely, `confidentialTransferFrom(from, to, amount)` DOES grant transient access to the caller via an internal `Nox.allowTransient(transferred, msg.sender)`. While this is a logical design choice (distinguishing self-transfers from operator-mediated transfers), it is a major gotcha for developers building contract logic that needs to act on a transfer's result handle (e.g., adding a recipient as a viewer right after transferring to them). We had to explicitly route self-transfers through `confidentialTransferFrom` (with `from == address(this)`) purely to obtain the transient grant. This should be explicitly documented in the ERC-7984 "Operators" or main transfer section.

### _mint already grants admin access automatically
- Contrary to what we initially assumed from the ACL overview page, `_mint` (which is called internally by `ERC20ToERC7984Wrapper.wrap()`) already performs both `Nox.allowThis()` (granting admin access to the calling wrapper contract) and `Nox.allow(newBalance, to)` (granting admin and decrypt rights to the recipient) on the new balance handle. This means recipients of minted/wrapped tokens already have decrypt access to their balances out of the box without needing an additional `addViewer()` call. Confirming this behavior in the "Create a Confidential ERC-7984 Token" guide or the ACL overview would have saved us investigation time (which we spent digging into ERC7984Base.sol's internal `_update` logic).

### Missing subgraph URL in docs
- `HandleClientConfig.subgraphUrl` is a required field for `createViemHandleClient`, but the docs site has no reference to it anywhere — not in the JS SDK guide, Getting Started, or Networks page. We had to find the actual subgraph endpoint via general web search (found: "Nox Protocol Indexer - Ethereum Sepolia" on The Graph Explorer, subgraph ID `9CsccKwvgYFo72zZeU4k4wj2NEBLdWhVE3EUandgmzgo`). This should be published directly in the JS SDK reference alongside the other config fields, ideally one official URL per supported network (matching the Networks page's chain list).


