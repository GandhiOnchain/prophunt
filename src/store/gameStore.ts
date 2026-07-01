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

export interface PlayerState {
  id: string;
  name: string;
  walletAddress: string | null;
  isHunter: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  isLocked: boolean;
  propRotationOffset: number;
  activePropType: string;
  hp: number;
  score: number;
  isDead: boolean;
}

interface GameState {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  view: 'MENU' | 'PLAYING' | 'MAP_SELECT';
  setView: (view: 'MENU' | 'PLAYING' | 'MAP_SELECT') => void;
  
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

  // Player Info
  playerId: string;
  roomCode: string;
  setRoomCode: (code: string) => void;
  otherPlayers: { [id: string]: PlayerState };
  setOtherPlayers: (players: { [id: string]: PlayerState }) => void;
  updateOtherPlayer: (id: string, state: Partial<PlayerState>) => void;
  removeOtherPlayer: (id: string) => void;

  playerPosition: [number, number, number];
  setPlayerPosition: (position: [number, number, number]) => void;
  playerPositionRef: [number, number, number]; // Added to quickly query from hook ref
  setPlayerPositionWithRef: (position: [number, number, number]) => void;
  playerRotation: [number, number, number];
  setPlayerRotation: (rotation: [number, number, number]) => void;
  ghostPosition: [number, number, number] | null;
  setGhostPosition: (position: [number, number, number] | null) => void;

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

const generateId = () => 'p-' + Math.random().toString(36).substring(2, 11);

export const useGameStore = create<GameState>((set, get) => ({
  walletAddress: null,
  setWalletAddress: (address) => set({ walletAddress: address }),
  
  view: 'MENU',
  setView: (view) => set({ view, hp: 100, gamePhase: 'WAITING', isLocked: false }),
  
  currentMapId: 'TEMPLE',
  setMapId: (id) => {
    // Determine a default prop for the selected map
    let defaultProp = 'box';
    if (id === 'TEMPLE') defaultProp = 'vase';
    else if (id === 'LOST_MINE') defaultProp = 'barrel';
    else if (id === 'BLUE_SANDS') defaultProp = 'box';
    else if (id === 'NEXUS') defaultProp = 'monitor';
    
    set({ currentMapId: id, playerPropType: defaultProp });
  },
  
  isHunter: true,
  setIsHunter: (isHunter) => set({ isHunter }),
  
  score: 0,
  addScore: (points) => set((state) => ({ score: state.score + points })),
  
  hp: 100,
  setHp: (hp) => {
    const nextHp = typeof hp === 'function' ? hp(get().hp) : hp;
    set({ hp: nextHp });
  },
  
  gamePhase: 'WAITING',
  setGamePhase: (phase) => {
    set({ gamePhase: phase });
  },
  
  gameOverMessage: '',
  setGameOver: (message) => {
    set({ gamePhase: 'GAME_OVER', gameOverMessage: message });
  },

  playerPropType: 'vase', // Matches default TEMPLE map
  setPlayerPropType: (type) => {
    set({ playerPropType: type });
  },
  
  isLocked: false,
  setIsLocked: (locked) => {
    const nextLocked = typeof locked === 'function' ? locked(get().isLocked) : locked;
    set({ isLocked: nextLocked });
  },

  propRotationOffset: 0,
  setPropRotationOffset: (offset) => {
    const nextOffset = typeof offset === 'function' ? offset(get().propRotationOffset) : offset;
    set({ propRotationOffset: nextOffset });
  },

  // Player Info
  playerId: generateId(),
  roomCode: 'LOBBY',
  setRoomCode: (code) => set({ roomCode: code.toUpperCase() }),
  otherPlayers: {},
  setOtherPlayers: (players) => set({ otherPlayers: players }),
  updateOtherPlayer: (id, state) => set((prev) => ({
    otherPlayers: {
      ...prev.otherPlayers,
      [id]: {
        ...(prev.otherPlayers[id] || {
          id,
          name: id.substring(0, 8),
          walletAddress: null,
          isHunter: false,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          isLocked: false,
          propRotationOffset: 0,
          activePropType: 'vase', // Matches default map TEMPLE
          hp: 100,
          score: 0,
          isDead: false
        }),
        ...state
      }
    }
  })),
  removeOtherPlayer: (id) => set((prev) => {
    const updated = { ...prev.otherPlayers };
    delete updated[id];
    return { otherPlayers: updated };
  }),

  playerPosition: [0, 1, 10],
  playerPositionRef: [0, 1, 10],
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setPlayerPositionWithRef: (position) => set({ playerPosition: position, playerPositionRef: position }),
  playerRotation: [0, 0, 0],
  setPlayerRotation: (rotation) => set({ playerRotation: rotation }),
  ghostPosition: null,
  setGhostPosition: (position) => set({ ghostPosition: position }),

  hitMarker: 0,
  triggerHitMarker: () => set((state) => ({ hitMarker: state.hitMarker + 1 })),

  chatMessages: [
    { id: '1', sender: 'System', text: 'Welcome to the match!', timestamp: '00:00', role: 'SYSTEM', channel: 'global' },
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
      { id: '1', sender: 'System', text: 'Connected to multiplayer lobby.', timestamp: '00:00', role: 'SYSTEM', channel: 'global' },
    ]
  }),
  isChatFocused: false,
  setIsChatFocused: (focused) => set({ isChatFocused: focused }),
}));
