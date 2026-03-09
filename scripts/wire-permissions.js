import hre from "hardhat";
const { ethers } = hre;

// Already deployed contracts on Somnia Shannon Testnet
const D = {
    RiftWorld: "0xFf1475BCe36386722e14D0c061458D6830Cc4DF3",
    RiftPlayers: "0xB9a49c41904bD680ce3d1D45827C040419D90D79",
    RiftActions: "0x88201a61eCDbB0d4E75e09840083868B5326A54B",
    RiftEvents: "0x56E0B7320f491615E14E360fF00D3F9EE8d1fa4F",
    ReactiveWatcher_Price: "0x61d08faD50E4b183128feBc1aE0771dd1847F29A",
    ReactiveWatcher_Liquidation: "0xAf8816C1D4b8849AF5De25dc541d6607Dc306221",
    ReactiveWatcher_Whale: "0xeAAC391d9AF660a18e8e125D3b81daeb4938Cab5",
};

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Wiring permissions with:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "STT\n");

    const world = await ethers.getContractAt("RiftWorld", D.RiftWorld);
    const players = await ethers.getContractAt("RiftPlayers", D.RiftPlayers);
    const events = await ethers.getContractAt("RiftEvents", D.RiftEvents);

    // Set actions contract
    console.log("Setting actions contract...");
    await (await world.setActionsContract(D.RiftActions)).wait();
    console.log("  World -> Actions ✓");

    await (await players.setActionsContract(D.RiftActions)).wait();
    console.log("  Players -> Actions ✓");

    // Set players on world
    await (await world.setPlayersContract(D.RiftPlayers)).wait();
    console.log("  World -> Players ✓");

    // Authorize watchers on World + Events
    const watchers = [D.ReactiveWatcher_Price, D.ReactiveWatcher_Liquidation, D.ReactiveWatcher_Whale];
    for (const w of watchers) {
        await (await world.setWatcher(w, true)).wait();
        await (await events.setWatcher(w, true)).wait();
        console.log(`  Watcher ${w.slice(0, 10)}... authorized on World + Events ✓`);
    }

    // Watchers on Players
    for (const w of watchers) {
        await (await players.setWatcher(w, true)).wait();
        console.log(`  Watcher ${w.slice(0, 10)}... authorized on Players ✓`);
    }

    console.log("\n=== WIRING COMPLETE ===");
    console.log("3 reactive events are live: Shockwave, Collapse, Seismic");
    console.log("\nFrontend .env:");
    console.log(`VITE_RIFT_WORLD=${D.RiftWorld}`);
    console.log(`VITE_RIFT_PLAYERS=${D.RiftPlayers}`);
    console.log(`VITE_RIFT_ACTIONS=${D.RiftActions}`);
    console.log(`VITE_RIFT_EVENTS=${D.RiftEvents}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
