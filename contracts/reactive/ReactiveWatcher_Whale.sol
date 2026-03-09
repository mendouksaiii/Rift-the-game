// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IReactive.sol";
import "./interfaces/AbstractReactive.sol";

/// @title ReactiveWatcher_Whale
/// @notice Watches MockERC20 for large Transfer events (whale moves).
///         Triggers Seismic Event: Fault Line territories reshuffle.
/// @dev Built with Somnia Reactive SDK pattern
contract ReactiveWatcher_Whale is AbstractReactive {
    // ─── Targets ───
    address public immutable TOKEN;
    address public immutable RIFT_WORLD;
    address public immutable RIFT_PLAYERS;
    address public immutable RIFT_EVENTS;

    // ─── Topic Signature ───
    uint256 private constant TRANSFER_TOPIC =
        uint256(keccak256("Transfer(address,address,uint256)"));

    // ─── Config ───
    uint256 public constant WHALE_THRESHOLD = 500 * 10**18; // 500 tokens

    // ─── Events ───
    event SeismicTriggered(uint256 blockNumber, uint256 transferAmount);
    event SeismicWarning(uint256 blockNumber); // Pre-commit warning for Oracle faction

    constructor(
        address _token,
        address _riftWorld,
        address _riftPlayers,
        address _riftEvents
    ) {
        TOKEN = _token;
        RIFT_WORLD = _riftWorld;
        RIFT_PLAYERS = _riftPlayers;
        RIFT_EVENTS = _riftEvents;

        if (address(service) != address(0)) {
            service.subscribe(
                block.chainid,
                _token,
                TRANSFER_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    /// @notice Called by Somnia reactive runtime when Transfer fires
    function react(
        uint256 /* chainId */,
        address /* emitter */,
        uint256 /* topic0 */,
        uint256 /* topic1 - from */,
        uint256 /* topic2 - to */,
        uint256 /* topic3 */,
        bytes calldata data,
        uint256 /* blockNumber */,
        uint256 /* opCode */
    ) external override vmOnly {
        // Decode transfer value
        uint256 value;
        if (data.length >= 32) {
            value = abi.decode(data, (uint256));
        }

        if (value >= WHALE_THRESHOLD) {
            // Select 3 fault line hexes to reshuffle
            uint256[] memory faultHexes = _selectFaultLineHexes(3);

            // Fire Seismic Event via Callback
            bytes memory seismicPayload = abi.encodeWithSignature(
                "applySeismic(uint256[])",
                faultHexes
            );
            emit Callback(block.chainid, RIFT_WORLD, GAS_LIMIT, seismicPayload);

            // Log event
            bytes memory logPayload = abi.encodeWithSignature(
                "logEvent(uint8,bytes)",
                uint8(2), // EventType.SEISMIC
                abi.encode(faultHexes, value, block.number)
            );
            emit Callback(block.chainid, RIFT_EVENTS, GAS_LIMIT, logPayload);

            emit SeismicWarning(block.number);
            emit SeismicTriggered(block.number, value);
        }
    }

    /// @notice Direct trigger for local testing
    function triggerSeismic(uint256 _transferAmount) external {
        require(_transferAmount >= WHALE_THRESHOLD, "Below whale threshold");

        uint256[] memory faultHexes = _selectFaultLineHexes(3);

        (bool success,) = RIFT_WORLD.call(
            abi.encodeWithSignature("applySeismic(uint256[])", faultHexes)
        );
        require(success, "Seismic call failed");

        (bool logSuccess,) = RIFT_EVENTS.call(
            abi.encodeWithSignature(
                "logEvent(uint8,bytes)",
                uint8(2),
                abi.encode(faultHexes, _transferAmount, block.number)
            )
        );
        require(logSuccess, "Log call failed");

        emit SeismicWarning(block.number);
        emit SeismicTriggered(block.number, _transferAmount);
    }

    /// @dev Select pseudo-random fault line hex IDs
    function _selectFaultLineHexes(uint256 _count) internal view returns (uint256[] memory) {
        // Fault line hexes: main diagonal (r==c) and anti-diagonal (r+c==6)
        // Excluding corners (Oracle zones): 0,6,42,48
        // Main diagonal: 8, 16, 24, 32, 40
        // Anti-diagonal: 1*7+5=12, 2*7+4=18... wait, let me use the correct ones
        // r=c: (1,1)=8, (2,2)=16, (3,3)=24, (4,4)=32, (5,5)=40
        // r+c=6: (1,5)=12, (2,4)=18, (4,2)=30, (5,1)=36
        // Note: (3,3)=24 is in market zone, (2,4)=18 and (4,2)=30 are also market
        // Using non-market fault line hexes: 8, 12, 36, 40
        uint256[4] memory faultPool = [uint256(8), 12, 36, 40];

        uint256 count = _count > 4 ? 4 : _count;
        uint256[] memory selected = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 idx = uint256(keccak256(abi.encodePacked(block.number, block.timestamp, i))) % 4;
            selected[i] = faultPool[idx];
        }
        return selected;
    }
}
