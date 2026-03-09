import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';
import { useEffect, useState } from 'react';

const FC = { 0: { color: '#38bdf8', name: 'ARCHITECT', icon: '◇' }, 1: { color: '#fbbf24', name: 'SCAVENGER', icon: '◆' }, 2: { color: '#a78bfa', name: 'ORACLE', icon: '◎' } };
const EV = { 0: { label: 'SHOCKWAVE', color: '#fbbf24', icon: '⚡', desc: 'Markets destabilized' }, 1: { label: 'COLLAPSE', color: '#ff4a1c', icon: '◣', desc: 'Borders in instability' }, 2: { label: 'SEISMIC', color: '#38bdf8', icon: '◈', desc: 'Fault lines reshuffled' }, 3: { label: 'NEW AGE', color: '#a78bfa', icon: '▽', desc: 'Oracle zone unlocked' }, 4: { label: 'PROSPERITY', color: '#00ff6a', icon: '✦', desc: 'Wealth boosted' } };
const ZN = { 0: 'MKT', 1: 'BDR', 2: 'ORC', 3: 'FLT' };
const ST = { 0: '', 1: '◆', 2: '▲', 3: '◎' };

function timeAgo(ts) {
    const d = Math.floor(Date.now() / 1000) - Number(ts);
    if (d < 60) return `${d}s`;
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    return `${Math.floor(d / 3600)}h`;
}

