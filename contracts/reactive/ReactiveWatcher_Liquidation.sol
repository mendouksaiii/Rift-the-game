// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IReactive.sol";
import "./interfaces/AbstractReactive.sol";

/// @title ReactiveWatcher_Liquidation
/// @notice Watches MockLendingProtocol for LiquidationExecuted events.
///         Triggers Collapse: 5 Border Zone territories enter instability.
/// @dev Built with Somnia Reactive SDK pattern
contract ReactiveWatcher_Liquidation is AbstractReactive {
    // ─── Targets ───
    address public immutable LENDING_PROTOCOL;
    address public immutable RIFT_WORLD;
    address public immutable RIFT_PLAYERS;
    address public immutable RIFT_EVENTS;

    // ─── Topic Signature ───
    uint256 private constant LIQUIDATION_TOPIC =
        uint256(keccak256("LiquidationExecuted(address,uint256)"));

    // ─── Events ───
    event CollapseTriggered(uint256 blockNumber, uint256 affectedCount);

    constructor(
        address _lendingProtocol,
        address _riftWorld,
        address _riftPlayers,
        address _riftEvents
    ) {
        LENDING_PROTOCOL = _lendingProtocol;
        RIFT_WORLD = _riftWorld;
        RIFT_PLAYERS = _riftPlayers;
        RIFT_EVENTS = _riftEvents;

        if (address(service) != address(0)) {
            service.subscribe(
                block.chainid,
                _lendingProtocol,
                LIQUIDATION_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    /// @notice Called by Somnia reactive runtime when LiquidationExecuted fires
    function react(
        uint256 /* chainId */,
        address /* emitter */,
        uint256 /* topic0 */,
        uint256 /* topic1 */,
        uint256 /* topic2 */,
        uint256 /* topic3 */,
        bytes calldata /* data */,
        uint256 /* blockNumber */,
        uint256 /* opCode */
    ) external override vmOnly {
        // Select 5 pseudo-random border hex IDs
        uint256[] memory affected = _selectBorderHexes(5);

        // Fire Collapse via Callback
        bytes memory collapsePayload = abi.encodeWithSignature(
            "applyCollapse(uint256[])",
            affected
        );
        emit Callback(block.chainid, RIFT_WORLD, GAS_LIMIT, collapsePayload);

        // Log the event
        bytes memory logPayload = abi.encodeWithSignature(
            "logEvent(uint8,bytes)",
            uint8(1), // EventType.COLLAPSE
            abi.encode(affected, block.number)
        );
        emit Callback(block.chainid, RIFT_EVENTS, GAS_LIMIT, logPayload);

        emit CollapseTriggered(block.number, affected.length);
    }

    /// @notice Direct trigger for local testing
    function triggerCollapse() external {
        uint256[] memory affected = _selectBorderHexes(5);

        (bool success,) = RIFT_WORLD.call(
            abi.encodeWithSignature("applyCollapse(uint256[])", affected)
        );
        require(success, "Collapse call failed");

        (bool logSuccess,) = RIFT_EVENTS.call(
            abi.encodeWithSignature(
                "logEvent(uint8,bytes)",
                uint8(1),
                abi.encode(affected, block.number)
            )
        );
        require(logSuccess, "Log call failed");

        emit CollapseTriggered(block.number, affected.length);
    }

    /// @dev Select pseudo-random border hex IDs
    function _selectBorderHexes(uint256 _count) internal view returns (uint256[] memory) {
        // Border hexes in a 7x7 grid (edges, excluding corners which are Oracle zones)
        // Row 0: 1,2,3,4,5 | Row 6: 43,44,45,46,47
        // Col 0: 7,14,21,28,35 | Col 6: 13,20,27,34,41
        uint256[20] memory borderPool = [
            uint256(1), 2, 3, 4, 5,
            43, 44, 45, 46, 47,
            7, 14, 21, 28, 35,
            13, 20, 27, 34, 41
        ];

        uint256[] memory selected = new uint256[](_count);
        for (uint256 i = 0; i < _count; i++) {
            uint256 idx = uint256(keccak256(abi.encodePacked(block.number, block.timestamp, i))) % 20;
            selected[i] = borderPool[idx];
        }
        return selected;
    }
}
