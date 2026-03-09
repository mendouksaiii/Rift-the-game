import { useState, useEffect, useCallback } from 'react';

const SLIDES = [
    {
        title: 'WELCOME TO THE RIFT',
        subtitle: 'A world that breathes with the blockchain',
        body: 'Rift is not a game that sits on top of the blockchain.\nIt is a game that lives inside it.\n\nReal on-chain events — price crashes, whale moves, governance votes — reshape the game world in the same block they fire.',
        icon: '◈',
        color: '#00ff6a',
        bg: 'radial-gradient(ellipse at 30% 70%, rgba(0,255,106,0.06) 0%, transparent 70%)',
    },
    {
        title: 'THE LIVING MAP',
        subtitle: '49 territories. 4 zone types. Constant flux.',
        body: 'The world is a 7×7 hex grid. Each territory has:\n\n◆ Stability — How fortified it is. Low stability = vulnerable\n◆ Wealth — Resource output. High wealth = high value target\n◆ Controller — The player who holds it\n\nZones: Market (trade hubs), Border (contested), Oracle (locked mysteries), Fault (tectonic chaos)',
        icon: '⬡',
        color: '#38bdf8',
        bg: 'radial-gradient(ellipse at 70% 30%, rgba(56,189,248,0.06) 0%, transparent 70%)',
    },
    {
        title: 'CHOOSE YOUR FACTION',
        subtitle: 'Your allegiance shapes your destiny',
        body: '◇ ARCHITECT — Builders and defenders\n   Bonus: Stability events buff you\n   Weakness: Collapse events hurt more\n\n◆ SCAVENGER — Raiders and opportunists\n   Bonus: Thrive in chaos and liquidations\n   Weakness: Prosperity stabilizes against you\n\n◎ ORACLE — Seers and speculators\n   Bonus: Governance events unlock secrets for you\n   Weakness: Seismic events shake your foundations',
        icon: '△',
        color: '#a78bfa',
        bg: 'radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.06) 0%, transparent 70%)',
    },
    {
        title: 'CLAIM & BUILD',
        subtitle: 'Expand your domain. Fortify your holdings.',
        body: 'Actions cost resources:\n\n◆ CLAIM — 50 Flux (25 during raid windows)\n   Seize unclaimed or unstable territory\n\n◆ FORTIFY — 30 Flux\n   Add +20 stability to your territory\n\n◆ BUILD — 80 Flux\n   Shield (defense), Mine (wealth), or Beacon (intel)\n\n◆ RAID — 10 Shards\n   Attack unstable enemy territory',
        icon: '▲',
        color: '#fbbf24',
        bg: 'radial-gradient(ellipse at 30% 30%, rgba(251,191,36,0.06) 0%, transparent 70%)',
    },
    {
        title: 'THE CHAIN STRIKES',
        subtitle: 'Real blockchain events reshape your world',
        body: '5 reactive events fire from real on-chain activity:\n\n⚡ SHOCKWAVE — Price dump destabilizes markets\n◣ COLLAPSE — Liquidation makes borders seizeable\n◈ SEISMIC — Whale move reshuffles fault lines\n▽ NEW AGE — DAO vote unlocks Oracle zones\n✦ PROSPERITY — Yield claim boosts wealth\n\nNo servers. No bots. The blockchain is the game master.',
        icon: '⚡',
        color: '#ff4a1c',
        bg: 'radial-gradient(ellipse at 70% 70%, rgba(255,74,28,0.06) 0%, transparent 70%)',
    },
    {
        title: 'REACT OR PERISH',
        subtitle: 'Narrow windows. Split-second decisions.',
        body: 'When events fire, you have seconds to act:\n\n▲ Raid Window (10 blocks) — Claims cost half, raids enabled\n▲ Instability (15 blocks) — Border zones free for seizure\n▲ Oracle Race (5 blocks) — First to claim wins\n\nThe player who controls the most high-value territory wins.\nBut the map never stops changing.',
        icon: '◆',
        color: '#00ff6a',
        bg: 'radial-gradient(ellipse at 50% 30%, rgba(0,255,106,0.08) 0%, transparent 70%)',
    },
];

export default function HowToPlay({ onClose }) {
    const [slide, setSlide] = useState(0);
    const s = SLIDES[slide];

    const next = useCallback(() => {
        if (slide < SLIDES.length - 1) setSlide(slide + 1);
        else { localStorage.setItem('rift-tutorial-seen', '1'); onClose(); }
    }, [slide, onClose]);

    const prev = useCallback(() => {
        if (slide > 0) setSlide(slide - 1);
    }, [slide]);

    // Keyboard
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') next();
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [next, prev, onClose]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(2,2,4,0.92)', backdropFilter: 'blur(12px)' }}>
            {/* Card */}
            <div
                className="w-full max-w-xl mx-4 relative"
                style={{
                    background: `linear-gradient(168deg, #0f1018 0%, #050508 100%)`,
                    border: '1px solid #1a1c2a',
                    borderTop: `2px solid ${s.color}`,
                    borderRadius: '6px',
                    boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 1px ${s.color}`,
                }}
            >
                {/* Background gradient */}
                <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none" style={{ background: s.bg }} />

                {/* Content */}
                <div className="relative p-8 pt-7">
                    {/* Skip */}
                    <button onClick={onClose} className="absolute top-4 right-4 text-xs transition-colors hover:text-white" style={{ color: '#2a2c3a', fontFamily: 'var(--font-display)', letterSpacing: '1px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        SKIP
                    </button>

                    {/* Icon */}
                    <div className="text-4xl mb-4 opacity-60" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>
                        {s.icon}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)', color: s.color }}>
                        {s.title}
                    </h2>
                    <p className="text-xs tracking-widest mb-6" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62', letterSpacing: '3px' }}>
                        {s.subtitle}
                    </p>

                    {/* Body */}
                    <div className="text-sm leading-relaxed whitespace-pre-line mb-8" style={{ color: '#7a7c9a', fontFamily: 'var(--font-data)', lineHeight: '1.7' }}>
                        {s.body}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        {/* Dots */}
                        <div className="flex gap-2">
                            {SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSlide(i)}
                                    className="transition-all"
                                    style={{
                                        width: i === slide ? 20 : 6, height: 6,
                                        borderRadius: 3,
                                        background: i === slide ? s.color : '#1a1c2a',
                                        border: 'none', cursor: 'pointer', padding: 0,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Nav buttons */}
                        <div className="flex gap-2">
                            {slide > 0 && (
                                <button onClick={prev} className="btn-rift" style={{ padding: '6px 14px' }}>
                                    ← PREV
                                </button>
                            )}
                            <button onClick={next} className="btn-rift btn-rift-primary" style={{ padding: '6px 18px' }}>
                                {slide === SLIDES.length - 1 ? 'ENTER THE RIFT →' : 'NEXT →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
