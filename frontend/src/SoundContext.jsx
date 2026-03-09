import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';

const SoundContext = createContext(null);
export const useSound = () => useContext(SoundContext);

export function SoundProvider({ children }) {
    const [enabled, setEnabled] = useState(false);
    const actx = useRef(null);

    // Initialize AudioContext on first user interaction
    const init = useCallback(() => {
        if (!enabled) setEnabled(true);
        if (!actx.current) {
            actx.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (actx.current.state === 'suspended') {
            actx.current.resume();
        }
    }, [enabled]);

    // Utility to play raw synthesized sound
    const playTone = useCallback((freq, type, duration, vol = 0.1) => {
        if (!actx.current) return;
        const o = actx.current.createOscillator();
        const g = actx.current.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, actx.current.currentTime);

        g.gain.setValueAtTime(vol, actx.current.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, actx.current.currentTime + duration);

        o.connect(g);
        g.connect(actx.current.destination);
        o.start();
        o.stop(actx.current.currentTime + duration);
    }, []);

    // Specific game sound effects
    const sfx = {
        hover: useCallback(() => {
            if (!enabled || !actx.current) return;
            playTone(800, 'sine', 0.05, 0.02);
            setTimeout(() => playTone(1200, 'sine', 0.05, 0.01), 20);
        }, [enabled, playTone]),

        click: useCallback(() => {
            if (!enabled || !actx.current) return;
            playTone(400, 'square', 0.03, 0.05);
            setTimeout(() => playTone(200, 'square', 0.05, 0.03), 10);
        }, [enabled, playTone]),

        claim: useCallback(() => {
            if (!enabled || !actx.current) return;
            const now = actx.current.currentTime;
            [440, 554, 659, 880].forEach((f, i) => {
                setTimeout(() => playTone(f, 'triangle', 0.2, 0.05), i * 100);
            });
        }, [enabled, playTone]),

        error: useCallback(() => {
            if (!enabled || !actx.current) return;
            playTone(150, 'sawtooth', 0.1, 0.05);
            setTimeout(() => playTone(140, 'sawtooth', 0.2, 0.05), 50);
        }, [enabled, playTone]),

        raid: useCallback(() => {
            if (!enabled || !actx.current) return;
            playTone(100, 'sawtooth', 0.3, 0.08);
            setTimeout(() => playTone(80, 'sawtooth', 0.4, 0.08), 100);
            setTimeout(() => playTone(60, 'sawtooth', 0.5, 0.08), 200);
        }, [enabled, playTone])
    };

    // Attach global click listener to initialize audio context
    useEffect(() => {
        const handleInteraction = () => init();
        window.addEventListener('click', handleInteraction, { once: true });
        return () => window.removeEventListener('click', handleInteraction);
    }, [init]);

    return (
        <SoundContext.Provider value={{
            enabled,
            toggleSound: () => setEnabled(e => !e),
            playHover: sfx.hover,
            playClick: sfx.click,
            playClaim: sfx.claim,
            playError: sfx.error,
            playRaid: sfx.raid
        }}>
            {children}
        </SoundContext.Provider>
    );
}
