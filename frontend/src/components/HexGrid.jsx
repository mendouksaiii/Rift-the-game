import { useState, useCallback, useEffect } from 'react';
import { ZONE_TYPES } from '../contracts';
import { useSound } from '../SoundContext';

const COLS = 7;
const ROWS = 7;
const HEX_R = 36;
const GAP = 3;

const W = HEX_R * 2;
const H = Math.sqrt(3) * HEX_R;

function center(row, col) {
    return {
        x: col * (W * 0.75) + HEX_R + 40,
        y: row * (H + GAP) + (col % 2 ? H / 2 : 0) + HEX_R + 28,
    };
}

function pts(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i);
        p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return p.join(' ');
}

// Zone fills — atmospheric, not flat
const ZONE_FILLS = {
    0: { base: '#0c1a2e', glow: '#1a3050' },       // MARKET — dark navy
    1: { base: '#1a0c0c', glow: '#2a1515' },       // BORDER — dried blood
    2: { base: '#140c24', glow: '#221640' },        // ORACLE — deep indigo
    3: { base: '#0c1a10', glow: '#1a2a1a' },        // FAULTLINE — dark moss
};

const FACTION_HEX = {
    0: '#38bdf8', // ARCHITECT — ice blue
    1: '#fbbf24', // SCAVENGER — gold
    2: '#a78bfa', // ORACLE — lavender
};

function hexFill(t) {
    if (t.locked) return '#080810';
    const hasOwner = t.controller && t.controller !== '0x0000000000000000000000000000000000000000';
    if (hasOwner) {
        const fc = FACTION_HEX[t.controllerFaction] || '#444';
        const a = Math.round((0.08 + (t.wealth / 100) * 0.22) * 255).toString(16).padStart(2, '0');
        return fc + a;
    }
    return ZONE_FILLS[t.zone]?.base || '#0a0b10';
}

function hexStroke(t) {
    if (t.locked) return '#1a1c2a';
    if (t.instability) return '#ff4a1c';
    const hasOwner = t.controller && t.controller !== '0x0000000000000000000000000000000000000000';
    if (hasOwner) return FACTION_HEX[t.controllerFaction] || '#252840';
    return '#1e2038';
}

function strokeW(t) {
    if (t.instability) return 2;
    const hasOwner = t.controller && t.controller !== '0x0000000000000000000000000000000000000000';
    return hasOwner ? 1.2 + (t.stability / 100) * 1.3 : 0.8;
}

const STRUCT = { 1: '◆', 2: '▲', 3: '◎' };
const ZONE_TAG = { 0: 'MKT', 1: 'BDR', 2: 'ORC', 3: 'FLT' };

