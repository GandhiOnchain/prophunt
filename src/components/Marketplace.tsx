import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Box, Hexagon, Circle } from 'lucide-react';

const ITEMS = [
  { id: '1', name: 'Golden Barrel', price: '0.05 ETH', rarity: 'Legendary', icon: Hexagon, color: 'text-yellow-400' },
  { id: '2', name: 'Stealth Crate', price: '0.02 ETH', rarity: 'Epic', icon: Box, color: 'text-purple-400' },
  { id: '3', name: 'Holo-Sphere', price: '0.01 ETH', rarity: 'Rare', icon: Circle, color: 'text-blue-400' },
];

export default function Marketplace() {
  const { setView } = useGameStore();

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-8 animate-in fade-in duration-300">
      <button 
        onClick={() => setView('MENU')}
        className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors mb-8 w-fit"
      >
        <ArrowLeft size={20} />
        <span>Back to Hub</span>
      </button>

      <div className="space-y-2 mb-10">
        <h1 className="text-4xl font-black text-white">Decentralized Exchange</h1>
        <p className="text-zinc-500 font-mono text-sm">P2P Trading • IPFS Asset Storage • Smart Contract Escrow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center hover:border-emerald-500/30 transition-colors">
              <div className={`w-24 h-24 mb-6 flex items-center justify-center bg-zinc-950 rounded-2xl shadow-inner border border-zinc-800`}>
                <Icon size={48} className={item.color} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
              <p className={`text-xs font-mono mb-4 px-2 py-1 rounded bg-zinc-800 ${item.color}`}>
                {item.rarity}
              </p>
              <div className="w-full flex items-center justify-between mt-auto pt-4 border-t border-zinc-800">
                <span className="font-mono text-zinc-300">{item.price}</span>
                <button className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-sm font-bold rounded transition-colors">
                  Buy
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-12 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm font-mono text-center">
        Transactions are secured by Ethereum smart contracts. Assets hosted on IPFS.
      </div>
    </div>
  );
}
