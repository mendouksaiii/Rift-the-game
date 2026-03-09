// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IReactive.sol";
import "./interfaces/AbstractReactive.sol";

/// @title ReactiveWatcher_Governance
/// @notice Watches MockDAO for ProposalExecuted events.
///         Triggers New Age: unlocks Oracle Zone territories.
/// @dev Built with Somnia Reactive SDK pattern
contract ReactiveWatcher_Governance is AbstractReactive {
    // ─── Targets ───
    address public immutable DAO;
    address public immutable RIFT_WORLD;
    address public immutable RIFT_EVENTS;

    // ─── Topic Signature ───
    uint256 private constant PROPOSAL_EXECUTED_TOPIC =
        uint256(keccak256("ProposalExecuted(uint256)"));

    // ─── Events ───
    event NewAgeTriggered(uint256 blockNumber, uint256 proposalId);

    constructor(
        address _dao,
        address _riftWorld,
        address _riftEvents
    ) {
        DAO = _dao;
        RIFT_WORLD = _riftWorld;
        RIFT_EVENTS = _riftEvents;

        if (address(service) != address(0)) {
            service.subscribe(
                block.chainid,
                _dao,
                PROPOSAL_EXECUTED_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    /// @notice Called by Somnia reactive runtime when ProposalExecuted fires
    function react(
        uint256 /* chainId */,
        address /* emitter */,
        uint256 /* topic0 */,
        uint256 topic1,
        uint256 /* topic2 */,
        uint256 /* topic3 */,
        bytes calldata /* data */,
        uint256 /* blockNumber */,
        uint256 /* opCode */
    ) external override vmOnly {
        uint256 proposalId = topic1;

        // Unlock next Oracle Zone
        bytes memory unlockPayload = abi.encodeWithSignature("unlockOracleZone()");
        emit Callback(block.chainid, RIFT_WORLD, GAS_LIMIT, unlockPayload);

        // Log event
        bytes memory logPayload = abi.encodeWithSignature(
            "logEvent(uint8,bytes)",
            uint8(3), // EventType.NEW_AGE
            abi.encode(proposalId, block.number)
        );
        emit Callback(block.chainid, RIFT_EVENTS, GAS_LIMIT, logPayload);

        emit NewAgeTriggered(block.number, proposalId);
    }

    /// @notice Direct trigger for local testing
    function triggerNewAge(uint256 _proposalId) external {
        (bool success,) = RIFT_WORLD.call(
            abi.encodeWithSignature("unlockOracleZone()")
        );
        require(success, "Unlock call failed");

        (bool logSuccess,) = RIFT_EVENTS.call(
            abi.encodeWithSignature(
                "logEvent(uint8,bytes)",
                uint8(3),
                abi.encode(_proposalId, block.number)
            )
        );
        require(logSuccess, "Log call failed");

        emit NewAgeTriggered(block.number, _proposalId);
    }
}
