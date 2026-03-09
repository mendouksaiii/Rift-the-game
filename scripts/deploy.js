import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying RIFT contracts with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
    console.log("");

    // ─── Phase 1: Deploy Mock Protocols ───
    console.log("=== DEPLOYING MOCK PROTOCOLS ===");

    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    const oracle = await MockPriceOracle.deploy(ethers.parseEther("2000")); // $2000 initial price
    await oracle.waitForDeployment();
    console.log("MockPriceOracle:", await oracle.getAddress());

    const MockLendingProtocol = await ethers.getContractFactory("MockLendingProtocol");
    const lending = await MockLendingProtocol.deploy();
    await lending.waitForDeployment();
    console.log("MockLendingProtocol:", await lending.getAddress());

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("RiftToken", "RIFT", 1000000);
    await token.waitForDeployment();
    console.log("MockERC20:", await token.getAddress());

    const MockDAO = await ethers.getContractFactory("MockDAO");
    const dao = await MockDAO.deploy();
    await dao.waitForDeployment();
    console.log("MockDAO:", await dao.getAddress());

    const MockYieldPool = await ethers.getContractFactory("MockYieldPool");
    const yieldPool = await MockYieldPool.deploy();
    await yieldPool.waitForDeployment();
    console.log("MockYieldPool:", await yieldPool.getAddress());

    console.log("");

    // ─── Phase 2: Deploy Core Contracts ───
    console.log("=== DEPLOYING CORE CONTRACTS ===");

    const RiftWorld = await ethers.getContractFactory("RiftWorld");
    const world = await RiftWorld.deploy();
    await world.waitForDeployment();
    console.log("RiftWorld:", await world.getAddress());

    const RiftPlayers = await ethers.getContractFactory("RiftPlayers");
    const players = await RiftPlayers.deploy();
    await players.waitForDeployment();
    console.log("RiftPlayers:", await players.getAddress());

    const RiftActions = await ethers.getContractFactory("RiftActions");
    const actions = await RiftActions.deploy(await world.getAddress(), await players.getAddress());
    await actions.waitForDeployment();
    console.log("RiftActions:", await actions.getAddress());

    const RiftEvents = await ethers.getContractFactory("RiftEvents");
    const events = await RiftEvents.deploy();
    await events.waitForDeployment();
    console.log("RiftEvents:", await events.getAddress());

    console.log("");

    // ─── Phase 3: Deploy Reactive Watchers ───
    console.log("=== DEPLOYING REACTIVE WATCHERS ===");

    const ReactiveWatcher_Price = await ethers.getContractFactory("ReactiveWatcher_Price");
    const watcherPrice = await ReactiveWatcher_Price.deploy(
        await oracle.getAddress(),
        await world.getAddress(),
        await players.getAddress(),
        await events.getAddress()
    );
    await watcherPrice.waitForDeployment();
    console.log("ReactiveWatcher_Price:", await watcherPrice.getAddress());

    const ReactiveWatcher_Liquidation = await ethers.getContractFactory("ReactiveWatcher_Liquidation");
    const watcherLiquidation = await ReactiveWatcher_Liquidation.deploy(
        await lending.getAddress(),
        await world.getAddress(),
        await players.getAddress(),
        await events.getAddress()
    );
    await watcherLiquidation.waitForDeployment();
    console.log("ReactiveWatcher_Liquidation:", await watcherLiquidation.getAddress());

    const ReactiveWatcher_Whale = await ethers.getContractFactory("ReactiveWatcher_Whale");
    const watcherWhale = await ReactiveWatcher_Whale.deploy(
        await token.getAddress(),
        await world.getAddress(),
        await players.getAddress(),
        await events.getAddress()
    );
    await watcherWhale.waitForDeployment();
    console.log("ReactiveWatcher_Whale:", await watcherWhale.getAddress());

    const ReactiveWatcher_Governance = await ethers.getContractFactory("ReactiveWatcher_Governance");
    const watcherGovernance = await ReactiveWatcher_Governance.deploy(
        await dao.getAddress(),
        await world.getAddress(),
        await events.getAddress()
    );
    await watcherGovernance.waitForDeployment();
    console.log("ReactiveWatcher_Governance:", await watcherGovernance.getAddress());

    const ReactiveWatcher_Yield = await ethers.getContractFactory("ReactiveWatcher_Yield");
    const watcherYield = await ReactiveWatcher_Yield.deploy(
        await yieldPool.getAddress(),
        await world.getAddress(),
        await players.getAddress(),
        await events.getAddress()
    );
    await watcherYield.waitForDeployment();
    console.log("ReactiveWatcher_Yield:", await watcherYield.getAddress());

    console.log("");

    // ─── Phase 4: Wire Permissions ───
    console.log("=== WIRING PERMISSIONS ===");

    // Set actions contract on world and players
    await world.setActionsContract(await actions.getAddress());
    await players.setActionsContract(await actions.getAddress());
    console.log("Actions contract authorized on World & Players");

    // Set players contract on world
    await world.setPlayersContract(await players.getAddress());
    console.log("Players contract set on World");

    // Authorize all watchers on World
    const watcherAddresses = [
        await watcherPrice.getAddress(),
        await watcherLiquidation.getAddress(),
        await watcherWhale.getAddress(),
        await watcherGovernance.getAddress(),
        await watcherYield.getAddress(),
    ];

    for (const addr of watcherAddresses) {
        await world.setWatcher(addr, true);
        await events.setWatcher(addr, true);
    }
    console.log("All 5 watchers authorized on World & Events");

    // Authorize watchers that interact with Players
    await players.setWatcher(await watcherPrice.getAddress(), true);
    await players.setWatcher(await watcherLiquidation.getAddress(), true);
    await players.setWatcher(await watcherWhale.getAddress(), true);
    await players.setWatcher(await watcherYield.getAddress(), true);
    console.log("Watchers authorized on Players");

    console.log("");

    // ─── Output Addresses ───
    console.log("=== DEPLOYMENT COMPLETE ===");
    const addresses = {
        MockPriceOracle: await oracle.getAddress(),
        MockLendingProtocol: await lending.getAddress(),
        MockERC20: await token.getAddress(),
        MockDAO: await dao.getAddress(),
        MockYieldPool: await yieldPool.getAddress(),
        RiftWorld: await world.getAddress(),
        RiftPlayers: await players.getAddress(),
        RiftActions: await actions.getAddress(),
        RiftEvents: await events.getAddress(),
        ReactiveWatcher_Price: await watcherPrice.getAddress(),
        ReactiveWatcher_Liquidation: await watcherLiquidation.getAddress(),
        ReactiveWatcher_Whale: await watcherWhale.getAddress(),
        ReactiveWatcher_Governance: await watcherGovernance.getAddress(),
        ReactiveWatcher_Yield: await watcherYield.getAddress(),
    };

    console.log("\nContract Addresses (JSON):");
    console.log(JSON.stringify(addresses, null, 2));

    return addresses;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
