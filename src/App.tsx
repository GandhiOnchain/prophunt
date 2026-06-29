/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import WalletConnect from './components/WalletConnect';
import MainMenu from './components/MainMenu';
import GameArea from './components/GameArea';
import Marketplace from './components/Marketplace';
import MapSelector from './components/MapSelector';
import { useGameStore } from './store/gameStore';

export default function App() {
  const { view } = useGameStore();

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white overflow-hidden selection:bg-emerald-500/30">
      {view === 'LOGIN' && <WalletConnect />}
      {view === 'MENU' && <MainMenu />}
      {view === 'MAP_SELECT' && <MapSelector />}
      {view === 'PLAYING' && <GameArea />}
      {view === 'MARKETPLACE' && <Marketplace />}
    </div>
  );
}
