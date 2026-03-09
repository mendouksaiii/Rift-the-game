// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IReactive.sol";

/// @title ISubscriptionService
/// @notice Interface for Somnia's subscription management service
interface ISubscriptionService {
    function subscribe(
        uint256 chainId,
        address emitter,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) external;

    function unsubscribe(
        uint256 chainId,
        address emitter,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) external;
}

/// @title AbstractReactive
/// @notice Abstract base contract for Somnia Reactive Smart Contracts
/// @dev Provides subscription management, Callback event, and access control
abstract contract AbstractReactive is IReactive {
    // ─── Constants ───
    uint256 internal constant REACTIVE_IGNORE = 0;
    uint256 internal constant GAS_LIMIT = 1000000;

    // ─── Subscription Service ───
    ISubscriptionService internal service;

    // ─── Access Control ───
    address internal _owner;

    /// @notice Restricts function to Somnia VM reactive runtime calls only
    modifier vmOnly() {
        // In production on Somnia, this would check msg.sender == REACTIVE_VM
        // For local testing, we allow any caller
        _;
    }

    constructor() {
        _owner = msg.sender;
        // On Somnia mainnet/testnet, service would be set to the
        // platform's subscription service address
        // For local development, subscriptions are simulated
    }

    /// @notice Set the subscription service address (for deployment on Somnia)
    function setSubscriptionService(address _service) external {
        require(msg.sender == _owner, "Not owner");
        service = ISubscriptionService(_service);
    }
}
