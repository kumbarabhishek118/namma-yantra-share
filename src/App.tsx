import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tractor, 
  Settings as Scythe, 
  Droplets, 
  Sprout, 
  Calendar, 
  History, 
  User, 
  MapPin, 
  Search,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Star,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  onSnapshot, 
  doc, 
  getDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

// Types
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Machine {
  id: string;
  name: string;
  category: string;
  hourlyRate: number;
  dailyRate: number;
  imageUrl: string;
  imageUrls?: string[];
  distance?: string;
  available: boolean;
  ownerId: string;
  condition: string;
  ownerName?: string;
}

interface Booking {
  id: string;
  machineId: string;
  machineName: string;
  farmerId: string;
  ownerId: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  totalAmount: number;
  createdAt: any;
  startDate?: number;
  duration?: number;
  durationUnit?: string;
}

const CATEGORIES = [
  { name: 'All', icon: Search },
  { name: 'Tractor', icon: Tractor },
  { name: 'Harvester', icon: Scythe },
  { name: 'Sprayer', icon: Droplets },
  { name: 'Power Tiller', icon: Sprout },
];

export default function App() {
  const [view, setView] = useState<'splash' | 'login' | 'home' | 'details' | 'bookings' | 'profile' | 'listings'>('splash');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
        if (u) setView('home');
        else if (view === 'splash') setView('login');
      });
    }, 2000);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (user && view === 'home') {
      const q = query(collection(db, 'machines'), where('available', '==', true));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Machine));
        setMachines(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'machines'));
      return () => unsubscribe();
    }
  }, [user, view]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      alert("Login failed. Make sure you use a Google account.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setView('login');
  };

  if (loading) return <SplashScreen />;

  return (
    <div className="min-h-screen bg-bg-soft font-sans text-stone-900 overflow-x-hidden pb-20">
      <AnimatePresence mode="wait">
        {view === 'splash' && <SplashScreen key="splash" />}
        {view === 'login' && <LoginScreen onLogin={handleLogin} key="login" />}
        <div className={view === 'splash' || view === 'login' ? 'hidden' : 'block'}>
          {view === 'home' && (
            <HomeScreen 
              machines={machines} 
              onSelect={(m) => { setSelectedMachine(m); setView('details'); }}
              key="home" 
            />
          )}
          {view === 'details' && selectedMachine && (
            <DetailsScreen 
              machine={selectedMachine} 
              onBack={() => setView('home')} 
              onBook={() => setView('bookings')}
              key="details" 
            />
          )}
          {view === 'bookings' && <BookingsScreen key="bookings" />}
          {view === 'listings' && <ManageListingsScreen key="listings" />}
          {view === 'profile' && <ProfileScreen user={user} onLogout={handleLogout} key="profile" />}
        </div>
      </AnimatePresence>

      {view !== 'splash' && view !== 'login' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around py-3 px-4 z-50 shadow-lg">
          <NavItem icon={Search} label="Explore" active={view === 'home' || view === 'details'} onClick={() => setView('home')} />
          <NavItem icon={History} label="Bookings" active={view === 'bookings'} onClick={() => setView('bookings')} />
          <NavItem icon={Scythe} label="My Yantras" active={view === 'listings'} onClick={() => setView('listings')} />
          <NavItem icon={User} label="Profile" active={view === 'profile'} onClick={() => setView('profile')} />
        </nav>
      )}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-primary' : 'text-stone-400'}`}
    >
      <Icon size={24} />
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-pill" className="w-1.5 h-1.5 bg-primary rounded-full mt-0.5" />}
    </button>
  );
}

