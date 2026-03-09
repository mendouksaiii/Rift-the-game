// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IReactive.sol";
import "./interfaces/AbstractReactive.sol";

/// @title ReactiveWatcher_Price
/// @notice Watches MockPriceOracle for PriceUpdated events.
///         When price drops >= 3%, fires Economic Shockwave on RiftWorld.
/// @dev Built with Somnia Reactive SDK pattern
contract ReactiveWatcher_Price is AbstractReactive {
    // ─── Targets ───
    address public immutable PRICE_ORACLE;
    address public immutable RIFT_WORLD;
    address public immutable RIFT_PLAYERS;
    address public immutable RIFT_EVENTS;

    // ─── Topic Signature ───
    uint256 private constant PRICE_UPDATED_TOPIC =
        uint256(keccak256("PriceUpdated(uint256)"));

    // ─── State ───
    uint256 private lastPrice;
    uint256 private constant DROP_THRESHOLD = 3; // 3%

    // ─── Events ───
    event ShockwaveTriggered(uint256 dropPercent, uint256 blockNumber);

    constructor(
        address _priceOracle,
        address _riftWorld,
        address _riftPlayers,
        address _riftEvents
    ) {
        PRICE_ORACLE = _priceOracle;
        RIFT_WORLD = _riftWorld;
        RIFT_PLAYERS = _riftPlayers;
        RIFT_EVENTS = _riftEvents;

        // Subscribe to PriceUpdated events from the oracle
        // On Somnia, this registers with the reactive runtime
        if (address(service) != address(0)) {
            service.subscribe(
                block.chainid,
                _priceOracle,
                PRICE_UPDATED_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    /// @notice Called by Somnia reactive runtime when PriceUpdated fires
    function react(
        uint256 /* chainId */,
        address /* emitter */,
        uint256 /* topic0 */,
        uint256 topic1,
        uint256 /* topic2 */,
        uint256 /* topic3 */,
        bytes calldata data,
        uint256 /* blockNumber */,
        uint256 /* opCode */
    ) external override vmOnly {
        // Decode new price from event data
        uint256 newPrice;
        if (data.length >= 32) {
            newPrice = abi.decode(data, (uint256));
        } else {
            newPrice = topic1;
        }

        if (lastPrice > 0 && newPrice < lastPrice) {
            uint256 dropPercent = ((lastPrice - newPrice) * 100) / lastPrice;

            if (dropPercent >= DROP_THRESHOLD) {
                // Fire Economic Shockwave via Callback
                bytes memory shockwavePayload = abi.encodeWithSignature(
                    "applyShockwave(uint256,uint256)",
                    dropPercent,
                    block.number
                );
                emit Callback(block.chainid, RIFT_WORLD, GAS_LIMIT, shockwavePayload);

                // Log the event
                bytes memory logPayload = abi.encodeWithSignature(
                    "logEvent(uint8,bytes)",
                    uint8(0), // EventType.SHOCKWAVE
                    abi.encode(dropPercent, block.number)
                );
                emit Callback(block.chainid, RIFT_EVENTS, GAS_LIMIT, logPayload);

                emit ShockwaveTriggered(dropPercent, block.number);
            }
        }

        lastPrice = newPrice;
    }

    /// @notice Direct trigger for local testing (simulates what Somnia runtime does)
    function triggerShockwave(uint256 _newPrice) external {
        if (lastPrice > 0 && _newPrice < lastPrice) {
            uint256 dropPercent = ((lastPrice - _newPrice) * 100) / lastPrice;
            if (dropPercent >= DROP_THRESHOLD) {
                // Directly call RiftWorld (for local Hardhat testing)
                (bool success,) = RIFT_WORLD.call(
                    abi.encodeWithSignature(
                        "applyShockwave(uint256,uint256)",
                        dropPercent,
                        block.number
                    )
                );
                require(success, "Shockwave call failed");

                // Log the event
                (bool logSuccess,) = RIFT_EVENTS.call(
                    abi.encodeWithSignature(
                        "logEvent(uint8,bytes)",
                        uint8(0),
                        abi.encode(dropPercent, block.number)
                    )
                );
                require(logSuccess, "Log call failed");

                emit ShockwaveTriggered(dropPercent, block.number);
            }
        }
        lastPrice = _newPrice;
    }
}
