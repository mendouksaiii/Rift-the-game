import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

const FACTIONS = [
    {
        id: 0, name: 'ARCHITECT', icon: '◇', glyph: '⬡', color: '#38bdf8', colorDim: '#1a6fa0',
        tagline: 'BUILDERS & DEFENDERS',
        motto: '"We build what the Rift destroys."',
        desc: 'Architects are the backbone of civilization in the Rift. They build, they fortify, they endure. When the world trembles, Architects stand firm. Their structures last longer, their walls hold stronger, and their territories generate stability passively.\n\nBut they are not invincible. Collapse events — triggered by real liquidations on-chain — hit Architects hardest, crumbling the very foundations they built.',
        bonus: 'Stability events grant +50% bonus\nStructures cost 20% less Flux',
        penalty: 'Collapse events deal double instability',
        playstyle: 'Defensive · Long-term · Territory control',
        zones: 'Market zones — stable, central, valuable',
        resource: 'Flux-focused',
        stats: { offense: 2, defense: 5, economy: 4, survival: 5 },
    },
    {
        id: 1, name: 'SCAVENGER', icon: '◆', glyph: '⚔', color: '#fbbf24', colorDim: '#a07a18',
        tagline: 'RAIDERS & OPPORTUNISTS',
        motto: '"Chaos is a ladder. We climb fast."',
        desc: 'Scavengers thrive in chaos. When markets crash and borders collapse, Scavengers move in. They raid destabilized territories, seize abandoned hexes during instability windows, and accumulate Shards from the wreckage.\n\nBut when prosperity returns and the world stabilizes, Scavengers lose their edge. A peaceful chain is a Scavenger\'s worst nightmare.',
        bonus: 'Free raids during Collapse + Shockwave\nRaid costs reduced 50%',
        penalty: 'Prosperity reduces territory wealth by 20%',
        playstyle: 'Aggressive · Opportunistic · High-risk',
        zones: 'Border zones — contested, chaotic',
        resource: 'Shard-focused',
        stats: { offense: 5, defense: 2, economy: 3, survival: 3 },
    },
    {
        id: 2, name: 'ORACLE', icon: '◎', glyph: '👁', color: '#a78bfa', colorDim: '#6a50b0',
        tagline: 'SEERS & SPECULATORS',
        motto: '"We see what the chain reveals."',
        desc: 'Oracles see what others cannot. When governance proposals execute on-chain, Oracle zones unlock — and only Oracles can claim them for free during the 5-block race window. These locked hexes contain the highest wealth in the game.\n\nBut Oracles are fragile on unstable ground. Seismic events — triggered by whale movements — devastate Oracle holdings disproportionately.',
        bonus: 'Governance unlocks Oracle zones for free\nBeacons reveal more intel',
        penalty: 'Seismic events deal 2x fault line damage',
        playstyle: 'Strategic · Patient · High-reward',
        zones: 'Oracle zones — locked, corners, richest',
        resource: 'Balanced',
        stats: { offense: 3, defense: 3, economy: 5, survival: 4 },
    },
];

function StatBar({ label, value, color }) {
    return (
        <div className="flex items-center gap-4">
            <span className="text-sm w-12 text-right font-bold tracking-widest" style={{ color: '#4a4c62', fontFamily: 'var(--font-display)' }}>{label}</span>
            <div className="flex-1 flex gap-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-3.5 flex-1 rounded-sm transition-all" style={{
                        background: i <= value ? color : '#0f1018',
                        boxShadow: i <= value ? `0 0 8px ${color}40` : 'none',
                    }} />
                ))}
            </div>
        </div>
    );
}

