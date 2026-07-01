import { useGameStore } from '../store/gameStore';
import { Play, Store, Trophy, User } from 'lucide-react';

export default function MainMenu() {
  const { walletAddress, setView, setIsHunter } = useGameStore();

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handlePlay = (hunter: boolean) => {
    setIsHunter(hunter);
    setView('MAP_SELECT');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
        <User size={16} className="text-emerald-400" />
        <span className="font-mono text-sm text-zinc-300">{walletAddress ? formatAddress(walletAddress) : ''}</span>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
      </div>

      <div className="text-center space-y-2 select-none">
        <h1 className="text-5xl font-black text-white tracking-tight">Select Protocol</h1>
        <div className="flex flex-col items-center gap-2 mt-2">
          <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest bg-emerald-950/50 border border-emerald-800/50 px-3 py-1 rounded-full">
            Ancient Temple Update Live
          </span>
          <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider">
            Press Ctrl+F5 or Cmd+Shift+R to clear cache if you see old bots
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl font-sans">
        <button
          onClick={() => handlePlay(true)}
          className="group relative flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Play size={48} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-bold text-white mb-2">Play as Hunter</h2>
          <p className="text-zinc-500 text-sm text-center">Find hidden props in the environment before time runs out.</p>
        </button>

        <button
          onClick={() => handlePlay(false)}
          className="group relative flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 border-4 border-purple-400 border-dashed rounded mb-4 group-hover:rotate-180 transition-transform duration-700" />
          <h2 className="text-2xl font-bold text-white mb-2">Play as Prop</h2>
          <p className="text-zinc-500 text-sm text-center">Disguise yourself as environmental objects and survive.</p>
        </button>
      </div>

    </div>
  );
}
