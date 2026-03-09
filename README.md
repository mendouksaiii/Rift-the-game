# RIFT — Reactive On-Chain Dark Forest Game

> *A persistent on-chain strategy game where real blockchain events — price crashes, liquidations, whale moves, governance votes — reactively reshape the game world in real time, with no off-chain infrastructure, powered entirely by Somnia Native Reactivity.*

![Somnia Reactivity](https://img.shields.io/badge/Somnia-Reactivity-00f0ff?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge)

## Overview

Rift is not a game that sits on top of the blockchain — it is a game that lives **inside** it.

The game world is a **7×7 hex grid** (49 territories) where every territory has on-chain attributes: **Stability**, **Wealth**, and **Controller**. Real on-chain events from external protocols (price oracles, lending protocols, token transfers, governance contracts) trigger in-game state mutations **in the same block** the event fires, through **Somnia Native On-chain Reactivity**.

There are no servers, no bots, no keepers. The blockchain is the game master.

## Architecture

```
contracts/
├── core/
│   ├── RiftWorld.sol              # 49-hex map state, territory attributes
│   ├── RiftPlayers.sol            # Player registration, factions, resources
│   ├── RiftActions.sol            # Claim, fortify, raid, build structures
│   └── RiftEvents.sol             # On-chain event log
├── reactive/
│   ├── interfaces/
│   │   ├── IReactive.sol          # Somnia SDK interface
│   │   └── AbstractReactive.sol   # Reactive base contract
│   ├── ReactiveWatcher_Price.sol       # Economic Shockwave
│   ├── ReactiveWatcher_Liquidation.sol # Collapse
│   ├── ReactiveWatcher_Whale.sol       # Seismic Event
│   ├── ReactiveWatcher_Governance.sol  # New Age
│   └── ReactiveWatcher_Yield.sol       # Prosperity
└── mocks/
    ├── MockPriceOracle.sol
    ├── MockLendingProtocol.sol
    ├── MockERC20.sol
    ├── MockDAO.sol
    └── MockYieldPool.sol

frontend/           # React + Vite + TailwindCSS + ethers.js v6
scripts/
├── deploy.js       # Full deployment + permission wiring
└── demo/
    └── runFullDemo.js  # Live demo simulation
```

## Somnia Reactive SDK Usage

Each of the 5 **ReactiveWatcher** contracts uses the Somnia Reactive SDK pattern:

| Watcher | Subscribes To | Event | In-Game Consequence |
|---|---|---|---|
| `ReactiveWatcher_Price` | `MockPriceOracle` | `PriceUpdated(uint256)` | **Economic Shockwave** — Market zones lose wealth/stability, raid window opens |
| `ReactiveWatcher_Liquidation` | `MockLendingProtocol` | `LiquidationExecuted(address,uint256)` | **Collapse** — 5 border zones enter instability (free seizure window) |
| `ReactiveWatcher_Whale` | `MockERC20` | `Transfer(address,address,uint256)` | **Seismic Event** — Fault line territories reshuffle, owners lose control |
| `ReactiveWatcher_Governance` | `MockDAO` | `ProposalExecuted(uint256)` | **New Age** — Oracle zone unlocks, 5-block race window |
| `ReactiveWatcher_Yield` | `MockYieldPool` | `RewardClaimed(address,uint256)` | **Prosperity** — Player territories gain wealth, shards minted |

### SDK Pattern

```solidity
contract ReactiveWatcher_Price is AbstractReactive {
    constructor(...) {
        // Subscribe to external contract events
        service.subscribe(
            block.chainid, PRICE_ORACLE,
            keccak256("PriceUpdated(uint256)"),
            REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
        );
    }

    function react(...) external override vmOnly {
        // Decode event data, apply game logic
        // Emit Callback to trigger state change in same block
        emit Callback(block.chainid, RIFT_WORLD, GAS_LIMIT, payload);
    }
}
```

## Factions

| Faction | Bonus | Penalty |
|---|---|---|
| **Architect** 🏗️ | Stability events | Collapse events |
| **Scavenger** 🗡️ | Collapse + liquidation events | Prosperity events |
| **Oracle** 🔮 | Governance events | Seismic events |

## Setup

### Prerequisites
- Node.js 18+
- MetaMask wallet

### Install
```bash
# Smart contracts
cd rift
npm install

# Frontend
cd frontend
npm install
```

### Compile & Test
```bash
npx hardhat compile    # Compile all 16 Solidity contracts
npx hardhat test       # Run tests
```

### Run Demo
```bash
npx hardhat run scripts/demo/runFullDemo.js
```

### Run Frontend
```bash
cd frontend
npm run dev
```

### Deploy to Somnia Testnet
```bash
# Set environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY

npx hardhat run scripts/deploy.js --network somniaTestnet
```

## Somnia Network Config

| Parameter | Value |
|---|---|
| Network | Somnia Shannon Testnet |
| Chain ID | 50312 |
| RPC URL | https://dream-rpc.somnia.network/ |
| Currency | STT |
| Explorer | https://shannon-explorer.somnia.network/ |

### Deployed Addresses (Somnia Shannon Testnet)
- **RiftWorld**: `0xFf1475BCe36386722e14D0c061458D6830Cc4DF3`
- **RiftPlayers**: `0xB9a49c41904bD680ce3d1D45827C040419D90D79`
- **RiftActions**: `0x88201a61eCDbB0d4E75e09840083868B5326A54B`
- **RiftEvents**: `0x56E0B7320f491615E14E360fF00D3F9EE8d1fa4F`

## Game Resources

- **Flux** ⚡ — Earned passively from territories. Used for claims, fortifications, structures.
- **Shards** 🔷 — Minted only when reactive events fire. Used for raids. Scarce when chain is quiet.

## License

MIT
