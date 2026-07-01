import { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { GameScene } from './GameScene';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Heart, ShieldAlert } from 'lucide-react';
import { safeRequestPointerLock, MAP_SIZE } from './game/utils';
import Chat from './game/Chat';
import { motion, AnimatePresence } from 'motion/react';

// Highly optimized Tactical Radar sub-component that shows real players on the grid
interface TacticalRadarProps {
  showRadar: boolean;
  isHunter: boolean;
}

function TacticalRadar({ showRadar, isHunter }: TacticalRadarProps) {
  const playerPosition = useGameStore(state => state.playerPosition);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const ghostPosition = useGameStore(state => state.ghostPosition);
  const isLocked = useGameStore(state => state.isLocked);

  return (
    <AnimatePresence>
      {!isHunter && showRadar && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 p-2 rounded-xl shadow-2xl flex flex-col items-center"
        >
          <div className="relative w-40 h-40 border border-cyan-500/10 rounded-lg overflow-hidden bg-zinc-950/90">
            {/* Grid line background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e90a_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e90a_1px,transparent_1px)] bg-[size:10px_10px]" />
            
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-75">
              {/* Outer boundary lines */}
              <rect x="5" y="5" width="90" height="90" fill="none" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2,2" />
              
              {/* Central Stucco Partition Walls */}
              <line x1="33" y1="20" x2="33" y2="80" stroke="#0ea5e9" strokeWidth="0.75" />
              <line x1="67" y1="20" x2="67" y2="80" stroke="#0ea5e9" strokeWidth="0.75" />
              
              {/* Boxwood hedge boundaries */}
              <line x1="5" y1="65" x2="33" y2="65" stroke="#10b981" strokeWidth="0.75" strokeDasharray="1,1" />
              <line x1="67" y1="35" x2="95" y2="35" stroke="#10b981" strokeWidth="0.75" strokeDasharray="1,1" />
              
              {/* Elevated stone terraces */}
              <rect x="67" y="65" width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1,2" />
              <rect x="13" y="15" width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1,2" />
              
              {/* Centerpiece indicator */}
              <circle cx="50" cy="50" r="6" fill="none" stroke="#f59e0b" strokeWidth="0.75" />
              <circle cx="50" cy="50" r="1.5" fill="#f59e0b" />

              {/* Other players dot representation on radar */}
              {Object.values(otherPlayers).map((p) => {
                if (p.isDead) return null;
                const halfSize = MAP_SIZE / 2;
                const mapX = 50 + (p.position[0] / halfSize) * 40;
                const mapZ = 50 + (p.position[2] / halfSize) * 40;
                return (
                  <g key={p.id}>
                    <circle 
                      cx={mapX} 
                      cy={mapZ} 
                      r={p.isHunter ? "2.5" : "2.0"} 
                      fill={p.isHunter ? "#ef4444" : "#a855f7"} 
                      className={p.isHunter ? "animate-pulse" : ""}
                    />
                  </g>
                );
              })}

              {/* Gray dot (ghost spectator) */}
              {isLocked && ghostPosition && (() => {
                const halfSize = MAP_SIZE / 2;
                const ghostX = 50 + (ghostPosition[0] / halfSize) * 40;
                const ghostZ = 50 + (ghostPosition[2] / halfSize) * 40;
                return (
                  <g>
                    <circle 
                      cx={ghostX} 
                      cy={ghostZ} 
                      r="2.5" 
                      fill="#cbd5e1" 
                      stroke="#475569"
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })()}

              {/* Local player position tracker blip (green for Prop) */}
              {(() => {
                const halfSize = MAP_SIZE / 2;
                const playerX = 50 + (playerPosition[0] / halfSize) * 40;
                const playerZ = 50 + (playerPosition[2] / halfSize) * 40;
                return (
                  <g>
                    <circle 
                      cx={playerX} 
                      cy={playerZ} 
                      r="2.8" 
                      fill="#4ade80" 
                      stroke="#ffffff"
                      strokeWidth="0.75"
                    />
                  </g>
                );
              })()}
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function GameArea() {
  const setView = useGameStore(state => state.setView);
  const isHunter = useGameStore(state => state.isHunter);
  const hp = useGameStore(state => state.hp);
  const setHp = useGameStore(state => state.setHp);
  const gamePhase = useGameStore(state => state.gamePhase);
  const setGamePhase = useGameStore(state => state.setGamePhase);
  const gameOverMessage = useGameStore(state => state.gameOverMessage);
  const setGameOver = useGameStore(state => state.setGameOver);
  const hitMarker = useGameStore(state => state.hitMarker);
  const isChatFocused = useGameStore(state => state.isChatFocused);
  const clearChat = useGameStore(state => state.clearChat);

  // Dynamic multiplayer counters
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const alivePropsCount = useGameStore(state => {
    const localCount = (!state.isHunter && state.hp > 0) ? 1 : 0;
    const othersCount = Object.values(state.otherPlayers).filter(p => !p.isHunter && !p.isDead).length;
    return localCount + othersCount;
  });

  const activeHuntersCount = useGameStore(state => {
    const localCount = (state.isHunter && state.hp > 0) ? 1 : 0;
    const othersCount = Object.values(state.otherPlayers).filter(p => p.isHunter && !p.isDead).length;
    return localCount + othersCount;
  });

  const [timeLeft, setTimeLeft] = useState(30);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [showHitmarker, setShowHitmarker] = useState(false);
  const [showRadar, setShowRadar] = useState(true);

  // Initialize Game (Offline / Sandbox mode, ready for future Supabase sync)
  useEffect(() => {
    clearChat();
    setHp(100);
    setGamePhase('HIDING');
    setTimeLeft(30);

    useGameStore.getState().setOtherPlayers({});

    // Initial info chat alerts
    useGameStore.getState().addChatMessage(
      'Sandbox session initiated. Explore the map and test prop locking/hiding controls!',
      'System',
      'SYSTEM',
      false,
      'global'
    );
    useGameStore.getState().addChatMessage(
      'Prop Controls: [W/A/S/D] to move, [Space] to jump, [Left-Click] to Lock/Freeze prop, [R] to randomize prop, [T] to Taunt hunters.',
      'System',
      'SYSTEM',
      false,
      'global'
    );
    
    return () => {
      useGameStore.getState().setOtherPlayers({});
    };
  }, []);

  // Sync state transitions to keep Timer ticking
  useEffect(() => {
    if (gamePhase === 'GAME_OVER') return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (timeLeft === 0) {
      if (gamePhase === 'HIDING') {
        setGamePhase('HUNTING');
        setTimeLeft(120); // 2 minutes to hunt
      } else if (gamePhase === 'HUNTING') {
        setGameOver(isHunter ? 'Time Over! Props Win.' : 'Time Over! You Survived!');
      }
    }
  }, [timeLeft, gamePhase, isHunter]);

  // Win/Loss State Syncer
  useEffect(() => {
    if (gamePhase === 'GAME_OVER') return;

    if (hp <= 0 && !isHunter) {
      setGameOver('You were eliminated!');
    }

    if (isHunter && gamePhase === 'HUNTING') {
      // If there are zero props left in the match, hunters win!
      if (alivePropsCount === 0) {
        setGameOver('All Props Eliminated! Hunters Win.');
      }
    }
  }, [hp, alivePropsCount, isHunter, gamePhase]);

  // Hitmarker Trigger
  useEffect(() => {
    if (hitMarker > 0) {
      setShowHitmarker(true);
      const t = setTimeout(() => setShowHitmarker(false), 200);
      return () => clearTimeout(t);
    }
  }, [hitMarker]);

  // Pointer Lock Controller
  useEffect(() => {
    const handleLock = () => setIsPointerLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', handleLock);
    return () => document.removeEventListener('pointerlockchange', handleLock);
  }, []);

  // Automatic radar toggle based on phase
  useEffect(() => {
    if (gamePhase === 'HIDING') {
      setShowRadar(true);
    } else if (gamePhase === 'HUNTING') {
      setShowRadar(false);
    }
  }, [gamePhase]);

  // Radar manual hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChatFocused) return;
      if (e.key === 'r' || e.key === 'R') {
        setShowRadar(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatFocused]);

  const { roomCode } = useGameStore.getState();

  return (
    <div className="relative w-full h-full bg-zinc-950 animate-in fade-in duration-1000">
      
      {/* 1. Top Centered Pill: Team VS Status */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 select-none pointer-events-none">
        <div className="flex items-center bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-full px-5 py-2 shadow-2xl">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>PROPS: {alivePropsCount}</span>
          </div>
          <div className="mx-4 text-[10px] font-mono font-black tracking-widest bg-zinc-800 border border-zinc-700 px-3 py-0.5 rounded-full text-zinc-300">
            VS
          </div>
          <div className="flex items-center space-x-2 text-rose-400 font-bold font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span>HUNTERS: {activeHuntersCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Top Left Action Bars */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-3 pointer-events-none select-none">
        <button 
          onClick={(e) => { e.stopPropagation(); setView('MENU'); }}
          className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 hover:bg-zinc-800 px-4 py-2.5 rounded-xl pointer-events-auto backdrop-blur-md border border-zinc-800 shadow-xl self-start cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Disconnect</span>
        </button>
      </div>

      {/* 3. Top Right Tactical Radar Schematic, Vitality Status & Session Meta */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-4 select-none pointer-events-none">
        
        {/* Row for Timer and Vital Signs beside each other */}
        <div className="flex items-center space-x-2.5 pointer-events-auto">
          {/* Vital Signs indicator */}
          <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 px-3 py-2 rounded-xl flex items-center justify-between shadow-xl select-none w-32 h-12">
            <div className="flex flex-col justify-center items-start text-left">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black leading-none">vitals</span>
              <span className={`text-lg font-mono font-black tracking-tight leading-none mt-1 ${hp <= 30 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                {hp}%
              </span>
            </div>
            <Heart size={16} className={`fill-current shrink-0 ${hp <= 30 ? 'text-rose-500 animate-bounce' : 'text-rose-400'}`} />
          </div>

          {/* State / Match timer */}
          <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 px-3 py-2 rounded-xl shadow-xl flex flex-col justify-center items-end text-right w-32 h-12 select-none">
            <span className="text-[8px] font-mono text-zinc-500 font-black tracking-widest uppercase leading-none">
              {gamePhase === 'HIDING' ? 'hide' : 'remaining time'}
            </span>
            <span className={`text-lg font-mono font-black tracking-tight leading-none mt-1 ${timeLeft <= 10 && gamePhase === 'HUNTING' ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Tactical Map */}
        <TacticalRadar showRadar={showRadar} isHunter={isHunter} />
      </div>

      {/* 6. Hitmarker visual prompt */}
      <AnimatePresence>
        {showHitmarker && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
          >
            <div className="w-10 h-10 border-2 border-rose-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-rose-500 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Game Over Dialog Overlay */}
      <AnimatePresence>
        {gamePhase === 'GAME_OVER' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex flex-col items-center justify-center select-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl font-sans"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Transmission Terminated</h2>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Match Result Summary</p>
              </div>
              
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 text-zinc-300">
                {gameOverMessage}
              </div>

              <button 
                onClick={() => setView('MENU')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-colors cursor-pointer border border-emerald-500/30 font-sans"
              >
                Return to Primary Terminal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Game Canvas Area */}
      <div className="w-full h-full z-0">
        <ErrorBoundary>
          <GameScene />
        </ErrorBoundary>
      </div>

      {/* Embedded Terminal Chat Controller */}
      <Chat />

    </div>
  );
}
