import { useState } from 'react';
import { FACTION_NAMES, ZONE_TYPES } from '../contracts';
import { useSound } from '../SoundContext';

const FC = {
    0: { color: '#38bdf8', icon: '◇', name: 'ARCHITECT', desc: 'Builder · Defender' },
    1: { color: '#fbbf24', icon: '◆', name: 'SCAVENGER', desc: 'Raider · Opportunist' },
    2: { color: '#a78bfa', icon: '◎', name: 'ORACLE', desc: 'Speculator · Seer' },
};

export default function PlayerPanel({ player, account, territories, onRegister, onTrade }) {
    const isConnected = !!account;
    const isReg = player?.registered;
    const { playHover, playClick, playClaim } = useSound();

    const owned = territories.filter(
        (t) => t.controller?.toLowerCase() === account?.toLowerCase()
    );

    const [trading, setTrading] = useState(false);

    // Leaderboard
    const board = {};
    for (const t of territories) {
        if (t.controller && t.controller !== '0x0000000000000000000000000000000000000000') {
            if (!board[t.controller]) board[t.controller] = { addr: t.controller, n: 0, f: t.controllerFaction };
            board[t.controller].n++;
        }
    }
    const top = Object.values(board).sort((a, b) => b.n - a.n).slice(0, 5);

    return (
        <div className="panel-rift h-full flex flex-col md:text-base">
            <div className="panel-header-rift p-6 text-lg" style={{ color: '#a78bfa' }}>
                <span className="status-dot w-3 h-3" style={{ background: '#a78bfa', boxShadow: '0 0 12px #a78bfa' }} />
                <span>OPERATOR TERMINAL</span>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center h-full" style={{ color: '#2a2c3a' }}>
                        <div className="text-6xl mb-6 opacity-20">⟡</div>
                        <div className="text-sm tracking-widest mb-2" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62' }}>
                            AWAITING UPLINK
                        </div>
                        <div className="text-base" style={{ color: '#2a2c3a' }}>
                            Connect wallet to enter
                        </div>
                    </div>
                ) : (
                    <div className="stagger-children">
                        {/* Wallet */}
                        <div className="animate-fade-up">
                            <div className="text-sm uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62' }}>
                                Uplink Connection
                            </div>
                            <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-data)', color: '#5a5c72' }}>
                                {account.slice(0, 8)}…{account.slice(-6)}
                            </div>
                        </div>

                        {!isReg ? (
                            /* Faction selection */
                            <div className="animate-fade-up space-y-4 mt-8">
                                <div className="text-sm text-center mb-6 font-bold" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62', letterSpacing: '3px' }}>
                                    SELECT FACTION TO INITIALIZE
                                </div>
                                {[0, 1, 2].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => { playClaim(); onRegister(f); }}
                                        onMouseEnter={playHover}
                                        className="w-full p-6 rounded-sm text-left transition-all hover:brightness-125"
                                        style={{
                                            background: FC[f].color + '08',
                                            border: `1px solid ${FC[f].color}20`,
                                        }}
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="text-4xl" style={{ color: FC[f].color }}>{FC[f].icon}</span>
                                            <div>
                                                <div className="text-base font-bold tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)', color: FC[f].color }}>
                                                    {FC[f].name}
                                                </div>
                                                <div className="text-sm" style={{ color: '#4a4c62' }}>{FC[f].desc}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Faction */}
                                <div className="animate-fade-up mt-6">
                                    <div className="badge-rift px-6 py-4 text-lg" style={{ borderColor: FC[player.faction].color + '30', color: FC[player.faction].color, background: FC[player.faction].color + '08' }}>
                                        {FC[player.faction].icon} {FC[player.faction].name}
                                    </div>
                                </div>

                                {/* Resources */}
                                <div className="animate-fade-up grid grid-cols-3 gap-3 mt-6">
                                    <div className="p-3 rounded-sm" style={{ background: '#00ff6a06', border: '1px solid #00ff6a15' }}>
                                        <div className="text-xs uppercase tracking-widest mb-1 font-bold" style={{ fontFamily: 'var(--font-display)', color: '#2a2c3a' }}>Flux Reserve</div>
                                        <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#00ff6a' }}>
                                            {player.flux?.toString() || '0'}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-sm" style={{ background: '#a78bfa06', border: '1px solid #a78bfa15' }}>
                                        <div className="text-xs uppercase tracking-widest mb-1 font-bold" style={{ fontFamily: 'var(--font-display)', color: '#2a2c3a' }}>Shards</div>
                                        <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#a78bfa' }}>
                                            {player.shards?.toString() || '0'}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-sm" style={{ background: '#facc1506', border: '1px solid #facc1515' }}>
                                        <div className="text-xs uppercase tracking-widest mb-1 font-bold" style={{ fontFamily: 'var(--font-display)', color: '#2a2c3a' }}>Relics</div>
                                        <div className="text-2xl font-bold text-center" style={{ fontFamily: 'var(--font-display)', color: '#facc15' }}>
                                            {player.relicsDrawn?.toString() || '0'}
                                        </div>
                                    </div>
                                </div>

                                {/* Trading */}
                                <div className="animate-fade-up mt-6 p-5 rounded-sm" style={{ background: '#1a1c2a08', border: '1px solid #1a1c2a' }}>
                                    <div className="text-sm uppercase tracking-widest mb-4 font-bold flex justify-between items-center" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62' }}>
                                        <span>Black Market Exchange</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { playClick(); setTrading(true); onTrade?.('flux-to-shards', 1); setTimeout(() => setTrading(false), 500); }}
                                            onMouseEnter={playHover}
                                            disabled={trading || player.flux < 100}
                                            className="p-3 rounded-sm text-center transition-all hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ background: '#a78bfa10', border: '1px solid #a78bfa30' }}
                                        >
                                            <div className="text-xs mb-1" style={{ color: '#a78bfa' }}>GET 1 SHARD</div>
                                            <div className="text-xs font-bold" style={{ color: '#4a4c62' }}>Cost: 100 FLX</div>
                                        </button>
                                        <button
                                            onClick={() => { playClick(); setTrading(true); onTrade?.('shards-to-flux', 1); setTimeout(() => setTrading(false), 500); }}
                                            onMouseEnter={playHover}
                                            disabled={trading || player.shards < 1}
                                            className="p-3 rounded-sm text-center transition-all hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ background: '#00ff6a10', border: '1px solid #00ff6a30' }}
                                        >
                                            <div className="text-xs mb-1" style={{ color: '#00ff6a' }}>GET 50 FLUX</div>
                                            <div className="text-xs font-bold" style={{ color: '#4a4c62' }}>Cost: 1 SHD</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Holdings */}
                                <div className="animate-fade-up mt-6">
                                    <div className="text-sm uppercase tracking-widest mb-4 font-bold" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62' }}>
                                        Strategic Holdings · {owned.length}
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {owned.length === 0 ? (
                                            <div className="text-sm" style={{ color: '#2a2c3a' }}>No territories held under your command.</div>
                                        ) : (
                                            owned.map((t) => (
                                                <div key={t.hexId} className="flex items-center justify-between px-4 py-3 rounded-sm" style={{ background: '#0a0b10', borderBottom: '1px solid #1a1c2a' }}>
                                                    <span className="text-sm font-bold tracking-widest" style={{ fontFamily: 'var(--font-display)', color: '#d4d4e8' }}>
                                                        HEX-{String(t.hexId).padStart(2, '0')}
                                                    </span>
                                                    <div className="flex items-center gap-6 text-sm font-bold">
                                                        <span style={{ color: t.stability > 50 ? '#00ff6a' : '#ff4a1c' }}>{t.stability}%</span>
                                                        <span style={{ color: '#fbbf24' }}>W{t.wealth}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Threat alerts */}
                                {owned.some(t => t.instability) && (
                                    <div className="animate-fade-up p-5 rounded-sm mt-6" style={{ background: '#ff4a1c08', border: '1px solid #ff4a1c20' }}>
                                        <div className="text-sm font-bold mb-3 tracking-widest" style={{ fontFamily: 'var(--font-display)', color: '#ff4a1c' }}>
                                            ▲ ACTIVE THREAT DETECTED
                                        </div>
                                        {owned.filter(t => t.instability).map(t => (
                                            <div key={t.hexId} className="text-sm mb-1" style={{ color: '#ff6644' }}>
                                                • HEX-{String(t.hexId).padStart(2, '0')} is experiencing instability
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Leaderboard */}
                                {top.length > 0 && (
                                    <div className="animate-fade-up mt-8 pt-6 border-t border-[#1a1c2a]">
                                        <div className="text-sm uppercase tracking-widest mb-4 font-bold" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62' }}>
                                            Global Dominance Network
                                        </div>
                                        {top.map((p, i) => (
                                            <div key={p.addr} className="flex items-center justify-between px-3 py-2 text-sm font-bold" style={{ color: '#4a4c62' }}>
                                                <span style={{ color: FC[p.f]?.color || '#4a4c62', fontFamily: 'var(--font-data)' }}>
                                                    {i + 1}. {p.addr.slice(0, 6)}…
                                                </span>
                                                <span style={{ color: '#5a5c72' }}>{p.n} hexes</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
