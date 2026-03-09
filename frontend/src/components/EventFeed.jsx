import { useEffect, useRef } from 'react';

const EV = {
    0: { icon: '⚡', color: '#fbbf24', label: 'SHOCKWAVE', desc: 'Market zones destabilized' },
    1: { icon: '◣', color: '#ff4a1c', label: 'COLLAPSE', desc: 'Border zones in instability' },
    2: { icon: '◈', color: '#38bdf8', label: 'SEISMIC', desc: 'Fault lines reshuffled' },
    3: { icon: '▽', color: '#a78bfa', label: 'NEW AGE', desc: 'Oracle zone unlocked' },
    4: { icon: '✦', color: '#00ff6a', label: 'PROSPERITY', desc: 'Wealth boosted, shards minted' },
};

function timeAgo(ts) {
    const d = Math.floor(Date.now() / 1000) - Number(ts);
    if (d < 60) return `${d}s`;
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    return `${Math.floor(d / 3600)}h`;
}

export default function EventFeed({ events }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) ref.current.scrollTop = 0;
    }, [events.length]);

    return (
        <div className="panel-rift h-full flex flex-col pt-0">
            <div className="panel-header-rift p-6 text-lg tracking-[3px]">
                <span className="status-dot w-3 h-3" />
                <span>CHAIN TELEMETRY FEED</span>
                <span className="ml-auto text-sm" style={{ color: '#4a4c62', letterSpacing: '2px', fontWeight: 700 }}>
                    {events.length} LOGS
                </span>
            </div>

            <div ref={ref} className="flex-1 overflow-y-auto">
                {events.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full" style={{ color: '#2a2c3a' }}>
                        <div className="text-5xl mb-4 opacity-30">◌</div>
                        <div className="text-sm tracking-widest font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            MONITORING NETWORK SENSORS…
                        </div>
                    </div>
                )}

                {[...events].reverse().map((ev, i) => {
                    const info = EV[ev.eventType] || EV[0];
                    return (
                        <div
                            key={`${ev.blockNumber}-${ev.eventType}-${i}`}
                            className="event-entry p-6 border-b border-[#0a0b10] hover:bg-white/[0.01] transition-colors"
                            style={{ borderLeft: `4px solid ${info.color}30` }}
                        >
                            <div className="flex items-start gap-5">
                                {/* Icon */}
                                <div
                                    className="shrink-0 w-12 h-12 flex items-center justify-center rounded-sm text-2xl"
                                    style={{
                                        background: info.color + '10',
                                        color: info.color,
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 700,
                                    }}
                                >
                                    {info.icon}
                                </div>

                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className="text-base font-bold tracking-widest"
                                            style={{ color: info.color, fontFamily: 'var(--font-display)' }}
                                        >
                                            {info.label}
                                        </span>
                                        <div className="text-right">
                                            <div className="text-sm font-bold tracking-wider mb-1" style={{ color: '#4a4c62', fontFamily: 'var(--font-data)' }}>
                                                #{ev.blockNumber?.toString().slice(-5)}
                                            </div>
                                            <div className="text-sm" style={{ color: '#2a2c3a' }}>
                                                {ev.timestamp ? `${timeAgo(ev.timestamp)} ago` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm" style={{ color: '#5a5c72' }}>
                                        {info.desc}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
