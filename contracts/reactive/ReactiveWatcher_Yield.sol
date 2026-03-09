// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IReactive.sol";
import "./interfaces/AbstractReactive.sol";

/// @title ReactiveWatcher_Yield
/// @notice Watches MockYieldPool for RewardClaimed events.
///         Triggers Prosperity: boosts wealth of the claiming player's territories.
/// @dev Built with Somnia Reactive SDK pattern
contract ReactiveWatcher_Yield is AbstractReactive {
    // ─── Targets ───
    address public immutable YIELD_POOL;
    address public immutable RIFT_WORLD;
    address public immutable RIFT_PLAYERS;
    address public immutable RIFT_EVENTS;

    // ─── Topic Signature ───
    uint256 private constant REWARD_CLAIMED_TOPIC =
        uint256(keccak256("RewardClaimed(address,uint256)"));

    // ─── Events ───
    event ProsperityTriggered(address indexed player, uint256 amount, uint256 blockNumber);

    constructor(
        address _yieldPool,
        address _riftWorld,
        address _riftPlayers,
        address _riftEvents
    ) {
        YIELD_POOL = _yieldPool;
        RIFT_WORLD = _riftWorld;
        RIFT_PLAYERS = _riftPlayers;
        RIFT_EVENTS = _riftEvents;

        if (address(service) != address(0)) {
            service.subscribe(
                block.chainid,
                _yieldPool,
                REWARD_CLAIMED_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    /// @notice Called by Somnia reactive runtime when RewardClaimed fires
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
        // topic1 = indexed user address
        address player = address(uint160(topic1));

        // Decode amount from data
        uint256 amount;
        if (data.length >= 32) {
            amount = abi.decode(data, (uint256));
        }

        // Calculate wealth boost (15 base + proportional to yield)
        uint256 boost = 15;

        // Fire Prosperity via Callback
        bytes memory prosperityPayload = abi.encodeWithSignature(
            "applyProsperity(address,uint256)",
            player,
            boost
        );
        emit Callback(block.chainid, RIFT_WORLD, GAS_LIMIT, prosperityPayload);

        // Mint shards proportional to amount (1 shard per 10 units)
        uint256 shardReward = amount / 10;
        if (shardReward > 0) {
            bytes memory shardPayload = abi.encodeWithSignature(
                "mintShards(address,uint256)",
                player,
                shardReward
            );
            emit Callback(block.chainid, RIFT_PLAYERS, GAS_LIMIT, shardPayload);
        }

        // Log event
        bytes memory logPayload = abi.encodeWithSignature(
            "logEvent(uint8,bytes)",
            uint8(4), // EventType.PROSPERITY
            abi.encode(player, boost, amount, block.number)
        );
        emit Callback(block.chainid, RIFT_EVENTS, GAS_LIMIT, logPayload);

        emit ProsperityTriggered(player, amount, block.number);
    }

    /// @notice Direct trigger for local testing
    function triggerProsperity(address _player, uint256 _amount) external {
        uint256 boost = 15;

        (bool success,) = RIFT_WORLD.call(
            abi.encodeWithSignature("applyProsperity(address,uint256)", _player, boost)
        );
        require(success, "Prosperity call failed");

        uint256 shardReward = _amount / 10;
        if (shardReward > 0) {
            (bool shardSuccess,) = RIFT_PLAYERS.call(
                abi.encodeWithSignature("mintShards(address,uint256)", _player, shardReward)
            );
            require(shardSuccess, "Shard mint failed");
        }

        (bool logSuccess,) = RIFT_EVENTS.call(
            abi.encodeWithSignature(
                "logEvent(uint8,bytes)",
                uint8(4),
                abi.encode(_player, boost, _amount, block.number)
            )
        );
        require(logSuccess, "Log call failed");

        emit ProsperityTriggered(_player, _amount, block.number);
    }
}
