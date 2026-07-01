/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import MainMenu from './components/MainMenu';
import GameArea from './components/GameArea';
import MapSelector from './components/MapSelector';
import { useGameStore } from './store/gameStore';

export default function App() {
  const view = useGameStore(state => state.view);

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white overflow-hidden selection:bg-emerald-500/30">
      {view === 'MENU' && <MainMenu />}
      {view === 'MAP_SELECT' && <MapSelector />}
      {view === 'PLAYING' && <GameArea />}
    </div>
  );
}
