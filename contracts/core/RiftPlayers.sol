// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RiftPlayers
/// @notice Player registration, faction management, and resource balances
contract RiftPlayers {
    // ─── Enums ───
    enum Faction { ARCHITECT, SCAVENGER, ORACLE }

    // ─── Player Data ───
    struct Player {
        Faction faction;
        uint256 flux;
        uint256 shards;
        address linkedDeFiWallet;
        bool registered;
        uint8 relicsDrawn;
    }

    // ─── State ───
    mapping(address => Player) public players;
    address[] public playerList;
    mapping(Faction => address[]) public factionMembers;

    // Access control
    address public owner;
    mapping(address => bool) public authorizedWatchers;
    address public actionsContract;

    // ─── Events ───
    event PlayerRegistered(address indexed player, Faction faction);
    event FluxMinted(address indexed player, uint256 amount);
    event ShardsMinted(address indexed player, uint256 amount);
    event FluxSpent(address indexed player, uint256 amount);
    event ShardsSpent(address indexed player, uint256 amount);
    event FluxDeducted(address indexed player, uint256 amount);

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
    }

    // ─── Admin ───
    function setWatcher(address _watcher, bool _authorized) external onlyOwner {
        authorizedWatchers[_watcher] = _authorized;
    }

    function setActionsContract(address _actions) external onlyOwner {
        actionsContract = _actions;
    }

    // ─── Registration ───
    function register(Faction _faction, address _linkedWallet) external {
        require(!players[msg.sender].registered, "Already registered");
        players[msg.sender] = Player({
            faction: _faction,
            flux: 500,     // Starting flux
            shards: 25,    // Starting shards
            linkedDeFiWallet: _linkedWallet,
            registered: true,
            relicsDrawn: 0
        });
        playerList.push(msg.sender);
        factionMembers[_faction].push(msg.sender);
        emit PlayerRegistered(msg.sender, _faction);
    }

    /// @notice Admin registration for demo purposes
    function registerPlayer(address _player, Faction _faction) external onlyOwner {
        require(!players[_player].registered, "Already registered");
        players[_player] = Player({
            faction: _faction,
            flux: 500,
            shards: 25,
            linkedDeFiWallet: _player,
            registered: true,
            relicsDrawn: 0
        });
        playerList.push(_player);
        factionMembers[_faction].push(_player);
        emit PlayerRegistered(_player, _faction);
    }

    // ─── Minting (onlyWatcher) ───
    function mintShards(address _player, uint256 _amount) external onlyWatcher {
        require(players[_player].registered, "Not registered");
        players[_player].shards += _amount;
        emit ShardsMinted(_player, _amount);
    }

    function mintFlux(address _player, uint256 _amount) external onlyWatcher {
        require(players[_player].registered, "Not registered");
        players[_player].flux += _amount;
        emit FluxMinted(_player, _amount);
    }

    /// @notice Deduct flux from a player (used by reactive collapse events)
    function deductFlux(address _player, uint256 _amount) external onlyWatcher {
        require(players[_player].registered, "Not registered");
        if (players[_player].flux >= _amount) {
            players[_player].flux -= _amount;
        } else {
            players[_player].flux = 0;
        }
        emit FluxDeducted(_player, _amount);
    }

    // ─── Spending (onlyActions) ───
    function spendFlux(address _player, uint256 _amount) external onlyActions {
        require(players[_player].registered, "Not registered");
        require(players[_player].flux >= _amount, "Insufficient Flux");
        players[_player].flux -= _amount;
        emit FluxSpent(_player, _amount);
    }

    function spendShards(address _player, uint256 _amount) external onlyActions {
        require(players[_player].registered, "Not registered");
        require(players[_player].shards >= _amount, "Insufficient Shards");
        players[_player].shards -= _amount;
        emit ShardsSpent(_player, _amount);
    }

    function grantRelic(address _player) external onlyActions {
        require(players[_player].registered, "Not registered");
        players[_player].relicsDrawn += 1;
    }

    // ─── Trading ───
    function tradeFluxForShards(uint256 _shardsWanted) external {
        require(players[msg.sender].registered, "Not registered");
        uint256 fluxCost = _shardsWanted * 100;
        require(players[msg.sender].flux >= fluxCost, "Insufficient Flux");
        
        players[msg.sender].flux -= fluxCost;
        players[msg.sender].shards += _shardsWanted;
        
        emit FluxSpent(msg.sender, fluxCost);
        emit ShardsMinted(msg.sender, _shardsWanted);
    }

    function tradeShardsForFlux(uint256 _shardsToTrade) external {
        require(players[msg.sender].registered, "Not registered");
        require(players[msg.sender].shards >= _shardsToTrade, "Insufficient Shards");
        
        uint256 fluxGained = _shardsToTrade * 50;
        players[msg.sender].shards -= _shardsToTrade;
        players[msg.sender].flux += fluxGained;
        
        emit ShardsSpent(msg.sender, _shardsToTrade);
        emit FluxMinted(msg.sender, fluxGained);
    }

    // ─── View Functions ───
    function getPlayer(address _addr) external view returns (Player memory) {
        return players[_addr];
    }

    function isRegistered(address _addr) external view returns (bool) {
        return players[_addr].registered;
    }

    function getPlayerCount() external view returns (uint256) {
        return playerList.length;
    }

    function getFactionMembers(Faction _faction) external view returns (address[] memory) {
        return factionMembers[_faction];
    }

    function getAllPlayers() external view returns (address[] memory) {
        return playerList;
    }

    function getPlayerFaction(address _addr) external view returns (Faction) {
        require(players[_addr].registered, "Not registered");
        return players[_addr].faction;
    }
}
