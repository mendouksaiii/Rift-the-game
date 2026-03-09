// Contract ABIs — simplified for frontend use
// These are generated from Hardhat compilation artifacts

export const RIFT_WORLD_ABI = [
    "function GRID_SIZE() view returns (uint256)",
    "function getTerritory(uint256 hexId) view returns (tuple(uint256 hexId, uint8 stability, uint8 wealth, address controller, uint8 zone, bool locked, bool instability, uint256 instabilityUntilBlock, uint8 structure))",
    "function getAllTerritories() view returns (tuple(uint256 hexId, uint8 stability, uint8 wealth, address controller, uint8 zone, bool locked, bool instability, uint256 instabilityUntilBlock, uint8 structure)[])",
    "function getMarketHexIds() view returns (uint256[])",
    "function getBorderHexIds() view returns (uint256[])",
    "function getOracleHexIds() view returns (uint256[])",
    "function getFaultLineHexIds() view returns (uint256[])",
    "function isRaidWindowActive() view returns (bool)",
    "function isOracleRaceActive() view returns (bool)",
    "function isInstabilityActive(uint256 hexId) view returns (bool)",
    "function hasRelic(uint256 hexId) view returns (bool)",
    "function raidWindowUntilBlock() view returns (uint256)",
    "function oracleRaceHexId() view returns (uint256)",
    "function oracleRaceUntilBlock() view returns (uint256)",
    "event TerritoryUpdated(uint256 indexed hexId, uint8 stability, uint8 wealth, address controller)",
    "event ShockwaveFired(uint256 blockNumber, uint256 priceDropPercent)",
    "event CollapseFired(uint256 blockNumber, uint256[] affectedHexIds)",
    "event SeismicFired(uint256 blockNumber, uint256[] reshuffledHexIds)",
    "event NewAgeFired(uint256 blockNumber, uint256 unlockedHexId)",
    "event ProsperityFired(address indexed player, uint256 wealthBoost)",
    "event RaidWindowOpened(uint256 untilBlock)",
    "event TerritoryInstabilitySet(uint256 indexed hexId, uint256 untilBlock)",
];

export const RIFT_PLAYERS_ABI = [
    "function register(uint8 faction, address linkedWallet) external",
    "function getPlayer(address addr) view returns (tuple(uint8 faction, uint256 flux, uint256 shards, address linkedDeFiWallet, bool registered, uint8 relicsDrawn))",
    "function isRegistered(address addr) view returns (bool)",
    "function getPlayerCount() view returns (uint256)",
    "function getFactionMembers(uint8 faction) view returns (address[])",
    "function getAllPlayers() view returns (address[])",
    "function tradeFluxForShards(uint256 shardsWanted) external",
    "function tradeShardsForFlux(uint256 shardsToTrade) external",
    "event PlayerRegistered(address indexed player, uint8 faction)",
    "event FluxMinted(address indexed player, uint256 amount)",
    "event ShardsMinted(address indexed player, uint256 amount)",
];

export const RIFT_ACTIONS_ABI = [
    "function claimTerritory(uint256 hexId) external",
    "function fortify(uint256 hexId) external",
    "function raid(uint256 hexId) external",
    "function buildStructure(uint256 hexId, uint8 structureType) external",
    "function claimRelic(uint256 hexId) external",
    "function CLAIM_COST_FLUX() view returns (uint256)",
    "function FORTIFY_COST_FLUX() view returns (uint256)",
    "function RAID_COST_SHARDS() view returns (uint256)",
    "event TerritoryClaimed(address indexed player, uint256 hexId)",
    "event TerritoryFortified(address indexed player, uint256 hexId, uint8 newStability)",
    "event TerritoryRaided(address indexed attacker, address indexed defender, uint256 hexId, bool success)",
    "event StructureBuilt(address indexed player, uint256 hexId, uint8 structureType)",
];

export const RIFT_EVENTS_ABI = [
    "function getEventCount() view returns (uint256)",
    "function getRecentEvents(uint256 count) view returns (tuple(uint256 blockNumber, uint8 eventType, bytes data, uint256 timestamp)[])",
    "function getEventsSince(uint256 blockNumber) view returns (tuple(uint256 blockNumber, uint8 eventType, bytes data, uint256 timestamp)[])",
    "function getEvent(uint256 index) view returns (tuple(uint256 blockNumber, uint8 eventType, bytes data, uint256 timestamp))",
    "event GameEventLogged(uint256 indexed index, uint8 eventType, uint256 blockNumber)",
];

// Default addresses — update after deploy
export const CONTRACT_ADDRESSES = {
    RiftWorld: import.meta.env.VITE_RIFT_WORLD || "0x0000000000000000000000000000000000000000",
    RiftPlayers: import.meta.env.VITE_RIFT_PLAYERS || "0x0000000000000000000000000000000000000000",
    RiftActions: import.meta.env.VITE_RIFT_ACTIONS || "0x0000000000000000000000000000000000000000",
    RiftEvents: import.meta.env.VITE_RIFT_EVENTS || "0x0000000000000000000000000000000000000000",
};

// Zone types
export const ZONE_TYPES = ['MARKET', 'BORDER', 'ORACLE', 'FAULTLINE'];
export const FACTION_NAMES = ['ARCHITECT', 'SCAVENGER', 'ORACLE'];
export const STRUCTURE_NAMES = ['NONE', 'SHIELD', 'MINE', 'BEACON', 'WATCHTOWER', 'SIPHON'];
export const EVENT_TYPES = ['SHOCKWAVE', 'COLLAPSE', 'SEISMIC', 'NEW_AGE', 'PROSPERITY'];
