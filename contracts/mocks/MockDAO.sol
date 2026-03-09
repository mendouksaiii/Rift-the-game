// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockDAO
/// @notice Simulates a governance DAO that emits ProposalExecuted events
contract MockDAO {
    event ProposalExecuted(uint256 indexed proposalId);

    uint256 public proposalCount;
    mapping(uint256 => bool) public executed;

    /// @notice Execute a governance proposal
    function executeProposal(uint256 _proposalId) external {
        require(!executed[_proposalId], "Already executed");
        executed[_proposalId] = true;
        proposalCount++;
        emit ProposalExecuted(_proposalId);
    }

    /// @notice Create and immediately execute a new proposal (for demo)
    function createAndExecute() external returns (uint256) {
        proposalCount++;
        uint256 id = proposalCount;
        executed[id] = true;
        emit ProposalExecuted(id);
        return id;
    }
}
