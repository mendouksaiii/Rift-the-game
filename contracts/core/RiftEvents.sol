// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RiftEvents
/// @notice Permanent on-chain event log for all reactive game events
contract RiftEvents {
    // ─── Enums ───
    enum EventType {
        SHOCKWAVE,      // 0 — Economic Shockwave
        COLLAPSE,       // 1 — Border Collapse
        SEISMIC,        // 2 — Seismic Event
        NEW_AGE,        // 3 — Oracle Zone Unlock
        PROSPERITY      // 4 — Prosperity Boost
    }

    // ─── Event Data ───
    struct GameEvent {
        uint256 blockNumber;
        EventType eventType;
        bytes data;           // ABI-encoded event-specific data
        uint256 timestamp;
    }

    // ─── State ───
    GameEvent[] public eventHistory;
    address public owner;
    mapping(address => bool) public authorizedWatchers;

    // ─── Events ───
    event GameEventLogged(uint256 indexed index, EventType eventType, uint256 blockNumber);

    // ─── Modifiers ───
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyWatcher() {
        require(authorizedWatchers[msg.sender] || msg.sender == owner, "Not authorized watcher");
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

    // ─── Logging ───
    function logEvent(EventType _eventType, bytes calldata _data) external onlyWatcher {
        uint256 index = eventHistory.length;
        eventHistory.push(GameEvent({
            blockNumber: block.number,
            eventType: _eventType,
            data: _data,
            timestamp: block.timestamp
        }));
        emit GameEventLogged(index, _eventType, block.number);
    }

    // ─── View Functions ───
    function getEventCount() external view returns (uint256) {
        return eventHistory.length;
    }

    function getRecentEvents(uint256 _count) external view returns (GameEvent[] memory) {
        uint256 total = eventHistory.length;
        uint256 count = _count > total ? total : _count;
        GameEvent[] memory events = new GameEvent[](count);

        for (uint256 i = 0; i < count; i++) {
            events[i] = eventHistory[total - count + i];
        }
        return events;
    }

    function getEventsSince(uint256 _blockNumber) external view returns (GameEvent[] memory) {
        // Count matching events
        uint256 count = 0;
        for (uint256 i = 0; i < eventHistory.length; i++) {
            if (eventHistory[i].blockNumber >= _blockNumber) {
                count++;
            }
        }

        // Build result array
        GameEvent[] memory events = new GameEvent[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < eventHistory.length; i++) {
            if (eventHistory[i].blockNumber >= _blockNumber) {
                events[idx] = eventHistory[i];
                idx++;
            }
        }
        return events;
    }

    function getEvent(uint256 _index) external view returns (GameEvent memory) {
        require(_index < eventHistory.length, "Index out of bounds");
        return eventHistory[_index];
    }
}
