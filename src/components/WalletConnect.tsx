import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ethers } from 'ethers';
import { Wallet, ShieldCheck } from 'lucide-react';

export default function WalletConnect() {
  const { setWalletAddress, setView } = useGameStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const ethereum = (window as any).ethereum;
      if (typeof ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setView('MENU');
        }
      } else {
        // Fallback for preview environments without a wallet extension
        console.warn('No Ethereum provider found. Using mock wallet for preview.');
        setTimeout(() => {
          setWalletAddress('0xMockWalletAddress1234567890abcdef');
          setView('MENU');
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-700 drop-shadow-sm">
          PROP HUNT
        </h1>
        <p className="text-xl font-mono text-zinc-400 max-w-md mx-auto">
          Decentralized Hide & Seek. Immutable State. Zero Trust.
        </p>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-2xl border border-zinc-800 shadow-2xl max-w-sm w-full space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mx-auto text-emerald-400">
          <ShieldCheck size={32} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Identity Verification</h2>
          <p className="text-zinc-500 text-sm">Cryptographic player identity required for anti-cheat and asset ownership.</p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet size={20} />
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      </div>
    </div>
  );
}