export default function FactionsPage() {
    const { player, register, account, connect } = useGame();
    const navigate = useNavigate();
    const isRegistered = player?.registered;
    const [hoveredFaction, setHoveredFaction] = useState(null);
    const [selecting, setSelecting] = useState(null);

    const handleJoin = async (id) => {
        setSelecting(id);
        await register(id);
        setSelecting(null);
        navigate('/');
    };

    return (
        <div className="h-full flex flex-col">
            {/* Hero — compact */}
            <div className="relative py-8 text-center shrink-0 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,106,0.04) 0%, transparent 60%)' }} />
                <h1 className="text-4xl font-bold tracking-widest mb-2" style={{ fontFamily: 'var(--font-display)', color: '#d4d4e8' }}>
                    CHOOSE YOUR PATH
                </h1>
                <p className="text-sm tracking-[6px]" style={{ fontFamily: 'var(--font-display)', color: '#3a3c52' }}>
                    YOUR ALLEGIANCE SHAPES YOUR DESTINY
                </p>
                {!account && (
                    <button onClick={connect} className="btn-rift btn-rift-primary mt-4 px-8 py-3 text-sm">CONNECT TO CHOOSE</button>
                )}
                {isRegistered && (
                    <div className="mt-3 text-sm font-bold tracking-widest" style={{ color: '#4a4c62', fontFamily: 'var(--font-display)' }}>
                        ◆ YOU ARE {FACTIONS[player.faction]?.name}
                    </div>
                )}
            </div>

            {/* Faction Cards — fill remaining height, full width */}
            <div className="flex-1 grid grid-cols-3 gap-0 min-h-0 text-base">
                {FACTIONS.map((f) => {
                    const isActive = player?.faction === f.id && isRegistered;
                    const isHovered = hoveredFaction === f.id;
                    return (
                        <div
                            key={f.id}
                            className="relative flex flex-col overflow-y-auto"
                            onMouseEnter={() => setHoveredFaction(f.id)}
                            onMouseLeave={() => setHoveredFaction(null)}
                            style={{
                                background: `linear-gradient(180deg, ${f.color}06 0%, #050508 30%, #050508 100%)`,
                                borderRight: f.id < 2 ? '1px solid #1a1c2a' : 'none',
                                borderTop: `2px solid ${isActive ? f.color : isHovered ? f.color + '60' : '#1a1c2a'}`,
                                transition: 'border-color 0.3s ease',
                            }}
                        >
                            {/* Decorative glyph */}
                            <div className="absolute right-4 top-4 text-[120px] leading-none pointer-events-none select-none transition-opacity duration-500"
                                style={{ color: f.color, opacity: isHovered ? 0.06 : 0.02 }}>
                                {f.glyph}
                            </div>

                            {/* Active badge */}
                            {isActive && (
                                <div className="absolute top-5 right-5 px-3 py-1 rounded-sm text-sm font-bold z-10" style={{
                                    background: f.color + '15', color: f.color, border: `1px solid ${f.color}30`,
                                    fontFamily: 'var(--font-display)', letterSpacing: '2px',
                                }}>◆ ACTIVE</div>
                            )}

                            {/* Content */}
                            <div className="flex-1 flex flex-col p-8 lg:p-10">
                                {/* Header */}
                                <div className="mb-6">
                                    <div className="flex items-start gap-4 mb-3">
                                        <span className="text-4xl" style={{ color: f.color }}>{f.icon}</span>
                                        <div>
                                            <h2 className="text-3xl font-bold tracking-wider" style={{ fontFamily: 'var(--font-display)', color: f.color }}>
                                                {f.name}
                                            </h2>
                                            <p className="text-sm tracking-[4px] mt-1" style={{ fontFamily: 'var(--font-display)', color: '#5a5c72' }}>
                                                {f.tagline}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg italic mt-3" style={{ color: '#5a5c72' }}>{f.motto}</p>
                                </div>

                                {/* Divider */}
                                <div className="mb-6" style={{ height: '1px', background: `linear-gradient(90deg, ${f.color}20, transparent)` }} />

                                {/* Lore */}
                                <p className="text-base leading-relaxed whitespace-pre-line mb-8" style={{ color: '#8a8c9a', lineHeight: '1.8' }}>
                                    {f.desc}
                                </p>

                                {/* Stat Bars */}
                                <div className="space-y-4 mb-8">
                                    <StatBar label="ATK" value={f.stats.offense} color={f.color} />
                                    <StatBar label="DEF" value={f.stats.defense} color={f.color} />
                                    <StatBar label="ECO" value={f.stats.economy} color={f.color} />
                                    <StatBar label="SRV" value={f.stats.survival} color={f.color} />
                                </div>

                                {/* Bonus + Penalty */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-sm" style={{ background: '#00ff6a06', border: '1px solid #00ff6a15' }}>
                                        <div className="text-sm font-bold mb-2 tracking-widest" style={{ fontFamily: 'var(--font-display)', color: '#00ff6a' }}>▲ BONUS</div>
                                        <div className="text-sm whitespace-pre-line" style={{ color: '#7a7c9a', lineHeight: '1.6' }}>{f.bonus}</div>
                                    </div>
                                    <div className="p-4 rounded-sm" style={{ background: '#ff4a1c06', border: '1px solid #ff4a1c15' }}>
                                        <div className="text-sm font-bold mb-2 tracking-widest" style={{ fontFamily: 'var(--font-display)', color: '#ff4a1c' }}>▼ PENALTY</div>
                                        <div className="text-sm whitespace-pre-line" style={{ color: '#7a7c9a', lineHeight: '1.6' }}>{f.penalty}</div>
                                    </div>
                                </div>

                                {/* Info chips */}
                                <div className="space-y-3 mb-8">
                                    <div className="px-4 py-3 rounded-sm text-sm" style={{ background: '#0a0b10', border: '1px solid #1a1c2a', color: '#6a6c8a' }}>
                                        <span style={{ color: f.color, marginRight: 8 }}>◈</span>{f.playstyle}
                                    </div>
                                    <div className="px-4 py-3 rounded-sm text-sm" style={{ background: '#0a0b10', border: '1px solid #1a1c2a', color: '#6a6c8a' }}>
                                        <span style={{ color: f.color, marginRight: 8 }}>⬡</span>{f.zones}
                                    </div>
                                    <div className="px-4 py-3 rounded-sm text-sm" style={{ background: '#0a0b10', border: '1px solid #1a1c2a', color: '#6a6c8a' }}>
                                        <span style={{ color: f.color, marginRight: 8 }}>⚡</span>{f.resource}
                                    </div>
                                </div>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* CTA */}
                                {!isRegistered && account && (
                                    <button
                                        onClick={() => handleJoin(f.id)}
                                        disabled={selecting !== null}
                                        className="w-full py-5 rounded-sm text-base font-bold tracking-widest transition-all duration-200 mt-4"
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            background: isHovered ? `linear-gradient(135deg, ${f.color}20, ${f.color}08)` : `${f.color}08`,
                                            border: `1px solid ${isHovered ? f.color + '50' : f.color + '25'}`,
                                            color: f.color,
                                            cursor: selecting !== null ? 'wait' : 'pointer',
                                            letterSpacing: '5px',
                                        }}
                                    >
                                        {selecting === f.id ? '◈ JOINING...' : `JOIN ${f.name} →`}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
