import { useState } from 'react';
import { ZONE_TYPES } from '../contracts';
import { useSound } from '../SoundContext';

const FACTION_HEX = { 0: '#38bdf8', 1: '#fbbf24', 2: '#a78bfa' };

export default function ActionModal({ territory, player, account, raidWindowActive, onClose, onAction, loading }) {
    const [acting, setActing] = useState(null);
    const { playHover, playClick, playClaim, playError, playRaid } = useSound();
    const t = territory;
    if (!t) return null;

    const isOwner = t.controller?.toLowerCase() === account?.toLowerCase();
    const unclaimed = !t.controller || t.controller === '0x0000000000000000000000000000000000000000';
    const locked = t.locked;
    const unstable = t.instability;

    const canClaim = !locked && (unclaimed || unstable) && !isOwner;
    const canFortify = isOwner;
    const canRaid = !unclaimed && !isOwner && (unstable || (raidWindowActive && player?.faction === 1));
    const canBuild = isOwner && t.structure === 0;
    const canClaimRelic = isOwner && t.hasRelic;

    const actions = [
        { id: 'claim', name: 'CLAIM', icon: '■', cost: raidWindowActive ? '25 FLX' : '50 FLX', desc: 'Seize control', ok: canClaim, color: '#00ff6a' },
        { id: 'fortify', name: 'FORTIFY', icon: '◫', cost: '30 FLX', desc: '+20 stability', ok: canFortify, color: '#38bdf8' },
        { id: 'raid', name: 'RAID', icon: '▲', cost: '10 SHD', desc: 'Attack territory', ok: canRaid, color: '#ff4a1c' },
        { id: 'build-shield', name: 'SHIELD', icon: '■', cost: '80 FLX', desc: '+20 perm stability', ok: canBuild, color: '#38bdf8' },
        { id: 'build-mine', name: 'MINE', icon: '▲', cost: '80 FLX', desc: '+10 wealth', ok: canBuild, color: '#fbbf24' },
        { id: 'build-beacon', name: 'BEACON', icon: '●', cost: '80 FLX', desc: 'Early warning', ok: canBuild, color: '#a78bfa' },
        { id: 'build-watchtower', name: 'WATCHTOWER', icon: '◬', cost: '120 FLX', desc: '+30 perm stability', ok: canBuild, color: '#38bdf8' },
        { id: 'build-siphon', name: 'SIPHON', icon: '▼', cost: '100 FLX', desc: '+20 wealth, -10 stab', ok: canBuild, color: '#ff4a1c' },
        { id: 'claim-relic', name: 'CLAIM RELIC', icon: '✦', cost: '50 FLX + 10 SHD', desc: '+10% Yield Boost', ok: canClaimRelic, color: '#facc15' },
    ].filter(a => a.ok);

    async function exec(a) {
        setActing(a.id);
        playClick();
        try {
            await onAction(a.id, t.hexId);
            if (a.id === 'claim' || a.id === 'claim-relic') playClaim();
            else if (a.id === 'raid') playRaid();
            else playClick();
        } catch (e) {
            console.error(e);
            playError();
        }
        setActing(null);
    }

    return (
        <div className="modal-rift-backdrop" onClick={() => { playClick(); onClose(); }}>
            <div className="modal-rift-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-3">
                    <div>
                        <div className="text-base font-bold tracking-wider" style={{ fontFamily: 'var(--font-display)', color: '#00ff6a' }}>
                            HEX-{t.hexId}
                        </div>
                        <div className="text-xs tracking-widest mt-0.5" style={{ fontFamily: 'var(--font-display)', color: '#4a4c62' }}>
                            {ZONE_TYPES[t.zone]} ZONE
                        </div>
                    </div>
                    <button onClick={() => { playClick(); onClose(); }} onMouseEnter={playHover} className="text-lg px-2 transition-colors hover:text-white" style={{ color: '#2a2c3a' }}>✕</button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-px mx-4 mb-4" style={{ background: '#1a1c2a', borderRadius: '2px', overflow: 'hidden' }}>
                    <div className="p-2.5 text-center" style={{ background: '#0a0b10' }}>
                        <div className="text-xs" style={{ color: '#2a2c3a', fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '1.5px' }}>STB</div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: t.stability > 50 ? '#00ff6a' : '#ff4a1c', fontFamily: 'var(--font-display)' }}>
                            {t.stability}%
                        </div>
                    </div>
                    <div className="p-2.5 text-center" style={{ background: '#0a0b10' }}>
                        <div className="text-xs" style={{ color: '#2a2c3a', fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '1.5px' }}>WLT</div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: '#fbbf24', fontFamily: 'var(--font-display)' }}>
                            {t.wealth}
                        </div>
                    </div>
                    <div className="p-2.5 text-center" style={{ background: '#0a0b10' }}>
                        <div className="text-xs" style={{ color: '#2a2c3a', fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '1.5px' }}>CTL</div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: unclaimed ? '#2a2c3a' : FACTION_HEX[t.controllerFaction] || '#5a5c72', fontFamily: 'var(--font-data)' }}>
                            {unclaimed ? '—' : t.controller.slice(0, 5)}
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 mx-4 mb-4 flex-wrap">
                    {locked && <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: '#1a1c2a', color: '#4a4c62' }}>▣ LOCKED</span>}
                    {unstable && <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: '#ff4a1c10', color: '#ff4a1c' }}>▲ INSTABILITY</span>}
                    {isOwner && <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: '#00ff6a10', color: '#00ff6a' }}>◆ YOURS</span>}
                    {raidWindowActive && t.zone === 0 && <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: '#fbbf2410', color: '#fbbf24' }}>⚡ RAID WINDOW</span>}
                    {t.hasRelic && <span className="text-xs px-2 py-0.5 rounded-sm border" style={{ borderColor: '#facc1540', background: '#facc1510', color: '#facc15' }}>✦ RELIC DETECTED</span>}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 space-y-1.5">
                    {actions.length === 0 ? (
                        <div className="text-center py-4 text-xs tracking-widest" style={{ color: '#2a2c3a', fontFamily: 'var(--font-display)' }}>
                            {locked ? 'SECTOR LOCKED' : 'NO ACTIONS AVAILABLE'}
                        </div>
                    ) : (
                        actions.map((a) => (
                            <button
                                key={a.id}
                                onClick={() => exec(a)}
                                onMouseEnter={playHover}
                                disabled={loading || acting === a.id}
                                className="w-full flex items-center gap-3 p-3 rounded-sm text-left transition-all hover:brightness-130"
                                style={{ background: a.color + '06', border: `1px solid ${a.color}18` }}
                            >
                                <span className="text-sm" style={{ color: a.color, fontFamily: 'var(--font-display)', fontWeight: 400, filter: 'drop-shadow(0 0 4px currentColor)' }}>
                                    {a.icon}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold tracking-wider" style={{ color: a.color, fontFamily: 'var(--font-display)' }}>
                                            {acting === a.id ? 'EXECUTING…' : a.name}
                                        </span>
                                        <span className="text-xs" style={{ color: '#4a4c62' }}>{a.cost}</span>
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: '#3a3c52' }}>{a.desc}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
