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
  Award
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
  themeColor: '#4F46E5' // Indigo 600
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
  { id: '1', title: 'Watch Video Ad 1', description: 'Watch a 30-second video to earn.', amount: 5, timeRequired: 30, link: '#', category: 'Video', active: true },
  { id: '2', title: 'Watch Video Ad 2', description: 'Watch a 30-second video to earn.', amount: 5, timeRequired: 30, link: '#', category: 'Video', active: true },
  { id: '3', title: 'Watch Video Ad 3', description: 'Watch a 30-second video to earn.', amount: 5, timeRequired: 30, link: '#', category: 'Video', active: true },
];

export default function App() {
  // --- State ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ernig_users');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ernig_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [impersonator, setImpersonator] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ernig_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('ernig_plans');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ernig_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('ernig_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ernig_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [view, setView] = useState<'auth' | 'dashboard' | 'admin'>('auth');
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [theme, setTheme] = useState(settings.themeColor);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('ernig_users', JSON.stringify(users));
    localStorage.setItem('ernig_current_user', JSON.stringify(currentUser));
    localStorage.setItem('ernig_tasks', JSON.stringify(tasks));
    localStorage.setItem('ernig_plans', JSON.stringify(plans));
    localStorage.setItem('ernig_transactions', JSON.stringify(transactions));
    localStorage.setItem('ernig_tickets', JSON.stringify(tickets));
    localStorage.setItem('ernig_settings', JSON.stringify(settings));
  }, [users, currentUser, tasks, plans, transactions, tickets, settings]);

  useEffect(() => {
    if (currentUser) {
      setView(currentUser.isAdmin ? 'admin' : 'dashboard');
      // Sync currentUser with users list
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
      }
    } else {
      setView('auth');
    }
  }, [currentUser, users]);

  useEffect(() => {
    setTheme(settings.themeColor);
  }, [settings.themeColor]);

  // --- Auth Handlers ---
  const handleRegister = (username: string, phone: string, pass: string, refCode?: string) => {
    if (users.find(u => u.username === username || u.phone === phone)) {
      alert('Username or phone already exists');
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      phone,
      password: pass,
      balance: 0,
      totalEarnings: 0,
      totalWithdrawals: 0,
      referralCode: username.toLowerCase().replace(/\s/g, ''),
      referredBy: refCode,
      status: 'active',
      createdAt: Date.now(),
      isAdmin: username === 'admin' // Simple admin check for demo
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  const handleLogin = (username: string, pass: string) => {
    const user = users.find(u => u.username === username && u.password === pass);
    if (user) {
      if (user.status === 'banned') {
        alert('Your account has been banned.');
        return;
      }
      setCurrentUser(user);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    if (impersonator) {
      setCurrentUser(impersonator);
      setImpersonator(null);
    } else {
      setCurrentUser(null);
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

  // --- Render Helpers ---
  if (!currentUser && view === 'auth') {
    return <AuthScreen mode={authMode} setMode={setAuthMode} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20 md:pb-0">
      {/* Impersonation Banner */}
      {impersonator && (
        <div className="bg-amber-500 text-white py-2 px-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
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
      <div className="max-w-7xl mx-auto" style={{ '--primary': theme } as any}>
        {currentUser?.isAdmin && !impersonator ? (
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
            onLogout={handleLogout}
            impersonateUser={impersonateUser}
          />
        ) : (
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
        )}
      </div>

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
    <div className="min-h-screen bg-indigo-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-3xl opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white">
              <Award size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-indigo-900">
            {mode === 'login' ? 'আবার স্বাগতম' : 'অ্যাকাউন্ট তৈরি করুন'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'login' ? 'Welcome back to ERNIG EARN' : 'Join the best earning platform'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <UserIcon size={18} />
            </div>
            <input
              type="text"
              placeholder="ইউজার নেইম"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Bell size={18} />
              </div>
              <input
                type="tel"
                placeholder="মোবাইল নম্বর"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <ShieldCheck size={18} />
            </div>
            <input
              type="password"
              placeholder="পাসওয়ার্ড"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Users size={18} />
              </div>
              <input
                type="text"
                placeholder="রেফার কোড (ঐচ্ছিক)"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                আমাকে মনে রাখুন
              </label>
              <button type="button" className="text-sm text-indigo-600 font-medium hover:underline">
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
          >
            {mode === 'login' ? (
              <>
                <LogOut size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                সাইন ইন করুন
              </>
            ) : (
              <>
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                এখন নিবন্ধন করুন
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            {mode === 'login' ? 'কোনো অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?'}
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-indigo-600 font-bold hover:underline"
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
  const [showSupport, setShowSupport] = useState(false);

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
      case 'home': return <HomeTab user={user} stats={stats} onDeposit={() => setShowDeposit(true)} onWithdraw={() => setShowWithdraw(true)} onSupport={() => setShowSupport(true)} settings={settings} />;
      case 'tasks': return <TasksTab user={user} setUsers={setUsers} tasks={tasks} transactions={transactions} setTransactions={setTransactions} settings={settings} plans={plans} />;
      case 'plans': return <PlansTab user={user} setUsers={setUsers} plans={plans} transactions={transactions} setTransactions={setTransactions} settings={settings} />;
      case 'history': return <HistoryTab user={user} transactions={transactions} settings={settings} />;
      case 'profile': return <ProfileTab user={user} onLogout={onLogout} settings={settings} />;
      case 'support': return <SupportTab user={user} tickets={tickets} setTickets={setTickets} settings={settings} />;
      default: return <HomeTab user={user} stats={stats} onDeposit={() => setShowDeposit(true)} onWithdraw={() => setShowWithdraw(true)} onSupport={() => setShowSupport(true)} settings={settings} />;
    }
  };

  return (
    <div className="pb-24 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: settings.themeColor }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 leading-none">{user.username}</h2>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ID: {user.id.slice(-4)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <button onClick={() => setActiveTab('support')} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <MessageSquare size={20} />
          </button>
        </div>
      </header>

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
    </div>
  );
}

function HomeTab({ user, stats, onDeposit, onWithdraw, onSupport, settings }: any) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div 
        className="rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${settings.themeColor}, ${settings.themeColor}dd)` }}
      >
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/80 text-sm font-medium">বর্তমান ব্যালেন্স</span>
            <button onClick={() => setShowBalance(!showBalance)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          
          <div className="text-4xl font-bold mb-8 flex items-baseline gap-1">
            <span className="text-2xl font-medium">৳</span>
            {showBalance ? user.balance.toFixed(2) : '••••••'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onDeposit}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} /> ডিপোজিট
            </button>
            <button 
              onClick={onWithdraw}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Wallet size={18} /> উত্তোলন
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">মোট উপার্জন</p>
            <p className="text-lg font-bold text-slate-900">৳{stats.totalEarned.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <ArrowUpCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">মোট উত্তোলন</p>
            <p className="text-lg font-bold text-slate-900">৳{stats.totalWithdrawn.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: settings.themeColor }} />
          দ্রুত কার্যক্রম
        </h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <QuickAction icon={<ClipboardList className="text-amber-500" />} label="কাজ" color="bg-amber-50" />
          <QuickAction icon={<Plus className="text-indigo-500" />} label="ডিপোজিট" color="bg-indigo-50" />
          <QuickAction icon={<Wallet className="text-emerald-500" />} label="উত্তোলন" color="bg-emerald-50" />
          <QuickAction icon={<Award className="text-violet-500" />} label="প্ল্যান" color="bg-violet-50" />
        </div>
      </div>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-4 text-white flex items-center justify-between shadow-lg shadow-orange-100">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Limited Offer</p>
          <h4 className="font-bold text-lg leading-tight mt-1">৩০০০ টাকা ডিপোজিট করলে<br/>১৫০০ টাকা বোনাস</h4>
        </div>
        <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm">
          <Award size={32} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color }: any) {
  return (
    <button className="flex flex-col items-center gap-2 group">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
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
    
    // Update user balance and referral bonuses
    setUsers((prev: User[]) => {
      let updatedUsers = [...prev];
      
      // 1. Credit the user who completed the task
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

      // 2. Credit referrers (Multi-level)
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-32 h-32 rounded-full border-8 border-indigo-100 border-t-indigo-600 animate-spin mb-8 flex items-center justify-center">
          <span className="text-2xl font-bold text-indigo-600 animate-none">{timer}s</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{completingTask.title}</h2>
        <p className="text-slate-500">অনুগ্রহ করে অপেক্ষা করুন, আপনার কাজ যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase">আজকের কাজ</p>
          <p className="text-lg font-bold text-slate-900">{tasksDoneToday} / {activePlan?.dailyTasks || 0}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-bold uppercase">সক্রিয় প্ল্যান</p>
          <p className="text-sm font-bold text-indigo-600">{activePlan?.name || 'কোনোটিই নয়'}</p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">উপলব্ধ বিজ্ঞাপন</h3>
      {tasks.filter((t: any) => t.active).map((task: any) => (
        <div key={task.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <ClipboardList size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{task.title}</h4>
              <p className="text-xs text-slate-500">৳{task.amount.toFixed(2)} • {task.timeRequired}s</p>
            </div>
          </div>
          <button 
            onClick={() => startTask(task)}
            className="text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ backgroundColor: settings.themeColor }}
          >
            কাজ শুরু করুন
          </button>
        </div>
      ))}
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
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 text-center">বিনিয়োগ প্ল্যান নির্বাচন করুন</h3>
      <div className="grid grid-cols-1 gap-6">
        {plans.filter((p: any) => p.active).map((plan: any) => (
          <div 
            key={plan.id} 
            className={`bg-white rounded-[32px] p-6 shadow-sm border-2 transition-all ${user.activePlanId === plan.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900">{plan.name}</h4>
                <p className="text-sm text-slate-500">{plan.validityDays} দিন মেয়াদী</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">৳{plan.price}</p>
                {user.activePlanId === plan.id && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Active</span>}
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>প্রতিদিন কাজ: {plan.dailyTasks} টি</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>প্রতিদিন আয়: ৳{plan.dailyEarning}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>মোট আয়: ৳{plan.dailyEarning * plan.validityDays}</span>
              </div>
            </div>

            <button 
              onClick={() => buyPlan(plan)}
              disabled={user.activePlanId === plan.id}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${user.activePlanId === plan.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-white shadow-lg shadow-indigo-100 hover:scale-[1.02]'}`}
              style={{ backgroundColor: user.activePlanId === plan.id ? undefined : settings.themeColor }}
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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">রেফার করুন এবং আয় করুন</h3>
        <p className="text-slate-500 text-sm mb-6">আপনার বন্ধুদের আমন্ত্রণ জানান এবং প্রতিটি সফল রেফারেলের জন্য বোনাস পান।</p>
        
        <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-600 truncate">{referralLink}</span>
          <button onClick={copyToClipboard} className="bg-white p-2 rounded-xl shadow-sm text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-4 bg-violet-600 rounded-full" />
          আপনার রেফারেল তালিকা ({referrals.length})
        </h3>
        <div className="space-y-3">
          {referrals.length > 0 ? referrals.map((ref: any) => (
            <div key={ref.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">
                  {ref.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{ref.username}</p>
                  <p className="text-[10px] text-slate-500">{new Date(ref.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Active</span>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-400 italic text-sm">No referrals yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ user, transactions, settings }: any) {
  const userTransactions = [...transactions]
    .filter((t: any) => t.userId === user.id)
    .sort((a: any) => a.createdAt - 1);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 mb-2">লেনদেন ইতিহাস</h3>
      {userTransactions.length > 0 ? userTransactions.map((t: any) => (
        <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              t.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' :
              t.type === 'withdrawal' ? 'bg-rose-50 text-rose-600' :
              t.type === 'task' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
            }`}>
              {t.type === 'deposit' ? <ArrowDownCircle size={20} /> :
               t.type === 'withdrawal' ? <ArrowUpCircle size={20} /> :
               t.type === 'task' ? <ClipboardList size={20} /> : <Award size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 capitalize">{t.type.replace('_', ' ')}</p>
              <p className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold ${t.type === 'deposit' || t.type === 'task' || t.type === 'referral' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.type === 'deposit' || t.type === 'task' || t.type === 'referral' ? '+' : '-'} ৳{t.amount}
            </p>
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
              t.status === 'approved' || t.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
              t.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {t.status}
            </span>
          </div>
        </div>
      )) : (
        <div className="text-center py-12 text-slate-400 italic text-sm">No transactions found</div>
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

    // Simple AI Bot response
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
        <h3 className="text-lg font-bold text-slate-900">সাপোর্ট টিকেট</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-white px-4 py-2 rounded-xl text-sm font-bold"
          style={{ backgroundColor: settings.themeColor }}
        >
          {showForm ? 'বন্ধ করুন' : 'নতুন টিকেট'}
        </button>
      </div>

      {showForm && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
        >
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
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button type="submit" className="w-full text-white font-bold py-3 rounded-xl shadow-lg" style={{ backgroundColor: settings.themeColor }}>
            টিকিট জমা দিন
          </button>
        </motion.form>
      )}

      <div className="space-y-4">
        {userTickets.length > 0 ? userTickets.map((ticket: any) => (
          <div key={ticket.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-slate-900">{ticket.subject}</h4>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                ticket.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4">{ticket.message}</p>
            
            {ticket.replies.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-50">
                {ticket.replies.map((reply: any) => (
                  <div key={reply.id} className={`flex ${reply.isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                      reply.isAdmin ? 'bg-indigo-50 text-indigo-700 rounded-tl-none' : 'bg-slate-100 text-slate-700 rounded-tr-none'
                    }`}>
                      <p className="font-bold text-[9px] uppercase mb-1 opacity-60">{reply.senderId === 'bot' ? 'AI Assistant' : reply.isAdmin ? 'Admin' : 'You'}</p>
                      {reply.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )) : (
          <div className="text-center py-12 text-slate-400 italic text-sm">No support tickets found</div>
        )}
      </div>
    </div>
  );
}

function ProfileTab({ user, onLogout, settings }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 opacity-10" style={{ backgroundColor: settings.themeColor }} />
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-xl relative z-10 border-4 border-white"
          style={{ backgroundColor: settings.themeColor }}
        >
          {user.username[0].toUpperCase()}
        </div>
        <h3 className="text-2xl font-bold text-slate-900">{user.username}</h3>
        <p className="text-slate-500 font-medium">{user.phone}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold">
            <ShieldCheck size={14} /> Verified Account
          </div>
          {user.activePlanId && (
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-100">
              <Award size={14} /> Premium Member
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <ProfileItem icon={<UserIcon size={20} />} label="ব্যক্তিগত তথ্য" />
        <ProfileItem icon={<Wallet size={20} />} label="পেমেন্ট মেথড" />
        <ProfileItem icon={<Settings size={20} />} label="সেটিংস" />
        <ProfileItem icon={<ShieldCheck size={20} />} label="নিরাপত্তা" />
        <button 
          onClick={onLogout}
          className="w-full p-5 flex items-center gap-4 text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-50"
        >
          <LogOut size={20} />
          <span className="font-bold">লগ আউট করুন</span>
        </button>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label }: any) {
  return (
    <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-4 text-slate-700">
        <div className="text-slate-400">{icon}</div>
        <span className="font-bold">{label}</span>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">ডিপোজিট করুন</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
        </div>

        <div className="bg-indigo-50 p-4 rounded-2xl mb-6 flex gap-3">
          <Bell className="text-indigo-600 shrink-0" size={20} />
          <p className="text-xs text-indigo-700 leading-relaxed">{settings.depositInstructions}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => setMethod('bKash')}
              className={`py-3 rounded-2xl border-2 font-bold transition-all ${method === 'bKash' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
            >
              bKash
            </button>
            <button 
              type="button"
              onClick={() => setMethod('Nagad')}
              className={`py-3 rounded-2xl border-2 font-bold transition-all ${method === 'Nagad' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
            >
              Nagad
            </button>
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Send Money To ({method})</p>
            <p className="text-xl font-mono font-bold text-indigo-600">{method === 'bKash' ? settings.bkashNumber : settings.nagadNumber}</p>
          </div>

          <input 
            type="number" 
            placeholder="টাকার পরিমাণ (৳)" 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="ট্রানজেকশন আইডি (TrxID)" 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            required
          />
          <input 
            type="tel" 
            placeholder="আপনার নম্বর" 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            required
          />

          <button type="submit" className="w-full text-white font-bold py-4 rounded-2xl shadow-lg mt-4" style={{ backgroundColor: settings.themeColor }}>
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">টাকা উত্তোলন</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-slate-900">৳{user.balance.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => setMethod('bKash')}
              className={`py-3 rounded-2xl border-2 font-bold transition-all ${method === 'bKash' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
            >
              bKash
            </button>
            <button 
              type="button"
              onClick={() => setMethod('Nagad')}
              className={`py-3 rounded-2xl border-2 font-bold transition-all ${method === 'Nagad' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
            >
              Nagad
            </button>
          </div>

          <input 
            type="number" 
            placeholder="টাকার পরিমাণ (৳)" 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input 
            type="tel" 
            placeholder="আপনার অ্যাকাউন্ট নম্বর" 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            required
          />

          <button type="submit" className="w-full text-white font-bold py-4 rounded-2xl shadow-lg mt-4" style={{ backgroundColor: settings.themeColor }}>
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
      case 'users': return <AdminUsers users={users} setUsers={setUsers} impersonateUser={impersonateUser} />;
      case 'tasks': return <AdminTasks tasks={tasks} setTasks={setTasks} />;
      case 'plans': return <AdminPlans plans={plans} setPlans={setPlans} />;
      case 'deposits': return <AdminDeposits transactions={transactions} setTransactions={setTransactions} setUsers={setUsers} />;
      case 'withdrawals': return <AdminWithdrawals transactions={transactions} setTransactions={setTransactions} setUsers={setUsers} />;
      case 'settings': return <AdminSettings settings={settings} setSettings={setSettings} />;
      case 'support': return <AdminSupport tickets={tickets} setTickets={setTickets} />;
      default: return <AdminDashboard stats={stats} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 flex flex-col sticky top-0 md:h-screen z-40">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <AdminNavItem active={adminTab === 'dashboard'} onClick={() => setAdminTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <AdminNavItem active={adminTab === 'users'} onClick={() => setAdminTab('users')} icon={<Users size={20} />} label="Users" />
          <AdminNavItem active={adminTab === 'tasks'} onClick={() => setAdminTab('tasks')} icon={<ClipboardList size={20} />} label="Tasks" />
          <AdminNavItem active={adminTab === 'plans'} onClick={() => setAdminTab('plans')} icon={<Award size={20} />} label="Plans" />
          <AdminNavItem active={adminTab === 'deposits'} onClick={() => setAdminTab('deposits')} icon={<ArrowDownCircle size={20} />} label="Deposits" badge={stats.pendingDeposits} />
          <AdminNavItem active={adminTab === 'withdrawals'} onClick={() => setAdminTab('withdrawals')} icon={<ArrowUpCircle size={20} />} label="Withdrawals" badge={stats.pendingWithdrawals} />
          <AdminNavItem active={adminTab === 'support'} onClick={() => setAdminTab('support')} icon={<MessageSquare size={20} />} label="Support" badge={stats.openTickets} />
          <AdminNavItem active={adminTab === 'settings'} onClick={() => setAdminTab('settings')} icon={<Settings size={20} />} label="Settings" />
        </nav>

        <button 
          onClick={onLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 capitalize">{adminTab}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">Super Administrator</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">A</div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={adminTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderAdminTab()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AdminNavItem({ active, onClick, icon, label, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function AdminDashboard({ stats }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatCard icon={<Users className="text-blue-600" />} label="Total Users" value={stats.totalUsers} color="bg-blue-50" />
      <AdminStatCard icon={<Wallet className="text-emerald-600" />} label="Total Balance" value={`৳${stats.totalBalance.toFixed(2)}`} color="bg-emerald-50" />
      <AdminStatCard icon={<ArrowDownCircle className="text-amber-600" />} label="Pending Deposits" value={stats.pendingDeposits} color="bg-amber-50" />
      <AdminStatCard icon={<ArrowUpCircle className="text-rose-600" />} label="Pending Withdrawals" value={stats.pendingWithdrawals} color="bg-rose-50" />
    </div>
  );
}

function AdminStatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{u.username}</p>
                      <p className="text-xs text-slate-500">{u.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">৳{u.balance.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => impersonateUser(u.id)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Login as user"><Eye size={18} /></button>
                    <button onClick={() => adjustBalance(u.id, 100)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Add 100"><Plus size={18} /></button>
                    <button onClick={() => toggleBan(u.id)} className={`p-2 transition-colors ${u.status === 'active' ? 'text-slate-400 hover:text-rose-600' : 'text-rose-600 hover:text-emerald-600'}`} title={u.status === 'active' ? 'Ban' : 'Unban'}>
                      {u.status === 'active' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
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
  const [newTask, setNewTask] = useState({ title: '', description: '', amount: '', time: '', link: '', category: 'Video' });

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
      active: true
    };
    setTasks([...tasks, task]);
    setShowAdd(false);
    setNewTask({ title: '', description: '', amount: '', time: '', link: '', category: 'Video' });
  };

  const deleteTask = (id: string) => {
    if (confirm('Are you sure?')) {
      setTasks(tasks.filter((t: any) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Manage Tasks</h3>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Plus size={18} /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group">
            <button onClick={() => deleteTask(task.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors">
              <XCircle size={20} />
            </button>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <ClipboardList size={24} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{task.title}</h4>
            <p className="text-xs text-slate-500 mb-4">{task.description}</p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="text-lg font-bold text-indigo-600">৳{task.amount}</span>
              <span className="text-xs font-medium text-slate-400">{task.timeRequired}s • {task.category}</span>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add New Task</h3>
            <form onSubmit={addTask} className="space-y-4">
              <input type="text" placeholder="Title" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
              <input type="text" placeholder="Description" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Amount (৳)" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={newTask.amount} onChange={e => setNewTask({...newTask, amount: e.target.value})} required />
                <input type="number" placeholder="Time (s)" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} required />
              </div>
              <input type="text" placeholder="Link" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} required />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">Save Task</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">TrxID</th>
              <th className="px-6 py-4">Sender</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingDeposits.map((d: any) => (
              <tr key={d.id}>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{d.userId}</td>
                <td className="px-6 py-4 text-sm font-bold text-emerald-600">৳{d.amount}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{d.method}</td>
                <td className="px-6 py-4 text-sm font-mono text-slate-500">{d.trxId}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{d.accountNumber}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(d.id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle2 size={18} /></button>
                    <button onClick={() => handleAction(d.id, 'rejected')} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><XCircle size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingDeposits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No pending deposits</td>
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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Account</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingWithdrawals.map((w: any) => (
              <tr key={w.id}>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{w.userId}</td>
                <td className="px-6 py-4 text-sm font-bold text-rose-600">৳{w.amount}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{w.method}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{w.accountNumber}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(w.id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle2 size={18} /></button>
                    <button onClick={() => handleAction(w.id, 'rejected')} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><XCircle size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingWithdrawals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No pending withdrawals</td>
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
    <div className="max-w-2xl bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">bKash Number</label>
          <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={settings.bkashNumber} onChange={e => setSettings({...settings, bkashNumber: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nagad Number</label>
          <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={settings.nagadNumber} onChange={e => setSettings({...settings, nagadNumber: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min Withdrawal (৳)</label>
          <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={settings.minWithdrawal} onChange={e => setSettings({...settings, minWithdrawal: Number(e.target.value)})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Withdrawal/Day (৳)</label>
          <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4" value={settings.maxWithdrawalPerDay} onChange={e => setSettings({...settings, maxWithdrawalPerDay: Number(e.target.value)})} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website Notice</label>
        <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 h-24 resize-none" value={settings.websiteNotice} onChange={e => setSettings({...settings, websiteNotice: e.target.value})} />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposit Instructions</label>
        <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 h-24 resize-none" value={settings.depositInstructions} onChange={e => setSettings({...settings, depositInstructions: e.target.value})} />
      </div>
      <button onClick={() => alert('Settings saved!')} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100">Save All Settings</button>
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
    <div className="space-y-6">
      {tickets.map((ticket: any) => (
        <div key={ticket.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg mr-2">{ticket.category}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${ticket.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{ticket.status}</span>
              <h4 className="font-bold text-slate-900 mt-2">{ticket.subject}</h4>
              <p className="text-xs text-slate-500">User ID: {ticket.userId}</p>
            </div>
            <button 
              onClick={() => setActiveTicketId(activeTicketId === ticket.id ? null : ticket.id)}
              className="text-indigo-600 text-sm font-bold hover:underline"
            >
              {activeTicketId === ticket.id ? 'Cancel' : 'Reply'}
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-2xl italic">"{ticket.message}"</p>

          {ticket.replies.length > 0 && (
            <div className="space-y-3 mb-6 border-l-2 border-slate-100 pl-4">
              {ticket.replies.map((reply: any) => (
                <div key={reply.id} className="text-xs">
                  <p className="font-bold text-slate-900 mb-1">{reply.senderId === 'bot' ? 'AI Bot' : reply.isAdmin ? 'Admin' : 'User'}</p>
                  <p className="text-slate-600">{reply.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeTicketId === ticket.id && (
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type your reply..." 
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button 
                onClick={() => handleReply(ticket.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
              >
                Send
              </button>
            </div>
          )}
        </div>
      ))}
      {tickets.length === 0 && <div className="text-center py-12 text-slate-400 italic">No support tickets</div>}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus size={18} /> Add New Plan
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addPlan} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Plan Name" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} required />
          <input type="number" placeholder="Price" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} required />
          <input type="number" placeholder="Daily Tasks" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2" value={newPlan.dailyTasks} onChange={e => setNewPlan({...newPlan, dailyTasks: e.target.value})} required />
          <input type="number" placeholder="Daily Earning" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2" value={newPlan.dailyEarning} onChange={e => setNewPlan({...newPlan, dailyEarning: e.target.value})} required />
          <input type="number" placeholder="Validity (Days)" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2" value={newPlan.validity} onChange={e => setNewPlan({...newPlan, validity: e.target.value})} required />
          <button type="submit" className="bg-indigo-600 text-white font-bold rounded-xl py-2">Save Plan</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <div key={plan.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-slate-900">{plan.name}</h4>
              <button onClick={() => setPlans(plans.map((p: any) => p.id === plan.id ? { ...p, active: !p.active } : p))} className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${plan.active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {plan.active ? 'Active' : 'Inactive'}
              </button>
            </div>
            <p className="text-2xl font-bold text-indigo-600 mb-4">৳{plan.price}</p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>Daily Tasks: {plan.dailyTasks}</p>
              <p>Daily Earning: ৳{plan.dailyEarning}</p>
              <p>Validity: {plan.validityDays} Days</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

