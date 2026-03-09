import hre from "hardhat";
const { ethers } = hre;

const D = {
    MockDAO: "0xF0F70454ef25B19AF056dF4cC4D85B48FC991cbE",
    MockYieldPool: "0xa919CF6752A3694067398D47718F4fcC506ebF67",
    RiftWorld: "0xFf1475BCe36386722e14D0c061458D6830Cc4DF3",
    RiftPlayers: "0xB9a49c41904bD680ce3d1D45827C040419D90D79",
    RiftEvents: "0x56E0B7320f491615E14E360fF00D3F9EE8d1fa4F",
};

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Resuming final deployments with:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "STT\n");

    console.log("=== DEPLOYING REMAINING 2 WATCHERS ===");
    const GovFactory = await ethers.getContractFactory("ReactiveWatcher_Governance");
    const gov = await GovFactory.deploy(D.MockDAO, D.RiftWorld, D.RiftEvents);
    await gov.waitForDeployment();
    const govAddr = await gov.getAddress();
    console.log("ReactiveWatcher_Governance:", govAddr);

    const YieldFactory = await ethers.getContractFactory("ReactiveWatcher_Yield");
    const yieldWatcher = await YieldFactory.deploy(D.MockYieldPool, D.RiftWorld, D.RiftPlayers, D.RiftEvents);
    await yieldWatcher.waitForDeployment();
    const yieldAddr = await yieldWatcher.getAddress();
    console.log("ReactiveWatcher_Yield:", yieldAddr);

    console.log("\n=== WIRING PERMISSIONS FOR NEW WATCHERS ===");
    const world = await ethers.getContractAt("RiftWorld", D.RiftWorld);
    const players = await ethers.getContractAt("RiftPlayers", D.RiftPlayers);
    const events = await ethers.getContractAt("RiftEvents", D.RiftEvents);

    await (await world.setWatcher(govAddr, true)).wait();
    await (await events.setWatcher(govAddr, true)).wait();
    console.log("Governance watcher authorized on World + Events");

    await (await world.setWatcher(yieldAddr, true)).wait();
    await (await events.setWatcher(yieldAddr, true)).wait();
    await (await players.setWatcher(yieldAddr, true)).wait();
    console.log("Yield watcher authorized on World + Events + Players");

    console.log("\n=== ALL 14 CONTRACTS DEPLOYED & WIRED ===");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