function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-[100]"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <Tractor className="text-primary" size={48} />
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">Namma-Yantra</h1>
        <p className="text-primary-foreground/80 mt-2 font-medium">Village machinery at your fingertips</p>
      </motion.div>
    </motion.div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 flex flex-col justify-center min-h-screen bg-bg-soft"
    >
      <div className="mb-12">
        <div className="w-20 h-20 bg-secondary text-primary rounded-2xl flex items-center justify-center mb-8 shadow-xl rotate-3 border-b-4 border-primary/20">
          <Tractor size={40} />
        </div>
        <h2 className="text-5xl font-black text-primary tracking-tighter leading-none italic uppercase">Agricultural<br />Machinery<br />Network</h2>
        <div className="w-20 h-2 bg-secondary mt-6 rounded-full" />
        <p className="text-stone-500 mt-6 text-lg font-medium">Empowering village farmers through local machinery sharing.</p>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onLogin}
          className="group relative w-full h-18 bg-primary text-white rounded-2xl flex items-center justify-center gap-4 transition-all hover:bg-primary-dark active:scale-[0.98] shadow-xl shadow-primary/20"
        >
          <LogIn className="text-secondary" size={24} />
          <span className="font-black italic uppercase tracking-widest">Login with Google</span>
        </button>
        
        <div className="flex items-center gap-4 py-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em]">Regional Access</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button className="w-full h-18 bg-white border-2 border-stone-100 text-stone-500 rounded-2xl font-black italic uppercase tracking-widest text-xs flex items-center justify-center gap-3">
          <MapPin size={18} className="text-primary" />
          Join as Service Provider
        </button>
      </div>

      <p className="mt-12 text-center text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">Mandya • Hassan • Mysore • Tumkur</p>
    </motion.div>
  );
}

