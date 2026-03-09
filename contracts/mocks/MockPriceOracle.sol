// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockPriceOracle
/// @notice Simulates a price oracle for RIFT demo — emits PriceUpdated events
contract MockPriceOracle {
    uint256 public currentPrice;

    event PriceUpdated(uint256 newPrice);

    constructor(uint256 _initialPrice) {
        currentPrice = _initialPrice;
        emit PriceUpdated(_initialPrice);
    }

    /// @notice Set a new price directly
    function setPrice(uint256 _newPrice) external {
        currentPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    /// @notice Simulate a price drop by a given percentage (for demo scripting)
    function simulateDrop(uint256 _dropPercent) external {
        require(_dropPercent > 0 && _dropPercent <= 100, "Invalid drop percent");
        uint256 drop = (currentPrice * _dropPercent) / 100;
        currentPrice = currentPrice - drop;
        emit PriceUpdated(currentPrice);
    }

    /// @notice Simulate a price increase by a given percentage
    function simulateRise(uint256 _risePercent) external {
        require(_risePercent > 0, "Invalid rise percent");
        uint256 rise = (currentPrice * _risePercent) / 100;
        currentPrice = currentPrice + rise;
        emit PriceUpdated(currentPrice);
    }
}
