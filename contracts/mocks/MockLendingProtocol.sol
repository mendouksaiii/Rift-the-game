// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockLendingProtocol
/// @notice Simulates a lending protocol that emits LiquidationExecuted events
contract MockLendingProtocol {
    event LiquidationExecuted(address indexed borrower, uint256 amount);

    uint256 public totalLiquidations;

    /// @notice Trigger a simulated liquidation event
    function triggerLiquidation(address _borrower, uint256 _amount) external {
        require(_borrower != address(0), "Invalid borrower");
        require(_amount > 0, "Invalid amount");
        totalLiquidations++;
        emit LiquidationExecuted(_borrower, _amount);
    }

    /// @notice Batch liquidation for demo
    function batchLiquidate(address[] calldata _borrowers, uint256[] calldata _amounts) external {
        require(_borrowers.length == _amounts.length, "Length mismatch");
        for (uint256 i = 0; i < _borrowers.length; i++) {
            totalLiquidations++;
            emit LiquidationExecuted(_borrowers[i], _amounts[i]);
        }
    }
}
