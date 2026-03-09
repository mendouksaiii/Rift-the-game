import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './GameContext';
import Layout from './Layout';
import GamePage from './pages/GamePage';
import FactionsPage from './pages/FactionsPage';
import DashboardPage from './pages/DashboardPage';
import HowToPlay from './components/HowToPlay';
import { useState, useEffect } from 'react';
import './index.css';

import { SoundProvider } from './SoundContext';

function AppInner() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('rift-tutorial-seen')) {
      setShowIntro(true);
    }
  }, []);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<GamePage />} />
          <Route path="/factions" element={<FactionsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
      {showIntro && (
        <HowToPlay onClose={() => { setShowIntro(false); localStorage.setItem('rift-tutorial-seen', '1'); }} />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SoundProvider>
        <GameProvider>
          <AppInner />
        </GameProvider>
      </SoundProvider>
    </BrowserRouter>
  );
}
