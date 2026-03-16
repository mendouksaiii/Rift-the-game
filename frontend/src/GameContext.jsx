import { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import {
    RIFT_WORLD_ABI, RIFT_PLAYERS_ABI, RIFT_ACTIONS_ABI, RIFT_EVENTS_ABI,
    CONTRACT_ADDRESSES, FACTION_NAMES,
} from './contracts';

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

/* ─── DEMO MOCK DATA ─── */
function mockTerritories() {
    const FA = [
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    ];
    const ts = [];
    for (let i = 0; i < 49; i++) {
        const r = Math.floor(i / 7), c = i % 7;
        let zone = 1, locked = false, stab = 40 + Math.floor(Math.random() * 30), wlth = 30 + Math.floor(Math.random() * 40);
        let ctrl = '0x0000000000000000000000000000000000000000', cf = 0, inst = false, relic = false;
        if ((r === 0 && c === 0) || (r === 0 && c === 6) || (r === 6 && c === 0) || (r === 6 && c === 6)) {
            zone = 2; locked = i !== 0; stab = 80; wlth = 60;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            zone = 0; stab = 60; wlth = 75;
            if (i === 16) relic = true;
        } else if (r === c || r + c === 6) {
            zone = 3; stab = 45; wlth = 40;
        }
        if ([16, 17, 23, 30].includes(i)) { ctrl = FA[0]; cf = 0; }
        else if ([1, 2, 43].includes(i)) { ctrl = FA[1]; cf = 1; }
        else if ([8, 0].includes(i)) { ctrl = FA[2]; cf = 2; }
        if ([1, 7, 44].includes(i)) { inst = true; stab = 0; }
        ts.push({
            hexId: i, stability: stab, wealth: wlth, controller: ctrl, controllerFaction: cf,
            zone, locked, instability: inst, instabilityUntilBlock: inst ? 999999 : 0,
            structure: i === 16 ? 2 : i === 23 ? 1 : 0,
            hasRelic: relic,
        });
    }
    return ts;
}

const now = () => Math.floor(Date.now() / 1000);
const MOCK_EV = [
    { blockNumber: 9042811, eventType: 0, data: '0x', timestamp: now() - 30 },
    { blockNumber: 9042798, eventType: 2, data: '0x', timestamp: now() - 120 },
    { blockNumber: 9042756, eventType: 3, data: '0x', timestamp: now() - 300 },
    { blockNumber: 9042712, eventType: 1, data: '0x', timestamp: now() - 600 },
    { blockNumber: 9042680, eventType: 4, data: '0x', timestamp: now() - 900 },
];

export function GameProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contracts, setContracts] = useState({});
    const [territories, setTerritories] = useState(mockTerritories());
    const [player, setPlayer] = useState(null);
    const [events, setEvents] = useState(MOCK_EV);
    const [raidWindow, setRaidWindow] = useState(true);
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [block, setBlock] = useState(0);
    const [flash, setFlash] = useState('');
    const poll = useRef(null);

    const connect = useCallback(async () => {
        console.log('[RIFT] Connect clicked');
        if (!window.ethereum) {
            // Demo mode — simulate wallet connection (unregistered, pick faction)
            console.log('[RIFT] No MetaMask detected — entering demo mode');
            const demoAddr = '0xea7A6f8925F91f31a5baBfe8Ce1505d4Ef0B5ed7';
            setAccount(demoAddr);
            setConnected(true);
            // Don't auto-register — let user choose faction on /factions page
            return;
        }
        try {
            console.log('[RIFT] Requesting MetaMask accounts...');
            const bp = new BrowserProvider(window.ethereum);
            // Force MetaMask to show the account chooser popup every time
            await bp.send('wallet_requestPermissions', [{ eth_accounts: {} }]);
            const accs = await bp.send('eth_accounts', []);
            console.log('[RIFT] Connected:', accs[0]);
            const s = await bp.getSigner();
            setProvider(bp); setSigner(s); setAccount(accs[0]); setConnected(true);
            const addr = CONTRACT_ADDRESSES;
            const live = addr.RiftWorld !== '0x0000000000000000000000000000000000000000';
            if (live) {
                console.log('[RIFT] Live mode — connecting to Somnia contracts');
                const w = new Contract(addr.RiftWorld, RIFT_WORLD_ABI, s);
                const p = new Contract(addr.RiftPlayers, RIFT_PLAYERS_ABI, s);
                const a = new Contract(addr.RiftActions, RIFT_ACTIONS_ABI, s);
                const e = new Contract(addr.RiftEvents, RIFT_EVENTS_ABI, s);
                setContracts({ world: w, players: p, actions: a, events: e });
                try { const pl = await p.getPlayer(accs[0]); if (pl.registered) setPlayer({ faction: Number(pl.faction), flux: pl.flux, shards: pl.shards, registered: true, relicsDrawn: Number(pl.relicsDrawn) }); } catch (e) { console.log('[RIFT] Player not registered yet:', e.message); }
                try {
                    const all = await w.getAllTerritories();
                    const rFlags = await Promise.all(all.map((_, i) => w.hasRelic(i)));
                    setTerritories(all.map((t, i) => ({ hexId: Number(t.hexId), stability: Number(t.stability), wealth: Number(t.wealth), controller: t.controller, controllerFaction: 0, zone: Number(t.zone), locked: t.locked, instability: t.instability, instabilityUntilBlock: Number(t.instabilityUntilBlock), structure: Number(t.structure), hasRelic: rFlags[i] })));
                } catch (e) { console.log('[RIFT] Using demo territories:', e.message); }
            } else {
                console.log('[RIFT] Demo mode — no contracts deployed');
                setPlayer({ faction: 0, flux: 240, shards: 12, registered: true, relicsDrawn: 0 });
            }
        } catch (err) {
            console.error('[RIFT] Connect error:', err);
            alert(`Wallet connection failed: ${err.message}`);
        }
    }, []);

    const register = useCallback(async (f) => {
        if (contracts.players) {
            setLoading(true);
            try { const tx = await contracts.players.register(f, account); await tx.wait(); } catch { }
            setLoading(false);
        }
        setPlayer({ faction: f, flux: 500, shards: 25, registered: true, relicsDrawn: 0 });
    }, [contracts, account]);

    const doAction = useCallback(async (aid, hid) => {
        setLoading(true);
        try {
            if (contracts.actions) {
                let tx;
                if (aid === 'claim') tx = await contracts.actions.claimTerritory(hid);
                else if (aid === 'fortify') tx = await contracts.actions.fortify(hid);
                else if (aid === 'raid') tx = await contracts.actions.raid(hid);
                else if (aid === 'build-shield') tx = await contracts.actions.buildStructure(hid, 1);
                else if (aid === 'build-mine') tx = await contracts.actions.buildStructure(hid, 2);
                else if (aid === 'build-beacon') tx = await contracts.actions.buildStructure(hid, 3);
                else if (aid === 'build-watchtower') tx = await contracts.actions.buildStructure(hid, 4);
                else if (aid === 'build-siphon') tx = await contracts.actions.buildStructure(hid, 5);
                else if (aid === 'claim-relic') tx = await contracts.actions.claimRelic(hid);
                if (tx) await tx.wait();
                const all = await contracts.world.getAllTerritories();
                const rFlags = await Promise.all(all.map((_, i) => contracts.world.hasRelic(i)));
                setTerritories(all.map((t, i) => ({ hexId: Number(t.hexId), stability: Number(t.stability), wealth: Number(t.wealth), controller: t.controller, controllerFaction: 0, zone: Number(t.zone), locked: t.locked, instability: t.instability, instabilityUntilBlock: Number(t.instabilityUntilBlock), structure: Number(t.structure), hasRelic: rFlags[i] })));
                const p = await contracts.players.getPlayer(account);
                setPlayer({ faction: Number(p.faction), flux: p.flux, shards: p.shards, registered: true, relicsDrawn: Number(p.relicsDrawn) });
            } else {
                setTerritories(prev => prev.map(t => {
                    if (t.hexId !== hid) return t;
                    if (aid === 'claim' || aid === 'raid') return { ...t, controller: account, controllerFaction: player?.faction || 0 };
                    if (aid === 'fortify') return { ...t, stability: Math.min(100, t.stability + 20) };
                    if (aid === 'build-shield') return { ...t, structure: 1, stability: Math.min(100, t.stability + 20) };
                    if (aid === 'build-mine') return { ...t, structure: 2, wealth: Math.min(100, t.wealth + 10) };
                    if (aid === 'build-beacon') return { ...t, structure: 3 };
                    if (aid === 'build-watchtower') return { ...t, structure: 4, stability: Math.min(100, t.stability + 30) };
                    if (aid === 'build-siphon') return { ...t, structure: 5, wealth: Math.min(100, t.wealth + 20), stability: Math.max(0, t.stability - 10) };
                    if (aid === 'claim-relic') return { ...t, hasRelic: false };
                    return t;
                }));
                const costs = { claim: { f: raidWindow ? 25 : 50, s: 0 }, fortify: { f: 30, s: 0 }, raid: { f: 0, s: 10 }, 'build-shield': { f: 80, s: 0 }, 'build-mine': { f: 80, s: 0 }, 'build-beacon': { f: 80, s: 0 }, 'build-watchtower': { f: 120, s: 0 }, 'build-siphon': { f: 100, s: 0 }, 'claim-relic': { f: 50, s: 10 } };
                const c = costs[aid] || { f: 0, s: 0 };
                setPlayer(p => ({ ...p, flux: Number(p.flux) - c.f, shards: Number(p.shards) - c.s, relicsDrawn: aid === 'claim-relic' ? (p.relicsDrawn || 0) + 1 : (p.relicsDrawn || 0) }));
            }
        } catch (err) { console.error(err); alert(`Failed: ${err.reason || err.message}`); }
        setLoading(false);
    }, [contracts, account, player, raidWindow]);

    const trade = useCallback(async (type, amount) => {
        setLoading(true);
        try {
            if (contracts.players) {
                let tx;
                if (type === 'flux-to-shards') {
                    tx = await contracts.players.tradeFluxForShards(amount);
                } else if (type === 'shards-to-flux') {
                    tx = await contracts.players.tradeShardsForFlux(amount);
                }
                if (tx) await tx.wait();
                const p = await contracts.players.getPlayer(account);
                setPlayer({ faction: Number(p.faction), flux: p.flux, shards: p.shards, registered: true, relicsDrawn: Number(p.relicsDrawn) });
            } else {
                // Demo local simulation
                if (type === 'flux-to-shards') {
                    setPlayer(p => ({ ...p, flux: Number(p.flux) - (amount * 100), shards: Number(p.shards) + amount }));
                } else if (type === 'shards-to-flux') {
                    setPlayer(p => ({ ...p, shards: Number(p.shards) - amount, flux: Number(p.flux) + (amount * 50) }));
                }
            }
        } catch (err) {
            console.error('[RIFT] Trade failed:', err);
            alert(`Trade failed: ${err.reason || err.message}`);
        }
        setLoading(false);
    }, [contracts, account]);

    // Event polling
    useEffect(() => {
        if (!contracts.events) return;
        const fn = async () => { try { const n = await contracts.events.getEventCount(); if (Number(n) > 0) { const r = await contracts.events.getRecentEvents(Math.min(20, Number(n))); setEvents(r.map(e => ({ blockNumber: Number(e.blockNumber), eventType: Number(e.eventType), data: e.data, timestamp: Number(e.timestamp) }))); } } catch { } };
        fn(); poll.current = setInterval(fn, 5000);
        return () => clearInterval(poll.current);
    }, [contracts.events]);

    // Block number
    useEffect(() => {
        if (!provider) return;
        const fn = async () => { try { setBlock(await provider.getBlockNumber()); } catch { } };
        fn(); const i = setInterval(fn, 3000);
        return () => clearInterval(i);
    }, [provider]);

    // Demo event generator
    useEffect(() => {
        if (connected) return;
        const i = setInterval(() => {
            const et = Math.floor(Math.random() * 5);
            const flashMap = ['flash-shockwave', 'flash-collapse', 'flash-seismic', 'flash-newage', 'flash-prosperity'];
            setFlash(flashMap[et]);
            setTimeout(() => setFlash(''), 1500);
            setEvents(prev => [...prev, { blockNumber: 9042811 + Math.floor(Math.random() * 200), eventType: et, data: '0x', timestamp: now() }].slice(-20));
        }, 8000);
        return () => clearInterval(i);
    }, [connected]);

    return (
        <GameContext.Provider value={{
            account, player, territories, events, raidWindow, loading, connected, block, flash,
            connect, register, doAction, trade, setPlayer,
        }}>
            {children}
        </GameContext.Provider>
    );
}