export default function HexGrid({ territories, raidWindowActive, onHexClick, selectedHex, account }) {
    const [hovered, setHovered] = useState(null);
    const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const { playHover, playClick } = useSound();

    useEffect(() => {
        setMounted(true);
    }, []);

    const onEnter = useCallback((t, e) => {
        if (t.hexId !== hovered?.hexId) playHover();
        setHovered(t);
        const r = e.currentTarget.closest('svg').getBoundingClientRect();
        setTipPos({ x: e.clientX - r.left + 16, y: e.clientY - r.top - 10 });
    }, [hovered, playHover]);

    const svgW = COLS * W * 0.75 + W * 0.5 + 80;
    const svgH = ROWS * (H + GAP) + H + 56;

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div className="map-data-bg" />
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full relative z-10" style={{ maxWidth: svgW }}>
                <defs>
                    <filter id="hex-glow-green">
                        <feGaussianBlur stdDeviation="4" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="hex-glow-red">
                        <feGaussianBlur stdDeviation="6" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {territories.map((t) => {
                    const row = Math.floor(t.hexId / COLS);
                    const col = t.hexId % COLS;
                    const { x, y } = center(row, col);
                    const isSel = selectedHex === t.hexId;
                    const isOwn = t.controller?.toLowerCase() === account?.toLowerCase();
                    const cls = [
                        'hex-territory',
                        t.instability ? 'hex-unstable animate-pulse drop-shadow-[0_0_15px_rgba(255,74,28,0.6)]' : '',
                        t.locked ? 'hex-locked' : '',
                        mounted ? 'hex-stagger-enter' : 'opacity-0'
                    ].filter(Boolean).join(' ');

                    // Distance from center (24) for radial staggered entry
                    const distFromCenter = Math.abs(row - 3) + Math.abs(col - 3);
                    const animDelay = distFromCenter * 0.05 + Math.random() * 0.1;

                    return (
                        <g
                            key={t.hexId}
                            className={cls}
                            style={{ animationDelay: `${animDelay}s` }}
                            onClick={() => { playClick(); onHexClick(t); }}
                            onMouseEnter={(e) => onEnter(t, e)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {/* Animated SVG Selection Reticle */}
                            {isSel && (
                                <g className="hex-reticle" style={{ transformOrigin: `${x}px ${y}px` }}>
                                    <polygon points={pts(x, y, HEX_R + 6)} fill="none" stroke="#00ff6a" strokeWidth="1" opacity="0.4" strokeDasharray="10 5" />
                                    <polygon points={pts(x, y, HEX_R + 3)} fill="none" stroke="#00ff6a" strokeWidth="2" opacity="0.8" filter="url(#hex-glow-green)" />
                                    <circle cx={x} cy={y} r={HEX_R + 12} fill="none" stroke="#00ff6a" strokeWidth="0.5" strokeDasharray="2 12" />
                                </g>
                            )}

                            {/* Main hex */}
                            <polygon
                                points={pts(x, y, HEX_R - 1)}
                                fill={hexFill(t)}
                                stroke={hexStroke(t)}
                                strokeWidth={strokeW(t)}
                            />

                            {/* Inner subtle gradient for depth */}
                            {!t.locked && (
                                <polygon
                                    points={pts(x, y, HEX_R - 6)}
                                    fill="none"
                                    stroke={ZONE_FILLS[t.zone]?.glow || '#1a1c2a'}
                                    strokeWidth="0.5"
                                    opacity="0.3"
                                />
                            )}

                            {/* Relic Glow */}
                            {t.hasRelic && (
                                <text
                                    x={x} y={y + 8}
                                    textAnchor="middle"
                                    fill="#facc15"
                                    fontFamily="var(--font-display)"
                                    fontSize="32"
                                    opacity="0.25"
                                    className="animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                                >
                                    ✦
                                </text>
                            )}

                            {/* Hex ID — primary label */}
                            <text
                                x={x} y={y - 2}
                                textAnchor="middle"
                                fill={t.locked ? '#1a1c2a' : '#5a5c72'}
                                fontSize="11"
                                fontFamily="var(--font-display)"
                                fontWeight="700"
                                letterSpacing="1"
                            >
                                {t.locked ? '▣' : t.hexId}
                            </text>

                            {/* Zone tag */}
                            {!t.locked && (
                                <text
                                    x={x} y={y + 12}
                                    textAnchor="middle"
                                    fill="#2e3048"
                                    fontSize="7"
                                    fontFamily="var(--font-display)"
                                    fontWeight="600"
                                    letterSpacing="1.5"
                                >
                                    {ZONE_TAG[t.zone]}
                                </text>
                            )}

                            {/* Structure glyph */}
                            {t.structure > 0 && (
                                <text
                                    x={x} y={y - 14}
                                    textAnchor="middle"
                                    fill={['', '#38bdf8', '#fbbf24', '#a78bfa'][t.structure]}
                                    fontSize="8"
                                    fontFamily="var(--font-data)"
                                    fontWeight="700"
                                    className="animate-pulse"
                                >
                                    {STRUCT[t.structure]}
                                </text>
                            )}

                            {/* Ownership pip */}
                            {isOwn && (
                                <circle
                                    cx={x + HEX_R - 10} cy={y - HEX_R + 10} r="3"
                                    fill="#00ff6a"
                                    opacity="0.9"
                                    className="animate-pulse"
                                />
                            )}

                            {/* Stability micro-bar */}
                            {!t.locked && (
                                <>
                                    <rect x={x - 12} y={y + 17} width="24" height="2" rx="1" fill="#0f1018" />
                                    <rect
                                        x={x - 12} y={y + 17}
                                        width={24 * (t.stability / 100)} height="2" rx="1"
                                        fill={t.stability > 60 ? '#00ff6a' : t.stability > 25 ? '#fbbf24' : '#ff4a1c'}
                                        opacity="0.7"
                                    />
                                </>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* ── Tooltip ── */}
            {hovered && (
                <div className="tooltip-rift animate-fade-in" style={{ left: tipPos.x, top: tipPos.y }}>
                    <div className="tooltip-label">HEX-{hovered.hexId}</div>
                    <div className="space-y-1" style={{ color: '#7a7c9a' }}>
                        <div className="flex justify-between gap-6">
                            <span>Zone</span>
                            <span style={{ color: '#d4d4e8' }}>{ZONE_TYPES[hovered.zone]}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span>Stability</span>
                            <span style={{ color: hovered.stability > 50 ? '#00ff6a' : '#ff4a1c' }}>{hovered.stability}%</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span>Wealth</span>
                            <span style={{ color: '#fbbf24' }}>{hovered.wealth}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span>Controller</span>
                            {hovered.controller && hovered.controller !== '0x0000000000000000000000000000000000000000' ? (
                                <span style={{ color: FACTION_HEX[hovered.controllerFaction] }}>
                                    {hovered.controller.slice(0, 6)}…
                                </span>
                            ) : (
                                <span style={{ color: '#2a2c3a' }}>—</span>
                            )}
                        </div>
                        {hovered.instability && (
                            <div className="animate-pulse font-bold" style={{ color: '#ff4a1c', marginTop: 4 }}>▲ INSTABILITY ACTIVE</div>
                        )}
                        {hovered.locked && (
                            <div style={{ color: '#4a4c62', marginTop: 4 }}>▣ LOCKED</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
