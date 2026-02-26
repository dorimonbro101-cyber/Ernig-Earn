import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Copy,
  Plus,
  Search,
  Menu,
  X,
  Eye,
  EyeOff,
  Bell,
  Home,
  Award,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Task, 
  Transaction, 
  SupportTicket, 
  AppSettings, 
  Plan
} from './types';
import { db, auth } from './firebase';
import { ref, onValue, set, push, update, get } from 'firebase/database';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

// Initial Settings
const DEFAULT_SETTINGS: AppSettings = {
  websiteNotice: "Welcome to ERNIG EARN! Complete tasks and earn money daily.",
  minWithdrawal: 100,
  maxWithdrawalPerDay: 5000,
  bkashNumber: "01700000000",
  nagadNumber: "01800000000",
  depositInstructions: "Send money to our bKash/Nagad number and provide the Transaction ID.",
  referralLevels: 3,
  referralBonuses: [
    { level: 1, amount: 10, type: 'percentage' },
    { level: 2, amount: 5, type: 'percentage' },
    { level: 3, amount: 2, type: 'percentage' }
  ],
  themeColor: '#4F46E5', // Indigo 600
  maintenanceMode: false
};

// Initial Plans
const INITIAL_PLANS: Plan[] = [
  { id: 'p1', name: 'Free Plan', price: 0, dailyTasks: 1, dailyEarning: 2, validityDays: 365, active: true },
  { id: 'p2', name: 'Silver Plan', price: 500, dailyTasks: 5, dailyEarning: 25, validityDays: 30, active: true },
  { id: 'p3', name: 'Gold Plan', price: 1000, dailyTasks: 10, dailyEarning: 60, validityDays: 30, active: true },
  { id: 'p4', name: 'Diamond Plan', price: 2000, dailyTasks: 25, dailyEarning: 150, validityDays: 30, active: true },
];

// Initial Tasks
const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Watch Video Ad 1', description: 'Watch a 30-second video to earn.', amount: 5, timeRequired: 30, link: '#', category: 'Video', active: true, imageUrl: 'https://picsum.photos/seed/task1/400/200' },
  { id: '2', title: 'Watch Video Ad 2', description: 'Watch a 30-second video to earn.', amount: 5, timeRequired: 30, link: '#', category: 'Video', active: true, imageUrl: 'https://picsum.photos/seed/task2/400/200' },
  { id: '3', title: 'Watch Video Ad 3', description: 'Watch a 30-second video to earn.', amount: 5, timeRequired: 30, link: '#', category: 'Video', active: true, imageUrl: 'https://picsum.photos/seed/task3/400/200' },
];

