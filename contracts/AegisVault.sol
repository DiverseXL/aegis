// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Nox, euint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/// @title AegisVault
/// @notice Wraps the DAO's treasury ERC-20 into a confidential ERC-7984 token.
///         Balances and transfer amounts are hidden on-chain; deposits/withdrawals
///         still route through the normal ERC-20 the DAO already holds in Safe.
contract AegisVault is ERC20ToERC7984Wrapper {
    constructor(IERC20 treasuryToken)
        ERC20ToERC7984Wrapper("Aegis Confidential Treasury", "aTREASURY", "", treasuryToken)
    {}

    /// @notice Wraps ERC-20 into confidential tokens, then grants the
    ///         recipient viewer access so they can actually decrypt their
    ///         own balance via the JS SDK (not automatic per ACL model).
    function wrap(address to, uint256 amount) public override returns (euint256) {
        euint256 wrappedAmount = super.wrap(to, amount);
        Nox.addViewer(wrappedAmount, to);
        return wrappedAmount;
    }
}
