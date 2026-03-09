import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useGame } from './GameContext';
import { FACTION_NAMES } from './contracts';
import HowToPlay from './components/HowToPlay';

const FC = { 0: '#38bdf8', 1: '#fbbf24', 2: '#a78bfa' };

export default function Layout() {
    const { account, player, connect, block, flash } = useGame();
    const [showTutorial, setShowTutorial] = useState(false);

    const linkClass = ({ isActive }) =>
        `nav-link ${isActive ? 'nav-link-active' : ''}`;

    return (
        <div className={`h-screen flex flex-col grain-overlay relative ${flash}`} style={{ zIndex: 1 }}>
            <div className="bg-rift" />

            {/* ═══ NAV ═══ */}
            <header className="shrink-0 flex items-center justify-between px-5 py-2 relative z-10" style={{ borderBottom: '1px solid #1a1c2a', background: 'rgba(5,5,8,0.95)' }}>
                <div className="flex items-center gap-5">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center gap-2 no-underline">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#00ff6a', boxShadow: '0 0 12px #00ff6a, 0 0 4px #00ff6a' }} />
                        <span className="text-lg font-bold tracking-widest" style={{ fontFamily: 'var(--font-display)', color: '#00ff6a', textShadow: '0 0 20px rgba(0,255,106,0.15)' }}>
                            RIFT
                        </span>
                    </NavLink>

                    {/* Nav Links */}
                    <nav className="flex items-center gap-1">
                        <NavLink to="/" end className={linkClass}>Map</NavLink>
                        <NavLink to="/factions" className={linkClass}>Factions</NavLink>
                        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                        <button onClick={() => setShowTutorial(true)} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            How to Play
                        </button>
                    </nav>

                    {block > 0 && (
                        <span className="text-xs" style={{ color: '#2a2c3a', fontFamily: 'var(--font-data)' }}>
                            BLK {block}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {player?.registered && (
                        <div className="flex items-center gap-2">
                            <span className="badge-rift" style={{ borderColor: '#00ff6a20', color: '#00ff6a', background: '#00ff6a06' }}>
                                ⚡ {player.flux?.toString()} FLX
                            </span>
                            <span className="badge-rift" style={{ borderColor: '#a78bfa20', color: '#a78bfa', background: '#a78bfa06' }}>
                                ◈ {player.shards?.toString()} SHD
                            </span>
                            <span className="badge-rift" style={{ borderColor: FC[player.faction] + '20', color: FC[player.faction], background: FC[player.faction] + '06' }}>
                                {FACTION_NAMES[player.faction]}
                            </span>
                        </div>
                    )}
                    {account ? (
                        <span className="text-xs px-2.5 py-1 rounded-sm" style={{ background: '#0a0b10', color: '#4a4c62', border: '1px solid #1a1c2a', fontFamily: 'var(--font-data)' }}>
                            {account.slice(0, 6)}…{account.slice(-4)}
                        </span>
                    ) : (
                        <button onClick={connect} className="btn-rift btn-rift-primary">Connect</button>
                    )}
                </div>
            </header>

            {/* ═══ PAGE CONTENT ═══ */}
            <main className="flex-1 overflow-hidden relative z-10">
                <Outlet />
            </main>

            {/* Tutorial Modal */}
            {showTutorial && <HowToPlay onClose={() => setShowTutorial(false)} />}
        </div>
    );
}
