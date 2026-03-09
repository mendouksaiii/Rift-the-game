// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RiftWorld
/// @notice The hex-grid game world — 49 territories with reactive state mutations
/// @dev Only authorized watcher contracts can modify territory state
contract RiftWorld {
    // ─── Enums ───
    enum ZoneType { MARKET, BORDER, ORACLE, FAULTLINE }
    enum StructureType { NONE, SHIELD, MINE, BEACON, WATCHTOWER, SIPHON }

    // ─── Territory Data ───
    struct Territory {
        uint256 hexId;
        uint8 stability;           // 0-100
        uint8 wealth;              // 0-100
        address controller;        // 0x0 = unclaimed
        ZoneType zone;
        bool locked;               // Oracle zones start locked
        bool instability;          // Temporary collapse state
        uint256 instabilityUntilBlock;
        StructureType structure;
    }

    // ─── State ───
    uint256 public constant GRID_SIZE = 49;
    mapping(uint256 => Territory) public territories;
    mapping(uint256 => bool) public hasRelic; // Relic system
    uint256[] public marketHexIds;
    uint256[] public borderHexIds;
    uint256[] public oracleHexIds;
    uint256[] public faultLineHexIds;

    // Shockwave raid window
    bool public raidWindowActive;
    uint256 public raidWindowUntilBlock;

    // Oracle zone unlock tracking
    uint256 public nextOracleUnlockIndex;
    bool public oracleRaceActive;
    uint256 public oracleRaceHexId;
    uint256 public oracleRaceUntilBlock;

    // Access control
    address public owner;
    mapping(address => bool) public authorizedWatchers;
    address public actionsContract;
    address public playersContract;

    // ─── Events ───
    event TerritoryUpdated(uint256 indexed hexId, uint8 stability, uint8 wealth, address controller);
    event ShockwaveFired(uint256 blockNumber, uint256 priceDropPercent);
    event CollapseFired(uint256 blockNumber, uint256[] affectedHexIds);
    event SeismicFired(uint256 blockNumber, uint256[] reshuffledHexIds);
    event NewAgeFired(uint256 blockNumber, uint256 unlockedHexId);
    event ProsperityFired(address indexed player, uint256 wealthBoost);
    event RaidWindowOpened(uint256 untilBlock);
    event TerritoryInstabilitySet(uint256 indexed hexId, uint256 untilBlock);
    event RelicSpawned(uint256 indexed hexId);
    event RelicClaimed(address indexed player, uint256 indexed hexId);

    // ─── Modifiers ───
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyWatcher() {
        require(authorizedWatchers[msg.sender] || msg.sender == owner, "Not authorized watcher");
        _;
    }

    modifier onlyActions() {
        require(msg.sender == actionsContract || msg.sender == owner, "Not actions contract");
        _;
    }

    // ─── Constructor ───
    constructor() {
        owner = msg.sender;
        _initializeMap();
    }

    // ─── Admin ───
    function setWatcher(address _watcher, bool _authorized) external onlyOwner {
        authorizedWatchers[_watcher] = _authorized;
    }

    function setActionsContract(address _actions) external onlyOwner {
        actionsContract = _actions;
    }

    function setPlayersContract(address _players) external onlyOwner {
        playersContract = _players;
    }

    // ─── Map Initialization ───
    function _initializeMap() internal {
        // 7x7 grid = 49 hexes, indices 0-48
        // Layout (r=row 0-6, c=col 0-6, hexId = r*7 + c):
        //
        // Corners (Oracle Zones): (0,0)=0, (0,6)=6, (6,0)=42, (6,6)=48
        // Centre cluster (Market Zones): rows 2-4, cols 2-4 = hexes 16-18, 23-25, 30-32
        // Diagonal band (Fault Lines): hexes where |r - c| <= 0 (main diagonal)
        // Edges (Border Zones): everything else on the perimeter

        for (uint256 r = 0; r < 7; r++) {
            for (uint256 c = 0; c < 7; c++) {
                uint256 hexId = r * 7 + c;
                ZoneType zone;
                bool locked = false;
                uint8 stability;
                uint8 wealth;

                // Oracle Zones: 4 corners
                if (_isCorner(r, c)) {
                    zone = ZoneType.ORACLE;
                    locked = true;
                    stability = 80;
                    wealth = 60;
                    oracleHexIds.push(hexId);
                }
                // Market Zones: centre 3x3
                else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                    zone = ZoneType.MARKET;
                    stability = 70;
                    wealth = 85;
                    marketHexIds.push(hexId);
                }
                // Fault Lines: main diagonal band
                else if (_absDiff(r, c) == 0 || (r + c == 6)) {
                    zone = ZoneType.FAULTLINE;
                    stability = 50;
                    wealth = 40;
                    faultLineHexIds.push(hexId);
                }
                // Border Zones: edges
                else if (r == 0 || r == 6 || c == 0 || c == 6) {
                    zone = ZoneType.BORDER;
                    stability = 30;
                    wealth = 25;
                    borderHexIds.push(hexId);
                }
                // Interior non-categorized → default to BORDER
                else {
                    zone = ZoneType.BORDER;
                    stability = 45;
                    wealth = 35;
                    borderHexIds.push(hexId);
                }

                territories[hexId] = Territory({
                    hexId: hexId,
                    stability: stability,
                    wealth: wealth,
                    controller: address(0),
                    zone: zone,
                    locked: locked,
                    instability: false,
                    instabilityUntilBlock: 0,
                    structure: StructureType.NONE
                });
            }
        }
    }

    function _isCorner(uint256 r, uint256 c) internal pure returns (bool) {
        return (r == 0 && c == 0) || (r == 0 && c == 6) ||
               (r == 6 && c == 0) || (r == 6 && c == 6);
    }

    function _absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }

    // ─── Reactive Mutations (onlyWatcher) ───

    /// @notice Economic Shockwave — destabilize Market Zones
    function applyShockwave(uint256 _dropPercent, uint256 /* _blockNum */) external onlyWatcher {
        // Destabilize all market hexes
        for (uint256 i = 0; i < marketHexIds.length; i++) {
            uint256 hid = marketHexIds[i];
            Territory storage t = territories[hid];
            t.wealth = t.wealth > 20 ? t.wealth - 20 : 0;
            t.stability = t.stability > 10 ? t.stability - 10 : 0;
            emit TerritoryUpdated(hid, t.stability, t.wealth, t.controller);
        }

        // Open 10-block raid window
        raidWindowActive = true;
        raidWindowUntilBlock = block.number + 10;
        emit RaidWindowOpened(raidWindowUntilBlock);
        emit ShockwaveFired(block.number, _dropPercent);
    }

    /// @notice Collapse — set Border Zones to instability
    function applyCollapse(uint256[] calldata _borderHexIds) external onlyWatcher {
        uint256 count = _borderHexIds.length > 5 ? 5 : _borderHexIds.length;
        uint256[] memory affected = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 hid = _borderHexIds[i];
            require(hid < GRID_SIZE, "Invalid hex");
            Territory storage t = territories[hid];
            t.stability = 0;
            t.instability = true;
            t.instabilityUntilBlock = block.number + 15;
            affected[i] = hid;
            emit TerritoryInstabilitySet(hid, t.instabilityUntilBlock);
            emit TerritoryUpdated(hid, t.stability, t.wealth, t.controller);
        }

        emit CollapseFired(block.number, affected);
    }

    /// @notice Seismic Event — reshuffle Fault Line territories
    function applySeismic(uint256[] calldata _faultHexIds) external onlyWatcher {
        uint256 count = _faultHexIds.length > 3 ? 3 : _faultHexIds.length;
        uint256[] memory reshuffled = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 hid = _faultHexIds[i];
            require(hid < GRID_SIZE, "Invalid hex");
            Territory storage t = territories[hid];
            t.controller = address(0);
            // Pseudo-randomise attributes
            t.stability = uint8((uint256(keccak256(abi.encodePacked(block.number, hid, i))) % 61) + 20);
            t.wealth = uint8((uint256(keccak256(abi.encodePacked(block.timestamp, hid, i))) % 61) + 20);
            reshuffled[i] = hid;
            emit TerritoryUpdated(hid, t.stability, t.wealth, t.controller);
        }

        emit SeismicFired(block.number, reshuffled);
    }

    /// @notice New Age — unlock next Oracle Zone territory
    function unlockOracleZone() external onlyWatcher {
        require(oracleHexIds.length > 0, "No oracle zones");
        require(nextOracleUnlockIndex < oracleHexIds.length, "All oracle zones unlocked");

        uint256 hid = oracleHexIds[nextOracleUnlockIndex];
        territories[hid].locked = false;

        // Spawn a relic on the newly unlocked Oracle Zone
        hasRelic[hid] = true;
        emit RelicSpawned(hid);

        // Start 5-block race window
        oracleRaceActive = true;
        oracleRaceHexId = hid;
        oracleRaceUntilBlock = block.number + 5;

        nextOracleUnlockIndex++;
        emit NewAgeFired(block.number, hid);
        emit TerritoryUpdated(hid, territories[hid].stability, territories[hid].wealth, territories[hid].controller);
    }

    /// @notice Prosperity — boost wealth of a player's territories
    function applyProsperity(address _player, uint256 _boost) external onlyWatcher {
        for (uint256 i = 0; i < GRID_SIZE; i++) {
            if (territories[i].controller == _player) {
                uint256 newWealth = uint256(territories[i].wealth) + _boost;
                territories[i].wealth = newWealth > 100 ? 100 : uint8(newWealth);
                emit TerritoryUpdated(i, territories[i].stability, territories[i].wealth, territories[i].controller);
            }
        }
        emit ProsperityFired(_player, _boost);
    }

    /// @notice Spawn a relic on a specific hex (used by Governance watcher)
    function spawnRelic(uint256 _hexId) external onlyWatcher {
        require(_hexId < GRID_SIZE, "Invalid hex");
        hasRelic[_hexId] = true;
        emit RelicSpawned(_hexId);
    }

    // ─── Actions Interface (called by RiftActions) ───

    function setController(uint256 _hexId, address _controller) external onlyActions {
        require(_hexId < GRID_SIZE, "Invalid hex");
        territories[_hexId].controller = _controller;
        emit TerritoryUpdated(_hexId, territories[_hexId].stability, territories[_hexId].wealth, _controller);
    }

    function addStability(uint256 _hexId, uint8 _amount) external onlyActions {
        require(_hexId < GRID_SIZE, "Invalid hex");
        uint256 newStab = uint256(territories[_hexId].stability) + _amount;
        territories[_hexId].stability = newStab > 100 ? 100 : uint8(newStab);
    }

    function setStructure(uint256 _hexId, StructureType _structure) external onlyActions {
        require(_hexId < GRID_SIZE, "Invalid hex");
        territories[_hexId].structure = _structure;
        if (_structure == StructureType.SHIELD) {
            uint256 newStab = uint256(territories[_hexId].stability) + 20;
            territories[_hexId].stability = newStab > 100 ? 100 : uint8(newStab);
        } else if (_structure == StructureType.MINE) {
            uint256 newWealth = uint256(territories[_hexId].wealth) + 10;
            territories[_hexId].wealth = newWealth > 100 ? 100 : uint8(newWealth);
        } else if (_structure == StructureType.WATCHTOWER) {
            uint256 newStab = uint256(territories[_hexId].stability) + 30;
            territories[_hexId].stability = newStab > 100 ? 100 : uint8(newStab);
        } else if (_structure == StructureType.SIPHON) {
            uint256 newWealth = uint256(territories[_hexId].wealth) + 20;
            territories[_hexId].wealth = newWealth > 100 ? 100 : uint8(newWealth);
            
            uint256 newStab = uint256(territories[_hexId].stability);
            if (newStab > 10) {
                territories[_hexId].stability -= 10;
            } else {
                territories[_hexId].stability = 0;
            }
        }
    }

    function consumeRelic(uint256 _hexId, address _player) external onlyActions {
        require(_hexId < GRID_SIZE, "Invalid hex");
        require(hasRelic[_hexId], "No relic on hex");
        hasRelic[_hexId] = false;
        emit RelicClaimed(_player, _hexId);
    }

    // ─── View Functions ───

    function getTerritory(uint256 _hexId) external view returns (Territory memory) {
        require(_hexId < GRID_SIZE, "Invalid hex");
        return territories[_hexId];
    }

    function getAllTerritories() external view returns (Territory[] memory) {
        Territory[] memory all = new Territory[](GRID_SIZE);
        for (uint256 i = 0; i < GRID_SIZE; i++) {
            all[i] = territories[i];
        }
        return all;
    }

    function getMarketHexIds() external view returns (uint256[] memory) { return marketHexIds; }
    function getBorderHexIds() external view returns (uint256[] memory) { return borderHexIds; }
    function getOracleHexIds() external view returns (uint256[] memory) { return oracleHexIds; }
    function getFaultLineHexIds() external view returns (uint256[] memory) { return faultLineHexIds; }

    function isRaidWindowActive() external view returns (bool) {
        return raidWindowActive && block.number <= raidWindowUntilBlock;
    }

    function isOracleRaceActive() external view returns (bool) {
        return oracleRaceActive && block.number <= oracleRaceUntilBlock;
    }

    function isInstabilityActive(uint256 _hexId) external view returns (bool) {
        return territories[_hexId].instability && block.number <= territories[_hexId].instabilityUntilBlock;
    }
}
