import { create } from 'zustand';

export type MapID = 'TEMPLE' | 'LOST_MINE' | 'BLUE_SANDS' | 'NEXUS';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  role: 'HUNTER' | 'PROP' | 'SYSTEM';
  isPlayer?: boolean;
  channel?: 'team' | 'global';
}

interface Bot {
  id: string;
  type: string;
  position: [number, number, number];
  isDead: boolean;
}

interface GameState {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  view: 'LOGIN' | 'MENU' | 'PLAYING' | 'MARKETPLACE' | 'MAP_SELECT';
  setView: (view: 'LOGIN' | 'MENU' | 'PLAYING' | 'MARKETPLACE' | 'MAP_SELECT') => void;
  
  currentMapId: MapID;
  setMapId: (id: MapID) => void;
  
  isHunter: boolean;
  setIsHunter: (isHunter: boolean) => void;
  
  score: number;
  addScore: (points: number) => void;
  hp: number;
  setHp: (hp: number | ((prev: number) => number)) => void;
  
  gamePhase: 'WAITING' | 'HIDING' | 'HUNTING' | 'GAME_OVER';
  setGamePhase: (phase: 'WAITING' | 'HIDING' | 'HUNTING' | 'GAME_OVER') => void;
  
  gameOverMessage: string;
  setGameOver: (message: string) => void;

  // Prop Specific
  playerPropType: string;
  setPlayerPropType: (type: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean | ((prev: boolean) => boolean)) => void;
  propRotationOffset: number;
  setPropRotationOffset: (offset: number | ((prev: number) => number)) => void;

  // Bots
  propBots: Bot[];
  initPropBots: (bots: Bot[]) => void;
  killPropBot: (id: string) => void;

  playerPosition: [number, number, number];
  setPlayerPosition: (position: [number, number, number]) => void;
  ghostPosition: [number, number, number] | null;
  setGhostPosition: (position: [number, number, number] | null) => void;
  hunterBots: { id: string; position: [number, number, number]; target: [number, number, number]; speed: number }[];
  initHunterBots: (hunters: { id: string; position: [number, number, number]; target: [number, number, number]; speed: number }[]) => void;
  updateHunterBotPosition: (id: string, position: [number, number, number], target: [number, number, number]) => void;

  // Visual Effects
  hitMarker: number;
  triggerHitMarker: () => void;

  // Chat Interface
  chatMessages: ChatMessage[];
  addChatMessage: (text: string, sender?: string, role?: 'HUNTER' | 'PROP' | 'SYSTEM', isPlayer?: boolean, channel?: 'team' | 'global') => void;
  clearChat: () => void;
  isChatFocused: boolean;
  setIsChatFocused: (focused: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  walletAddress: null,
  setWalletAddress: (address) => set({ walletAddress: address }),
  
  view: 'LOGIN',
  setView: (view) => set({ view, hp: 100, gamePhase: 'WAITING', isLocked: false }),
  
  currentMapId: 'TEMPLE',
  setMapId: (id) => set({ currentMapId: id }),
  
  isHunter: true,
  setIsHunter: (isHunter) => set({ isHunter }),
  
  score: 0,
  addScore: (points) => set((state) => ({ score: state.score + points })),
  
  hp: 100,
  setHp: (hp) => set((state) => ({ hp: typeof hp === 'function' ? hp(state.hp) : hp })),
  
  gamePhase: 'WAITING',
  setGamePhase: (phase) => set({ gamePhase: phase }),
  
  gameOverMessage: '',
  setGameOver: (message) => set({ gamePhase: 'GAME_OVER', gameOverMessage: message }),

  playerPropType: 'box',
  setPlayerPropType: (type) => set({ playerPropType: type }),
  
  isLocked: false,
  setIsLocked: (locked) => set((state) => ({ isLocked: typeof locked === 'function' ? locked(state.isLocked) : locked })),
  propRotationOffset: 0,
  setPropRotationOffset: (offset) => set((state) => ({ propRotationOffset: typeof offset === 'function' ? offset(state.propRotationOffset) : offset })),

  propBots: [],
  initPropBots: (bots) => set({ propBots: bots }),
  killPropBot: (id) => set((state) => ({
    propBots: state.propBots.map(b => b.id === id ? { ...b, isDead: true } : b)
  })),

  playerPosition: [0, 1, 10],
  setPlayerPosition: (position) => set({ playerPosition: position }),
  ghostPosition: null,
  setGhostPosition: (position) => set({ ghostPosition: position }),
  hunterBots: [],
  initHunterBots: (hunters) => set({ hunterBots: hunters }),
  updateHunterBotPosition: (id, position, target) => set((state) => ({
    hunterBots: state.hunterBots.map(h => h.id === id ? { ...h, position, target } : h)
  })),

  hitMarker: 0,
  triggerHitMarker: () => set((state) => ({ hitMarker: state.hitMarker + 1 })),

  chatMessages: [
    { id: '1', sender: '0xGigaProp', text: 'Yo, is this lobby full?', timestamp: '14:29', role: 'PROP', channel: 'global' },
    { id: '2', sender: '0xSlayer', text: 'Ready to hunt. Good luck hiders!', timestamp: '14:30', role: 'HUNTER', channel: 'global' },
    { id: '3', sender: 'System', text: 'Welcome to the match! 5 players connected.', timestamp: '14:30', role: 'SYSTEM', channel: 'global' },
  ],
  addChatMessage: (text, sender = 'Player', role = 'SYSTEM', isPlayer = false, channel = 'global') => set((state) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return {
      chatMessages: [
        ...state.chatMessages,
        {
          id: `${Date.now()}-${Math.random()}`,
          sender,
          text,
          timestamp,
          role,
          isPlayer,
          channel
        }
      ].slice(-50) // Keep last 50 messages
    };
  }),
  clearChat: () => set({
    chatMessages: [
      { id: '1', sender: '0xGigaProp', text: 'Yo, is this lobby full?', timestamp: '14:29', role: 'PROP', channel: 'global' },
      { id: '2', sender: '0xSlayer', text: 'Ready to hunt. Good luck hiders!', timestamp: '14:30', role: 'HUNTER', channel: 'global' },
      { id: '3', sender: 'System', text: 'Welcome to the match! 5 players connected.', timestamp: '14:30', role: 'SYSTEM', channel: 'global' },
    ]
  }),
  isChatFocused: false,
  setIsChatFocused: (focused) => set({ isChatFocused: focused }),
}));
