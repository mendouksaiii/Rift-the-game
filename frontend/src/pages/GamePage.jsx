import { useState, useCallback } from 'react';
import { useGame } from '../GameContext';
import HexGrid from '../components/HexGrid';
import EventFeed from '../components/EventFeed';
import PlayerPanel from '../components/PlayerPanel';
import ActionModal from '../components/ActionModal';

export default function GamePage() {
    const { territories, events, player, account, raidWindow, loading, register, doAction, trade } = useGame();
    const [selectedHex, setSelectedHex] = useState(null);
    const [modal, setModal] = useState(null);
    const [feedOpen, setFeedOpen] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
    const [mobileView, setMobileView] = useState('map'); // 'map', 'feed', 'player'

    const handleHexClick = useCallback((t) => {
        setSelectedHex(t.hexId);
        setModal(t);
    }, []);

    const handleAction = useCallback(async (aid, hid) => {
        await doAction(aid, hid);
        setModal(null);
    }, [doAction]);

    return (
        <div className="h-full flex relative">
            {/* ═══ FULL-SCREEN MAP ═══ */}
            <div className="flex-1 min-w-0 relative">
                <HexGrid
                    territories={territories}
                    raidWindowActive={raidWindow}
                    onHexClick={handleHexClick}
                    selectedHex={selectedHex}
                    account={account}
                />

                {/* Map HUD — top left */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-sm text-xs flex items-center gap-2" style={{ background: 'rgba(5,5,8,0.85)', border: '1px solid #1a1c2a', backdropFilter: 'blur(8px)' }}>
                        <span className="status-dot" style={{ width: 5, height: 5 }} />
                        <span style={{ fontFamily: 'var(--font-display)', color: '#00ff6a', letterSpacing: '2px', fontSize: '10px' }}>SECTOR MAP</span>
                        <span style={{ color: '#2a2c3a', marginLeft: 4 }}>49</span>
                    </div>
                    {raidWindow && (
                        <div className="px-2 py-1.5 rounded-sm text-xs" style={{ background: 'rgba(255,74,28,0.08)', border: '1px solid rgba(255,74,28,0.15)', backdropFilter: 'blur(8px)', fontFamily: 'var(--font-display)', color: '#ff4a1c', letterSpacing: '1.5px', fontSize: '9px' }}>
                            ▲ RAID WINDOW
                        </div>
                    )}
                </div>

                {/* Legend — bottom left */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 px-3 py-1.5 rounded-sm" style={{ background: 'rgba(5,5,8,0.85)', border: '1px solid #1a1c2a', backdropFilter: 'blur(8px)' }}>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#2a2c3a' }}><span className="w-2 h-2 rounded-sm" style={{ background: '#0c1a2e' }} /> MKT</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#2a2c3a' }}><span className="w-2 h-2 rounded-sm" style={{ background: '#1a0c0c' }} /> BDR</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#2a2c3a' }}><span className="w-2 h-2 rounded-sm" style={{ background: '#140c24' }} /> ORC</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#2a2c3a' }}><span className="w-2 h-2 rounded-sm" style={{ background: '#0c1a10' }} /> FLT</span>
                    <span style={{ color: '#0f1018' }}>│</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#38bdf8' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }} /> ARC</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#fbbf24' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fbbf24' }} /> SCV</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#a78bfa' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa' }} /> ORC</span>
                </div>
            </div>

            {/* ═══ TOGGLE BUTTONS — desktop only right edge ═══ */}
            <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 flex-col gap-1" style={{ right: feedOpen ? 600 : 0, transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
                <button
                    onClick={() => setFeedOpen(!feedOpen)}
                    className="px-1 py-4 rounded-l-sm transition-colors"
                    title={feedOpen ? 'Hide Feed' : 'Show Feed'}
                    style={{ background: 'rgba(10,11,16,0.9)', border: '1px solid #1a1c2a', borderRight: 'none', color: '#00ff6a', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-display)', letterSpacing: '2px', writingMode: 'vertical-lr' }}
                >
                    {feedOpen ? 'FEED ◂' : '▸ FEED'}
                </button>
                <button
                    onClick={() => setPanelOpen(!panelOpen)}
                    className="px-1 py-4 rounded-l-sm transition-colors"
                    title={panelOpen ? 'Hide Panel' : 'Show Panel'}
                    style={{ background: 'rgba(10,11,16,0.9)', border: '1px solid #1a1c2a', borderRight: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-display)', letterSpacing: '2px', writingMode: 'vertical-lr' }}
                >
                    {panelOpen ? 'PLAYER ◂' : '▸ PLAYER'}
                </button>
            </div>

            {/* ═══ EVENT FEED — desktop or mobile drawer ═══ */}
            <div
                className={`${mobileView === 'feed' ? 'mobile-drawer-rift' : 'hidden md:block'} shrink-0 h-full transition-all overflow-hidden`}
                style={{ width: mobileView === 'feed' ? '100%' : (feedOpen ? 600 : 0), transitionDuration: '0.3s', transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
            >
                <div className="w-full md:w-[600px] h-full">
                    <EventFeed events={events} />
                </div>
            </div>

            {/* ═══ PLAYER PANEL ═══ */}
            {(panelOpen || mobileView === 'player') && (
                <div className={`${mobileView === 'player' ? 'mobile-drawer-rift' : 'absolute top-0 right-0 z-30 h-full w-[500px]'} overflow-y-auto`} style={{ background: 'rgba(5,5,8,0.95)', borderLeft: '1px solid #1a1c2a', backdropFilter: 'blur(12px)' }}>
                    <PlayerPanel player={player} account={account} territories={territories} onRegister={register} onTrade={trade} />
                </div>
            )}

            {/* ═══ MOBILE BOTTOM NAV ═══ */}
            <div className="md:hidden mobile-nav-rift">
                <button className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>
                    <span>⬡</span>
                    <span>MAP</span>
                </button>
                <button className={mobileView === 'feed' ? 'active' : ''} onClick={() => setMobileView('feed')}>
                    <span>▤</span>
                    <span>FEED</span>
                </button>
                <button className={mobileView === 'player' ? 'active' : ''} onClick={() => setMobileView('player')}>
                    <span>◆</span>
                    <span>INTEL</span>
                </button>
            </div>

            {/* ═══ ACTION MODAL ═══ */}
            {modal && (
                <ActionModal
                    territory={modal} player={player} account={account} raidWindowActive={raidWindow}
                    onClose={() => { setModal(null); setSelectedHex(null); }}
                    onAction={handleAction} loading={loading}
                />
            )}
        </div>
    );
}