function HomeScreen({ machines, onSelect }: { machines: Machine[], onSelect: (m: Machine) => void }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredMachines = activeCategory === 'All' 
    ? machines 
    : machines.filter(m => m.category === activeCategory);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-20 md:pb-0"
    >
      <header className="bg-primary text-white p-4 md:px-32 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-black text-primary text-2xl">Y</div>
          <div>
            <div className="font-extrabold text-lg md:text-xl tracking-tight leading-none uppercase italic">Namma-Yantra Share</div>
            <div className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Agricultural Machinery Network</div>
          </div>
        </div>
        <div className="hidden md:flex flex-1 max-w-md mx-10 bg-white/10 backdrop-blur-sm p-3 rounded-xl items-center gap-3 text-sm">
          <Search size={18} className="opacity-60" />
          <span className="opacity-60">Search for Tractors, Harvesters...</span>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
          <MapPin size={12} />
          <span>Mandya, KA</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr_300px] gap-6 p-6">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col gap-6 bg-card-bg rounded-2xl p-5 shadow-md self-start sticky top-24">
          <h2 className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 border-b pb-4">Categories</h2>
          <div className="flex flex-col gap-2">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  activeCategory === cat.name 
                    ? 'bg-accent text-primary font-black shadow-sm ring-1 ring-primary/10' 
                    : 'text-stone-500 hover:bg-stone-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-lg">
                  {cat.name === 'All' && '📋'}
                  {cat.name === 'Tractor' && '🚜'}
                  {cat.name === 'Harvester' && '🌾'}
                  {cat.name === 'Sprayer' && '💧'}
                  {cat.name === 'Power Tiller' && '⚙️'}
                </div>
                <span className="text-sm uppercase tracking-wider">{cat.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 p-4 bg-stone-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">
            Switch to owner mode →
          </div>
        </aside>

        {/* Categories - Mobile */}
        <div className="md:hidden flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-6 py-4 rounded-3xl whitespace-nowrap transition-all border-2 ${
                activeCategory === cat.name 
                  ? 'bg-accent border-primary text-primary font-black shadow-md' 
                  : 'bg-card-bg border-stone-100 text-stone-400'
              }`}
            >
              <cat.icon size={20} />
              <span className="text-xs uppercase tracking-widest">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Feed Area */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Nearby Machinery</h2>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">
                {activeCategory === 'All' ? 'Showing all machinery' : `Showing available ${activeCategory.toLowerCase()}s`} in Mandya
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredMachines.length === 0 ? (
              <div className="py-20 text-center bg-card-bg rounded-3xl shadow-sm border border-stone-100">
                <Settings className="mx-auto text-stone-200 mb-4 animate-spin-slow" size={64} />
                <p className="text-stone-400 font-bold uppercase tracking-widest">No listings available</p>
                {activeCategory !== 'All' && (
                  <button onClick={() => setActiveCategory('All')} className="mt-4 text-xs font-black text-primary uppercase underline underline-offset-4">Browse all categories</button>
                )}
              </div>
            ) : (
              filteredMachines.map(machine => (
                <motion.div 
                  layoutId={machine.id}
                  key={machine.id}
                  onClick={() => onSelect(machine)}
                  className="bg-card-bg rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-stone-100 flex flex-col md:flex-row group cursor-pointer"
                >
                  <div className="relative w-full md:w-56 h-48 md:h-auto overflow-hidden shrink-0">
                    <img 
                      src={machine.imageUrl || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc'} 
                      alt={machine.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[9px] uppercase font-black">
                      {machine.condition || 'Premium'}
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-secondary tracking-wider">{machine.category}</span>
                          <h3 className="font-black text-xl italic tracking-tight text-primary uppercase mt-1">{machine.name}</h3>
                        </div>
                        <span className="bg-accent text-primary px-3 py-1 rounded-md text-[10px] font-black uppercase ring-1 ring-primary/20">
                          Available
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-medium tracking-tight">Owned by: {machine.ownerName || 'Verified Owner'} • {machine.distance || '1.2 km'} away</p>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-primary italic">₹{machine.hourlyRate}</span>
                        <span className="text-[10px] font-bold text-stone-400 uppercase">/ hour</span>
                      </div>
                      <button className="bg-secondary text-primary px-6 py-2 rounded-xl font-black italic uppercase tracking-wider text-xs shadow-md border-b-2 border-primary/10 hover:translate-y-[-2px] active:translate-y-0 transition-all">
                        Rent Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Right Sidebar - Desktop summary view if something selected? */}
        <aside className="hidden md:flex flex-col gap-6">
          <div className="bg-card-bg rounded-2xl p-6 shadow-md border border-stone-100">
            <h2 className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 border-b pb-4 mb-4">Quick Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Avg Price</span>
                <span className="font-black italic text-primary">₹550/hr</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Total Listings</span>
                <span className="font-black italic text-primary">{machines.length}</span>
              </div>
            </div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-6 border-2 border-dashed border-primary/20 flex flex-col items-center text-center">
            <Calendar className="text-primary/40 mb-3" size={32} />
            <p className="font-black italic uppercase text-primary text-xs leading-tight">Plan your harvest ahead. Book now!</p>
          </div>
        </aside>
      </main>
    </motion.div>
  );
}

function DetailsScreen({ machine, onBack, onBook }: { machine: Machine, onBack: () => void, onBook: () => void }) {
  const [duration, setDuration] = useState(4);
  const [unit, setUnit] = useState<'Hours' | 'Days'>('Hours');
  const [booking, setBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = machine.imageUrls && machine.imageUrls.length > 0 
    ? [machine.imageUrl, ...machine.imageUrls] 
    : [machine.imageUrl || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc'];

  const total = unit === 'Hours' ? duration * machine.hourlyRate : duration * machine.dailyRate;

  const handleBooking = async () => {
    if (!auth.currentUser) return;
    setBooking(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        machineId: machine.id,
        machineName: machine.name,
        farmerId: auth.currentUser.uid,
        ownerId: machine.ownerId,
        status: 'Pending',
        totalAmount: total,
        startDate: Date.now(),
        duration,
        durationUnit: unit,
        createdAt: serverTimestamp()
      });
      onBook();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'bookings');
    } finally {
      setBooking(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-10"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-bg-soft w-full max-w-5xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
      >
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-10 text-primary hover:scale-110 transition-transform"
        >
          <X size={24} />
        </button>

        <div className="w-full md:w-1/2 h-80 md:h-auto shrink-0 relative group">
          <AnimatePresence mode="wait">
            <motion.img 
              key={activeImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={images[activeImageIndex]} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </AnimatePresence>
          
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2 z-10">
            {images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${activeImageIndex === idx ? 'bg-secondary w-6' : 'bg-white/50'}`}
              />
            ))}
          </div>

          {images.length > 1 && (
            <>
              <button 
                onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
          <div className="absolute bottom-16 left-8 text-white">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-secondary text-primary px-3 py-1 rounded-full">{machine.category}</span>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase mt-4">{machine.name}</h1>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar bg-white">
          <section className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Verified Machinery</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-primary">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase tracking-tight text-primary">{machine.ownerName || 'Shivanna K.'}</h3>
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Registered Owner</p>
                  </div>
                </div>
              </div>
              <div className="bg-secondary p-4 rounded-3xl rotate-3 shadow-md border-b-4 border-primary/20">
                <Star size={24} className="fill-primary text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Hourly Rate</p>
                <p className="text-2xl font-black text-primary italic">₹{machine.hourlyRate}</p>
              </div>
              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Condition</p>
                <p className="text-lg font-black italic text-primary uppercase">{machine.condition}</p>
              </div>
            </div>

            <div className="bg-[#FFFDE7] p-8 rounded-3xl border-2 border-dashed border-secondary">
              <h4 className="text-sm font-black uppercase italic tracking-widest text-primary mb-6">Booking Summary</h4>
              
              <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-2xl mb-6 ring-1 ring-secondary/30">
                {['Hours', 'Days'].map(u => (
                  <button 
                    key={u}
                    onClick={() => setUnit(u as 'Hours' | 'Days')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${unit === u ? 'bg-secondary text-primary shadow-sm' : 'text-stone-400'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setDuration(Math.max(1, duration - 1))} className="w-12 h-12 bg-white border-2 border-secondary rounded-2xl flex items-center justify-center text-2xl font-black active:scale-95 transition-all">-</button>
                <div className="text-center">
                  <span className="text-4xl font-black italic text-primary">{duration}</span>
                  <span className="text-[10px] text-stone-400 uppercase font-black ml-2 tracking-widest">{unit}</span>
                </div>
                <button onClick={() => setDuration(duration + 1)} className="w-12 h-12 bg-white border-2 border-secondary rounded-2xl flex items-center justify-center text-2xl font-black active:scale-95 transition-all">+</button>
              </div>

              <div className="space-y-3 pt-6 border-t border-secondary/20">
                <div className="flex justify-between text-xs font-bold text-stone-500 uppercase">
                  <span>Base Estimate</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-primary uppercase italic pt-2">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowConfirm(true)}
                className="w-full h-16 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest mt-8 shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98]"
              >
                Confirm Rent
              </button>
              <p className="text-[9px] text-center text-stone-400 font-bold uppercase tracking-widest mt-4">Pay the owner directly after work completion</p>
            </div>
          </section>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl border-2 border-primary/10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-accent text-primary rounded-[32px] flex items-center justify-center mb-6 shadow-sm ring-1 ring-primary/10">
                  <Clock size={40} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-primary leading-tight">Confirm Your<br />Selection</h3>
                <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mt-4 mb-8 italic">Please review your rental summary</p>
                
                <div className="w-full bg-stone-50 rounded-3xl p-6 mb-8 space-y-4 border border-stone-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-stone-400">Machine</span>
                    <span className="font-black italic text-primary uppercase">{machine.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-stone-400">Duration</span>
                    <span className="font-black italic text-primary uppercase">{duration} {unit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-stone-200">
                    <span className="text-[10px] font-black uppercase text-stone-400">Total Investment</span>
                    <span className="text-2xl font-black italic text-primary">₹{total}</span>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-4">
                  <button 
                    onClick={handleBooking}
                    disabled={booking}
                    className="w-full h-16 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {booking ? 'Securing...' : 'Verify & Rent'}
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    disabled={booking}
                    className="w-full h-14 bg-white text-stone-400 font-black uppercase tracking-widest rounded-2xl border-2 border-stone-100 hover:bg-stone-50 transition-all"
                  >
                    Back to Edit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ManageListingsScreen() {
  const [myMachines, setMyMachines] = useState<Machine[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'machines'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Machine));
      setMyMachines(list);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'machines'));
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this listing?")) {
      try {
        await updateDoc(doc(db, 'machines', id), { available: false });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `machines/${id}`);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-6 md:pt-12">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-black italic uppercase italic tracking-tighter text-primary leading-none">Your Fleet</h1>
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] mt-3">Manage your machinery and earnings</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-primary text-white rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all hover:bg-primary-dark"
        >
          <Plus size={32} />
        </button>
      </header>

      {loading ? (
        <div className="py-20 text-center font-black uppercase text-stone-300 animate-pulse">Syncing with hub...</div>
      ) : myMachines.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center bg-white rounded-[40px] border border-dashed border-stone-200">
          <Tractor className="text-stone-100 mb-8" size={120} />
          <p className="text-stone-400 font-black uppercase tracking-[0.2em] max-w-xs leading-relaxed mb-8">No machinery registered under your name yet.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs"
          >
            Register First Machine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-24">
          {myMachines.map(machine => (
            <motion.div 
              layoutId={machine.id}
              key={machine.id} 
              className="bg-white rounded-[40px] p-6 md:p-8 border border-stone-100 shadow-sm flex flex-col md:flex-row gap-6 relative group"
            >
              <div className="w-full md:w-48 h-40 rounded-3xl overflow-hidden shrink-0 border border-stone-50">
                <img src={machine.imageUrl} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{machine.category}</span>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">{machine.name}</h3>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 ${machine.available ? 'bg-green-50 text-green-700 border-green-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>
                    {machine.available ? 'Live On Network' : 'Currently Offline'}
                  </div>
                </div>

                <div className="flex gap-8 mb-6">
                  <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Rate</p>
                    <p className="font-black italic text-primary">₹{machine.hourlyRate}/hr</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Growth</p>
                    <p className="font-black italic text-green-600">+12%</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setEditingMachine(machine)}
                    className="flex-1 h-12 bg-stone-50 text-primary font-black uppercase tracking-widest text-[10px] rounded-2xl border border-stone-100 hover:bg-accent transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} /> Edit Details
                  </button>
                  <button 
                    onClick={() => handleDelete(machine.id)}
                    className="w-12 h-12 bg-stone-50 text-red-400 rounded-2xl flex items-center justify-center hover:bg-red-50 transition-all border border-stone-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(isAdding || editingMachine) && (
          <MachineForm 
            machine={editingMachine || undefined}
            onClose={() => { setIsAdding(false); setEditingMachine(null); }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MachineForm({ machine, onClose }: { machine?: Machine, onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: machine?.name || '',
    category: machine?.category || 'Tractor',
    hourlyRate: machine?.hourlyRate || 0,
    dailyRate: machine?.dailyRate || 0,
    imageUrl: machine?.imageUrl || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc',
    condition: machine?.condition || 'Excellent',
    available: machine?.available ?? true,
    district: machine?.district || 'Mandya',
    distance: machine?.distance || '0.0 km'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);

    try {
      if (machine) {
        await updateDoc(doc(db, 'machines', machine.id), {
          ...formData,
          hourlyRate: Number(formData.hourlyRate),
          dailyRate: Number(formData.dailyRate),
        });
      } else {
        await addDoc(collection(db, 'machines'), {
          ...formData,
          ownerId: auth.currentUser.uid,
          ownerName: auth.currentUser.displayName,
          hourlyRate: Number(formData.hourlyRate),
          dailyRate: Number(formData.dailyRate),
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (e) {
      handleFirestoreError(e, machine ? OperationType.UPDATE : OperationType.CREATE, 'machines');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-primary/20 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 pb-4 flex justify-between items-center bg-stone-50 border-b border-stone-100">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-primary">{machine ? 'Edit Yantra' : 'Register Yantra'}</h2>
          <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-stone-400"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1 mb-2 block">Machine Identity</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Deere 5310"
                className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 font-black italic uppercase text-primary placeholder:text-stone-200 focus:border-primary/20 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1 mb-2 block">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 font-black italic uppercase tracking-widest text-primary text-xs outline-none"
                >
                  {CATEGORIES.filter(c => c.name !== 'All').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  <option value="Power Tiller">Power Tiller</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1 mb-2 block">Condition</label>
                <select 
                  value={formData.condition}
                  onChange={e => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 font-black italic uppercase tracking-widest text-primary text-xs outline-none"
                >
                  {['Premium', 'Excellent', 'Good', 'Work Ready'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1 mb-2 block">Hourly Rate (₹)</label>
                <input 
                  type="number"
                  required
                  value={formData.hourlyRate}
                  onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 font-black italic uppercase text-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1 mb-2 block">Daily Rate (₹)</label>
                <input 
                  type="number"
                  required
                  value={formData.dailyRate}
                  onChange={e => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                  className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 font-black italic uppercase text-primary outline-none"
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1 mb-2 block">Photo URL</label>
              <div className="relative">
                <input 
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 pl-14 font-medium text-stone-600 text-xs outline-none transition-all"
                />
                <ImageIcon size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 h-16 bg-stone-100 text-stone-400 font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-stone-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="flex-[2] h-16 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest shadow-xl shadow-primary/10 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Transmitting...' : machine ? 'Update Hub' : 'Register Hub'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'bookings'), where('farmerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      setBookings(list);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bookings'));
    return () => unsubscribe();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-6 md:pt-12">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-black italic uppercase italic tracking-tighter text-primary leading-none">Your History</h1>
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] mt-3">Active rentals and past records</p>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-primary"><Scythe size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">Active</p>
              <p className="font-black italic text-primary">{bookings.filter(b => b.status === 'Accepted').length}</p>
            </div>
          </div>
        </div>
      </header>
      
      {loading ? (
        <div className="py-20 text-center font-black uppercase text-stone-300 animate-pulse">Scanning records...</div>
      ) : bookings.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center bg-white rounded-[40px] border border-dashed border-stone-200">
          <Calendar className="text-stone-100 mb-8" size={120} />
          <p className="text-stone-400 font-black uppercase tracking-[0.2em] max-w-xs leading-relaxed">The fields are quiet. Rent machinery to begin your journey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
          {bookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(booking => (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={booking.id} 
              className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[9px] font-black bg-stone-100 px-2 py-1 rounded tracking-[0.2em] text-stone-400 mb-2 block w-max">#KNT-{booking.id.slice(0,4).toUpperCase()}</span>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary leading-tight">{booking.machineName}</h3>
                  </div>
                  <StatusChip status={booking.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-8 py-6 border-y border-stone-50">
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Duration</p>
                    <p className="font-black italic uppercase text-sm text-stone-700">{booking.duration} {booking.durationUnit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Investment</p>
                    <p className="font-black italic uppercase text-lg text-primary">₹{booking.totalAmount}</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
                      <Clock size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{booking.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) || 'Pending'}</span>
                  </div>
                  <button className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-primary px-4 py-2 rounded-xl border border-stone-100 hover:bg-secondary transition-colors">Details</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StatusChip({ status }: { status: string }) {
  const colors = {
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Accepted: 'bg-green-50 text-green-700 border-green-200',
    Declined: 'bg-red-50 text-red-700 border-red-200',
    Completed: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}

function ProfileScreen({ user, onLogout }: { user: FirebaseUser | null, onLogout: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-4xl mx-auto p-6 md:pt-12"
    >
      <header className="flex flex-col items-center mb-16">
        <div className="relative group">
          <div className="w-40 h-40 bg-primary rounded-[60px] flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden rotate-3 transition-transform group-hover:rotate-0 duration-500">
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl font-black text-white italic">{user?.displayName?.[0] || 'U'}</span>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 bg-secondary p-4 rounded-3xl shadow-xl border-4 border-white rotate-12">
            <CheckCircle2 size={32} className="text-primary" />
          </div>
        </div>
        <div className="text-center mt-10">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-primary">{user?.displayName || 'Farmer Partner'}</h2>
          <p className="text-stone-400 font-black uppercase text-[10px] tracking-[0.3em] mt-3">Agricultural Hub • Mandya</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm flex flex-col items-center">
          <p className="text-3xl font-black italic text-primary">14</p>
          <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mt-2">Active Rents</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm flex flex-col items-center">
          <p className="text-3xl font-black italic text-secondary">₹18.5k</p>
          <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mt-2">Total Yield</p>
        </div>
        <div className="hidden md:flex bg-primary p-8 rounded-[40px] border border-stone-100 shadow-xl flex-col items-center text-white">
          <p className="text-3xl font-black italic">A+</p>
          <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-2">Farmer Rating</p>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-stone-100 shadow-sm divide-y divide-stone-50 overflow-hidden mb-12">
        <MenuItem icon={User} label="Digital Farm Records" />
        <MenuItem icon={MapPin} label="Irrigation Zones" />
        <div 
          onClick={async () => {
            if (!auth.currentUser) return;
            const data = [
              { 
                name: 'John Deere 5310', 
                category: 'Tractor', 
                hourlyRate: 500, 
                dailyRate: 3500, 
                ownerId: auth.currentUser.uid, 
                ownerName: auth.currentUser.displayName, 
                available: true, 
                condition: 'Excellent', 
                distance: '0.8 km', 
                district: 'Mandya', 
                imageUrl: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc',
                imageUrls: [
                  'https://images.unsplash.com/photo-1592919016335-901ed4771960',
                  'https://images.unsplash.com/photo-1593113598332-cd288d6494ee'
                ]
              },
              { 
                name: 'Kubota Harvester', 
                category: 'Harvester', 
                hourlyRate: 1200, 
                dailyRate: 8000, 
                ownerId: auth.currentUser.uid, 
                ownerName: auth.currentUser.displayName, 
                available: true, 
                condition: 'Good', 
                distance: '2.4 km', 
                district: 'Mandya', 
                imageUrl: 'https://images.unsplash.com/photo-1594732832278-abd644401416',
                imageUrls: [
                  'https://images.unsplash.com/photo-1595436064132-75eb9255799a'
                ]
              },
              { 
                name: 'New Holland 3630', 
                category: 'Tractor', 
                hourlyRate: 450, 
                dailyRate: 3200, 
                ownerId: auth.currentUser.uid, 
                ownerName: auth.currentUser.displayName, 
                available: true, 
                condition: 'Premium', 
                distance: '1.2 km', 
                district: 'Mandya', 
                imageUrl: 'https://images.unsplash.com/photo-1530268577195-7731275ff0d9' 
              },
              { 
                name: 'Power Master Sprayer', 
                category: 'Sprayer', 
                hourlyRate: 200, 
                dailyRate: 1500, 
                ownerId: auth.currentUser.uid, 
                ownerName: auth.currentUser.displayName, 
                available: true, 
                condition: 'Excellent', 
                distance: '3.1 km', 
                district: 'Mandya', 
                imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0' 
              },
              { 
                name: 'Viking Tiller', 
                category: 'Power Tiller', 
                hourlyRate: 300, 
                dailyRate: 2200, 
                ownerId: auth.currentUser.uid, 
                ownerName: auth.currentUser.displayName, 
                available: true, 
                condition: 'Verified', 
                distance: '4.5 km', 
                district: 'Mandya', 
                imageUrl: 'https://images.unsplash.com/photo-1622325433010-85f094595246' 
              }
            ];
            for (const item of data) {
              await addDoc(collection(db, 'machines'), item);
            }
            alert('Machinery network seeded successfully!');
            window.location.reload();
          }}
          className="flex items-center justify-between p-8 active:bg-accent transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Sprout size={28} />
            </div>
            <span className="font-black italic uppercase tracking-widest text-stone-600 text-sm">Seed Machinery Data</span>
          </div>
          <ChevronRight size={20} className="text-stone-200" />
        </div>
        <MenuItem icon={AlertCircle} label="Help Center" />
      </div>

      <button 
        onClick={onLogout}
        className="w-full h-20 bg-stone-100 text-stone-400 font-black uppercase tracking-[0.2em] rounded-[32px] hover:bg-stone-200 active:scale-[0.99] transition-all text-xs"
      >
        Close Hub Access
      </button>

      <div className="mt-16 text-center">
        <p className="text-[9px] font-black text-stone-200 uppercase tracking-[0.5em] italic">Namma-Yantra Network v1.0.4 • mandya_cluster</p>
      </div>
    </motion.div>
  );
}

function MenuItem({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center justify-between p-6 active:bg-stone-50 transition-all cursor-pointer group">
      <div className="flex items-center gap-5">
        <div className="text-stone-300 group-hover:text-primary transition-colors">
          <Icon size={24} />
        </div>
        <span className="font-black italic uppercase tracking-tight text-stone-600">{label}</span>
      </div>
      <ChevronRight size={18} className="text-stone-200 group-hover:translate-x-1 transition-transform" />
    </div>
  );
}

function Settings({ className, size }: { className?: string, size?: number }) {
  return <Scythe className={className} size={size} />;
}
