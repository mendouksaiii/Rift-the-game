import hre from "hardhat";
const { ethers } = hre;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║        RIFT — LIVE DEMO SEQUENCE         ║");
    console.log("║   Reactive On-Chain Dark Forest Game     ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log("");

    const [deployer, player1, player2, player3, player4, player5] = await ethers.getSigners();

    // ─── Deploy Everything ───
    console.log("⏳ Deploying all contracts...");

    // Mocks
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    const oracle = await MockPriceOracle.deploy(ethers.parseEther("2000"));
    await oracle.waitForDeployment();

    const MockLendingProtocol = await ethers.getContractFactory("MockLendingProtocol");
    const lending = await MockLendingProtocol.deploy();
    await lending.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("RiftToken", "RIFT", 1000000);
    await token.waitForDeployment();

    const MockDAO = await ethers.getContractFactory("MockDAO");
    const dao = await MockDAO.deploy();
    await dao.waitForDeployment();

    const MockYieldPool = await ethers.getContractFactory("MockYieldPool");
    const yieldPool = await MockYieldPool.deploy();
    await yieldPool.waitForDeployment();

    // Core
    const RiftWorld = await ethers.getContractFactory("RiftWorld");
    const world = await RiftWorld.deploy();
    await world.waitForDeployment();

    const RiftPlayers = await ethers.getContractFactory("RiftPlayers");
    const players = await RiftPlayers.deploy();
    await players.waitForDeployment();

    const RiftActions = await ethers.getContractFactory("RiftActions");
    const actions = await RiftActions.deploy(await world.getAddress(), await players.getAddress());
    await actions.waitForDeployment();

    const RiftEvents = await ethers.getContractFactory("RiftEvents");
    const events = await RiftEvents.deploy();
    await events.waitForDeployment();

    // Watchers
    const ReactiveWatcher_Price = await ethers.getContractFactory("ReactiveWatcher_Price");
    const watcherPrice = await ReactiveWatcher_Price.deploy(
        await oracle.getAddress(), await world.getAddress(),
        await players.getAddress(), await events.getAddress()
    );
    await watcherPrice.waitForDeployment();

    const ReactiveWatcher_Liquidation = await ethers.getContractFactory("ReactiveWatcher_Liquidation");
    const watcherLiquidation = await ReactiveWatcher_Liquidation.deploy(
        await lending.getAddress(), await world.getAddress(),
        await players.getAddress(), await events.getAddress()
    );
    await watcherLiquidation.waitForDeployment();

    const ReactiveWatcher_Whale = await ethers.getContractFactory("ReactiveWatcher_Whale");
    const watcherWhale = await ReactiveWatcher_Whale.deploy(
        await token.getAddress(), await world.getAddress(),
        await players.getAddress(), await events.getAddress()
    );
    await watcherWhale.waitForDeployment();

    const ReactiveWatcher_Governance = await ethers.getContractFactory("ReactiveWatcher_Governance");
    const watcherGovernance = await ReactiveWatcher_Governance.deploy(
        await dao.getAddress(), await world.getAddress(), await events.getAddress()
    );
    await watcherGovernance.waitForDeployment();

    const ReactiveWatcher_Yield = await ethers.getContractFactory("ReactiveWatcher_Yield");
    const watcherYield = await ReactiveWatcher_Yield.deploy(
        await yieldPool.getAddress(), await world.getAddress(),
        await players.getAddress(), await events.getAddress()
    );
    await watcherYield.waitForDeployment();

    // Wire permissions
    await world.setActionsContract(await actions.getAddress());
    await players.setActionsContract(await actions.getAddress());
    await world.setPlayersContract(await players.getAddress());

    const watchers = [watcherPrice, watcherLiquidation, watcherWhale, watcherGovernance, watcherYield];
    for (const w of watchers) {
        const addr = await w.getAddress();
        await world.setWatcher(addr, true);
        await events.setWatcher(addr, true);
    }
    await players.setWatcher(await watcherPrice.getAddress(), true);
    await players.setWatcher(await watcherLiquidation.getAddress(), true);
    await players.setWatcher(await watcherWhale.getAddress(), true);
    await players.setWatcher(await watcherYield.getAddress(), true);

    console.log("✅ All 14 contracts deployed and wired\n");

    // ─── Step 1: Register Demo Players ───
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 1: Registering 5 demo players...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Faction 0=ARCHITECT, 1=SCAVENGER, 2=ORACLE
    await players.registerPlayer(player1.address, 0); // Architect
    await players.registerPlayer(player2.address, 1); // Scavenger
    await players.registerPlayer(player3.address, 2); // Oracle
    await players.registerPlayer(player4.address, 0); // Architect
    await players.registerPlayer(player5.address, 1); // Scavenger

    console.log(`   Player 1 (${player1.address.slice(0, 10)}...): ARCHITECT`);
    console.log(`   Player 2 (${player2.address.slice(0, 10)}...): SCAVENGER`);
    console.log(`   Player 3 (${player3.address.slice(0, 10)}...): ORACLE`);
    console.log(`   Player 4 (${player4.address.slice(0, 10)}...): ARCHITECT`);
    console.log(`   Player 5 (${player5.address.slice(0, 10)}...): SCAVENGER`);
    console.log("");

    // ─── Step 2: Claim Initial Territories ───
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 2: Claiming initial territories...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Each player claims 2 territories
    await actions.connect(player1).claimTerritory(16); // Market zone
    await actions.connect(player1).claimTerritory(17); // Market zone
    console.log("   Player 1 claimed hexes 16, 17 (Market Zone)");

    await actions.connect(player2).claimTerritory(1);  // Border zone
    await actions.connect(player2).claimTerritory(2);  // Border zone
    console.log("   Player 2 claimed hexes 1, 2 (Border Zone)");

    await actions.connect(player3).claimTerritory(23); // Market zone
    await actions.connect(player3).claimTerritory(8);  // Fault line
    console.log("   Player 3 claimed hexes 23, 8 (Market + Fault Line)");

    await actions.connect(player4).claimTerritory(30); // Market zone
    await actions.connect(player4).claimTerritory(31); // Market zone
    console.log("   Player 4 claimed hexes 30, 31 (Market Zone)");

    await actions.connect(player5).claimTerritory(43); // Border zone
    await actions.connect(player5).claimTerritory(44); // Border zone
    console.log("   Player 5 claimed hexes 43, 44 (Border Zone)");
    console.log("");

    // Show initial state
    const t16Before = await world.getTerritory(16);
    console.log(`   Hex 16 before shockwave — Stability: ${t16Before.stability}, Wealth: ${t16Before.wealth}`);
    console.log("");

    await sleep(1000);

    // ─── Step 3: Economic Shockwave (Price Drop) ───
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 3: ⚡ TRIGGERING ECONOMIC SHOCKWAVE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Simulating 5% price drop on oracle...");

    // First set the initial price in the watcher
    await watcherPrice.triggerShockwave(ethers.parseEther("2000"));
    // Now trigger a 5% drop
    const droppedPrice = ethers.parseEther("1900"); // 5% drop from 2000
    await watcherPrice.triggerShockwave(droppedPrice);

    const t16After = await world.getTerritory(16);
    console.log(`   ⚡ Hex 16 after shockwave — Stability: ${t16After.stability}, Wealth: ${t16After.wealth}`);
    console.log(`   📉 Stability dropped by ${t16Before.stability - t16After.stability}, Wealth dropped by ${t16Before.wealth - t16After.wealth}`);
    console.log(`   🪟 Raid Window opened: ${await world.isRaidWindowActive()}`);

    const eventCount1 = await events.getEventCount();
    console.log(`   📋 Events logged: ${eventCount1}`);
    console.log("");

    await sleep(1000);

    // ─── Step 4: Seismic Event (Whale Transfer) ───
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 4: 🌊 TRIGGERING SEISMIC EVENT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Whale moving 600 tokens (threshold: 500)...");

    const whaleAmount = ethers.parseEther("600");
    await watcherWhale.triggerSeismic(whaleAmount);

    const t8After = await world.getTerritory(8);
    console.log(`   🌊 Hex 8 after seismic — Stability: ${t8After.stability}, Wealth: ${t8After.wealth}, Controller: ${t8After.controller}`);
    console.log(`   Player 3 lost control of hex 8: ${t8After.controller === ethers.ZeroAddress}`);

    const eventCount2 = await events.getEventCount();
    console.log(`   📋 Events logged: ${eventCount2}`);
    console.log("");

    await sleep(1000);

    // ─── Step 5: Collapse (Liquidation) ───
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 5: 💧 TRIGGERING COLLAPSE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Liquidation detected on lending protocol...");

    await watcherLiquidation.triggerCollapse();

    // Check some border hexes
    const borderHexes = [1, 2, 43, 44, 7];
    for (const hid of borderHexes) {
        const t = await world.getTerritory(hid);
        const isUnstable = await world.isInstabilityActive(hid);
        if (isUnstable) {
            console.log(`   💧 Hex ${hid} in INSTABILITY — Stability: ${t.stability}, open for seizure!`);
        }
    }

    const eventCount3 = await events.getEventCount();
    console.log(`   📋 Events logged: ${eventCount3}`);
    console.log("");

    await sleep(1000);

    // ─── Step 6: New Age (Governance) ───
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 6: 🗳️ TRIGGERING NEW AGE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   DAO Proposal #44 executed...");

    await watcherGovernance.triggerNewAge(44);

    const oracleRaceActive = await world.isOracleRaceActive();
    const raceHexId = await world.oracleRaceHexId();
    console.log(`   🗳️ Oracle Race Active: ${oracleRaceActive}`);
    console.log(`   🗳️ Unlocked Oracle Zone hex: ${raceHexId}`);

    // Oracle player claims the zone (free for Oracle faction)
    const oracleHex = await world.getTerritory(raceHexId);
    if (!oracleHex.locked) {
        await actions.connect(player3).claimTerritory(raceHexId);
        const oracleHexAfter = await world.getTerritory(raceHexId);
        console.log(`   🎯 Player 3 (Oracle) claimed hex ${raceHexId} for FREE!`);
        console.log(`   Controller: ${oracleHexAfter.controller}`);
    }

    const eventCount4 = await events.getEventCount();
    console.log(`   📋 Events logged: ${eventCount4}`);
    console.log("");

    await sleep(1000);

    // ─── Step 7: Prosperity (Yield Claim) ───
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 7: 🌟 TRIGGERING PROSPERITY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Player 1 claimed yield rewards...");

    await watcherYield.triggerProsperity(player1.address, 100);

    const t16Final = await world.getTerritory(16);
    const t17Final = await world.getTerritory(17);
    console.log(`   🌟 Hex 16 — Wealth: ${t16Final.wealth} (boosted!)`);
    console.log(`   🌟 Hex 17 — Wealth: ${t17Final.wealth} (boosted!)`);

    const p1 = await players.getPlayer(player1.address);
    console.log(`   💎 Player 1 Shards: ${p1.shards} (minted from yield)`);

    const eventCount5 = await events.getEventCount();
    console.log(`   📋 Events logged: ${eventCount5}`);
    console.log("");

    // ─── Final Summary ───
    console.log("╔══════════════════════════════════════════╗");
    console.log("║          DEMO COMPLETE                   ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log("");
    console.log("Summary of reactive events fired:");
    console.log(`   Total events logged: ${eventCount5}`);
    console.log("   1. ⚡ Economic Shockwave — Price oracle drop");
    console.log("   2. 🌊 Seismic Event — Whale transfer");
    console.log("   3. 💧 Collapse — Liquidation");
    console.log("   4. 🗳️  New Age — Governance proposal");
    console.log("   5. 🌟 Prosperity — Yield reward claim");
    console.log("");
    console.log("All events fired via Somnia Reactive Watcher contracts.");
    console.log("Each watcher subscribes to external protocol events");
    console.log("and triggers in-game state changes in the SAME BLOCK.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