function MiniBar({ value, max = 100, color }) {
    return (
        <div className="w-full h-2 rounded-full mt-2" style={{ background: '#0f1018' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
        </div>
    );
}

// Global Ticker string builder
function buildTickerText(events, activeThreats) {
    if (events.length === 0) return 'INITIALIZING SECURE CONNECTION... AWAITING NETWORK TELEMETRY... NO RECENT ON-CHAIN ACTIVITY DETECTED...';
    const evStrs = [...events].reverse().slice(0, 5).map(e => `[${EV[e.eventType]?.label || 'EVENT'}] ${EV[e.eventType]?.desc || 'Unknown'}`);
    let str = evStrs.join('  ///  ');
    if (activeThreats > 0) {
        str += `  ///  🔴 WARNING: ${activeThreats} TERRITORIES UNDER THREAT OR UNSTABLE`;
    }
    // Duplicate to ensure smooth scrolling loop
    return `${str}  ///  ${str}`;
}

// Mini Radar Component
function MiniRadar({ activeZones = [] }) {
    return (
        <div className="relative w-full aspect-square overflow-hidden rounded-sm" style={{ background: '#07080c', border: '1px solid #1a1c2a' }}>
            {/* Grid */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#00ff6a 1px, transparent 1px), linear-gradient(90deg, #00ff6a 1px, transparent 1px)', backgroundSize: '20% 20%' }} />
            {/* Sweeper */}
            <div className="radar-sweep" />
            {/* Activity dots */}
            {activeZones.map((z, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full z-10 animate-pulse" style={{ background: '#00ff6a', boxShadow: '0 0 8px #00ff6a', top: `${20 + (z * 15)}%`, left: `${20 + (z * 15)}%` }} />
            ))}
            {/* Center reticle */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-[#00ff6a] opacity-50 rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
            <div className="absolute top-1/2 left-1/2 w-8 h-8 border border-[#00ff6a] opacity-20 rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
        </div>
    );
}

export default function DashboardPage() {
    const { player, account, territories, events, connect } = useGame();
    const navigate = useNavigate();

    if (!account) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center animate-fade-up">
                    <div className="text-7xl mb-6 opacity-10">⟡</div>
                    <div className="text-2xl mb-3 font-bold" style={{ fontFamily: 'var(--font-display)', color: '#5a5c72', letterSpacing: '8px' }}>OPERATOR TERMINAL</div>
                    <div className="text-sm mb-8 tracking-widest" style={{ color: '#3a3c52' }}>CONNECT WALLET TO ACCESS</div>
                    <button onClick={connect} className="btn-rift btn-rift-primary px-8 py-4 text-base tracking-widest font-bold">CONNECT NOW</button>
                </div>
            </div>
        );
    }

    const owned = territories.filter(t => t.controller?.toLowerCase() === account?.toLowerCase());
    const totalWealth = owned.reduce((s, t) => s + t.wealth, 0);
    const totalStability = owned.reduce((s, t) => s + t.stability, 0);
    const avgStability = owned.length > 0 ? Math.round(totalStability / owned.length) : 0;
    const threatened = owned.filter(t => t.instability || t.stability < 25);
    const faction = player?.registered ? FC[player.faction] : null;
    const zoneCount = {};
    owned.forEach(t => { zoneCount[t.zone] = (zoneCount[t.zone] || 0) + 1; });

    // Build leaderboard from territories + current player
    const pScores = {};
    territories.forEach(t => {
        if (!t.controller || t.controller === '0x0000000000000000000000000000000000000000') return;
        const c = t.controller;
        if (!pScores[c]) pScores[c] = { addr: c, f: t.controllerFaction, t: 0, s: 0 };
        pScores[c].t += 1;
        pScores[c].s += 100; // 100 pts per territory
    });
    // Add current player resources if registered
    if (player?.registered && account) {
        if (!pScores[account]) pScores[account] = { addr: account, f: player.faction, t: 0, s: 0 };
        pScores[account].s += Number(player.flux) || 0;
        pScores[account].s += (Number(player.shards) || 0) * 10;
        pScores[account].s += (Number(player.relicsDrawn) || 0) * 500;
    }
    const topPlayers = Object.values(pScores).sort((a, b) => b.s - a.s);

    const activeZonesList = Object.keys(zoneCount).map(Number); // for radar

    const tickerText = buildTickerText(events, threatened.length);

    return (
        <div className="h-full flex flex-col text-base relative">
            {/* ═══ TOP BAR: Identity + Resource Cards ═══ */}
            <div className="shrink-0 flex" style={{ borderBottom: '1px solid #1a1c2a' }}>
                {/* Identity */}
                <div className="w-96 shrink-0 p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${faction?.color || '#4a4c62'}06, #0a0b10 70%)`, borderRight: '1px solid #1a1c2a' }}>
                    <div className="absolute -right-4 -bottom-4 text-[90px] leading-none opacity-[0.03]" style={{ color: faction?.color }}>{faction?.icon || '?'}</div>
                    <div className="text-sm tracking-[4px] font-bold mb-3 flex items-center justify-between" style={{ fontFamily: 'var(--font-display)', color: '#3a3c52' }}>
                        <span>OPERATOR</span>
                        {threatened.length > 0 ? <span className="text-[#ff4a1c] animate-pulse">◆ UNSTABLE</span> : <span className="text-[#00ff6a]">◆ NOMINAL</span>}
                    </div>
                    <div className="text-lg font-bold mb-2 truncate" style={{ fontFamily: 'var(--font-data)', color: '#9a9caf' }}>
                        {account.slice(0, 6)}…{account.slice(-4)}
                    </div>
                    {faction ? (
                        <div className="flex items-center gap-3 mt-2">
                            <span style={{ color: faction.color, fontSize: '20px' }}>{faction.icon}</span>
                            <span className="text-lg font-bold tracking-widest" style={{ fontFamily: 'var(--font-display)', color: faction.color }}>{faction.name}</span>
                        </div>
                    ) : (
                        <button onClick={() => navigate('/factions')} className="mt-2 text-sm px-4 py-2 font-bold rounded-sm tracking-widest" style={{ background: '#00ff6a08', border: '1px solid #00ff6a20', color: '#00ff6a', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                            CHOOSE FACTION →
                        </button>
                    )}
                </div>

                {/* Resource Cards — stretch to fill */}
                {[
                    { label: 'FLUX', value: player?.flux?.toString() || '0', icon: '⚡', color: '#00ff6a', max: 500 },
                    { label: 'SHARDS', value: player?.shards?.toString() || '0', icon: '◈', color: '#a78bfa', max: 50 },
                    { label: 'TERRITORIES', value: owned.length, icon: '⬡', color: '#38bdf8', max: 49 },
                    { label: 'TOTAL WEALTH', value: totalWealth, icon: '▲', color: '#fbbf24', max: 4900 },
                ].map((s, i) => (
                    <div key={i} className="flex-1 p-6 flex flex-col justify-center relative overflow-hidden" style={{ background: '#07080c', borderRight: i < 3 ? '1px solid #1a1c2a' : 'none' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${s.color}, transparent 70%)` }} />
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <span className="text-sm tracking-[3px] font-bold" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62' }}>{s.label}</span>
                            <span style={{ color: s.color, fontSize: '22px' }}>{s.icon}</span>
                        </div>
                        <div className="text-4xl font-bold relative z-10" style={{ fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
                        <div className="relative z-10"><MiniBar value={Number(s.value)} max={s.max} color={s.color} /></div>
                    </div>
                ))}
            </div>

            {/* ═══ MAIN AREA: 3 columns filling remaining height ═══ */}
            <div className="flex-1 flex min-h-0" style={{ paddingBottom: '32px' }}>
                {/* Left: Territory Holdings */}
                <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: '1px solid #1a1c2a' }}>
                    <div className="shrink-0 px-6 py-4 flex items-center justify-between relative overflow-hidden" style={{ borderBottom: '1px solid #1a1c2a', background: 'rgba(0, 255, 106, 0.02)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#00ff6a', boxShadow: '0 0 8px #00ff6a' }} />
                            <span className="text-sm font-bold tracking-[3px]" style={{ fontFamily: 'var(--font-display)', color: '#00ff6a' }}>HOLDINGS MATRIX</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#4a4c62' }}>{owned.length}/49</span>
                    </div>
                    <div className="flex-1 overflow-y-auto relative">
                        {/* Matrix Data Stream background overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #00ff6a 20px, #00ff6a 21px)', backgroundSize: '100% 41px', zIndex: 0 }} />

                        <div className="relative z-10">
                            {owned.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20">
                                    <div className="text-6xl mb-6 opacity-5">⬡</div>
                                    <div className="text-sm tracking-[4px] font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#3a3c52' }}>NO TERRITORIES HELD</div>
                                    <button onClick={() => navigate('/')} className="text-sm font-bold tracking-widest px-6 py-3 rounded-sm" style={{ background: '#00ff6a08', border: '1px solid #00ff6a20', color: '#00ff6a', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                                        ⬡ CLAIM YOUR FIRST →
                                    </button>
                                </div>
                            ) : (
                                owned.map((t) => (
                                    <div key={t.hexId} className="flex items-center px-6 py-4 transition-colors hover:bg-white/[0.01]" style={{ borderBottom: '1px solid #0a0b10' }}>
                                        <div className="w-20">
                                            <span className="text-sm font-bold tracking-widest" style={{ fontFamily: 'var(--font-display)', color: '#d4d4e8' }}>H-{String(t.hexId).padStart(2, '0')}</span>
                                        </div>
                                        <span className="w-16 text-sm text-center font-bold" style={{ color: '#5a5c72' }}>{ZN[t.zone]}</span>
                                        <span className="w-10 text-center" style={{ color: '#6a6c8a', fontSize: '14px' }}>{ST[t.structure]}</span>
                                        <div className="flex-1 mx-6">
                                            <MiniBar value={t.stability} color={t.stability > 50 ? '#00ff6a' : t.stability > 25 ? '#fbbf24' : '#ff4a1c'} />
                                        </div>
                                        <span className="w-16 text-right text-sm font-bold tracking-widest" style={{ fontFamily: 'var(--font-data)', color: t.stability > 50 ? '#00ff6a' : '#ff4a1c' }}>{t.stability}%</span>
                                        <span className="w-16 text-right text-sm font-bold" style={{ fontFamily: 'var(--font-data)', color: '#fbbf24' }}>{t.wealth}</span>
                                        {t.instability && <span className="ml-3 text-sm font-bold animate-pulse text-[#ff4a1c]">▲</span>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {owned.length > 0 && (
                        <div className="shrink-0 px-6 py-4 flex justify-between text-sm font-bold tracking-widest" style={{ borderTop: '1px solid #1a1c2a', background: '#07080c' }}>
                            <span style={{ color: '#3a3c52' }}>AVG STB: <span style={{ color: avgStability > 50 ? '#00ff6a' : '#ff4a1c' }}>{avgStability}%</span></span>
                            <span style={{ color: '#3a3c52' }}>ZONES: {Object.entries(zoneCount).map(([z, c]) => `${ZN[z]}×${c}`).join(' ')}</span>
                        </div>
                    )}
                </div>

                {/* Center: Event Timeline */}
                <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: '1px solid #1a1c2a' }}>
                    <div className="shrink-0 px-6 py-4 flex items-center justify-between relative overflow-hidden" style={{ borderBottom: '1px solid #1a1c2a', background: 'rgba(251, 191, 36, 0.02)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
                            <span className="text-sm font-bold tracking-[3px]" style={{ fontFamily: 'var(--font-display)', color: '#fbbf24' }}>CHAIN TELEMETRY</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#4a4c62' }}>{events.length} logs</span>
                    </div>
                    <div className="flex-1 overflow-y-auto relative">
                        <div className="absolute inset-x-0 top-0 h-10 pointer-events-none z-10" style={{ background: 'linear-gradient(180deg, #050508, transparent)' }} />
                        <div className="relative z-0">
                            {[...events].reverse().map((ev, i) => {
                                const info = EV[ev.eventType] || EV[0];
                                return (
                                    <div key={i} className="flex items-center px-6 py-5 transition-colors hover:bg-white/[0.01]" style={{ borderBottom: '1px solid #0a0b10', borderLeft: `4px solid ${info.color}30` }}>
                                        <span className="w-10 text-center" style={{ color: info.color, fontSize: '20px' }}>{info.icon}</span>
                                        <div className="flex-1 ml-4">
                                            <div className="text-sm font-bold tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-display)', color: info.color }}>{info.label}</div>
                                            <div className="text-sm" style={{ color: '#5a5c72' }}>{info.desc}</div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className="text-sm tracking-wider font-bold mb-1.5" style={{ fontFamily: 'var(--font-data)', color: '#4a4c62' }}>#{ev.blockNumber?.toString().slice(-5)}</div>
                                            <div className="text-sm" style={{ color: '#2a2c3a' }}>{timeAgo(ev.timestamp)} ago</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Leaderboard + Actions */}
                <div className="w-96 shrink-0 flex flex-col">
                    {/* Leaderboard */}
                    <div className="flex-1 flex flex-col" style={{ borderBottom: '1px solid #1a1c2a', background: '#07080c' }}>
                        <div className="shrink-0 px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1c2a' }}>
                            <div className="flex items-center gap-3">
                                <div className="text-[#a78bfa] text-xs">▲</div>
                                <span className="text-sm font-bold tracking-[3px]" style={{ fontFamily: 'var(--font-display)', color: '#d4d4e8' }}>GLOBAL RANKING</span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: '#4a4c62' }}>TOP {topPlayers.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto relative p-4 space-y-2">
                            {topPlayers.length === 0 ? (
                                <div className="text-center text-sm mt-10" style={{ color: '#3a3c52', fontFamily: 'var(--font-display)', letterSpacing: '2px' }}>NO OPERATORS ONLINE</div>
                            ) : (
                                topPlayers.map((p, i) => (
                                    <div key={p.addr} className="flex items-center justify-between px-4 py-3 rounded-sm transition-all" style={{ background: p.addr.toLowerCase() === account.toLowerCase() ? '#00ff6a10' : '#0a0b10', border: `1px solid ${p.addr.toLowerCase() === account.toLowerCase() ? '#00ff6a30' : '#1a1c2a'}` }}>
                                        <div className="flex items-center gap-3 w-32">
                                            <span className="text-xs font-bold w-4 text-right" style={{ color: i === 0 ? '#fbbf24' : '#4a4c62' }}>{i + 1}</span>
                                            <span style={{ color: FC[p.f]?.color, fontSize: '14px' }}>{FC[p.f]?.icon}</span>
                                            <span className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-data)', color: '#9a9caf' }}>
                                                {p.addr.slice(0, 5)}…
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-[#5a5c72] w-20 justify-end">
                                            <span>{p.t} ⬡</span>
                                        </div>
                                        <div className="text-sm font-bold text-right w-16" style={{ fontFamily: 'var(--font-display)', color: i === 0 ? '#fbbf24' : '#d4d4e8' }}>
                                            {p.s}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 p-6 space-y-3" style={{ background: '#050508' }}>
                        <button onClick={() => navigate('/')} className="w-full py-4 rounded-sm text-sm font-bold tracking-[3px] transition-all hover:bg-[#00ff6a10]" style={{ fontFamily: 'var(--font-display)', background: '#00ff6a08', border: '1px solid #00ff6a20', color: '#00ff6a', cursor: 'pointer' }}>
                            ⬡ OPEN MAP →
                        </button>
                        <button onClick={() => navigate('/factions')} className="w-full py-4 rounded-sm text-sm font-bold tracking-[3px] transition-all hover:bg-[#a78bfa10]" style={{ fontFamily: 'var(--font-display)', background: '#a78bfa08', border: '1px solid #a78bfa20', color: '#a78bfa', cursor: 'pointer' }}>
                            △ FACTIONS →
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ GLOBAL TICKER MARQUEE ═══ */}
            <div className="absolute bottom-0 left-0 w-full h-8 overflow-hidden flex items-center" style={{ background: '#00ff6a10', borderTop: '1px solid #00ff6a30' }}>
                <div className="animate-marquee whitespace-nowrap text-xs font-bold tracking-widest" style={{ color: '#00ff6a', fontFamily: 'var(--font-data)' }}>
                    <span className="px-4">{tickerText}</span>
                </div>
            </div>
        </div>
    );
}