export default function App() {
  // --- State ---
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonator, setImpersonator] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [view, setView] = useState<'auth' | 'dashboard' | 'admin'>('auth');
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [theme, setTheme] = useState(settings.themeColor);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Firebase Sync ---
  useEffect(() => {
    const unsubSettings = onValue(ref(db, 'settings'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.val());
      else set(ref(db, 'settings'), DEFAULT_SETTINGS);
    });

    const unsubUsers = onValue(ref(db, 'users'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUsers(Object.values(data));
      }
    });

    const unsubTasks = onValue(ref(db, 'tasks'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTasks(Object.values(data));
      } else {
        INITIAL_TASKS.forEach(t => set(ref(db, `tasks/${t.id}`), t));
      }
    });

    const unsubPlans = onValue(ref(db, 'plans'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPlans(Object.values(data));
      } else {
        INITIAL_PLANS.forEach(p => set(ref(db, `plans/${p.id}`), p));
      }
    });

    const unsubTransactions = onValue(ref(db, 'transactions'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTransactions(Object.values(data));
      }
    });

    const unsubTickets = onValue(ref(db, 'tickets'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTickets(Object.values(data));
      }
    });

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        onValue(ref(db, `users/${firebaseUser.uid}`), (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setCurrentUser(userData);
            if (!impersonator) {
              setView(userData.isAdmin ? 'admin' : 'dashboard');
            }
          }
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setView('auth');
        setLoading(false);
      }
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubTasks();
      unsubPlans();
      unsubTransactions();
      unsubTickets();
      unsubAuth();
    };
  }, [impersonator]);

  useEffect(() => {
    setTheme(settings.themeColor);
  }, [settings.themeColor]);

  // --- Auth Handlers ---
  const handleRegister = async (username: string, phone: string, pass: string, refCode?: string) => {
    try {
      // Check if username exists in DB
      const usernameSnapshot = await get(ref(db, 'users'));
      if (usernameSnapshot.exists()) {
        const allUsers = Object.values(usernameSnapshot.val()) as User[];
        if (allUsers.find(u => u.username === username)) {
          alert('Username already exists');
          return;
        }
      }

      const email = `${username.toLowerCase()}@ernig.com`; // Dummy email for Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      const newUser: User = {
        id: firebaseUser.uid,
        username,
        phone,
        password: pass,
        balance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        referralCode: username.toLowerCase().replace(/\s/g, ''),
        referredBy: refCode || null,
        status: 'active',
        createdAt: Date.now(),
        isAdmin: false
      };

      await set(ref(db, `users/${firebaseUser.uid}`), newUser);
      // setUsers and setCurrentUser will be handled by onValue listeners
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogin = async (username: string, pass: string) => {
    try {
      const email = `${username.toLowerCase()}@ernig.com`;
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      alert('Invalid credentials or user not found');
    }
  };

  const handleLogout = async () => {
    if (impersonator) {
      setCurrentUser(impersonator);
      setImpersonator(null);
      setView('admin');
    } else {
      await signOut(auth);
      setView('auth');
    }
    setActiveTab('home');
  };

  // --- Admin Handlers ---
  const impersonateUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && currentUser?.isAdmin) {
      setImpersonator(currentUser);
      setCurrentUser(user);
      setView('dashboard');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'ernig2026') {
      // If already logged in as a normal user, we just switch view
      // If not logged in, we need to log in as admin
      // For simplicity, we assume the admin user is already created in Firebase with username 'admin'
      if (currentUser?.isAdmin) {
        setView('admin');
      } else {
        handleLogin('admin', 'ernig2026'); // Assume admin/ernig2026 exists
      }
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Invalid Admin Password');
    }
  };

  // --- Render Helpers ---
  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="text-highlight animate-spin" size={48} />
          <p className="text-slate-400 font-bold tracking-widest animate-pulse">LOADING ERNIG EARN...</p>
        </div>
      </div>
    );
  }

  if (settings.maintenanceMode && !currentUser?.isAdmin) {
    return <MaintenanceScreen />;
  }
  if (view === 'admin') {
    return (
      <AdminPanel 
        users={users} 
        setUsers={setUsers}
        tasks={tasks}
        setTasks={setTasks}
        plans={plans}
        setPlans={setPlans}
        transactions={transactions}
        setTransactions={setTransactions}
        tickets={tickets}
        setTickets={setTickets}
        settings={settings}
        setSettings={setSettings}
        onLogout={() => setView(currentUser ? 'dashboard' : 'auth')}
        impersonateUser={impersonateUser}
      />
    );
  }

  if (!currentUser && view === 'auth') {
    return (
      <div className="min-h-screen bg-primary">
        <Header onAdminClick={() => setShowAdminLogin(true)} />
        <AuthScreen mode={authMode} setMode={setAuthMode} onLogin={handleLogin} onRegister={handleRegister} />
        {showAdminLogin && <AdminLoginModal password={adminPassword} setPassword={setAdminPassword} onSubmit={handleAdminLogin} onClose={() => setShowAdminLogin(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-slate-200 font-sans pb-20 md:pb-0">
      <Header onAdminClick={() => setShowAdminLogin(true)} user={currentUser} />
      
      {/* Impersonation Banner */}
      {impersonator && (
        <div className="bg-amber-500 text-white py-2 px-4 flex justify-between items-center sticky top-16 z-50 shadow-md">
          <span className="text-sm font-medium">Logged in as: {currentUser?.username}</span>
          <button 
            onClick={handleLogout}
            className="bg-white text-amber-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-amber-50 transition-colors"
          >
            Return to Admin
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto pt-4">
        <UserDashboard 
          user={currentUser!} 
          users={users}
          setUsers={setUsers}
          tasks={tasks}
          plans={plans}
          transactions={transactions}
          setTransactions={setTransactions}
          tickets={tickets}
          setTickets={setTickets}
          settings={settings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
      </div>

      {showAdminLogin && <AdminLoginModal password={adminPassword} setPassword={setAdminPassword} onSubmit={handleAdminLogin} onClose={() => setShowAdminLogin(false)} />}

      {/* Mobile Navigation */}
      {(!currentUser?.isAdmin || impersonator) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-3 px-2 md:hidden z-40">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20} />} label="Home" theme={theme} />
          <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<ClipboardList size={20} />} label="Tasks" theme={theme} />
          <NavButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<Award size={20} />} label="Plans" theme={theme} />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon size={20} />} label="Profile" theme={theme} />
        </nav>
      )}

      {/* Theme Switcher Floating Button */}
      <button 
        onClick={() => {
          const colors = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777'];
          const nextColor = colors[(colors.indexOf(theme) + 1) % colors.length];
          setSettings({ ...settings, themeColor: nextColor });
        }}
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white z-50 transition-all hover:scale-110"
        style={{ backgroundColor: theme }}
      >
        <Settings size={24} />
      </button>

      {/* Support Floating Button */}
      <button 
        onClick={() => setActiveTab('support')}
        className="fixed bottom-24 left-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white z-50 transition-all hover:scale-110"
        style={{ backgroundColor: theme }}
      >
        <MessageSquare size={24} />
      </button>
    </div>
  );
}

// --- Sub-Components ---

function NavButton({ active, onClick, icon, label, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? '' : 'text-slate-400'}`}
      style={{ color: active ? theme : undefined }}
    >
      <div className={`p-1 rounded-xl ${active ? 'bg-opacity-10' : ''}`} style={{ backgroundColor: active ? theme : 'transparent' }}>
        {icon}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

// Placeholder components to be implemented in next steps
function Header({ onAdminClick, user }: { onAdminClick: () => void, user?: User | null }) {
  return (
    <header className="bg-secondary/80 backdrop-blur-lg border-b border-white/5 px-6 py-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-highlight to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-highlight/20">
          <Award size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-none tracking-tight">ERNIG EARN</h1>
          <p className="text-[10px] text-highlight font-bold uppercase tracking-widest mt-0.5">Real & Fast</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {!user?.isAdmin && (
          <button 
            onClick={onAdminClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 hover:bg-accent text-slate-300 hover:text-white transition-all text-xs font-bold border border-white/5"
          >
            <Settings size={14} />
            <span>Admin</span>
          </button>
        )}
        
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user.username}</p>
              <p className="text-[10px] text-emerald-400 font-bold">৳{user.balance.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-highlight p-0.5">
              <div className="w-full h-full bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function AdminLoginModal({ password, setPassword, onSubmit, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-primary/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-sm p-8 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-highlight mb-4 shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Access</h2>
          <p className="text-slate-400 text-xs mt-1">Enter password to continue</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <ShieldCheck size={18} />
            </div>
            <input
              type="password"
              placeholder="Admin Password"
              className="w-full bg-primary/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-highlight transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full btn-gradient py-4"
          >
            Login as Admin
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AuthScreen({ mode, setMode, onLogin, onRegister }: any) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(username, password);
    } else {
      onRegister(username, phone, password, refCode);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-highlight/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 md:p-10 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-black/50">
            <div className="w-14 h-14 bg-gradient-to-br from-highlight to-rose-600 rounded-2xl flex items-center justify-center text-white">
              <Award size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white font-bangla">
            {mode === 'login' ? 'আবার স্বাগতম' : 'অ্যাকাউন্ট তৈরি করুন'}
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {mode === 'login' ? 'Welcome back to ERNIG EARN' : 'Join the best earning platform'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-highlight transition-colors">
              <UserIcon size={20} />
            </div>
            <input
              type="text"
              placeholder="ইউজার নেইম"
              className="w-full bg-primary/40 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:bg-primary/60 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-highlight transition-colors">
                <Bell size={20} />
              </div>
              <input
                type="tel"
                placeholder="মোবাইল নম্বর"
                className="w-full bg-primary/40 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:bg-primary/60 transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-highlight transition-colors">
              <ShieldCheck size={20} />
            </div>
            <input
              type="password"
              placeholder="পাসওয়ার্ড"
              className="w-full bg-primary/40 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:bg-primary/60 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-highlight transition-colors">
                <Users size={20} />
              </div>
              <input
                type="text"
                placeholder="রেফার কোড (ঐচ্ছিক)"
                className="w-full bg-primary/40 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:bg-primary/60 transition-all"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded border-white/10 bg-primary/50 text-highlight focus:ring-highlight" />
                আমাকে মনে রাখুন
              </label>
              <button type="button" className="text-sm text-highlight font-bold hover:underline">
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-gradient py-4.5 flex items-center justify-center gap-3 group"
          >
            {mode === 'login' ? (
              <>
                <LogOut size={22} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                <span className="font-bangla">সাইন ইন করুন</span>
              </>
            ) : (
              <>
                <Plus size={22} className="group-hover:scale-110 transition-transform" />
                <span className="font-bangla">এখন নিবন্ধন করুন</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {mode === 'login' ? 'কোনো অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?'}
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-highlight font-bold hover:underline font-bangla"
            >
              {mode === 'login' ? 'এখানে নিবন্ধন করুন' : 'এখানে লগইন করুন'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
function UserDashboard({ 
  user, 
  users,
  setUsers,
  tasks, 
  plans,
  transactions, 
  setTransactions, 
  tickets, 
  setTickets, 
  settings, 
  activeTab, 
  setActiveTab, 
  onLogout 
}: any) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const stats = useMemo(() => {
    const userTransactions = transactions.filter((t: any) => t.userId === user.id);
    const userRefs = users.filter((u: any) => u.referredBy === user.referralCode);
    return {
      tasksCompleted: userTransactions.filter((t: any) => t.type === 'task').length,
      referrals: userRefs.length,
      totalEarned: user.totalEarnings,
      totalWithdrawn: user.totalWithdrawals
    };
  }, [user, transactions, users]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab user={user} stats={stats} onDeposit={() => setShowDeposit(true)} onWithdraw={() => setShowWithdraw(true)} settings={settings} setActiveTab={setActiveTab} />;
      case 'tasks': return <TasksTab user={user} setUsers={setUsers} tasks={tasks} transactions={transactions} setTransactions={setTransactions} settings={settings} plans={plans} />;
      case 'plans': return <PlansTab user={user} setUsers={setUsers} plans={plans} transactions={transactions} setTransactions={setTransactions} settings={settings} />;
      case 'history': return <HistoryTab user={user} transactions={transactions} settings={settings} />;
      case 'profile': return <ProfileTab user={user} onLogout={onLogout} settings={settings} />;
      case 'support': return <SupportTab user={user} tickets={tickets} setTickets={setTickets} settings={settings} />;
      default: return <HomeTab user={user} stats={stats} onDeposit={() => setShowDeposit(true)} onWithdraw={() => setShowWithdraw(true)} settings={settings} />;
    }
  };

  return (
    <div className="pb-24 min-h-[calc(100vh-80px)]">
      {/* Main View */}
      <main className="p-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      {showDeposit && <DepositModal user={user} settings={settings} onClose={() => setShowDeposit(false)} onSubmit={(t: any) => setTransactions([...transactions, t])} />}
      {showWithdraw && <WithdrawModal user={user} settings={settings} onClose={() => setShowWithdraw(false)} onSubmit={(t: any) => setTransactions([...transactions, t])} />}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-secondary/90 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={22} />} label="হোম" />
        <NavItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<ClipboardList size={22} />} label="কাজ" />
        <NavItem active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<Award size={22} />} label="প্ল্যান" />
        <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={22} />} label="হিস্ট্রি" />
        <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon size={22} />} label="প্রোফাইল" />
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${active ? 'text-highlight' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest font-bangla ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -top-4 w-1 h-1 bg-highlight rounded-full shadow-[0_0_10px_#E94560]"
        />
      )}
    </button>
  );
}

function HomeTab({ user, stats, onDeposit, onWithdraw, settings, setActiveTab }: any) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div 
        className="rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden border border-white/10"
        style={{ background: `linear-gradient(135deg, ${settings.themeColor}, #1e1b4b)` }}
      >
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-40 h-40 bg-highlight/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest font-bangla">বর্তমান ব্যালেন্স</span>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-md">
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          
          <div className="text-5xl font-bold mb-10 flex items-baseline gap-2">
            <span className="text-2xl font-medium text-white/60">৳</span>
            <span className="tracking-tight">
              {showBalance ? user.balance.toFixed(2) : '••••••'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onDeposit}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10 shadow-lg group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
              <span className="font-bangla">ডিপোজিট</span>
            </button>
            <button 
              onClick={onWithdraw}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10 shadow-lg group"
            >
              <Wallet size={20} className="group-hover:scale-110 transition-transform" /> 
              <span className="font-bangla">উত্তোলন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-bangla">মোট উপার্জন</p>
            <p className="text-xl font-bold text-white tracking-tight">৳{stats.totalEarned.toFixed(2)}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-highlight/10 text-highlight rounded-2xl flex items-center justify-center shadow-inner">
            <ArrowUpCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-bangla">মোট উত্তোলন</p>
            <p className="text-xl font-bold text-white tracking-tight">৳{stats.totalWithdrawn.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 font-bangla">
          <div className="w-1.5 h-5 rounded-full bg-highlight" />
          দ্রুত কার্যক্রম
        </h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <QuickAction icon={<ClipboardList className="text-amber-400" />} label="কাজ" color="bg-amber-400/10" onClick={() => setActiveTab('tasks')} />
          <QuickAction icon={<Plus className="text-highlight" />} label="ডিপোজিট" color="bg-highlight/10" onClick={onDeposit} />
          <QuickAction icon={<Wallet className="text-emerald-400" />} label="উত্তোলন" color="bg-emerald-400/10" onClick={onWithdraw} />
          <QuickAction icon={<Award className="text-violet-400" />} label="প্ল্যান" color="bg-violet-400/10" onClick={() => setActiveTab('plans')} />
        </div>
      </div>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-highlight to-rose-600 rounded-[32px] p-6 text-white flex items-center justify-between shadow-2xl shadow-highlight/20 relative overflow-hidden group cursor-pointer">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Limited Offer</p>
          <h4 className="font-bold text-xl leading-tight mt-2 font-bangla">৩০০০ টাকা ডিপোজিট করলে<br/>১৫০০ টাকা বোনাস</h4>
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md relative z-10 group-hover:rotate-12 transition-transform">
          <Award size={36} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg border border-white/5 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors font-bangla">{label}</span>
    </button>
  );
}

function TasksTab({ user, setUsers, tasks, transactions, setTransactions, settings, plans }: any) {
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [timer, setTimer] = useState(0);

  const activePlan = plans.find((p: any) => p.id === user.activePlanId);
  const today = new Date().setHours(0, 0, 0, 0);
  const tasksDoneToday = transactions.filter((t: any) => 
    t.userId === user.id && 
    t.type === 'task' && 
    t.createdAt >= today
  ).length;

  const startTask = (task: Task) => {
    if (!activePlan) {
      alert('আপনার কোনো সক্রিয় প্ল্যান নেই। কাজ করতে প্রথমে একটি প্ল্যান কিনুন।');
      return;
    }
    if (tasksDoneToday >= activePlan.dailyTasks) {
      alert('আপনার আজকের কাজের লিমিট শেষ হয়ে গেছে।');
      return;
    }
    setCompletingTask(task);
    setTimer(task.timeRequired);
  };

  useEffect(() => {
    let interval: any;
    if (completingTask && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (completingTask && timer === 0) {
      completeTask();
    }
    return () => clearInterval(interval);
  }, [completingTask, timer]);

  const completeTask = () => {
    if (!completingTask) return;
    
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      amount: completingTask.amount,
      type: 'task',
      status: 'approved',
      createdAt: Date.now(),
      description: `Task completed: ${completingTask.title}`
    };

    setTransactions([...transactions, transaction]);
    
    setUsers((prev: User[]) => {
      let updatedUsers = [...prev];
      updatedUsers = updatedUsers.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            balance: u.balance + completingTask.amount,
            totalEarnings: u.totalEarnings + completingTask.amount
          };
        }
        return u;
      });

      let currentReferrerCode = user.referredBy;
      let level = 1;
      const maxLevels = settings.referralLevels || 3;

      while (currentReferrerCode && level <= maxLevels) {
        const referrer = updatedUsers.find(u => u.referralCode === currentReferrerCode);
        if (!referrer) break;

        const bonusConfig = settings.referralBonuses.find((b: any) => b.level === level);
        if (bonusConfig) {
          const bonusAmount = bonusConfig.type === 'percentage' 
            ? (completingTask.amount * bonusConfig.amount) / 100 
            : bonusConfig.amount;

          updatedUsers = updatedUsers.map(u => {
            if (u.id === referrer.id) {
              return {
                ...u,
                balance: u.balance + bonusAmount,
                totalEarnings: u.totalEarnings + bonusAmount
              };
            }
            return u;
          });
        }
        currentReferrerCode = referrer.referredBy;
        level++;
      }
      return updatedUsers;
    });

    setCompletingTask(null);
    alert(`কাজ সম্পন্ন হয়েছে! আপনি ৳${completingTask.amount} আয় করেছেন।`);
  };

  if (completingTask) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative w-40 h-40 mb-10">
          <div className="absolute inset-0 rounded-full border-4 border-white/5" />
          <div 
            className="absolute inset-0 rounded-full border-4 border-highlight border-t-transparent animate-spin" 
            style={{ animationDuration: '1.5s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">{timer}s</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 font-bangla">{completingTask.title}</h2>
        <p className="text-slate-400 font-medium">অনুগ্রহ করে অপেক্ষা করুন, আপনার কাজ যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex justify-between items-center border-l-4 border-l-highlight">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-bangla">আজকের কাজ</p>
          <p className="text-2xl font-bold text-white">{tasksDoneToday} / {activePlan?.dailyTasks || 0}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-bangla">সক্রিয় প্ল্যান</p>
          <p className="text-sm font-bold text-highlight">{activePlan?.name || 'কোনোটিই নয়'}</p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 font-bangla">
        <div className="w-1.5 h-5 rounded-full bg-highlight" />
        উপলব্ধ বিজ্ঞাপন
      </h3>
      
      <div className="space-y-4">
        {tasks.filter((t: any) => t.active).map((task: any) => (
          <div key={task.id} className="glass-card group hover:border-highlight/30 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 h-32 relative overflow-hidden">
              <img src={task.imageUrl || `https://picsum.photos/seed/${task.id}/400/200`} alt={task.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-lg font-bangla">{task.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-emerald-400">৳{task.amount.toFixed(2)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {task.timeRequired}s
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => startTask(task)}
                  className="btn-accent px-5 py-2.5 text-sm font-bangla whitespace-nowrap"
                >
                  কাজ শুরু করুন
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlansTab({ user, setUsers, plans, transactions, setTransactions, settings }: any) {
  const buyPlan = (plan: Plan) => {
    if (user.balance < plan.price) {
      alert('আপনার ব্যালেন্স পর্যাপ্ত নয়। অনুগ্রহ করে ডিপোজিট করুন।');
      return;
    }

    if (confirm(`${plan.name} কিনতে চান? আপনার ব্যালেন্স থেকে ৳${plan.price} কাটা হবে।`)) {
      const transaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        amount: plan.price,
        type: 'plan_purchase',
        status: 'approved',
        createdAt: Date.now(),
        description: `Purchased Plan: ${plan.name}`
      };

      setTransactions([...transactions, transaction]);

      setUsers((prev: User[]) => prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            balance: u.balance - plan.price,
            activePlanId: plan.id,
            planExpiry: Date.now() + (plan.validityDays * 24 * 60 * 60 * 1000)
          };
        }
        return u;
      }));

      alert('প্ল্যান কেনা সফল হয়েছে!');
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white font-bangla">বিনিয়োগ প্ল্যান নির্বাচন করুন</h3>
        <p className="text-slate-500 text-sm mt-2">আপনার আয়ের লিমিট বাড়াতে একটি প্ল্যান বেছে নিন</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {plans.filter((p: any) => p.active).map((plan: any) => (
          <div 
            key={plan.id} 
            className={`glass-card p-8 relative overflow-hidden transition-all duration-500 ${user.activePlanId === plan.id ? 'border-highlight ring-4 ring-highlight/10 scale-[1.02]' : 'hover:border-white/20'}`}
          >
            {user.activePlanId === plan.id && (
              <div className="absolute top-0 right-0 bg-highlight text-white text-[10px] font-bold px-4 py-1 rounded-bl-2xl uppercase tracking-widest shadow-lg">
                Active Plan
              </div>
            )}
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-2xl font-bold text-white font-bangla">{plan.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={14} className="text-slate-500" />
                  <p className="text-sm text-slate-500 font-medium">{plan.validityDays} দিন মেয়াদী</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-highlight tracking-tight">৳{plan.price}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-sm font-medium font-bangla">প্রতিদিন কাজ: {plan.dailyTasks} টি</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-8 h-8 bg-highlight/10 text-highlight rounded-lg flex items-center justify-center">
                  <Award size={18} />
                </div>
                <span className="text-sm font-medium font-bangla">প্রতিদিন আয়: ৳{plan.dailyEarning}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5 sm:col-span-2">
                <div className="w-8 h-8 bg-violet-500/10 text-violet-500 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle size={18} />
                </div>
                <span className="text-sm font-medium font-bangla">মোট সম্ভাব্য আয়: ৳{plan.dailyEarning * plan.validityDays}</span>
              </div>
            </div>

            <button 
              onClick={() => buyPlan(plan)}
              disabled={user.activePlanId === plan.id}
              className={`w-full py-4.5 rounded-2xl font-bold transition-all duration-300 font-bangla ${user.activePlanId === plan.id ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5' : 'btn-gradient shadow-highlight/20 hover:scale-[1.02]'}`}
            >
              {user.activePlanId === plan.id ? 'ইতিমধ্যে সক্রিয়' : 'প্ল্যান কিনুন'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferTab({ user, users, settings }: any) {
  const referralLink = `${window.location.origin}?ref=${user.referralCode}`;
  const referrals = users.filter((u: any) => u.referredBy === user.referralCode);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied!');
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-highlight" />
        <div className="w-20 h-20 bg-violet-500/10 text-violet-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Users size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 font-bangla">রেফার করুন এবং আয় করুন</h3>
        <p className="text-slate-400 text-sm mb-8 font-medium">আপনার বন্ধুদের আমন্ত্রণ জানান এবং প্রতিটি সফল রেফারেলের জন্য বোনাস পান।</p>
        
        <div className="bg-primary/50 p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-4 group">
          <span className="text-xs font-mono text-slate-500 truncate select-all">{referralLink}</span>
          <button 
            onClick={copyToClipboard} 
            className="bg-accent hover:bg-highlight text-white p-3 rounded-xl transition-all shadow-lg group-hover:scale-110"
          >
            <Copy size={20} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 font-bangla">
          <div className="w-1.5 h-5 bg-violet-500 rounded-full" />
          আপনার রেফারেল তালিকা ({referrals.length})
        </h3>
        <div className="space-y-4">
          {referrals.length > 0 ? referrals.map((ref: any) => (
            <div key={ref.id} className="glass-card p-5 flex items-center justify-between group hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:rotate-6 transition-transform">
                  {ref.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{ref.username}</p>
                  <p className="text-xs text-slate-500 font-medium">{new Date(ref.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                <p className="text-[10px] text-slate-600 font-bold">LEVEL 1</p>
              </div>
            </div>
          )) : (
            <div className="glass-card py-16 text-center text-slate-500 italic text-sm font-medium">
              No referrals yet. Start inviting friends!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ user, transactions, settings }: any) {
  const userTransactions = [...transactions]
    .filter((t: any) => t.userId === user.id)
    .sort((a: any, b: any) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 font-bangla">
        <div className="w-1.5 h-5 rounded-full bg-highlight" />
        লেনদেন ইতিহাস
      </h3>
      
      {userTransactions.length > 0 ? userTransactions.map((t: any) => (
        <div key={t.id} className="glass-card p-5 flex items-center justify-between group hover:border-white/10 transition-all">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              t.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' :
              t.type === 'withdrawal' ? 'bg-rose-500/10 text-rose-500' :
              t.type === 'task' ? 'bg-highlight/10 text-highlight' : 'bg-accent text-slate-300'
            }`}>
              {t.type === 'deposit' ? <ArrowDownCircle size={24} /> :
               t.type === 'withdrawal' ? <ArrowUpCircle size={24} /> :
               t.type === 'task' ? <ClipboardList size={24} /> : <Award size={24} />}
            </div>
            <div>
              <p className="font-bold text-white capitalize text-lg font-bangla">{t.type.replace('_', ' ')}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold tracking-tight ${t.type === 'deposit' || t.type === 'task' || t.type === 'referral' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {t.type === 'deposit' || t.type === 'task' || t.type === 'referral' ? '+' : '-'} ৳{t.amount.toFixed(2)}
            </p>
            <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-lg mt-1 inline-block tracking-widest ${
              t.status === 'approved' || t.status === 'paid' ? 'bg-emerald-400/10 text-emerald-400' :
              t.status === 'pending' ? 'bg-amber-400/10 text-amber-400' : 'bg-rose-400/10 text-rose-400'
            }`}>
              {t.status}
            </span>
          </div>
        </div>
      )) : (
        <div className="glass-card py-20 text-center text-slate-500 italic text-sm font-medium">
          No transactions found yet.
        </div>
      )}
    </div>
  );
}

function SupportTab({ user, tickets, setTickets, settings }: any) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const userTickets = tickets.filter((t: any) => t.userId === user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: SupportTicket = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      subject,
      category: 'General',
      message,
      status: 'open',
      createdAt: Date.now(),
      replies: []
    };

    const botReply = {
      id: Date.now().toString(),
      senderId: 'bot',
      message: 'আমাদের সাপোর্ট টিমে মেসেজ দেয়ার জন্য ধন্যবাদ। একজন এডমিন শীঘ্রই আপনার সাথে যোগাযোগ করবেন।',
      createdAt: Date.now() + 1000,
      isAdmin: true
    };
    newTicket.replies.push(botReply);

    setTickets([...tickets, newTicket]);
    setSubject('');
    setMessage('');
    setShowForm(false);
    alert('সাপোর্ট টিকিট জমা দেওয়া হয়েছে!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white font-bangla">সাপোর্ট টিকেট</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-accent px-5 py-2.5 text-sm font-bangla"
        >
          {showForm ? 'বন্ধ করুন' : 'নতুন টিকেট'}
        </button>
      </div>

      {showForm && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="glass-card p-8 space-y-5 border-l-4 border-l-highlight"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-bangla">বিষয়</label>
            <input 
              type="text" 
              placeholder="আপনার সমস্যার বিষয় লিখুন" 
              className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-bangla">বিস্তারিত</label>
            <textarea 
              placeholder="আপনার সমস্যা বিস্তারিত লিখুন" 
              className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 h-40 resize-none text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full btn-gradient py-4.5 font-bangla">
            টিকিট জমা দিন
          </button>
        </motion.form>
      )}

      <div className="space-y-5">
        {userTickets.length > 0 ? userTickets.map((ticket: any) => (
          <div key={ticket.id} className="glass-card p-6 group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-white text-lg font-bangla">{ticket.subject}</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">Ticket ID: #{ticket.id.toUpperCase()}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest ${
                ticket.status === 'open' ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'
              }`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed font-medium">"{ticket.message}"</p>
            
            {ticket.replies.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/5">
                {ticket.replies.map((reply: any) => (
                  <div key={reply.id} className={`flex ${reply.isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-xl ${
                      reply.isAdmin ? 'bg-accent/50 text-slate-200 rounded-tl-none border border-white/5' : 'bg-highlight/10 text-white rounded-tr-none border border-highlight/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${reply.senderId === 'bot' ? 'bg-violet-400' : reply.isAdmin ? 'bg-highlight' : 'bg-emerald-400'}`} />
                        <p className="font-bold text-[10px] uppercase tracking-widest opacity-60">{reply.senderId === 'bot' ? 'AI Assistant' : reply.isAdmin ? 'Admin' : 'You'}</p>
                      </div>
                      <p className="font-medium leading-relaxed">{reply.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )) : (
          <div className="glass-card py-20 text-center text-slate-500 italic text-sm font-medium">
            No support tickets found. We're here to help!
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab({ user, onLogout, settings }: any) {
  return (
    <div className="space-y-8">
      <div className="glass-card p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-highlight/20 to-transparent" />
        <div 
          className="w-28 h-28 rounded-[40px] flex items-center justify-center text-white text-5xl font-bold mx-auto mb-6 shadow-2xl relative z-10 border-4 border-secondary ring-4 ring-highlight/20 bg-accent"
        >
          {user.username[0].toUpperCase()}
        </div>
        <h3 className="text-3xl font-bold text-white tracking-tight">{user.username}</h3>
        <p className="text-slate-500 font-bold mt-1 tracking-wider">{user.phone}</p>
        
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-emerald-500/10">
            <ShieldCheck size={14} /> Verified Account
          </div>
          {user.activePlanId && (
            <div className="inline-flex items-center gap-2 bg-highlight/10 text-highlight px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-highlight/10">
              <Award size={14} /> Premium Member
            </div>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden divide-y divide-white/5">
        <ProfileItem icon={<UserIcon size={22} />} label="ব্যক্তিগত তথ্য" />
        <ProfileItem icon={<Wallet size={22} />} label="পেমেন্ট মেথড" />
        <ProfileItem icon={<Settings size={22} />} label="সেটিংস" />
        <ProfileItem icon={<ShieldCheck size={22} />} label="নিরাপত্তা" />
        <button 
          onClick={onLogout}
          className="w-full p-6 flex items-center gap-5 text-rose-500 hover:bg-rose-500/5 transition-all group"
        >
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <LogOut size={24} />
          </div>
          <span className="font-bold text-lg font-bangla">লগ আউট করুন</span>
        </button>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label }: any) {
  return (
    <button className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-highlight group-hover:scale-110 transition-all">
          {icon}
        </div>
        <span className="font-bold text-white text-lg font-bangla">{label}</span>
      </div>
      <ChevronRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </button>
  );
}

// Modal Components
function DepositModal({ user, settings, onClose, onSubmit }: any) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [sender, setSender] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) < 100) return alert('Minimum deposit is ৳100');
    
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      amount: Number(amount),
      type: 'deposit',
      method,
      trxId,
      accountNumber: sender,
      status: 'pending',
      createdAt: Date.now(),
      description: `Deposit via ${method}`
    };
    onSubmit(transaction);
    onClose();
    alert('ডিপোজিট রিকোয়েস্ট জমা দেওয়া হয়েছে! এডমিন অ্যাপ্রুভালের জন্য অপেক্ষা করুন।');
  };

  return (
    <div className="fixed inset-0 bg-primary/90 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card w-full max-w-md p-8 relative border-t-4 border-t-highlight rounded-t-[40px] md:rounded-[40px]"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-white font-bangla">ডিপোজিট করুন</h3>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-all"><X size={24} /></button>
        </div>

        <div className="bg-highlight/10 p-5 rounded-2xl mb-8 flex gap-4 border border-highlight/20">
          <Bell className="text-highlight shrink-0" size={24} />
          <p className="text-xs text-slate-300 leading-relaxed font-medium">{settings.depositInstructions}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setMethod('bKash')}
              className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${method === 'bKash' ? 'border-highlight bg-highlight/10 text-highlight' : 'border-white/5 bg-white/5 text-slate-500'}`}
            >
              <div className={`w-2 h-2 rounded-full ${method === 'bKash' ? 'bg-highlight' : 'bg-slate-700'}`} />
              bKash
            </button>
            <button 
              type="button"
              onClick={() => setMethod('Nagad')}
              className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${method === 'Nagad' ? 'border-highlight bg-highlight/10 text-highlight' : 'border-white/5 bg-white/5 text-slate-500'}`}
            >
              <div className={`w-2 h-2 rounded-full ${method === 'Nagad' ? 'bg-highlight' : 'bg-slate-700'}`} />
              Nagad
            </button>
          </div>

          <div className="bg-primary/50 p-6 rounded-3xl text-center border border-white/5 shadow-inner">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Send Money To ({method})</p>
            <p className="text-2xl font-mono font-bold text-highlight tracking-wider">{method === 'bKash' ? settings.bkashNumber : settings.nagadNumber}</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="number" 
                placeholder="টাকার পরিমাণ (৳)" 
                className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4.5 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="ট্রানজেকশন আইডি (TrxID)" 
                className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4.5 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <input 
                type="tel" 
                placeholder="আপনার নম্বর" 
                className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4.5 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full btn-gradient py-4.5 mt-4 font-bangla">
            নিশ্চিত করুন
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function WithdrawModal({ user, settings, onClose, onSubmit }: any) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [account, setAccount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) < settings.minWithdrawal) return alert(`Minimum withdrawal is ৳${settings.minWithdrawal}`);
    if (Number(amount) > user.balance) return alert('Insufficient balance');
    
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      amount: Number(amount),
      type: 'withdrawal',
      method,
      accountNumber: account,
      status: 'pending',
      createdAt: Date.now(),
      description: `Withdrawal via ${method}`
    };
    onSubmit(transaction);
    onClose();
    alert('উত্তোলন রিকোয়েস্ট জমা দেওয়া হয়েছে!');
  };

  return (
    <div className="fixed inset-0 bg-primary/90 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card w-full max-w-md p-8 relative border-t-4 border-t-rose-500 rounded-t-[40px] md:rounded-[40px]"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-white font-bangla">টাকা উত্তোলন</h3>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-all"><X size={24} /></button>
        </div>

        <div className="bg-rose-500/10 p-6 rounded-3xl mb-8 text-center border border-rose-500/20 shadow-inner">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Available Balance</p>
          <p className="text-3xl font-bold text-white tracking-tight">৳{user.balance.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setMethod('bKash')}
              className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${method === 'bKash' ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-white/5 bg-white/5 text-slate-500'}`}
            >
              <div className={`w-2 h-2 rounded-full ${method === 'bKash' ? 'bg-rose-500' : 'bg-slate-700'}`} />
              bKash
            </button>
            <button 
              type="button"
              onClick={() => setMethod('Nagad')}
              className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${method === 'Nagad' ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-white/5 bg-white/5 text-slate-500'}`}
            >
              <div className={`w-2 h-2 rounded-full ${method === 'Nagad' ? 'bg-rose-500' : 'bg-slate-700'}`} />
              Nagad
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="number" 
                placeholder="টাকার পরিমাণ (৳)" 
                className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4.5 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <input 
                type="tel" 
                placeholder="আপনার অ্যাকাউন্ট নম্বর" 
                className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4.5 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-4.5 rounded-2xl shadow-lg shadow-rose-500/20 mt-4 transition-all font-bangla">
            উত্তোলন প্রক্রিয়া করুন
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function SupportModal({ user, tickets, setTickets, onClose }: any) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'Deposit' | 'Withdrawal' | 'Task' | 'Account' | 'Other'>('Other');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: SupportTicket = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      subject,
      category,
      message,
      status: 'open',
      createdAt: Date.now(),
      replies: []
    };
    setTickets([...tickets, newTicket]);
    setSubject('');
    setMessage('');
    alert('Support ticket submitted!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">সাপোর্ট সেন্টার</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
          {tickets.filter((t: any) => t.userId === user.id).length > 0 ? (
            tickets.filter((t: any) => t.userId === user.id).map((ticket: any) => (
              <div key={ticket.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{ticket.category}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${ticket.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{ticket.status}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{ticket.subject}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{ticket.message}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 italic text-sm">No tickets yet</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-slate-100">
          <select 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={category}
            onChange={(e: any) => setCategory(e.target.value)}
          >
            <option value="Deposit">Deposit Issue</option>
            <option value="Withdrawal">Withdrawal Problem</option>
            <option value="Task">Task Issue</option>
            <option value="Account">Account</option>
            <option value="Other">Other</option>
          </select>
          <input 
            type="text" 
            placeholder="বিষয়" 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <textarea 
            placeholder="আপনার সমস্যা বিস্তারিত লিখুন" 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100">
            টিকিট জমা দিন
          </button>
        </form>
      </motion.div>
    </div>
  );
}
function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-12 max-w-md border-t-4 border-t-highlight"
      >
        <div className="w-24 h-24 bg-highlight/10 text-highlight rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <AlertTriangle size={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4 font-bangla">কাজ চলছে...</h1>
        <p className="text-slate-400 leading-relaxed font-medium">
          আমাদের ওয়েবসাইটে বর্তমানে রক্ষণাবেক্ষণের কাজ চলছে। আমরা শীঘ্রই ফিরে আসব। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।
        </p>
        <div className="mt-10 pt-10 border-t border-white/5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ERNIG EARN Support</p>
        </div>
      </motion.div>
    </div>
  );
}

function AdminPanel({ 
  users, 
  setUsers, 
  tasks, 
  setTasks, 
  plans,
  setPlans,
  transactions, 
  setTransactions, 
  tickets, 
  setTickets, 
  settings, 
  setSettings, 
  onLogout, 
  impersonateUser 
}: any) {
  const [adminTab, setAdminTab] = useState('dashboard');

  const updateSettings = (newSettings: AppSettings) => {
    set(ref(db, 'settings'), newSettings);
  };

  const updateUsers = (newUsers: User[]) => {
    newUsers.forEach(u => set(ref(db, `users/${u.id}`), u));
  };

  const updateTasks = (newTasks: Task[]) => {
    const tasksObj = newTasks.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
    set(ref(db, 'tasks'), tasksObj);
  };

  const updatePlans = (newPlans: Plan[]) => {
    const plansObj = newPlans.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    set(ref(db, 'plans'), plansObj);
  };

  const updateTransactions = (newTransactions: Transaction[]) => {
    const transObj = newTransactions.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
    set(ref(db, 'transactions'), transObj);
  };

  const updateTickets = (newTickets: SupportTicket[]) => {
    const ticketsObj = newTickets.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
    set(ref(db, 'tickets'), ticketsObj);
  };

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalBalance: users.reduce((sum: number, u: any) => sum + u.balance, 0),
    pendingDeposits: transactions.filter((t: any) => t.type === 'deposit' && t.status === 'pending').length,
    pendingWithdrawals: transactions.filter((t: any) => t.type === 'withdrawal' && t.status === 'pending').length,
    openTickets: tickets.filter((t: any) => t.status === 'open').length
  }), [users, transactions, tickets]);

  const renderAdminTab = () => {
    switch (adminTab) {
      case 'dashboard': return <AdminDashboard stats={stats} />;
      case 'users': return <AdminUsers users={users} setUsers={updateUsers} impersonateUser={impersonateUser} />;
      case 'tasks': return <AdminTasks tasks={tasks} setTasks={updateTasks} />;
      case 'plans': return <AdminPlans plans={plans} setPlans={updatePlans} />;
      case 'deposits': return <AdminDeposits transactions={transactions} setTransactions={updateTransactions} setUsers={updateUsers} />;
      case 'withdrawals': return <AdminWithdrawals transactions={transactions} setTransactions={updateTransactions} setUsers={updateUsers} />;
      case 'settings': return <AdminSettings settings={settings} setSettings={updateSettings} />;
      case 'support': return <AdminSupport tickets={tickets} setTickets={updateTickets} />;
      default: return <AdminDashboard stats={stats} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-primary text-slate-200">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-72 bg-secondary border-r border-white/5 flex flex-col sticky top-0 md:h-screen z-40 shadow-2xl">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="w-12 h-12 bg-highlight rounded-2xl flex items-center justify-center text-white shadow-lg shadow-highlight/20">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Super Admin Control</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <AdminNavItem active={adminTab === 'dashboard'} onClick={() => setAdminTab('dashboard')} icon={<LayoutDashboard size={22} />} label="Dashboard" />
          <AdminNavItem active={adminTab === 'users'} onClick={() => setAdminTab('users')} icon={<Users size={22} />} label="Users" />
          <AdminNavItem active={adminTab === 'tasks'} onClick={() => setAdminTab('tasks')} icon={<ClipboardList size={22} />} label="Tasks" />
          <AdminNavItem active={adminTab === 'plans'} onClick={() => setAdminTab('plans')} icon={<Award size={22} />} label="Plans" />
          <AdminNavItem active={adminTab === 'deposits'} onClick={() => setAdminTab('deposits')} icon={<ArrowDownCircle size={22} />} label="Deposits" badge={stats.pendingDeposits} />
          <AdminNavItem active={adminTab === 'withdrawals'} onClick={() => setAdminTab('withdrawals')} icon={<ArrowUpCircle size={22} />} label="Withdrawals" badge={stats.pendingWithdrawals} />
          <AdminNavItem active={adminTab === 'support'} onClick={() => setAdminTab('support')} icon={<MessageSquare size={22} />} label="Support" badge={stats.openTickets} />
          <AdminNavItem active={adminTab === 'settings'} onClick={() => setAdminTab('settings')} icon={<Settings size={22} />} label="Settings" />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-2xl transition-all group"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 overflow-y-auto h-screen custom-scrollbar">
        <header className="sticky top-0 z-30 bg-primary/80 backdrop-blur-xl border-b border-white/5 p-6 md:px-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize tracking-tight">{adminTab}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage your platform operations</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">Administrator</p>
              <p className="text-[10px] text-highlight font-bold uppercase tracking-widest">Online</p>
            </div>
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center font-bold text-white shadow-lg border border-white/5">A</div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={adminTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderAdminTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function AdminNavItem({ active, onClick, icon, label, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-highlight text-white shadow-xl shadow-highlight/20' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
        <span className="font-bold tracking-tight">{label}</span>
      </div>
      {badge > 0 && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg min-w-[24px] flex items-center justify-center ${active ? 'bg-white text-highlight' : 'bg-highlight text-white shadow-lg shadow-highlight/30'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function AdminDashboard({ stats }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatCard icon={<Users size={28} />} label="Total Users" value={stats.totalUsers} color="text-blue-400" bg="bg-blue-400/10" />
      <AdminStatCard icon={<Wallet size={28} />} label="Total Balance" value={`৳${stats.totalBalance.toFixed(2)}`} color="text-emerald-400" bg="bg-emerald-400/10" />
      <AdminStatCard icon={<ArrowDownCircle size={28} />} label="Pending Deposits" value={stats.pendingDeposits} color="text-amber-400" bg="bg-amber-400/10" />
      <AdminStatCard icon={<ArrowUpCircle size={28} />} label="Pending Withdrawals" value={stats.pendingWithdrawals} color="text-rose-400" bg="bg-rose-400/10" />
    </div>
  );
}

function AdminStatCard({ icon, label, value, color, bg }: any) {
  return (
    <div className="glass-card p-8 group hover:border-white/10 transition-all duration-500">
      <div className={`w-16 h-16 ${bg} ${color} rounded-[24px] flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}

function AdminUsers({ users, setUsers, impersonateUser }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u: any) => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm)
  );

  const toggleBan = (userId: string) => {
    setUsers(users.map((u: any) => u.id === userId ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u));
  };

  const adjustBalance = (userId: string, amount: number) => {
    setUsers(users.map((u: any) => u.id === userId ? { ...u, balance: Math.max(0, u.balance + amount) } : u));
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between gap-6 items-center">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-highlight transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search users by name or phone..." 
            className="w-full pl-12 pr-6 py-4 bg-primary/50 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total: {filteredUsers.length}</span>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
            <tr>
              <th className="px-8 py-5">User Profile</th>
              <th className="px-8 py-5">Balance</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((u: any) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg tracking-tight">{u.username}</p>
                      <p className="text-xs text-slate-500 font-medium">{u.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 font-bold text-white text-lg tracking-tight">৳{u.balance.toFixed(2)}</td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${u.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => impersonateUser(u.id)} className="w-10 h-10 bg-white/5 text-slate-400 hover:text-white hover:bg-highlight rounded-xl flex items-center justify-center transition-all" title="Login as user"><Eye size={20} /></button>
                    <button onClick={() => adjustBalance(u.id, 100)} className="w-10 h-10 bg-white/5 text-slate-400 hover:text-white hover:bg-emerald-500 rounded-xl flex items-center justify-center transition-all" title="Add 100"><Plus size={20} /></button>
                    <button onClick={() => toggleBan(u.id)} className={`w-10 h-10 bg-white/5 flex items-center justify-center rounded-xl transition-all ${u.status === 'active' ? 'text-slate-400 hover:text-white hover:bg-rose-500' : 'text-rose-400 hover:text-white hover:bg-emerald-500'}`} title={u.status === 'active' ? 'Ban' : 'Unban'}>
                      {u.status === 'active' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminTasks({ tasks, setTasks }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', amount: '', time: '', link: '', category: 'Video', imageUrl: '' });

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      description: newTask.description,
      amount: Number(newTask.amount),
      timeRequired: Number(newTask.time),
      link: newTask.link,
      category: newTask.category,
      imageUrl: newTask.imageUrl || `https://picsum.photos/seed/${Math.random()}/400/200`,
      active: true
    };
    setTasks([...tasks, task]);
    setShowAdd(false);
    setNewTask({ title: '', description: '', amount: '', time: '', link: '', category: 'Video', imageUrl: '' });
  };

  const deleteTask = (id: string) => {
    if (confirm('Are you sure?')) {
      setTasks(tasks.filter((t: any) => t.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white tracking-tight">Manage Tasks</h3>
        <button onClick={() => setShowAdd(true)} className="btn-gradient px-6 py-3 text-sm flex items-center gap-2">
          <Plus size={20} /> Add New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task: any) => (
          <div key={task.id} className="glass-card group relative overflow-hidden flex flex-col">
            <button 
              onClick={() => deleteTask(task.id)} 
              className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-rose-500 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="h-40 overflow-hidden relative">
              <img src={task.imageUrl} alt={task.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] font-bold text-white bg-highlight px-3 py-1 rounded-full uppercase tracking-widest">{task.category}</span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h4 className="font-bold text-white text-lg mb-2 tracking-tight line-clamp-1">{task.title}</h4>
              <p className="text-xs text-slate-500 mb-6 font-medium line-clamp-2 flex-1">{task.description}</p>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-xl font-bold text-highlight tracking-tight">৳{task.amount}</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={12} /> {task.timeRequired}s
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-primary/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-lg p-10 relative border-t-4 border-t-highlight max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">Add New Task</h3>
            <form onSubmit={addTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Task Title</label>
                <input type="text" placeholder="Enter task title" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Task Image URL</label>
                <input type="text" placeholder="https://picsum.photos/..." className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newTask.imageUrl} onChange={e => setNewTask({...newTask, imageUrl: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                <input type="text" placeholder="Brief description" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reward (৳)</label>
                  <input type="number" placeholder="0.00" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newTask.amount} onChange={e => setNewTask({...newTask, amount: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time (Seconds)</label>
                  <input type="number" placeholder="30" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Link</label>
                <input type="text" placeholder="https://..." className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} required />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-gradient py-4.5">Save Task</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-white/5 text-white font-bold py-4.5 rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AdminDeposits({ transactions, setTransactions, setUsers }: any) {
  const pendingDeposits = transactions.filter((t: any) => t.type === 'deposit' && t.status === 'pending');

  const handleAction = (id: string, status: 'approved' | 'rejected') => {
    const deposit = transactions.find((t: any) => t.id === id);
    if (!deposit) return;

    setTransactions(transactions.map((t: any) => t.id === id ? { ...t, status } : t));

    if (status === 'approved') {
      setUsers((prev: User[]) => prev.map(u => u.id === deposit.userId ? { ...u, balance: u.balance + deposit.amount } : u));
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
            <tr>
              <th className="px-8 py-5">User ID</th>
              <th className="px-8 py-5">Amount</th>
              <th className="px-8 py-5">Method</th>
              <th className="px-8 py-5">TrxID</th>
              <th className="px-8 py-5">Sender</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pendingDeposits.map((d: any) => (
              <tr key={d.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6 text-sm font-bold text-white">{d.userId}</td>
                <td className="px-8 py-6 text-lg font-bold text-emerald-400">৳{d.amount}</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-slate-400">{d.method}</span>
                </td>
                <td className="px-8 py-6 text-sm font-mono text-slate-500">{d.trxId}</td>
                <td className="px-8 py-6 text-sm text-slate-500 font-medium">{d.accountNumber}</td>
                <td className="px-8 py-6">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleAction(d.id, 'approved')} className="w-10 h-10 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/10"><CheckCircle2 size={20} /></button>
                    <button onClick={() => handleAction(d.id, 'rejected')} className="w-10 h-10 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-rose-500/10"><XCircle size={20} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingDeposits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic font-medium">No pending deposit requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminWithdrawals({ transactions, setTransactions, setUsers }: any) {
  const pendingWithdrawals = transactions.filter((t: any) => t.type === 'withdrawal' && t.status === 'pending');

  const handleAction = (id: string, status: 'approved' | 'rejected') => {
    const withdrawal = transactions.find((t: any) => t.id === id);
    if (!withdrawal) return;

    setTransactions(transactions.map((t: any) => t.id === id ? { ...t, status: status === 'approved' ? 'paid' : 'rejected' } : t));

    if (status === 'rejected') {
      setUsers((prev: User[]) => prev.map(u => u.id === withdrawal.userId ? { ...u, balance: u.balance + withdrawal.amount } : u));
    } else {
      setUsers((prev: User[]) => prev.map(u => u.id === withdrawal.userId ? { ...u, totalWithdrawals: u.totalWithdrawals + withdrawal.amount } : u));
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
            <tr>
              <th className="px-8 py-5">User ID</th>
              <th className="px-8 py-5">Amount</th>
              <th className="px-8 py-5">Method</th>
              <th className="px-8 py-5">Account</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pendingWithdrawals.map((w: any) => (
              <tr key={w.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6 text-sm font-bold text-white">{w.userId}</td>
                <td className="px-8 py-6 text-lg font-bold text-rose-400">৳{w.amount}</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-slate-400">{w.method}</span>
                </td>
                <td className="px-8 py-6 text-sm text-slate-500 font-medium">{w.accountNumber}</td>
                <td className="px-8 py-6">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleAction(w.id, 'approved')} className="w-10 h-10 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/10"><CheckCircle2 size={20} /></button>
                    <button onClick={() => handleAction(w.id, 'rejected')} className="w-10 h-10 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-rose-500/10"><XCircle size={20} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingWithdrawals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-500 italic font-medium">No pending withdrawal requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSettings({ settings, setSettings }: any) {
  return (
    <div className="max-w-3xl glass-card p-10 space-y-10 border-t-4 border-t-highlight">
      <div className="flex items-center justify-between p-6 bg-primary/30 rounded-3xl border border-white/5">
        <div>
          <p className="text-lg font-bold text-white font-bangla">মেইনটেন্যান্স মোড</p>
          <p className="text-xs text-slate-500">অন করলে সাধারণ ইউজাররা সাইটে ঢুকতে পারবে না</p>
        </div>
        <button 
          onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
          className={`w-16 h-9 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-highlight' : 'bg-slate-700'}`}
        >
          <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all shadow-lg ${settings.maintenanceMode ? 'left-8' : 'left-1'}`} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">bKash Number</label>
          <input type="text" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={settings.bkashNumber} onChange={e => setSettings({...settings, bkashNumber: e.target.value})} />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Nagad Number</label>
          <input type="text" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={settings.nagadNumber} onChange={e => setSettings({...settings, nagadNumber: e.target.value})} />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Min Withdrawal (৳)</label>
          <input type="number" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={settings.minWithdrawal} onChange={e => setSettings({...settings, minWithdrawal: Number(e.target.value)})} />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Max Withdrawal/Day (৳)</label>
          <input type="number" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={settings.maxWithdrawalPerDay} onChange={e => setSettings({...settings, maxWithdrawalPerDay: Number(e.target.value)})} />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Website Notice</label>
        <textarea className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-6 text-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={settings.websiteNotice} onChange={e => setSettings({...settings, websiteNotice: e.target.value})} />
      </div>
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Deposit Instructions</label>
        <textarea className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-6 text-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={settings.depositInstructions} onChange={e => setSettings({...settings, depositInstructions: e.target.value})} />
      </div>
      <button onClick={() => alert('Settings saved successfully!')} className="w-full btn-gradient py-5 text-lg shadow-2xl shadow-highlight/20">Save All Configuration</button>
    </div>
  );
}

function AdminSupport({ tickets, setTickets }: any) {
  const [replyText, setReplyText] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const handleReply = (ticketId: string) => {
    if (!replyText.trim()) return;
    
    setTickets(tickets.map((t: any) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'replied',
          replies: [
            ...t.replies,
            {
              id: Date.now().toString(),
              senderId: 'admin',
              message: replyText,
              createdAt: Date.now(),
              isAdmin: true
            }
          ]
        };
      }
      return t;
    }));
    setReplyText('');
    setActiveTicketId(null);
  };

  return (
    <div className="space-y-8">
      {tickets.map((ticket: any) => (
        <div key={ticket.id} className="glass-card p-8 border-t-2 border-t-highlight/30">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-highlight bg-highlight/10 px-3 py-1 rounded-lg">{ticket.category}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg ${ticket.status === 'open' ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'}`}>{ticket.status}</span>
              </div>
              <h4 className="font-bold text-white text-xl tracking-tight">{ticket.subject}</h4>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">User ID: {ticket.userId}</p>
            </div>
            <button 
              onClick={() => setActiveTicketId(activeTicketId === ticket.id ? null : ticket.id)}
              className="text-highlight text-sm font-bold hover:underline transition-all"
            >
              {activeTicketId === ticket.id ? 'Cancel Reply' : 'Reply to Ticket'}
            </button>
          </div>
          
          <div className="bg-primary/50 p-6 rounded-2xl mb-8 border border-white/5 italic text-slate-400 text-sm leading-relaxed">
            "{ticket.message}"
          </div>

          {ticket.replies.length > 0 && (
            <div className="space-y-4 mb-8 border-l-2 border-white/5 pl-6">
              {ticket.replies.map((reply: any) => (
                <div key={reply.id} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {reply.senderId === 'bot' ? 'AI Assistant' : reply.isAdmin ? 'Administrator' : 'User'}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">{reply.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeTicketId === ticket.id && (
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Type your official response..." 
                className="flex-1 bg-primary/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button 
                onClick={() => handleReply(ticket.id)}
                className="btn-gradient px-8 py-4 text-sm"
              >
                Send Reply
              </button>
            </div>
          )}
        </div>
      ))}
      {tickets.length === 0 && (
        <div className="glass-card py-20 text-center text-slate-500 italic font-medium">
          No support tickets currently require attention
        </div>
      )}
    </div>
  );
}

function AdminPlans({ plans, setPlans }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', dailyTasks: '', dailyEarning: '', validity: '' });

  const addPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const plan: Plan = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlan.name,
      price: Number(newPlan.price),
      dailyTasks: Number(newPlan.dailyTasks),
      dailyEarning: Number(newPlan.dailyEarning),
      validityDays: Number(newPlan.validity),
      active: true
    };
    setPlans([...plans, plan]);
    setShowAdd(false);
    setNewPlan({ name: '', price: '', dailyTasks: '', dailyEarning: '', validity: '' });
  };

  const deletePlan = (id: string) => {
    if (confirm('Are you sure? This might affect users with this plan.')) {
      setPlans(plans.filter((p: any) => p.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white tracking-tight">Investment Plans</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-gradient px-6 py-3 text-sm flex items-center gap-2">
          <Plus size={20} /> {showAdd ? 'Cancel' : 'Create New Plan'}
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 border-t-4 border-t-highlight"
        >
          <form onSubmit={addPlan} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plan Name</label>
              <input type="text" placeholder="e.g. Gold Plan" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Price (৳)</label>
              <input type="number" placeholder="500" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Tasks</label>
              <input type="number" placeholder="5" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newPlan.dailyTasks} onChange={e => setNewPlan({...newPlan, dailyTasks: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Earning (৳)</label>
              <input type="number" placeholder="50" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newPlan.dailyEarning} onChange={e => setNewPlan({...newPlan, dailyEarning: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Validity (Days)</label>
              <input type="number" placeholder="30" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-highlight/50 transition-all" value={newPlan.validity} onChange={e => setNewPlan({...newPlan, validity: e.target.value})} required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full btn-gradient py-4.5">Save Plan</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <div key={plan.id} className="glass-card p-8 group relative overflow-hidden border-t-4 border-t-highlight/50">
            <button 
              onClick={() => deletePlan(plan.id)} 
              className="absolute top-6 right-6 text-slate-600 hover:text-rose-500 transition-colors"
            >
              <XCircle size={24} />
            </button>
            <div className="w-16 h-16 bg-highlight/10 text-highlight rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
              <Award size={32} />
            </div>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-white text-2xl tracking-tight">{plan.name}</h4>
              <button onClick={() => setPlans(plans.map((p: any) => p.id === plan.id ? { ...p, active: !p.active } : p))} className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg tracking-widest ${plan.active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                {plan.active ? 'Active' : 'Inactive'}
              </button>
            </div>
            <p className="text-3xl font-bold text-highlight mb-6 tracking-tight">৳{plan.price}</p>
            
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Tasks</span>
                <span className="text-sm font-bold text-white">{plan.dailyTasks} Tasks</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Earning</span>
                <span className="text-sm font-bold text-emerald-400">৳{plan.dailyEarning}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Validity</span>
                <span className="text-sm font-bold text-white">{plan.validityDays} Days</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

