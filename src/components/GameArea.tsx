import { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { GameScene } from './GameScene';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Wifi, ShieldAlert, Heart, Lock, Unlock, RotateCw, Radio } from 'lucide-react';
import { PROP_TYPES } from './game/PropModels';
import { isInsideWall, getGroundHeight, safeRequestPointerLock, MAP_SIZE } from './game/utils';
import Chat from './game/Chat';
import { motion, AnimatePresence } from 'motion/react';

// Highly optimized Tactical Radar sub-component that only re-renders on player/bot position changes
interface TacticalRadarProps {
  showRadar: boolean;
  isHunter: boolean;
}

function TacticalRadar({ showRadar, isHunter }: TacticalRadarProps) {
  const playerPosition = useGameStore(state => state.playerPosition);
  const hunterBots = useGameStore(state => state.hunterBots);
  const ghostPosition = useGameStore(state => state.ghostPosition);
  const isLocked = useGameStore(state => state.isLocked);
  const currentMapId = useGameStore(state => state.currentMapId);

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
              
              {/* Greek Pedestal centerpiece vase anchor */}
              <circle cx="50" cy="50" r="6" fill="none" stroke="#f59e0b" strokeWidth="0.75" />
              <circle cx="50" cy="50" r="1.5" fill="#f59e0b" />

              {/* Patrolling Hunter Bots (moving red dots) */}
              {hunterBots.map((h) => {
                const halfSize = MAP_SIZE / 2;
                const mapX = 50 + (h.position[0] / halfSize) * 40;
                const mapZ = 50 + (h.position[2] / halfSize) * 40;
                return (
                  <g key={h.id}>
                    {/* Core blinking blip point */}
                    <circle 
                      cx={mapX} 
                      cy={mapZ} 
                      r="2.2" 
                      fill="#ef4444" 
                      className="animate-pulse"
                    />
                  </g>
                );
              })}

              {/* Gray dot (ghost spectator) first, so it's under the green dot in SVG draw order */}
              {isLocked && ghostPosition && (() => {
                const halfSize = MAP_SIZE / 2;
                const ghostX = 50 + (ghostPosition[0] / halfSize) * 40;
                const ghostZ = 50 + (ghostPosition[2] / halfSize) * 40;
                return (
                  <g>
                    {/* Core static, vivid gray blip point with dark frame */}
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

              {/* Local player position tracker blip (green for Prop) - second, drawn on top */}
              {(() => {
                const halfSize = MAP_SIZE / 2;
                const playerX = 50 + (playerPosition[0] / halfSize) * 40;
                const playerZ = 50 + (playerPosition[2] / halfSize) * 40;
                return (
                  <g>
                    {/* Core static, vivid green blip point with white outer stroke */}
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

// Highly optimized Disguise Dashboard sub-component that only re-renders on prop transform/rotation changes
function DisguiseDashboard() {
  const playerPropType = useGameStore(state => state.playerPropType);
  const isLocked = useGameStore(state => state.isLocked);
  const propRotationOffset = useGameStore(state => state.propRotationOffset);

  return (
    <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 p-3 rounded-xl shadow-2xl flex flex-col space-y-2.5 min-w-[210px] font-mono text-left">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">DISGUISE INTERFACE</span>
        <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">DISGUISE:</span>
          <span className="text-white font-bold">{playerPropType.toUpperCase()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">STEALTH LOCK:</span>
          <span className={`font-bold flex items-center space-x-1 text-xs ${isLocked ? 'text-emerald-400' : 'text-amber-500'}`}>
            {isLocked ? (
              <>
                <Lock size={10} className="mr-0.5" />
                <span>LOCKED (GHOST)</span>
              </>
            ) : (
              <>
                <Unlock size={10} className="mr-0.5" />
                <span>UNLOCKED</span>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">YAW DELTA:</span>
          <span className="text-zinc-300 font-bold flex items-center">
            <RotateCw size={10} className="mr-1 text-zinc-500" />
            {Math.round((propRotationOffset * 180) / Math.PI) % 360}°
          </span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-zinc-800/40 pt-1.5 mt-0.5">
          <span className="text-zinc-500">TAUNT FEED:</span>
          <span className="text-purple-400 font-bold flex items-center">
            <Radio size={10} className="mr-1 animate-pulse" />
            [F] KEY READY
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GameArea() {
  const setView = useGameStore(state => state.setView);
  const isHunter = useGameStore(state => state.isHunter);
  const score = useGameStore(state => state.score);
  const addScore = useGameStore(state => state.addScore);
  const hp = useGameStore(state => state.hp);
  const setHp = useGameStore(state => state.setHp);
  const gamePhase = useGameStore(state => state.gamePhase);
  const setGamePhase = useGameStore(state => state.setGamePhase);
  const gameOverMessage = useGameStore(state => state.gameOverMessage);
  const setGameOver = useGameStore(state => state.setGameOver);
  const initPropBots = useGameStore(state => state.initPropBots);
  const initHunterBots = useGameStore(state => state.initHunterBots);
  const hitMarker = useGameStore(state => state.hitMarker);
  const isChatFocused = useGameStore(state => state.isChatFocused);
  const clearChat = useGameStore(state => state.clearChat);
  const currentMapId = useGameStore(state => state.currentMapId);

  // Memoized, stable select queries to prevent high frequency re-renders
  const aliveBotsCount = useGameStore(state => state.propBots.filter(b => !b.isDead).length);
  
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [showHitmarker, setShowHitmarker] = useState(false);
  const [showRadar, setShowRadar] = useState(true);

  // Initialize Game
  useEffect(() => {
    clearChat();
    setHp(100);
    setGamePhase('HIDING');
    setTimeLeft(30);
    
    // Spawn Prop Bots
    const newBots = Array.from({ length: 5 }).map((_, i) => {
      let x = 0;
      let z = 0;
      let tries = 0;
      do {
        x = (Math.random() - 0.5) * (MAP_SIZE - 20);
        z = (Math.random() - 0.5) * (MAP_SIZE - 20);
        tries++;
      } while (isInsideWall(x, z, currentMapId) && tries < 15);

      const y = getGroundHeight(x, z, currentMapId);

      return {
        id: `bot-${i}`,
        type: PROP_TYPES[Math.floor(Math.random() * PROP_TYPES.length)],
        position: [x, y, z] as [number, number, number],
        isDead: false
      };
    });
    initPropBots(newBots);

    // Spawn Hunter Bots (patrolling drones)
    const newHunters = Array.from({ length: 4 }).map((_, i) => {
      const x = (Math.random() - 0.5) * (MAP_SIZE - 10);
      const z = (Math.random() - 0.5) * (MAP_SIZE - 10);
      return {
        id: `hunter-bot-${i}`,
        position: [x, 2.5, z] as [number, number, number],
        target: [(Math.random() - 0.5) * (MAP_SIZE - 10), 2.5, (Math.random() - 0.5) * (MAP_SIZE - 10)] as [number, number, number],
        speed: 2 + Math.random() * 2
      };
    });
    initHunterBots(newHunters);
  }, []);

  // Game Loop Logic
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
        if (!isHunter) addScore(1000);
      }
    }
  }, [timeLeft, gamePhase, isHunter]);

  // Win/Loss Conditions
  useEffect(() => {
    if (gamePhase === 'GAME_OVER') return;

    if (hp <= 0 && !isHunter) {
      setGameOver('You were eliminated!');
    }

    if (isHunter && gamePhase === 'HUNTING') {
      if (aliveBotsCount === 0) {
        setGameOver('All Props Eliminated! Hunters Win.');
        addScore(1000);
      }
    }
  }, [hp, aliveBotsCount, isHunter, gamePhase]);

  // Hitmarker Effect
  useEffect(() => {
    if (hitMarker > 0) {
      setShowHitmarker(true);
      const t = setTimeout(() => setShowHitmarker(false), 200);
      return () => clearTimeout(t);
    }
  }, [hitMarker]);

  // Pointer Lock Listener
  useEffect(() => {
    const handleLock = () => setIsPointerLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', handleLock);
    return () => document.removeEventListener('pointerlockchange', handleLock);
  }, []);



  // Auto-manage radar visibility based on game phase
  useEffect(() => {
    if (gamePhase === 'HIDING') {
      setShowRadar(true);
    } else if (gamePhase === 'HUNTING') {
      setShowRadar(false);
    }
  }, [gamePhase]);

  // Handle Hotkeys (R to toggle radar)
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

  return (
    <div className="relative w-full h-full bg-zinc-950 animate-in fade-in duration-1000">
      
      {/* 1. Top Centered Pill: Team VS Status */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-full px-5 py-2 shadow-2xl pointer-events-none select-none">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold font-mono text-xs">
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>PROPS: {aliveBotsCount + (isHunter ? 0 : 1)}</span>
        </div>
        <div className="mx-4 text-[10px] font-mono font-black tracking-widest bg-zinc-800 border border-zinc-700 px-3 py-0.5 rounded-full text-zinc-300">
          VS
        </div>
        <div className="flex items-center space-x-2 text-rose-400 font-bold font-mono text-xs">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span>HUNTERS: 1</span>
        </div>
      </div>

      {/* 2. Top Left Action Bars & Health Indicators */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-3 pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); setView('MENU'); }}
          className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 hover:bg-zinc-800 px-4 py-2.5 rounded-xl pointer-events-auto backdrop-blur-md border border-zinc-800 shadow-xl self-start"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Disconnect</span>
        </button>
      </div>

      {/* 3. Top Right Tactical Radar Schematic & Session Meta */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-3 pointer-events-none select-none">
        {/* Row for Vitals (only if Prop) and Time left */}
        <div className="flex items-center space-x-2 self-end">
          {/* Compact, High-contrast Health panel */}
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 p-2 rounded-lg shadow-2xl w-[110px] h-[60px] flex flex-col justify-between text-left">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider leading-none">
                {isHunter ? 'FEEDBACK CORE' : 'VITALS'}
              </span>
              <span className={`flex h-1.5 w-1.5 rounded-full ${isHunter ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
            </div>
            <div className="flex items-center space-x-1.5 leading-none">
              <Heart size={12} fill="currentColor" className={isHunter ? "text-rose-400" : "text-emerald-400"} />
              <span className="font-mono text-sm font-black text-white leading-none">{Math.max(0, hp)}</span>
            </div>
            {/* Visual health slider bar */}
            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-800/50">
              <div 
                className={`h-full transition-all duration-300 ${isHunter ? 'bg-rose-500' : hp > 50 ? 'bg-emerald-500' : hp > 25 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`}
                style={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
              />
            </div>
          </div>

          {/* Phase/Time Indicator Panel */}
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 p-2 rounded-lg text-center w-[110px] h-[60px] shadow-2xl flex flex-col justify-between">
            <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider leading-none">
              {gamePhase === 'HIDING' ? 'PROPS HIDING' : 'TIME LEFT'}
            </span>
            <span className={`text-sm font-black font-mono tracking-tight leading-none ${timeLeft <= 15 && gamePhase === 'HUNTING' ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            {/* Visual game phase duration bar */}
            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-800/50">
              <div 
                className={`h-full ${gamePhase === 'HUNTING' && timeLeft >= 119 ? '' : 'transition-all duration-300'} ${gamePhase === 'HIDING' ? 'bg-purple-500' : 'bg-cyan-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, (timeLeft / (gamePhase === 'HIDING' ? 30 : 120)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tactical Sweeping Radar/Mini-map */}
        <TacticalRadar showRadar={showRadar} isHunter={isHunter} />
      </div>

      {/* 6. Bottom Right Weapon or Prop Tactical Ledgers */}
      {isHunter ? (
        <div className="absolute bottom-4 right-4 z-10 flex items-end space-x-3 pointer-events-none select-none">
          {/* Tactical Weapon Info */}
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-4 min-w-[190px]">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                WEAPON
              </span>
              <span className="text-xs font-black text-white font-mono tracking-tight uppercase">
                LIDAR GUN v1.2
              </span>
            </div>
            <div className="h-7 w-px bg-zinc-800" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">BATTERY</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                100%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2 pointer-events-none select-none">
          {/* Tactical Prop Info Dashboard */}
          <DisguiseDashboard />
          <span className="text-[8px] text-right text-zinc-600 font-mono tracking-wider">SCROLL TO ROTATE PROP • RIGHT CLICK TO LOCK</span>
        </div>
      )}

      {/* 7. Targeting HUD Crosshair Brackets */}
      {gamePhase !== 'GAME_OVER' && isHunter && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center select-none">
          <div className="relative flex items-center justify-center">
            {/* Central crosshair pinpoint */}
            <div className="absolute w-1.5 h-1.5 bg-white/90 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            {/* Outer Brackets ( • ) style */}
            <div className="absolute w-8 h-8 border-l border-t border-white/50 rounded-tl-md -translate-x-2.5 -translate-y-2.5" />
            <div className="absolute w-8 h-8 border-r border-t border-white/50 rounded-tr-md translate-x-2.5 -translate-y-2.5" />
            <div className="absolute w-8 h-8 border-l border-b border-white/50 rounded-bl-md -translate-x-2.5 translate-y-2.5" />
            <div className="absolute w-8 h-8 border-r border-b border-white/50 rounded-br-md translate-x-2.5 translate-y-2.5" />
            {/* Subtle circular indicator ring */}
            <div className="absolute w-12 h-12 border border-white/10 rounded-full" />
            {/* Hitmarker animation ring */}
            {showHitmarker && (
              <div className="absolute w-10 h-10 animate-[ping_0.15s_ease-out_infinite] border-2 border-rose-500 rounded-full" />
            )}
          </div>
        </div>
      )}



      {/* Hunter Containment Warning Overlay During Hiding Phase */}
      {isHunter && gamePhase === 'HIDING' && (
        <>
          {/* Subtle glowing red holographic containment boundary vignette around screen edges */}
          <div className="absolute inset-0 z-10 pointer-events-none border-[4px] border-rose-500/15 shadow-[inset_0_0_60px_rgba(244,63,94,0.15)]" />

          {/* Minimal, beautiful top tactical indicator pill */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-3 pointer-events-none bg-zinc-950/85 backdrop-blur-md border border-rose-500/30 px-4 py-2.5 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.15)] select-none animate-in fade-in slide-in-from-top-2 duration-500 font-mono">
            <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-rose-500 tracking-wider">
                CONTAINMENT ACTIVE
              </span>
              <span className="text-[8px] text-zinc-400 tracking-widest uppercase">
                PROPS ARE HIDING
              </span>
            </div>
          </div>
        </>
      )}

      {false && (
        <div className="absolute inset-0 bg-zinc-950 z-30 flex flex-col items-center justify-center pointer-events-none">
           <div className="text-zinc-800 mb-8"><ShieldAlert size={64} /></div>
           <h2 className="text-5xl font-black text-rose-500 tracking-tight animate-pulse mb-4">DEPLOYING PROPS</h2>
           <p className="text-zinc-500 font-mono text-xl">Vision disabled for {timeLeft}s</p>
        </div>
      )}

      {/* Game Over Screen */}
      {gamePhase === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl text-center space-y-6 max-w-md w-full animate-in zoom-in-95 duration-300 shadow-2xl">
            <h2 className="text-3xl font-black text-white tracking-tight">{gameOverMessage}</h2>
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="text-zinc-500 font-mono text-xs mb-2">MATCH SUMMARY</div>
              <div className="text-emerald-400 font-mono text-sm">+ {score} XP</div>
            </div>
            <button 
              onClick={() => setView('MENU')}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-colors text-lg"
            >
              Return to Hub
            </button>
          </div>
        </div>
      )}

      {/* Chat HUD overlay */}
      {gamePhase !== 'GAME_OVER' && <Chat />}

      {/* 3D Canvas */}
      <div id="game-canvas-container" className="absolute inset-0 z-0">
        <ErrorBoundary>
          <GameScene />
        </ErrorBoundary>
      </div>
    </div>
  );
}
