// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockYieldPool
/// @notice Simulates an Aave-style yield pool that emits RewardClaimed events
contract MockYieldPool {
    event RewardClaimed(address indexed user, uint256 amount);

    mapping(address => uint256) public totalClaimed;

    /// @notice Simulate claiming a yield reward
    function claimReward(address _user, uint256 _amount) external {
        require(_user != address(0), "Invalid user");
        require(_amount > 0, "Invalid amount");
        totalClaimed[_user] += _amount;
        emit RewardClaimed(_user, _amount);
    }

    /// @notice Batch claim for demo
    function batchClaim(address[] calldata _users, uint256[] calldata _amounts) external {
        require(_users.length == _amounts.length, "Length mismatch");
        for (uint256 i = 0; i < _users.length; i++) {
            totalClaimed[_users[i]] += _amounts[i];
            emit RewardClaimed(_users[i], _amounts[i]);
        }
    }
}
