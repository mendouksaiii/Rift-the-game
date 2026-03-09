// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IReactive
/// @notice Interface for Somnia Reactive Smart Contracts
/// @dev Local implementation matching the Somnia Reactive SDK pattern
interface IReactive {
    /// @notice Emitted to trigger a cross-contract callback in the same block
    event Callback(
        uint256 indexed chainId,
        address indexed target,
        uint256 gasLimit,
        bytes payload
    );

    /// @notice Called by the Somnia reactive runtime when a subscribed event fires
    function react(
        uint256 chainId,
        address emitter,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3,
        bytes calldata data,
        uint256 blockNumber,
        uint256 opCode
    ) external;
}
