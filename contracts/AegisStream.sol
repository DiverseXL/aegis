// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Nox, euint256, ebool, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {IERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol";

/// @title AegisStream
/// @notice Linear-vesting confidential payment stream, modeled on Sablier's
///         LockupLinear mechanics, reimplemented with encrypted amounts since
///         Sablier's own contracts only accept plaintext uint128 amounts.
///         The streamed asset is an AegisVault-issued ERC-7984 confidential token.
contract AegisStream {
    struct Stream {
        address sender;
        address recipient;
        IERC7984 asset;
        euint256 totalAmount;
        euint256 withdrawnAmount;
        uint40 startTime;
        uint40 duration; // must be > 0, enforced at creation
    }

    uint256 public nextStreamId;
    mapping(uint256 => Stream) public streams;
    address public immutable payoutGuardian;

    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, address asset);
    event StreamWithdrawn(uint256 indexed streamId, address indexed recipient);
    event DisclosureGranted(uint256 indexed streamId, address indexed auditor, address indexed requestedBy, bytes32 snapshotHandle, uint256 timestamp);

    constructor(address _payoutGuardian) {
        require(_payoutGuardian != address(0), "AegisStream: zero payout guardian");
        payoutGuardian = _payoutGuardian;
    }

    /// @notice Returns the encrypted total amount handle for a stream.
    ///         Explicit accessor since auto-generated struct getters may not
    ///         cleanly expose encrypted-type fields — see feedback.md.
    function getStreamTotalAmount(uint256 streamId) external view returns (euint256) {
        return streams[streamId].totalAmount;
    }

    /// @notice Creates a linear stream. Caller must have set this contract
    ///         as an operator on `asset` beforehand (per ERC-7984 operator model).
    function createStream(
        IERC7984 asset,
        address recipient,
        externalEuint256 encryptedTotalAmount,
        bytes calldata inputProof,
        uint40 startTime,
        uint40 duration
    ) external returns (uint256 streamId) {
        require(duration > 0, "AegisStream: zero duration");
        require(recipient != address(0), "AegisStream: zero recipient");

        euint256 totalAmount = Nox.fromExternal(encryptedTotalAmount, inputProof);

        // Pull the confidential tokens from the sender into this contract.
        Nox.allowTransient(totalAmount, address(asset));
        euint256 received = asset.confidentialTransferFrom(msg.sender, address(this), totalAmount);
        // Persist ACL so this contract can use `received` across future transactions
        // (e.g., withdraw). Without this, access is only transient for the current tx.
        Nox.allowThis(received);
        Nox.addViewer(received, payoutGuardian);

        streamId = nextStreamId++;
        euint256 zero = Nox.toEuint256(0);
        Nox.allowThis(zero);

        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            asset: asset,
            totalAmount: received,
            withdrawnAmount: zero,
            startTime: startTime,
            duration: duration
        });

        emit StreamCreated(streamId, msg.sender, recipient, address(asset));
    }

    /// @notice Computes the currently withdrawable encrypted amount for a stream.
    function withdrawableAmount(uint256 streamId) public returns (euint256) {
        Stream storage s = streams[streamId];

        uint40 elapsed;
        if (block.timestamp <= s.startTime) {
            elapsed = 0;
        } else {
            uint256 rawElapsed = block.timestamp - s.startTime;
            elapsed = rawElapsed >= s.duration ? s.duration : uint40(rawElapsed);
        }

        // Timestamps aren't secret, so wrapping them as public handles is fine
        // (see "Wrap as Public Handle" — only user-submitted amounts need encryption).
        euint256 elapsedEnc = Nox.toEuint256(uint256(elapsed));
        euint256 durationEnc = Nox.toEuint256(uint256(s.duration));
        Nox.allowThis(elapsedEnc);
        Nox.allowThis(durationEnc);

        euint256 vested = Nox.div(Nox.mul(s.totalAmount, elapsedEnc), durationEnc);
        euint256 withdrawable = Nox.sub(vested, s.withdrawnAmount);
        Nox.allowThis(withdrawable);

        return withdrawable;
    }

    /// @notice Withdraws the currently vested, unwithdrawn amount to the recipient.
    function withdraw(uint256 streamId) external {
        Stream storage s = streams[streamId];
        require(msg.sender == s.recipient, "AegisStream: not recipient");

        euint256 amount = withdrawableAmount(streamId);

        s.withdrawnAmount = Nox.add(s.withdrawnAmount, amount);
        Nox.allowThis(s.withdrawnAmount);

        Nox.allowTransient(amount, address(s.asset));
        euint256 transferred = s.asset.confidentialTransferFrom(
            address(this),
            s.recipient,
            amount
        );
        Nox.addViewer(transferred, s.recipient); // recipient needs viewer access to decrypt their new balance

        emit StreamWithdrawn(streamId, s.recipient);
    }

    /// @notice Creates an immutable snapshot of a stream's current withdrawn
    ///         amount and grants an auditor viewer access to that snapshot only.
    ///         Because Nox ACL grants are permanent (no revoke), this pattern
    ///         gives time-boxed disclosure semantics: the auditor sees a frozen
    ///         past state, not an ongoing view into the live, changing balance.
    function discloseToAuditor(uint256 streamId, address auditor) external returns (euint256 snapshotHandle) {
        Stream storage s = streams[streamId];
        require(msg.sender == s.sender, "AegisStream: only DAO/sender can disclose");
        require(auditor != address(0), "AegisStream: zero auditor");

        // Snapshot: add zero to force a fresh handle rather than reusing the live one.
        // This guarantees the auditor gets a frozen point-in-time view, not a live
        // window into the evolving withdrawnAmount handle.
        snapshotHandle = Nox.add(s.withdrawnAmount, Nox.toEuint256(0));
        Nox.allowThis(snapshotHandle);
        Nox.addViewer(snapshotHandle, auditor);

        emit DisclosureGranted(streamId, auditor, msg.sender, euint256.unwrap(snapshotHandle), block.timestamp);
    }
}
