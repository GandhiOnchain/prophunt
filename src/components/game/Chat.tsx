import { useState, useEffect, useRef } from 'react';
import { useGameStore, ChatMessage } from '../../store/gameStore';
import { MessageSquare, Send, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeRequestPointerLock } from './utils';

export default function Chat() {
  const chatMessages = useGameStore(state => state.chatMessages);
  const addChatMessage = useGameStore(state => state.addChatMessage);
  const gamePhase = useGameStore(state => state.gamePhase);
  const propBots = useGameStore(state => state.propBots);
  const isHunter = useGameStore(state => state.isHunter);
  const setIsChatFocused = useGameStore(state => state.setIsChatFocused);
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'global'>('team');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track bots alive count to detect when they are eliminated
  const prevBotsRef = useRef(propBots);

  // Auto-scroll to bottom of chat on new messages or channel swap
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [chatMessages, activeTab]);

  // Synchronize state with isOpen, handling focus, blur and pointer lock transitions centrally
  useEffect(() => {
    setIsChatFocused(isOpen);
    if (isOpen) {
      document.exitPointerLock();
      setTimeout(() => {
        inputRef.current?.focus();
        setIsFocused(true);
      }, 50);
    } else {
      setIsFocused(false);
      inputRef.current?.blur();
      safeRequestPointerLock();
    }
  }, [isOpen, setIsChatFocused]);

  // Handle hotkeys (Tab to toggle chat, ~ / ` to switch tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if ((e.key === '`' || e.key === '~' || e.code === 'Backquote') && isOpen) {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'team' ? 'global' : 'team'));
        // Maintain focus on the input box
        setTimeout(() => {
          inputRef.current?.focus();
          setIsFocused(true);
        }, 10);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  // Game phase change announcements
  useEffect(() => {
    const bots = ['0xGigaProp', '0xShadow', '0xSlayer', '0xAlpha', '0xMugHider'];
    if (gamePhase === 'HIDING') {
      addChatMessage('Hiding phase started! Props have 15 seconds to conceal themselves.', 'System', 'SYSTEM', false, 'global');
      
      // Seed some playful bot comments shortly after (to team channel)
      setTimeout(() => {
        addChatMessage('Quick, find a good spot! I am turning into a chair.', '0xGigaProp', 'PROP', false, 'team');
      }, 1500);
      setTimeout(() => {
        addChatMessage('I found the ultimate spot near the platform, do not copy me!', '0xShadow', 'PROP', false, 'team');
      }, 3500);
    } else if (gamePhase === 'HUNTING') {
      addChatMessage('Hunting phase started! Hunters are released! Hunt down all 5 props!', 'System', 'SYSTEM', false, 'global');
      
      // Seed some hunter tactical messages (to team channel)
      setTimeout(() => {
        addChatMessage('Alright, time to sweep the map! Check the platforms!', '0xSlayer', 'HUNTER', false, 'team');
      }, 1000);
      setTimeout(() => {
        addChatMessage('Remember: shooting wrong props damages your HP (-5 HP)! Aim carefully.', '0xAlpha', 'HUNTER', false, 'team');
      }, 3000);
    } else if (gamePhase === 'GAME_OVER') {
      const isHunterWin = useGameStore.getState().gameOverMessage.includes('Hunters Win') || useGameStore.getState().gameOverMessage.includes('eliminated');
      if (isHunterWin) {
        setTimeout(() => {
          addChatMessage('GG! Easy sweep for the hunters.', '0xSlayer', 'HUNTER', false, 'global');
          addChatMessage('No box or barrel can hide from us.', '0xAlpha', 'HUNTER', false, 'global');
        }, 1000);
      } else {
        setTimeout(() => {
          addChatMessage('GG! Unbeatable hiding spot! You stood right next to me!', '0xGigaProp', 'PROP', false, 'global');
          addChatMessage('Hahaha props win! Love this game.', '0xShadow', 'PROP', false, 'global');
        }, 1000);
      }
    }
  }, [gamePhase]);

  // Bot elimination comments
  useEffect(() => {
    const prevBots = prevBotsRef.current;
    
    // Compare bot alive status to trigger reaction dialogue
    propBots.forEach((bot, index) => {
      const prevBot = prevBots?.find(b => b.id === bot.id);
      if (prevBot && !prevBot.isDead && bot.isDead) {
        // This bot just died! Let's make them chat in Global
        const botNames = ['0xMugHider', '0xGigaProp', '0xShadow', '0xBarrelRoll', '0xBoxy'];
        const name = botNames[index] || `0xPropBot${index}`;
        
        // Random message list
        const messages = [
          'Agh! You got me! My disguise was shattered.',
          'Wait, how did you know I was a real player and not a static prop?!',
          'Who snitched?! I was perfectly aligned with the ground!',
          'Nice shot, hunter. I thought I was invisible.',
          'Nooo! I was a perfect plant pot!'
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        setTimeout(() => {
          addChatMessage(msg, name, 'PROP', false, 'global');
        }, 800);

        // Friendly hunter reacts in Global
        setTimeout(() => {
          const hunters = ['0xSlayer', '0xAlpha'];
          const hunterName = hunters[Math.floor(Math.random() * hunters.length)];
          const hunterMessages = [
            'One down, more to go!',
            'Nice shot! That prop was shaking a bit.',
            'Gotcha! Check the corners next.',
            'That was a suspicious looking box anyway!'
          ];
          const hunterMsg = hunterMessages[Math.floor(Math.random() * hunterMessages.length)];
          addChatMessage(hunterMsg, hunterName, 'HUNTER', false, 'global');
        }, 2200);
      }
    });

    prevBotsRef.current = propBots;
  }, [propBots]);

  const handleSendMessage = () => {
    if (!inputText.trim()) {
      // Empty text on Enter simply closes the chat box gracefully
      setIsOpen(false);
      return;
    }

    const userRole = isHunter ? 'HUNTER' : 'PROP';
    const currentChannel = activeTab;
    addChatMessage(inputText, 'You', userRole, true, currentChannel);
    const textSent = inputText.toLowerCase();
    setInputText('');
    
    // Keep focused on input field so they can keep typing without closing the chat
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    // Generate simulated contextual replies from lobby bots!
    setTimeout(() => {
      let pick: { sender: string; text: string; role: 'HUNTER' | 'PROP' } | null = null;

      if (textSent.includes('hello') || textSent.includes('hi') || textSent.includes('hey') || textSent.includes('yo')) {
        const replies = [
          { sender: '0xGigaProp', text: 'Hey player! GL HF!', role: 'PROP' as const },
          { sender: '0xMugHider', text: 'Sup! Are you going to hide or hunt?', role: 'PROP' as const },
          { sender: '0xSlayer', text: 'Yo! Get ready to hunt!', role: 'HUNTER' as const }
        ];
        const allowed = replies.filter(r => currentChannel === 'global' || r.role === userRole);
        pick = allowed[Math.floor(Math.random() * allowed.length)] || replies[0];
      } else if (textSent.includes('where') || textSent.includes('find') || textSent.includes('help')) {
        const replies = [
          { sender: '0xSlayer', text: 'Try checking the elevated platform areas, they like to jump up there!', role: 'HUNTER' as const },
          { sender: '0xAlpha', text: 'Check the horizontal wall dividers. Boxes often stand near them.', role: 'HUNTER' as const },
          { sender: '0xShadow', text: 'Hush! Do not reveal our sacred spots!', role: 'PROP' as const }
        ];
        const allowed = replies.filter(r => currentChannel === 'global' || r.role === userRole);
        pick = allowed[Math.floor(Math.random() * allowed.length)] || replies[0];
      } else if (textSent.includes('cheat') || textSent.includes('hack') || textSent.includes('glitch')) {
        const replies = [
          { sender: '0xGigaProp', text: 'No cheats here, just raw prop physics and perfect standing positions!', role: 'PROP' as const },
          { sender: '0xAlpha', text: 'Fair play only!', role: 'HUNTER' as const }
        ];
        const allowed = replies.filter(r => currentChannel === 'global' || r.role === userRole);
        pick = allowed[Math.floor(Math.random() * allowed.length)] || replies[0];
      } else if (textSent.includes('gg') || textSent.includes('wp')) {
        const replies = [
          { sender: '0xShadow', text: 'GG, well played!', role: 'PROP' as const },
          { sender: '0xSlayer', text: 'GG! Next round let us swap teams!', role: 'HUNTER' as const }
        ];
        const allowed = replies.filter(r => currentChannel === 'global' || r.role === userRole);
        pick = allowed[Math.floor(Math.random() * allowed.length)] || replies[0];
      } else if (textSent.includes('lock') || textSent.includes('right click') || textSent.includes('how')) {
        const replies = [
          { sender: '0xMugHider', text: 'If you are a Prop, right-click to Lock position! It snaps you to the ground and aligns your prop perfectly.', role: 'PROP' as const },
          { sender: '0xAlpha', text: 'To search, shoot suspicious props. But don\'t shoot randomly!', role: 'HUNTER' as const }
        ];
        const allowed = replies.filter(r => currentChannel === 'global' || r.role === userRole);
        pick = allowed[Math.floor(Math.random() * allowed.length)] || replies[0];
      } else {
        // General comment
        const generalReplies = [
          { sender: '0xGigaProp', text: 'This map is awesome, so many hiding alcoves.', role: 'PROP' as const },
          { sender: '0xSlayer', text: 'Keep an eye out for duplicate props that look out of place!', role: 'HUNTER' as const },
          { sender: '0xShadow', text: 'Hiding as a tiny mug is so overpowered haha.', role: 'PROP' as const },
          { sender: '0xAlpha', text: 'Agreed, mugs have tiny colliders!', role: 'HUNTER' as const }
        ];
        const allowed = generalReplies.filter(r => currentChannel === 'global' || r.role === userRole);
        pick = allowed[Math.floor(Math.random() * allowed.length)] || generalReplies[0];
      }

      if (pick) {
        addChatMessage(pick.text, pick.sender, pick.role, false, currentChannel);
      }
    }, 1200 + Math.random() * 800);
  };

  const getRoleBadgeStyles = (role: 'HUNTER' | 'PROP' | 'SYSTEM', isPlayer?: boolean) => {
    if (role === 'SYSTEM') return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    if (isPlayer) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (role === 'HUNTER') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  const getSenderColor = (role: 'HUNTER' | 'PROP' | 'SYSTEM', isPlayer?: boolean) => {
    if (role === 'SYSTEM') return 'text-amber-400 font-bold';
    if (isPlayer) return 'text-emerald-400 font-bold';
    if (role === 'HUNTER') return 'text-rose-400 font-bold';
    return 'text-purple-400 font-bold';
  };

  const playerRole = isHunter ? 'HUNTER' : 'PROP';
  const filteredMessages = chatMessages.filter((msg) => {
    if (msg.role === 'SYSTEM') return true;
    if (activeTab === 'team') {
      return msg.channel === 'team' && msg.role === playerRole;
    } else {
      return msg.channel === 'global' || !msg.channel;
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0 
          }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-24 left-6 w-[360px] flex flex-col z-20 select-none"
        >
          {/* Header Info */}
          <div className="flex items-center justify-between bg-zinc-950/90 border border-zinc-800/80 border-b-0 px-4 py-2 rounded-t-xl backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <MessageSquare size={14} className="text-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">Protocol Chat</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                <Users size={12} className="text-zinc-500" />
                <span className="text-[10px] font-mono font-bold text-zinc-400">5 ONLINE</span>
              </div>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setIsOpen(false);
                  setIsChatFocused(false);
                  safeRequestPointerLock();
                }}
                className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center border border-transparent"
                title="Minimize Chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Channel Tabs */}
          <div className="flex bg-zinc-950/95 border-x border-b border-zinc-800/50 px-2 py-1.5 gap-1.5">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setActiveTab('team');
                // Force input focus so typing is not interrupted
                setTimeout(() => {
                  inputRef.current?.focus();
                  setIsFocused(true);
                }, 10);
              }}
              className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold tracking-wider font-mono transition-all duration-200 cursor-pointer ${
                activeTab === 'team'
                  ? isHunter
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-zinc-900/40'
              }`}
            >
              🏹 {isHunter ? 'HUNTER TEAM' : 'PROP TEAM'}
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setActiveTab('global');
                // Force input focus so typing is not interrupted
                setTimeout(() => {
                  inputRef.current?.focus();
                  setIsFocused(true);
                }, 10);
              }}
              className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold tracking-wider font-mono transition-all duration-200 cursor-pointer ${
                activeTab === 'global'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-zinc-900/40'
              }`}
            >
              🌐 GLOBAL CHAT
            </button>
          </div>

          {/* Messages Window */}
          <div className="h-[200px] bg-zinc-950/80 border-x border-zinc-800/80 overflow-y-auto p-3 backdrop-blur-md scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <div className="flex flex-col space-y-2 min-h-full">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="text-xs animate-in fade-in duration-300 leading-snug">
                  <span className="text-[10px] font-mono text-zinc-500 mr-1.5">{msg.timestamp}</span>
                  
                  {msg.role !== 'SYSTEM' && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border mr-1.5 ${getRoleBadgeStyles(msg.role, msg.isPlayer)}`}>
                      {msg.isPlayer ? 'YOU' : msg.role}
                    </span>
                  )}

                  <span className={`mr-1.5 ${getSenderColor(msg.role, msg.isPlayer)}`}>
                    {msg.sender}:
                  </span>
                  <span className={msg.role === 'SYSTEM' ? 'text-zinc-400 italic' : 'text-zinc-200'}>
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <div className="flex bg-zinc-950/90 border border-t-0 border-zinc-800/80 p-2 rounded-b-xl backdrop-blur-md gap-2">
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              placeholder={activeTab === 'team' ? "Type team message..." : "Type global message..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setIsChatFocused(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFocused(false);
                  setIsChatFocused(false);
                }, 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-sans"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSendMessage}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center border border-emerald-500/20 cursor-pointer"
            >
              <Send size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
