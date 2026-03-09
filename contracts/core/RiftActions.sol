// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RiftWorld.sol";
import "./RiftPlayers.sol";

/// @title RiftActions
/// @notice Player actions: claim, fortify, raid, build structures on the hex grid
contract RiftActions {
    // ─── Constants ───
    uint256 public constant CLAIM_COST_FLUX = 50;
    uint256 public constant FORTIFY_COST_FLUX = 30;
    uint256 public constant RAID_COST_SHARDS = 10;

    // ─── Dependencies ───
    RiftWorld public world;
    RiftPlayers public playerContract;

    // ─── State ───
    address public owner;

    // ─── Events ───
    event TerritoryClaimed(address indexed player, uint256 hexId);
    event TerritoryFortified(address indexed player, uint256 hexId, uint8 newStability);
    event TerritoryRaided(address indexed attacker, address indexed defender, uint256 hexId, bool success);
    event StructureBuilt(address indexed player, uint256 hexId, RiftWorld.StructureType structureType);
    event RelicClaimedAction(address indexed player, uint256 hexId);

    // ─── Modifiers ───
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyRegistered() {
        require(playerContract.isRegistered(msg.sender), "Not registered");
        _;
    }

    // ─── Constructor ───
    constructor(address _world, address _players) {
        owner = msg.sender;
        world = RiftWorld(_world);
        playerContract = RiftPlayers(_players);
    }

    // ─── Actions ───

    /// @notice Claim an unclaimed or instability-state territory
    function claimTerritory(uint256 _hexId) external onlyRegistered {
        RiftWorld.Territory memory t = world.getTerritory(_hexId);
        require(!t.locked, "Territory is locked");
        require(
            t.controller == address(0) || world.isInstabilityActive(_hexId),
            "Territory is occupied and stable"
        );

        // Calculate cost — halved during raid window, free for Oracles during race
        uint256 cost = CLAIM_COST_FLUX;

        // Check Oracle race
        if (world.isOracleRaceActive() && world.oracleRaceHexId() == _hexId) {
            RiftPlayers.Player memory p = playerContract.getPlayer(msg.sender);
            if (p.faction == RiftPlayers.Faction.ORACLE) {
                cost = 0; // Free for Oracles during race
            }
        }

        // Halve cost during raid window
        if (world.isRaidWindowActive()) {
            cost = cost / 2;
        }

        // Deduct and claim
        if (cost > 0) {
            playerContract.spendFlux(msg.sender, cost);
        }
        world.setController(_hexId, msg.sender);

        emit TerritoryClaimed(msg.sender, _hexId);
    }

    /// @notice Fortify a territory you control — increases stability
    function fortify(uint256 _hexId) external onlyRegistered {
        RiftWorld.Territory memory t = world.getTerritory(_hexId);
        require(t.controller == msg.sender, "Not your territory");

        playerContract.spendFlux(msg.sender, FORTIFY_COST_FLUX);
        world.addStability(_hexId, 20);

        // Read updated stability
        RiftWorld.Territory memory updated = world.getTerritory(_hexId);
        emit TerritoryFortified(msg.sender, _hexId, updated.stability);
    }

    /// @notice Raid a territory — requires instability or shockwave window
    function raid(uint256 _hexId) external onlyRegistered {
        RiftWorld.Territory memory t = world.getTerritory(_hexId);
        require(t.controller != address(0), "Territory unclaimed - just claim it");
        require(t.controller != msg.sender, "Cannot raid your own territory");

        // Must be in instability state OR scavenger during shockwave
        bool canRaid = world.isInstabilityActive(_hexId);
        if (!canRaid && world.isRaidWindowActive()) {
            RiftPlayers.Player memory p = playerContract.getPlayer(msg.sender);
            canRaid = (p.faction == RiftPlayers.Faction.SCAVENGER);
        }
        require(canRaid, "Cannot raid - no window active");

        playerContract.spendShards(msg.sender, RAID_COST_SHARDS);

        // Raid success: attacker's shards (post-spend) vs defender's stability
        RiftPlayers.Player memory attacker = playerContract.getPlayer(msg.sender);
        bool success = attacker.shards >= t.stability;

        if (success) {
            world.setController(_hexId, msg.sender);
        }

        emit TerritoryRaided(msg.sender, t.controller, _hexId, success);
    }

    /// @notice Build a structure on a territory you control
    function buildStructure(uint256 _hexId, RiftWorld.StructureType _structureType) external onlyRegistered {
        require(
            _structureType == RiftWorld.StructureType.SHIELD ||
            _structureType == RiftWorld.StructureType.MINE ||
            _structureType == RiftWorld.StructureType.BEACON ||
            _structureType == RiftWorld.StructureType.WATCHTOWER ||
            _structureType == RiftWorld.StructureType.SIPHON,
            "Invalid structure"
        );

        RiftWorld.Territory memory t = world.getTerritory(_hexId);
        require(t.controller == msg.sender, "Not your territory");
        require(t.structure == RiftWorld.StructureType.NONE, "Already has structure");

        uint256 cost = 80; // Default cost for Shield, Mine, Beacon
        if (_structureType == RiftWorld.StructureType.WATCHTOWER) {
            cost = 120;
        } else if (_structureType == RiftWorld.StructureType.SIPHON) {
            cost = 100;
        }

        playerContract.spendFlux(msg.sender, cost);
        world.setStructure(_hexId, _structureType);

        emit StructureBuilt(msg.sender, _hexId, _structureType);
    }

    /// @notice Claim a relic from a territory, granting a permanent yield boost
    function claimRelic(uint256 _hexId) external onlyRegistered {
        RiftWorld.Territory memory t = world.getTerritory(_hexId);
        require(t.controller == msg.sender, "Not your territory");
        require(world.hasRelic(_hexId), "No relic on this hex");

        playerContract.spendFlux(msg.sender, 50);
        playerContract.spendShards(msg.sender, 10);

        world.consumeRelic(_hexId, msg.sender);
        playerContract.grantRelic(msg.sender);

        emit RelicClaimedAction(msg.sender, _hexId);
    }
}
