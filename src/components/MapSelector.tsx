import { useGameStore, MapID } from '../store/gameStore';

const MAPS: { id: MapID; name: string; description: string; image: string; theme: string }[] = [
  {
    id: 'TEMPLE',
    name: 'Ancient Temple',
    description: 'Moss-covered ruins and elevated stone walkways. Lots of pillars and slabs to blend into.',
    image: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?w=800&q=80',
    theme: '#4ade80'
  },
  {
    id: 'LOST_MINE',
    name: 'Lost Mine',
    description: 'Underground caverns with wooden platforms and minecarts. Dark and dangerous.',
    image: 'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=800&q=80',
    theme: '#92400e'
  },
  {
    id: 'BLUE_SANDS',
    name: 'Blue Sands',
    description: 'Tropical island with sandy shores and palm trees. Bright, open sightlines.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    theme: '#38bdf8'
  },
  {
    id: 'NEXUS',
    name: 'Nexus Arena',
    description: 'Futuristic sci-fi corridors with neon lights and servers. Symmetrical and fast-paced.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    theme: '#ec4899'
  }
];

export default function MapSelector() {
  const setView = useGameStore((state) => state.setView);
  const setMapId = useGameStore((state) => state.setMapId);

  const selectMap = (id: MapID) => {
    setMapId(id);
    setView('PLAYING');
  };

  return (
    <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-6xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2 text-center tracking-tight">SELECT MAP</h1>
        <p className="text-zinc-400 text-center mb-12">Choose your battleground</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MAPS.map((map) => (
            <div 
              key={map.id}
              onClick={() => selectMap(map.id)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-600 transition-all hover:scale-[1.02] group"
            >
              <div className="h-48 overflow-hidden relative">
                <img src={map.image} alt={map.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              </div>
              <div className="p-6 relative">
                <div 
                  className="w-12 h-1 absolute -top-0.5 left-6"
                  style={{ backgroundColor: map.theme }}
                />
                <h3 className="text-xl font-bold text-white mb-2">{map.name}</h3>
                <p className="text-zinc-400 text-sm">{map.description}</p>
                <div className="mt-6 flex items-center text-emerald-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Deploy
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => setView('MENU')}
          className="mt-12 mx-auto block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition-colors"
        >
          BACK TO MENU
        </button>
      </div>
    </div>
  );
}
