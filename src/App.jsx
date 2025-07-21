import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query, setDoc, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as RechartsLegend } from 'recharts';
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, DollarSign, List, LayoutDashboard, Settings, Search, Download, Calendar, Repeat, Sparkles, Bot, Target, Banknote, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Award, RefreshCw, TrendingUp } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- Helper & Error Components (Defined First) ---

function FirebaseConfigError() {
    return (<div className="bg-gradient-to-br from-slate-900 to-black text-white min-h-screen flex items-center justify-center p-8"><div className="bg-red-900/50 backdrop-blur-md border border-red-500/50 p-8 rounded-2xl max-w-2xl text-center"><h1 className="text-3xl font-bold text-white mb-4">Configuration Error</h1><p className="text-lg text-slate-200 mb-6">It looks like you haven't configured your Firebase credentials yet.</p><p className="text-slate-300 mb-4">To fix this, open the <code className="bg-slate-700 p-1 rounded">.env</code> file in your project's root directory and add your Firebase credentials.</p></div></div>);
}

function GeminiConfigError() {
    return (<div className="bg-gradient-to-br from-slate-900 to-black text-white min-h-screen flex items-center justify-center p-8"><div className="bg-red-900/50 backdrop-blur-md border border-red-500/50 p-8 rounded-2xl max-w-2xl text-center"><h1 className="text-3xl font-bold text-white mb-4">AI Features Disabled</h1><p className="text-lg text-slate-200 mb-6">The Gemini API key is missing. AI-powered features like the financial coach and smart suggestions will not work.</p><p className="text-slate-300 mb-4">To fix this, get a free API key from Google AI Studio and add it to a <code className="bg-slate-700 p-1 rounded">.env</code> file in your project's root directory.</p><div className="bg-slate-800 p-4 rounded-lg text-left text-sm text-slate-400"><pre className="whitespace-pre-wrap">{`// Create a file named .env in the root of your project and add:\nVITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"`}</pre></div></div></div>);
}

const NavButton = ({ icon: Icon, label, activeView, onClick }) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${activeView === label.toLowerCase() ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'} transition-all duration-200`}>
        <Icon size={16} /> {label}
    </button>
);

// --- Login Page Component ---
function LoginPage({ auth }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');

    const handleEmailPassword = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-black text-white min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                <h1 className="text-5xl font-bold text-white text-center mb-2">Penny</h1>
                <p className="text-slate-400 text-center mb-8">{isSignUp ? 'Create an account to start tracking.' : 'Welcome back! Please sign in.'}</p>
                {error && <p className="bg-red-900 border border-red-600 text-red-300 p-3 rounded-lg mb-4">{error}</p>}
                <form onSubmit={handleEmailPassword} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-700 p-3 rounded-lg text-white" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-700 p-3 rounded-lg text-white" required />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition-all duration-300 transform hover:scale-105">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
                </form>
                <div className="my-6 flex items-center"><div className="flex-grow bg-slate-700 h-px"></div><span className="mx-4 text-slate-500">OR</span><div className="flex-grow bg-slate-700 h-px"></div></div>
                <button onClick={handleGoogleSignIn} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105">
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.508,44,29.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                    Sign in with Google
                </button>
                <p className="text-center text-slate-400 mt-6">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-400 hover:text-blue-300 font-bold ml-2">
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
}

// --- Main App Component ---
export default function App() {
    // --- Configuration Check ---
    if (!firebaseConfig.apiKey) return <FirebaseConfigError />;
    if (!GEMINI_API_KEY) return <GeminiConfigError />;

    // --- State Management ---
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // --- Firebase Initialization and Auth Listener ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const firebaseAuth = getAuth(app);
        setAuth(firebaseAuth);

        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setUser(user);
            setLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    if (loadingAuth) {
        return <div className="flex items-center justify-center h-screen bg-slate-900"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    if (!user) {
        return <LoginPage auth={auth} />;
    }

    return <BudgetApp user={user} auth={auth} />;
}

// --- Budget App Component (The main app after login) ---
function BudgetApp({ user, auth }) {
    const [db, setDb] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [categories, setCategories] = useState({ 
        expense: ['Bills', 'Food', 'Health', 'Transport', 'Subscriptions', 'Entertainment', 'Shopping', 'Other'], 
        income: ['Salary', 'Bonus', 'Freelance', 'Gift', 'Other'] 
    });
    const [assets, setAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [achievements, setAchievements] = useState({});
    
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    
    const [activeView, setActiveView] = useState('dashboard');
    const [isAddTxDialogOpen, setIsAddTxDialogOpen] = useState(false);
    const [isAddSubDialogOpen, setIsAddSubDialogOpen] = useState(false);
    
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const firestoreDb = getFirestore(initializeApp(firebaseConfig));
        setDb(firestoreDb);
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        if (!db || !user) return;
        setLoadingData(true);
        const userId = user.uid;
        const collectionsToFetch = [
            { path: `users/${userId}/transactions`, setter: setTransactions, transform: d => ({ ...d, date: d.date?.toDate ? d.date.toDate() : new Date(d.date) }) },
            { path: `users/${userId}/subscriptions`, setter: setSubscriptions },
            { path: `users/${userId}/assets`, setter: setAssets },
            { path: `users/${userId}/liabilities`, setter: setLiabilities },
            { path: `users/${userId}/savingsGoals`, setter: setSavingsGoals, transform: d => ({ ...d, dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : null }) },
            { path: `users/${userId}/settings/achievements`, setter: setAchievements, isDoc: true },
            { path: `users/${userId}/settings/budgets`, setter: setBudgets, isDoc: true },
            { path: `users/${userId}/settings/categories`, setter: setCategories, isDoc: true, default: { expense: ['Bills', 'Food', 'Health', 'Transport', 'Subscriptions', 'Entertainment', 'Shopping', 'Other'], income: ['Salary', 'Bonus', 'Freelance', 'Gift', 'Other'] } }
        ];
        const unsubscribes = collectionsToFetch.map(({ path, setter, transform, isDoc, default: defaultValue }) => 
            onSnapshot(isDoc ? doc(db, path) : collection(db, path), (snapshot) => {
                if (isDoc) setter(snapshot.exists() ? snapshot.data() : (defaultValue || {}));
                else {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setter(transform ? data.map(transform) : data);
                }
            }, (err) => { console.error(`Error fetching ${path}:`, err); setError(`Failed to load ${path}.`); })
        );
        setLoadingData(false);
        return () => unsubscribes.forEach(unsub => unsub());
    }, [db, user]);

    // --- Filtered Transactions ---
    const filteredTransactions = useMemo(() => transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const { start, end } = dateRange;
        if (start && transactionDate < new Date(start)) return false;
        if (end && transactionDate > new Date(end)) return false;
        return t.description.toLowerCase().includes(searchQuery.toLowerCase());
    }), [transactions, dateRange, searchQuery]);
    
    // --- CRUD Handlers ---
    const createCrudHandlers = (collectionName) => ({
        add: async (item) => {
            if (!db || !user) return;
            try { 
                const itemToAdd = { ...item };
                if (itemToAdd.amount) itemToAdd.amount = parseFloat(itemToAdd.amount);
                if (itemToAdd.date) itemToAdd.date = new Date(itemToAdd.date);
                if (itemToAdd.dueDate) itemToAdd.dueDate = new Date(itemToAdd.dueDate);
                if (itemToAdd.value) itemToAdd.value = parseFloat(itemToAdd.value);
                if (itemToAdd.targetAmount) itemToAdd.targetAmount = parseFloat(itemToAdd.targetAmount);
                if (itemToAdd.interestRate) itemToAdd.interestRate = parseFloat(itemToAdd.interestRate);
                if (itemToAdd.minimumPayment) itemToAdd.minimumPayment = parseFloat(itemToAdd.minimumPayment);
                await addDoc(collection(db, `users/${user.uid}/${collectionName}`), itemToAdd); 
            } 
            catch (err) { console.error(`Error adding ${collectionName}:`, err); }
        },
        update: async (id, updates) => {
            if (!db || !user) return;
            try { await updateDoc(doc(db, `users/${user.uid}/${collectionName}`, id), updates); } 
            catch (err) { console.error(`Error updating ${collectionName}:`, err); }
        },
        delete: async (id) => {
            if (!db || !user) return;
            if (window.confirm("Are you sure?")) {
                try { await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, id)); } 
                catch (err) { console.error(`Error deleting ${collectionName}:`, err); }
            }
        },
    });

    const transactionHandlers = createCrudHandlers('transactions');
    const subscriptionHandlers = createCrudHandlers('subscriptions');
    const assetHandlers = createCrudHandlers('assets');
    const liabilityHandlers = createCrudHandlers('liabilities');
    const savingsGoalHandlers = createCrudHandlers('savingsGoals');

    const handleSaveSettings = async (newBudgets, newCategories) => {
        if (!db || !user) return;
        const batch = writeBatch(db);
        batch.set(doc(db, `users/${user.uid}/settings/budgets`), newBudgets, { merge: true });
        batch.set(doc(db, `users/${user.uid}/settings/categories`), newCategories);
        try { await batch.commit(); alert("Settings saved!"); } 
        catch (e) { console.error("Error saving settings:", e); setError("Could not save settings."); }
    };

    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout Error:", error));
    };

    if (error) return <div className="flex items-center justify-center h-screen bg-slate-900 text-red-400">{error}</div>;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-black text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div><h1 className="text-3xl font-bold text-white">Penny</h1><p className="text-slate-400 mt-1">Welcome, {user.displayName || user.email}!</p></div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <div className="flex items-center bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-1 flex-wrap">
                            <NavButton icon={LayoutDashboard} label="Dashboard" activeView={activeView} onClick={() => setActiveView('dashboard')} />
                            <NavButton icon={List} label="Transactions" activeView={activeView} onClick={() => setActiveView('transactions')} />
                            <NavButton icon={Calendar} label="Calendar" activeView={activeView} onClick={() => setActiveView('calendar')} />
                            <NavButton icon={Repeat} label="Subscriptions" activeView={activeView} onClick={() => setActiveView('subscriptions')} />
                            <NavButton icon={Banknote} label="Net Worth" activeView={activeView} onClick={() => setActiveView('net worth')} />
                            <NavButton icon={Target} label="Goals" activeView={activeView} onClick={() => setActiveView('goals')} />
                            <NavButton icon={ShieldCheck} label="Debt" activeView={activeView} onClick={() => setActiveView('debt')} />
                            <NavButton icon={Award} label="Achievements" activeView={activeView} onClick={() => setActiveView('achievements')} />
                            <NavButton icon={Bot} label="Coach" activeView={activeView} onClick={() => setActiveView('coach')} />
                            <NavButton icon={Settings} label="Settings" activeView={activeView} onClick={() => setActiveView('settings')} />
                            <NavButton icon={TrendingUp} label="Scenarios" activeView={activeView} onClick={() => setActiveView('scenarios')} />
                        </div>
                        <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"><LogOut size={16} /><span>Logout</span></button>
                    </div>
                </header>
                <div className="mb-6">
                    <button onClick={() => setIsAddTxDialogOpen(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/20"><Plus size={20} /><span>Add New Transaction</span></button>
                </div>

                {loadingData ? <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div> : (
                    <>
                        {activeView === 'dashboard' && <DashboardView transactions={filteredTransactions} allTransactions={transactions} budgets={budgets} dateRange={dateRange} setDateRange={setDateRange} savingsGoals={savingsGoals} />}
                        {activeView === 'transactions' && <TransactionListView transactions={filteredTransactions} handleDeleteTransaction={transactionHandlers.delete} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
                        {activeView === 'calendar' && <CalendarView transactions={transactions} subscriptions={subscriptions} />}
                        {activeView === 'subscriptions' && <SubscriptionsView subscriptions={subscriptions} onAdd={() => setIsAddSubDialogOpen(true)} onDelete={subscriptionHandlers.delete} />}
                        {activeView === 'net worth' && <NetWorthView assets={assets} liabilities={liabilities} handlers={{asset: assetHandlers, liability: liabilityHandlers}} />}
                        {activeView === 'goals' && <SavingsGoalsView goals={savingsGoals} handlers={savingsGoalHandlers} />}
                        {activeView === 'debt' && <DebtPlannerView />}
                        {activeView === 'achievements' && <AchievementsView achievements={achievements} />}
                        {activeView === 'coach' && <FinancialCoachView transactions={transactions} budgets={budgets} subscriptions={subscriptions} />}
                        {activeView === 'settings' && <SettingsView initialBudgets={budgets} initialCategories={categories} onSave={handleSaveSettings} subscriptions={subscriptions} />}
                        {activeView === 'scenarios' && <ScenariosView transactions={transactions} />}
                    </>
                )}
            </div>
            {isAddTxDialogOpen && <AddTransactionDialog categories={categories} onClose={() => setIsAddTxDialogOpen(false)} onAdd={async (transaction) => { await transactionHandlers.add(transaction); setIsAddTxDialogOpen(false); }} />}
            {isAddSubDialogOpen && <AddSubscriptionDialog onClose={() => setIsAddSubDialogOpen(false)} onAdd={async (subscription) => { await subscriptionHandlers.add(subscription); setIsAddSubDialogOpen(false); }} />}
        </div>
    );
}
// --- Views ---

function DashboardView({ transactions, allTransactions, budgets, dateRange, setDateRange, savingsGoals }) {
    const summary = useMemo(() => transactions.reduce((acc, t) => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') acc.income += amount; else acc.expense += amount;
        return acc;
    }, { income: 0, expense: 0 }), [transactions]);
    const balance = summary.income - summary.expense;
    const expenseByCategory = useMemo(() => {
        const cats = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'Uncategorized';
            cats[cat] = (cats[cat] || 0) + (parseFloat(t.amount) || 0);
        });
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [transactions]);
    const trendData = useMemo(() => {
        const trends = {};
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        allTransactions.filter(t => new Date(t.date) >= sixMonthsAgo).forEach(t => {
            const month = new Date(t.date).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
            if (!trends[month]) trends[month] = { income: 0, expense: 0 };
            trends[month][t.type] += parseFloat(t.amount) || 0;
        });
        return Object.entries(trends).map(([name, values]) => ({ name, ...values })).reverse();
    }, [allTransactions]);
    const savingsRateData = useMemo(() => {
        const monthlyData = {};
        allTransactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
            if (t.type === 'income') monthlyData[month].income += t.amount;
            else monthlyData[month].expense += t.amount;
        });
        return Object.entries(monthlyData).map(([name, { income, expense }]) => ({
            name,
            rate: income > 0 ? ((income - expense) / income) * 100 : 0
        })).slice(-6);
    }, [allTransactions]);

    return (
        <main>
            <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Total Income" amount={summary.income} icon={ArrowUpRight} color="text-green-400" />
                <SummaryCard title="Total Expense" amount={summary.expense} icon={ArrowDownLeft} color="text-red-400" />
                <SummaryCard title="Balance" amount={balance} icon={DollarSign} color={balance >= 0 ? "text-sky-400" : "text-red-400"} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartCard title="Monthly Trends (Last 6 Months)"><ResponsiveContainer width="100%" height={300}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="name" tick={{ fill: '#9ca3af' }} /><YAxis tick={{ fill: '#9ca3af' }} tickFormatter={(v) => `£${v.toLocaleString('en-GB')}`} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} formatter={(v) => `£${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /><Legend /><Line type="monotone" dataKey="income" stroke="#4ade80" /><Line type="monotone" dataKey="expense" stroke="#f87171" /></LineChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Expenses by Category"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">{expenseByCategory.map((e, i) => <Cell key={`cell-${i}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'][i % 6]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} formatter={(v) => `£${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /><RechartsLegend /></PieChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Monthly Savings Rate"><ResponsiveContainer width="100%" height={300}><BarChart data={savingsRateData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="name" tick={{ fill: '#9ca3af' }} /><YAxis tick={{ fill: '#9ca3af' }} unit="%" /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} formatter={(v) => `${v.toFixed(2)}%`} /><Bar dataKey="rate" name="Savings Rate" fill="#2dd4bf" /></BarChart></ResponsiveContainer></ChartCard>
                <SavingsGoalsWidget goals={savingsGoals} />
            </div>
            <BudgetStatus budgets={budgets} expenses={expenseByCategory} />
        </main>
    );
}

function TransactionListView({ transactions, handleDeleteTransaction, searchQuery, setSearchQuery }) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">All Transactions</h2>
                <div className="flex items-center gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
            </div>
            {transactions.length > 0 ? <TransactionList transactions={transactions} handleDeleteTransaction={handleDeleteTransaction} /> : <EmptyState illustration={<EmptyWalletIllustration/>} message="No transactions yet. Add one to get started!"/>}
        </div>
    );
}

function SubscriptionsView({ subscriptions, onAdd, onDelete }) {
    const totalMonthlyCost = useMemo(() => subscriptions.reduce((total, sub) => total + (sub.amount || 0), 0), [subscriptions]);
    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-semibold text-white">Subscriptions & Bills</h2><p className="text-slate-400 mt-1">Total Monthly Cost: <span className="font-bold text-sky-400">£{totalMonthlyCost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p></div>
                <button onClick={onAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"><Plus size={16} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.sort((a,b) => a.name.localeCompare(b.name)).map(sub => (
                    <div key={sub.id} className="bg-slate-700/50 p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-slate-700">
                        <div className="flex justify-between items-start">
                            <div><h3 className="font-bold text-white">{sub.name}</h3><p className="text-sm text-slate-400">{sub.category}</p></div>
                            <button onClick={() => onDelete(sub.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                        <div className="mt-4 flex justify-between items-end"><p className="text-xl font-bold text-green-400">£{sub.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                    </div>
                ))}
            </div>
            {subscriptions.length === 0 && <EmptyState illustration={<EmptyCalendarIllustration/>} message="No subscriptions or bills added yet."/>}
        </div>
    );
}

function SettingsView({ initialBudgets, initialCategories, onSave, subscriptions }) {
    const [budgets, setBudgets] = useState(initialBudgets || {});
    const [categories, setCategories] = useState(initialCategories || { expense: [], income: [] });
    const [newCat, setNewCat] = useState({ type: 'expense', name: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    const subscriptionTotals = useMemo(() => {
        const totals = { Bills: 0, Subscriptions: 0 };
        if (subscriptions) subscriptions.forEach(sub => { if (totals[sub.category] !== undefined) totals[sub.category] += sub.amount || 0; });
        return totals;
    }, [subscriptions]);
    const totalBudgeted = useMemo(() => Object.values(budgets).reduce((t, a) => t + (parseFloat(a) || 0), 0), [budgets]);
    const handleBudgetChange = (cat, val) => setBudgets(p => ({ ...p, [cat]: parseFloat(val) || 0 }));
    const handleAddCategory = () => { if (newCat.name.trim() === '') return; setCategories(p => ({ ...p, [newCat.type]: [...(p[newCat.type] || []), newCat.name.trim()] })); setNewCat({ type: 'expense', name: '' }); };
    const handleRemoveCategory = (type, cat) => setCategories(p => ({ ...p, [type]: p[type].filter(c => c !== cat) }));
    
    const handleGetAISuggestions = async () => {
        setIsGenerating(true);
        const totalIncome = Object.values(budgets).filter((_, i) => categories.income.includes(Object.keys(budgets)[i])).reduce((t, a) => t + a, 0); // Simplified income
        const fixedExpenses = subscriptionTotals.Bills + subscriptionTotals.Subscriptions;
        const prompt = `My monthly income is £${totalIncome || 2000}. My fixed monthly bills and subscriptions total £${fixedExpenses}. Suggest a monthly budget based on the 50/30/20 rule for these categories: ${categories.expense.join(', ')}. Respond with only a valid JSON object where keys are category names and values are numbers.`;
        try {
            const resultText = await callGeminiApi(prompt);
            const jsonString = extractJson(resultText);
            if (jsonString) {
                const suggestedBudgets = JSON.parse(jsonString);
                setBudgets(prev => ({ ...prev, ...suggestedBudgets }));
            } else {
                throw new Error("No valid JSON found in AI response.");
            }
        } catch (e) {
            console.error("Error getting AI suggestions:", e);
            alert("Sorry, I couldn't generate budget suggestions right now.");
        }
        setIsGenerating(false);
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-6">Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Manage Categories</h3>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New category name" value={newCat.name} onChange={e => setNewCat(p => ({...p, name: e.target.value}))} className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        <select value={newCat.type} onChange={e => setNewCat(p => ({...p, type: e.target.value}))} className="bg-slate-700 border border-slate-600 rounded-lg p-2 text-white"><option value="expense">Expense</option><option value="income">Income</option></select>
                        <button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg">Add</button>
                    </div>
                    <div className="space-y-4">
                        <div><h4 className="text-lg font-medium text-slate-300 mb-2">Expense Categories</h4><div className="flex flex-wrap gap-2">{(categories.expense || []).map(cat => (<span key={cat} className="bg-slate-700 px-3 py-1 text-sm rounded-full flex items-center gap-2">{cat} <button onClick={() => handleRemoveCategory('expense', cat)} className="text-red-400 hover:text-red-300">&times;</button></span>))}</div></div>
                        <div><h4 className="text-lg font-medium text-slate-300 mb-2">Income Categories</h4><div className="flex flex-wrap gap-2">{(categories.income || []).map(cat => (<span key={cat} className="bg-slate-700 px-3 py-1 text-sm rounded-full flex items-center gap-2">{cat} <button onClick={() => handleRemoveCategory('income', cat)} className="text-red-400 hover:text-red-300">&times;</button></span>))}</div></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-baseline mb-4">
                        <h3 className="text-xl font-semibold text-white">Set Monthly Budgets</h3>
                        <p className="text-slate-400">Total: <span className="font-bold text-sky-400">£{totalBudgeted.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
                    </div>
                    <button onClick={handleGetAISuggestions} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mb-4 disabled:bg-slate-600">
                        <Sparkles size={16} /> {isGenerating ? 'Generating...' : 'Get AI Suggestions'}
                    </button>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {(categories.expense || []).map(cat => (
                            <div key={cat} className="flex justify-between items-center">
                                <label className="text-slate-300">{cat}</label>
                                <div className="flex items-center gap-2">
                                    {(cat === 'Bills' || cat === 'Subscriptions') && subscriptionTotals[cat] > 0 && (<span className="text-xs text-slate-400">(Current: £{subscriptionTotals[cat].toFixed(2)})</span>)}
                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span><input type="number" value={budgets[cat] || ''} onChange={e => handleBudgetChange(cat, e.target.value)} placeholder="0.00" className="w-32 bg-slate-700 border border-slate-600 rounded-lg py-2 pl-7 pr-2 text-white text-right" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-8 text-right"><button onClick={() => onSave(budgets, categories)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Save All Settings</button></div>
        </div>
    );
}

function FinancialCoachView({ transactions, budgets, subscriptions }) {
    const [question, setQuestion] = useState('');
    const [scenario, setScenario] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAskCoach = async (isScenario = false) => {
        const query = isScenario ? scenario : question;
        if (!query.trim()) return;
        setIsLoading(true);
        setAnswer('');

        const financialSummary = `
            - Recent Transactions: ${transactions.slice(0, 10).map(t => `${t.description}: £${t.amount}`).join(', ')}
            - Budgets: ${JSON.stringify(budgets)}
            - Subscriptions: ${subscriptions.map(s => `${s.name}: £${s.amount}`).join(', ')}
        `;
        
        const prompt = isScenario 
            ? `You are a helpful financial planning assistant. A user wants to know the impact of a potential financial change. Based on their current financial summary, analyze the scenario and provide a clear, actionable projection. User's scenario: "${query}". Financial Summary: ${financialSummary}`
            : `You are a friendly and encouraging UK-based financial coach. Based on the following financial summary, provide a helpful and actionable answer to the user's question. User's question: "${query}". Financial Summary: ${financialSummary}`;
        
        try {
            const resultText = await callGeminiApi(prompt);
            setAnswer(resultText);
        } catch (e) {
            console.error("Error contacting financial coach:", e);
            setAnswer("I'm sorry, I'm having trouble connecting right now. Please try again later.");
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-white mb-2">Your AI Financial Coach</h2>
                <p className="text-slate-400 mb-6">Ask anything about your finances, from saving tips to budget analysis.</p>
                <div className="space-y-4">
                    <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g., How can I save more money on groceries?" rows="3" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white"></textarea>
                    <button onClick={() => handleAskCoach(false)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600">
                        <Sparkles size={16} /> {isLoading ? 'Thinking...' : 'Ask Your Coach'}
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-white mb-2">"What-If" Scenario Planner</h2>
                <p className="text-slate-400 mb-6">See how a financial change could impact your future.</p>
                <div className="space-y-4">
                    <textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="e.g., What if my salary increases by £200 a month?" rows="3" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white"></textarea>
                    <button onClick={() => handleAskCoach(true)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600">
                        <Bot size={16} /> {isLoading ? 'Analyzing...' : 'Analyze Scenario'}
                    </button>
                </div>
            </div>

            {isLoading && <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>}
            {answer && <div className="bg-slate-700/50 p-4 rounded-lg prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />') }}></div>}
        </div>
    );
}

// --- New Feature Views ---

function NetWorthView({ assets, liabilities, handlers }) {
    const [item, setItem] = useState({ type: 'asset', name: '', value: '', interestRate: '', minimumPayment: '' });
    const totalAssets = useMemo(() => assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0), [assets]);
    const totalLiabilities = useMemo(() => liabilities.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0), [liabilities]);
    const netWorth = totalAssets - totalLiabilities;

    const handleAddItem = (e) => {
        e.preventDefault();
        const handler = item.type === 'asset' ? handlers.asset : handlers.liability;
        const newItem = {
            name: item.name,
            value: parseFloat(item.value)
        };
        if (item.type === 'liability') {
            newItem.interestRate = parseFloat(item.interestRate || 0);
            newItem.minimumPayment = parseFloat(item.minimumPayment || 0);
        }
        handler.add(newItem);
        setItem({ type: 'asset', name: '', value: '', interestRate: '', minimumPayment: '' });
    };

    return (
        <div className="space-y-8">
            <div className="text-center bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl">
                <p className="text-slate-400 text-lg">Your Total Net Worth</p>
                <p className={`text-5xl font-bold ${netWorth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    £{netWorth.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FinancialListComponent title="Assets" items={assets} total={totalAssets} color="text-green-400" onDelete={handlers.asset.delete} />
                <FinancialListComponent title="Liabilities" items={liabilities} total={totalLiabilities} color="text-red-400" onDelete={handlers.liability.delete} />
            </div>
            <form onSubmit={handleAddItem} className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl space-y-4">
                <h3 className="text-xl font-semibold text-white">Add New Item</h3>
                <div className="flex flex-wrap gap-4">
                    <select value={item.type} onChange={e => setItem({...item, type: e.target.value})} className="bg-slate-700 border border-slate-600 rounded-lg p-2 text-white">
                        <option value="asset">Asset</option>
                        <option value="liability">Liability</option>
                    </select>
                    <input type="text" placeholder="Item Name (e.g., Savings Account)" value={item.name} onChange={e => setItem({...item, name: e.target.value})} className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required />
                    <input type="number" placeholder="Value/Balance" value={item.value} onChange={e => setItem({...item, value: e.target.value})} className="w-32 bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" required />
                    {item.type === 'liability' && (
                        <>
                            <input type="number" placeholder="Interest Rate %" value={item.interestRate} onChange={e => setItem({...item, interestRate: e.target.value})} className="w-32 bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                            <input type="number" placeholder="Min. Payment" value={item.minimumPayment} onChange={e => setItem({...item, minimumPayment: e.target.value})} className="w-32 bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" />
                        </>
                    )}
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg">Add Item</button>
                </div>
            </form>
        </div>
    );
}

function FinancialListComponent({ title, items, total, color, onDelete }) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <h2 className={`text-2xl font-semibold text-white mb-4 border-b-2 ${color.replace('text-', 'border-')} pb-2`}>{title}</h2>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                        <div>
                            <p>{item.name}</p>
                            {title === 'Liabilities' && (
                                <p className="text-xs text-slate-400">{item.interestRate || 0}% APR | Min: £{item.minimumPayment || 0}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span>£{parseFloat(item.value).toLocaleString('en-GB')}</span>
                            <button onClick={() => onDelete(item.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-slate-700 pt-2">
                <span>Total {title}</span>
                <span className={color}>£{total.toLocaleString('en-GB')}</span>
            </div>
        </div>
    );
}

function SavingsGoalsView({ goals, handlers }) {
    const [item, setItem] = useState({ name: '', targetAmount: '', currentAmount: 0, dueDate: '' });
    const [contribution, setContribution] = useState({ id: null, amount: '' });

    const handleAddGoal = (e) => {
        e.preventDefault();
        handlers.add({ ...item, targetAmount: parseFloat(item.targetAmount), currentAmount: 0 });
        setItem({ name: '', targetAmount: '', dueDate: '' });
    };

    const handleAddFunds = (goalId) => {
        const goal = goals.find(g => g.id === goalId);
        const newAmount = (goal.currentAmount || 0) + parseFloat(contribution.amount);
        handlers.update(goalId, { currentAmount: newAmount });
        setContribution({ id: null, amount: '' });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                    return (
                        <div key={goal.id} className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-white">{goal.name}</h3>
                                <button onClick={() => handlers.delete(goal.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                            <div>
                                <div className="w-full bg-slate-700 rounded-full h-4">
                                    <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-slate-300">£{parseFloat(goal.currentAmount || 0).toLocaleString('en-GB')}</span>
                                    <span className="text-slate-400">£{parseFloat(goal.targetAmount).toLocaleString('en-GB')}</span>
                                </div>
                                {goal.dueDate && <p className="text-xs text-slate-400 mt-1">Due: {new Date(goal.dueDate).toLocaleDateString('en-GB')}</p>}
                            </div>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Add funds" value={contribution.id === goal.id ? contribution.amount : ''} onChange={e => setContribution({ id: goal.id, amount: e.target.value })} className="w-full bg-slate-700 p-2 rounded-lg" />
                                <button onClick={() => handleAddFunds(goal.id)} className="bg-green-600 p-2 rounded-lg">Add</button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {goals.length === 0 && <EmptyState illustration={<EmptyPiggyBankIllustration/>} message="No savings goals yet. Create one to get started!"/>}
            <form onSubmit={handleAddGoal} className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl space-y-4">
                <h3 className="text-xl font-semibold text-white">Create New Savings Goal</h3>
                <div className="flex flex-wrap gap-4">
                    <input type="text" placeholder="Goal Name (e.g., Holiday Fund)" value={item.name} onChange={e => setItem({...item, name: e.target.value})} className="flex-grow bg-slate-700 p-2 rounded-lg" required />
                    <input type="number" placeholder="Target Amount" value={item.targetAmount} onChange={e => setItem({...item, targetAmount: e.target.value})} className="w-48 bg-slate-700 p-2 rounded-lg" required />
                    <input type="date" value={item.dueDate} onChange={e => setItem({...item, dueDate: e.target.value})} className="bg-slate-700 p-2 rounded-lg" />
                    <button type="submit" className="bg-blue-600 font-bold p-2 rounded-lg">Create Goal</button>
                </div>
            </form>
        </div>
    );
}

function DebtPlannerView() {
    const [extraPayment, setExtraPayment] = useState(100);
    const [strategy, setStrategy] = useState('avalanche'); // 'avalanche' or 'snowball'
    const [schedule, setSchedule] = useState(null);
    const [debts, setDebts] = useState([]); // Manage debts internally

    // State for new debt input fields
    const [newDebtName, setNewDebtName] = useState('');
    const [newDebtBalance, setNewDebtBalance] = useState('');
    const [newDebtInterestRate, setNewDebtInterestRate] = useState('');
    const [newDebtMinPayment, setNewDebtMinPayment] = useState('');

    const addDebt = () => {
        if (newDebtName && parseFloat(newDebtBalance) > 0 && parseFloat(newDebtInterestRate) >= 0 && parseFloat(newDebtMinPayment) >= 0) {
            setDebts([...debts, {
                id: Date.now(), // Unique ID for keying
                name: newDebtName,
                value: parseFloat(newDebtBalance), // Use 'value' to match original structure, though it's the initial balance
                balance: parseFloat(newDebtBalance), // Current working balance
                interestRate: parseFloat(newDebtInterestRate),
                minimumPayment: parseFloat(newDebtMinPayment)
            }]);
            // Clear input fields after adding
            setNewDebtName('');
            setNewDebtBalance('');
            setNewDebtInterestRate('');
            setNewDebtMinPayment('');
            setSchedule(null); // Clear schedule when debts change
        } else {
            alert('Please fill in all debt fields with valid positive numbers for balance/payments and non-negative for interest rate.');
        }
    };

    const removeDebt = (id) => {
        setDebts(debts.filter(debt => debt.id !== id));
        setSchedule(null); // Clear schedule when debts change
    };

    const calculatePaydown = () => {
        if (debts.length === 0) {
            alert('Please add at least one debt to calculate.');
            return;
        }

        let workingDebts = JSON.parse(JSON.stringify(debts.map(d => ({
            ...d,
            balance: parseFloat(d.value) // Reset balance to initial 'value' for calculation
        }))));

        if (strategy === 'avalanche') {
            workingDebts.sort((a, b) => b.interestRate - a.interestRate);
        } else if (strategy === 'snowball') {
            workingDebts.sort((a, b) => a.balance - b.balance);
        }

        let months = 0;
        let totalInterestPaid = 0;
        let paymentSchedule = [];
        const maxMonths = 600; // Safety break after 50 years

        while (workingDebts.some(d => d.balance > 0) && months < maxMonths) {
            months++;
            let currentMonthExtraPaymentPool = extraPayment; // Pool for extra payments this month
            let totalPaymentsThisMonth = 0;
            let currentMonthInterestAccrued = 0;

            // Step 1: Accrue interest and make minimum payments for all active debts
            workingDebts.forEach(debt => {
                if (debt.balance > 0) {
                    const monthlyInterestRate = debt.interestRate / 100 / 12;
                    const interestAccrued = debt.balance * monthlyInterestRate;
                    debt.balance += interestAccrued;
                    totalInterestPaid += interestAccrued;
                    currentMonthInterestAccrued += interestAccrued;

                    const minPaymentApplied = Math.min(debt.balance, debt.minimumPayment);
                    debt.balance -= minPaymentApplied;
                    totalPaymentsThisMonth += minPaymentApplied;
                }
            });

            // Step 2: Apply the extra payment to the prioritized debt(s)
            // This loop will distribute the 'extraPayment' after all minimums are paid
            for (const debt of workingDebts) {
                if (debt.balance > 0 && currentMonthExtraPaymentPool > 0) {
                    const paymentAmount = Math.min(debt.balance, currentMonthExtraPaymentPool);
                    debt.balance -= paymentAmount;
                    currentMonthExtraPaymentPool -= paymentAmount;
                    totalPaymentsThisMonth += paymentAmount; // Add extra payment to total payments
                }
            }

            // Record monthly snapshot
            paymentSchedule.push({
                month: months,
                totalBalance: workingDebts.reduce((sum, d) => sum + Math.max(0, d.balance), 0),
                totalInterestPaidToDate: totalInterestPaid,
                monthlyTotalPayment: totalPaymentsThisMonth,
                monthlyInterest: currentMonthInterestAccrued
            });
        }
        setSchedule({ months, totalInterestPaid, paymentSchedule });
    };

    return (
        <div className="space-y-8 p-4 md:p-8 text-white">
            {/* Input and Strategy Controls */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-white mb-4">Debt Paydown Planner</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label htmlFor="strategy" className="block text-sm text-slate-400 mb-1">Strategy</label>
                        <select
                            id="strategy"
                            value={strategy}
                            onChange={e => { setStrategy(e.target.value); setSchedule(null); }}
                            className="bg-slate-700 p-2 rounded-lg w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="avalanche">Avalanche (Highest Interest First)</option>
                            <option value="snowball">Snowball (Lowest Balance First)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="extraPayment" className="block text-sm text-slate-400 mb-1">Extra Monthly Payment (£)</label>
                        <input
                            id="extraPayment"
                            type="number"
                            value={extraPayment}
                            onChange={e => { setExtraPayment(parseFloat(e.target.value) || 0); setSchedule(null); }}
                            className="bg-slate-700 p-2 rounded-lg w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                            min="0"
                        />
                    </div>
                    <button
                        onClick={calculatePaydown}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition-colors duration-200 self-end md:col-span-2 lg:col-span-1"
                    >
                        Calculate Payoff
                    </button>
                </div>
            </div>

            {/* Debt Input Section */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Add a New Debt</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end mb-4">
                    <div>
                        <label htmlFor="debtName" className="block text-sm text-slate-400 mb-1">Debt Name</label>
                        <input
                            id="debtName"
                            type="text"
                            value={newDebtName}
                            onChange={e => setNewDebtName(e.target.value)}
                            className="bg-slate-700 p-2 rounded-lg w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="e.g., Credit Card A"
                        />
                    </div>
                    <div>
                        <label htmlFor="debtBalance" className="block text-sm text-slate-400 mb-1">Current Balance (£)</label>
                        <input
                            id="debtBalance"
                            type="number"
                            value={newDebtBalance}
                            onChange={e => setNewDebtBalance(e.target.value)}
                            className="bg-slate-700 p-2 rounded-lg w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="1000"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="debtInterest" className="block text-sm text-slate-400 mb-1">Interest Rate (%)</label>
                        <input
                            id="debtInterest"
                            type="number"
                            value={newDebtInterestRate}
                            onChange={e => setNewDebtInterestRate(e.target.value)}
                            className="bg-slate-700 p-2 rounded-lg w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="18.9"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="debtMinPayment" className="block text-sm text-slate-400 mb-1">Min. Payment (£)</label>
                        <input
                            id="debtMinPayment"
                            type="number"
                            value={newDebtMinPayment}
                            onChange={e => setNewDebtMinPayment(e.target.value)}
                            className="bg-slate-700 p-2 rounded-lg w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="25"
                            min="0"
                        />
                    </div>
                    <button
                        onClick={addDebt}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition-colors duration-200 lg:col-span-1"
                    >
                        Add Debt
                    </button>
                </div>

                {/* List of Added Debts */}
                {debts.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-slate-300 mb-3">Your Debts:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {debts.map(debt => (
                                <div key={debt.id} className="bg-slate-700/70 p-4 rounded-lg flex justify-between items-center border border-slate-600">
                                    <div>
                                        <p className="font-bold text-white text-lg">{debt.name}</p>
                                        <p className="text-sm text-slate-400">Balance: £{debt.value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                                        <p className="text-sm text-slate-400">Rate: {debt.interestRate}% | Min. Payment: £{debt.minimumPayment.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <button
                                        onClick={() => removeDebt(debt.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition-colors duration-200 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Projected Payoff Results */}
            {schedule && (
                <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl text-center shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Projected Payoff</h3>
                    {schedule.months === 600 && debts.some(d => d.balance > 0) ? (
                        <p className="text-lg text-yellow-400">
                            Calculation stopped after 50 years. You might need a larger extra payment or a different strategy to pay off sooner.
                        </p>
                    ) : (
                        <div className="flex flex-col md:flex-row justify-around gap-6">
                            <div>
                                <p className="text-slate-400 text-lg">Payoff Time</p>
                                <p className="text-4xl font-bold text-green-400">
                                    {Math.floor(schedule.months / 12)}y {schedule.months % 12}m
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-lg">Total Interest Paid</p>
                                <p className="text-4xl font-bold text-red-400">
                                    £{schedule.totalInterestPaid.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Reusable Components ---
const ChartCard = ({ title, children }) => (<div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg"><h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>{children}</div>);
function SummaryCard({ title, amount, icon: Icon, color }) {
    return (<div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:border-blue-500"><div><p className="text-slate-400 text-sm font-medium">{title}</p><p className={`text-2xl font-bold ${color}`}>£{amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div><div className={`p-3 rounded-full bg-slate-700 ${color}`}><Icon size={24} /></div></div>);
}
function TransactionList({ transactions, handleDeleteTransaction }) {
    if (transactions.length === 0) return <EmptyState illustration={<EmptyWalletIllustration/>} message="No transactions match your criteria."/>;
    return (<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-700"><th className="p-3 text-sm font-semibold text-slate-400">Date</th><th className="p-3 text-sm font-semibold text-slate-400">Description</th><th className="p-3 text-sm font-semibold text-slate-400">Category</th><th className="p-3 text-sm font-semibold text-slate-400 text-right">Amount</th><th className="p-3 text-sm font-semibold text-slate-400 text-center">Action</th></tr></thead><tbody>{transactions.map(t => (<tr key={t.id} className="border-b border-slate-700 hover:bg-slate-700/50"><td className="p-3 text-slate-300">{new Date(t.date).toLocaleDateString('en-GB')}</td><td className="p-3 text-slate-300">{t.description}</td><td className="p-3 text-slate-300"><span className="bg-slate-700 px-2 py-1 text-xs rounded-full">{t.category}</span></td><td className={`p-3 text-right font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '-'} £{parseFloat(t.amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="p-3 text-center"><button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>);
}
function AddTransactionDialog({ categories, onClose, onAdd }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories.expense[0] || 'Other');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => { setCategory(type === 'expense' ? (categories.expense[0] || 'Other') : (categories.income[0] || 'Other')); }, [type, categories]);
    
    const handleSuggestCategory = async () => {
        if (!description) return;
        setIsSuggesting(true);
        const prompt = `Based on the expense description "${description}", suggest the best category from this list: ${categories.expense.join(', ')}. Respond with only the single best category name.`;
        try {
            const suggestedCategory = await callGeminiApi(prompt);
            if (categories.expense.includes(suggestedCategory.trim())) {
                setCategory(suggestedCategory.trim());
            }
        } catch (e) {
            console.error("Error suggesting category:", e);
        }
        setIsSuggesting(false);
    };

    const handleSubmit = async (e) => { 
        e.preventDefault(); 
        if (!amount || !description || !date) { 
            alert("Please fill all fields."); 
            return; 
        } 
        await onAdd({ type, amount, category, description, date }); 
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md m-4">
                <h2 className="text-2xl font-bold mb-6 text-white">Add New Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><span className="text-slate-400 text-sm font-bold mb-2 block">Transaction Type</span><div className="flex items-center bg-slate-700 rounded-lg p-1"><button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-medium rounded-md ${type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-300'}`}>Expense</button><button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-medium rounded-md ${type === 'income' ? 'bg-green-500 text-white' : 'text-slate-300'}`}>Income</button></div></div>
                    <div><label className="text-slate-400 text-sm font-bold mb-2 block" htmlFor="amount">Amount (£)</label><input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white" required /></div>
                    <div><label className="text-slate-400 text-sm font-bold mb-2 block" htmlFor="description">Description</label><div className="flex gap-2"><input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Weekly shop at Tesco" className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white" required /><button type="button" onClick={handleSuggestCategory} disabled={isSuggesting || type === 'income'} className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded-lg disabled:bg-slate-600"><Sparkles size={16} /></button></div></div>
                    <div><label className="text-slate-400 text-sm font-bold mb-2 block" htmlFor="category">Category</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white">{(type === 'expense' ? categories.expense : categories.income).map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                    <div><label className="text-slate-400 text-sm font-bold mb-2 block" htmlFor="date">Date</label><input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white" required /></div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold rounded-lg">Cancel</button><button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Add Transaction</button></div>
                </form>
            </div>
        </div>
    );
}
function AddSubscriptionDialog({ onClose, onAdd }) {
    const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [category, setCategory] = useState('Subscriptions');
    const handleSubmit = async (e) => { 
        e.preventDefault(); 
        if (!name || !amount) { 
            alert("Please fill all fields."); 
            return; 
        } 
        await onAdd({ name, amount, category }); 
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"><div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md m-4"><h2 className="text-2xl font-bold mb-6 text-white">Add Subscription or Bill</h2><form onSubmit={handleSubmit}><div className="mb-4"><label className="text-slate-400 text-sm font-bold mb-2 block" htmlFor="sub-name">Name</label><input id="sub-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Netflix" className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white" required /></div><div className="mb-4"><label className="text-slate-400 text-sm font-bold mb-2 block" htmlFor="sub-amount">Amount (£)</label><input id="sub-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white" required /></div><div className="mb-6"><label className="text-slate-400 text-sm font-bold mb-2 block" htmlFor="sub-category">Category</label><select id="sub-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white"><option value="Subscriptions">Subscriptions</option><option value="Bills">Bills</option></select></div><div className="flex justify-end gap-4 mt-8"><button type="button" onClick={onClose} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold rounded-lg">Cancel</button><button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Add Subscription</button></div></form></div></div>);
}
function DateRangeFilter({ dateRange, setDateRange }) {
    const setThisMonth = () => { const now = new Date(); setDateRange({ start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0] }); };
    const setLastMonth = () => { const now = new Date(); setDateRange({ start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0], end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0] }); };
    return (<div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl mb-8 flex flex-col sm:flex-row items-center gap-4"><div className="flex items-center gap-2"><button onClick={setThisMonth} className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg text-sm">This Month</button><button onClick={setLastMonth} className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg text-sm">Last Month</button></div><div className="flex items-center gap-2"><input type="date" value={dateRange.start || ''} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" /><span className="text-slate-400">to</span><input type="date" value={dateRange.end || ''} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-slate-700 border border-slate-600 rounded-lg p-2 text-white" /></div><button onClick={() => setDateRange({start: null, end: null})} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Clear Filter</button></div>);
}
function BudgetStatus({ budgets, expenses }) {
    const budgetData = useMemo(() => Object.entries(budgets).map(([cat, bud]) => { const spent = expenses.find(e => e.name === cat)?.value || 0; return { cat, bud, spent, percentage: bud > 0 ? (spent / bud) * 100 : 0 }; }).filter(b => b.bud > 0), [budgets, expenses]);
    if (budgetData.length === 0) return null;
    return (<ChartCard title="Budget Status"><div className="space-y-4">{budgetData.map(({ cat, bud, spent, percentage }) => (<div key={cat}><div className="flex justify-between mb-1 text-sm"><span className="font-medium text-slate-300">{cat}</span><span className="text-slate-400">£{spent.toFixed(2)} / £{bud.toFixed(2)}</span></div><div className="w-full bg-slate-700 rounded-full h-2.5"><div className={`${percentage > 100 ? 'bg-red-500' : 'bg-green-500'} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div></div></div>))}</div></ChartCard>);
}

// --- NEW CALENDAR VIEW ---
function CalendarView({ transactions, subscriptions }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const eventsByDate = useMemo(() => {
        const events = {};
        transactions.forEach(t => {
            const date = new Date(t.date).toDateString();
            if (!events[date]) events[date] = [];
            events[date].push({ ...t, type: 'transaction' });
        });
        // Note: This is a simplified subscription model. It shows all subscriptions on their name.
        // A more advanced model would calculate recurring due dates.
        return events;
    }, [transactions]);

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="border border-slate-700"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = date.toDateString();
        const dayEvents = eventsByDate[dateString] || [];

        calendarDays.push(
            <div key={day} className="border border-slate-700 p-2 h-32 flex flex-col">
                <span className="font-bold">{day}</span>
                <div className="flex-grow overflow-y-auto text-xs space-y-1 mt-1">
                    {dayEvents.map(event => (
                        <div key={event.id} className={`p-1 rounded ${event.type === 'income' ? 'bg-green-800/50' : 'bg-red-800/50'}`}>
                            {event.description} - £{event.amount}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-700"><ChevronLeft /></button>
                <h2 className="text-2xl font-semibold text-white">{currentDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-700"><ChevronRight /></button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold p-2 bg-slate-800">{day}</div>
                ))}
                {calendarDays}
            </div>
        </div>
    );
}

// --- NEW ACHIEVEMENTS VIEW ---
function AchievementsView({ achievements }) {
    const allBadges = [
        { id: 'dailyLogin', name: 'Daily Login', description: 'Log in for the first time today.', icon: <LogOut/> },
        { id: 'onARoll', name: 'On a Roll', description: 'Log in 3 days in a row.', icon: <Repeat/> },
        { id: 'noSpendDay', name: 'No-Spend Day', description: 'Go a full day without any expenses.', icon: <ShieldCheck/> },
        { id: 'budgetBoss', name: 'Budget Boss', description: 'Stay under budget for a whole month.', icon: <Target/> },
        { id: 'goalGetter', name: 'Goal Getter', description: 'Successfully complete a savings goal.', icon: <Award/> },
    ];

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-white mb-6">Your Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allBadges.map(badge => {
                    const isEarned = achievements[badge.id];
                    return (
                        <div key={badge.id} className={`p-6 rounded-xl text-center transition-all duration-300 ${isEarned ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-700 text-slate-400'}`}>
                            <div className={`mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center ${isEarned ? 'bg-white/20' : 'bg-slate-600'}`}>
                                {React.cloneElement(badge.icon, { size: 32, className: isEarned ? 'text-white' : 'text-slate-500' })}
                            </div>
                            <h3 className={`font-bold ${isEarned ? 'text-white' : 'text-slate-300'}`}>{badge.name}</h3>
                            <p className="text-xs mt-1">{badge.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- Empty State Illustrations ---
const EmptyState = ({ illustration, message }) => (
    <div className="text-center py-16">
        <div className="w-48 mx-auto text-slate-600">{illustration}</div>
        <p className="text-slate-400 mt-4">{message}</p>
    </div>
);

const EmptyWalletIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
    </svg>
);

const EmptyCalendarIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const EmptyPiggyBankIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.7 15.3c-1.2-1.2-2.9-1.2-4.1 0s-1.2 2.9 0 4.1c1.2 1.2 2.9 1.2 4.1 0s1.2-2.9 0-4.1z"/><path d="M11.3 15.3c-1.2-1.2-2.9-1.2-4.1 0s-1.2 2.9 0 4.1c1.2 1.2 2.9 1.2 4.1 0s1.2-2.9 0-4.1z"/><path d="M15.5 15.5c-1.2-1.2-2.9-1.2-4.1 0s-1.2 2.9 0 4.1c1.2 1.2 2.9 1.2 4.1 0s1.2-2.9 0-4.1z"/><path d="M12 3a1 1 0 0 0-1 1v2.5a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z"/><path d="M12 21a1 1 0 0 0 1-1v-2.5a1 1 0 0 0-2 0V20a1 1 0 0 0 1 1z"/><path d="M3 12a1 1 0 0 0-1 1h2.5a1 1 0 0 0 0-2H2a1 1 0 0 0-1 1z"/><path d="M21 12a1 1 0 0 0 1-1h-2.5a1 1 0 0 0 0 2H22a1 1 0 0 0 1-1z"/>
    </svg>
);

// --- NEW CURRENCY CONVERTER ---
function CurrencyConverter() {
    const [amount, setAmount] = useState(1);
    const [fromCurrency, setFromCurrency] = useState('GBP');
    const [toCurrency, setToCurrency] = useState('USD');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currencies = ['GBP', 'USD', 'EUR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

    useEffect(() => {
        if (amount === '' || !fromCurrency || !toCurrency) return;
        
        setLoading(true);
        setError(null);
        
        fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
            .then(res => res.json())
            .then(data => {
                const rate = data.rates[toCurrency];
                setResult((amount * rate).toFixed(2));
                setLoading(false);
            })
            .catch(err => {
                setError("Could not fetch exchange rates.");
                setLoading(false);
                console.error(err);
            });

    }, [amount, fromCurrency, toCurrency]);

    return (
        <ChartCard title="Currency Converter">
            <div className="space-y-4">
                <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm text-slate-400 mb-1">Amount</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-700 p-2 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">From</label>
                        <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className="w-full bg-slate-700 p-2 rounded-lg">
                            {currencies.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="p-2">
                        <RefreshCw size={20} className="text-slate-400" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">To</label>
                        <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className="w-full bg-slate-700 p-2 rounded-lg">
                            {currencies.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                {loading && <div className="text-center">Loading...</div>}
                {error && <div className="text-center text-red-400">{error}</div>}
                {result && !loading && (
                    <div className="text-center bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-slate-400">{amount} {fromCurrency} =</p>
                        <p className="text-3xl font-bold text-green-400">{result} {toCurrency}</p>
                    </div>
                )}
            </div>
        </ChartCard>
    );
}

// --- NEW SAVINGS GOALS WIDGET ---
function SavingsGoalsWidget({ goals }) {
    return (
        <ChartCard title="Savings Goals">
            <div className="space-y-4">
                {goals.slice(0, 3).map(goal => {
                    const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                    return (
                        <div key={goal.id}>
                            <div className="flex justify-between mb-1 text-sm">
                                <span className="font-medium text-slate-300">{goal.name}</span>
                                <span className="text-slate-400">{Math.round(percentage)}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && <EmptyState illustration={<EmptyPiggyBankIllustration/>} message="No goals set yet."/>}
            </div>
        </ChartCard>
    );
}

// --- Add this new component to your file ---

function ScenariosView({ transactions }) {
    // Calculate the current balance from all existing transactions
    const currentBalance = useMemo(() => {
        return transactions.reduce((acc, t) => {
            const amount = parseFloat(t.amount) || 0;
            return t.type === 'income' ? acc + amount : acc - amount;
        }, 0);
    }, [transactions]);

    // State for the list of planned income/expense items
    const [plannedItems, setPlannedItems] = useState([]);
    // State for the input form
    const [newItem, setNewItem] = useState({ description: '', amount: '', type: 'expense' });

    // Calculate totals for planned items
    const { plannedIncome, plannedExpense } = useMemo(() => {
        return plannedItems.reduce((acc, item) => {
            const amount = parseFloat(item.amount) || 0;
            if (item.type === 'income') {
                acc.plannedIncome += amount;
            } else {
                acc.plannedExpense += amount;
            }
            return acc;
        }, { plannedIncome: 0, plannedExpense: 0 });
    }, [plannedItems]);

    // Calculate the final projected balance
    const projectedBalance = currentBalance + plannedIncome - plannedExpense;

    // Handler to add a new item to the list
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.description || !newItem.amount || parseFloat(newItem.amount) <= 0) {
            alert('Please enter a valid description and a positive amount.');
            return;
        }
        setPlannedItems([...plannedItems, { ...newItem, id: Date.now() }]);
        setNewItem({ description: '', amount: '', type: 'expense' }); // Reset form
    };

    // Handler to remove an item from the list
    const handleRemoveItem = (id) => {
        setPlannedItems(plannedItems.filter(item => item.id !== id));
    };
    
    // Handler for input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="Current Balance" amount={currentBalance} icon={DollarSign} color="text-sky-400" />
                <SummaryCard title="Projected Change" amount={plannedIncome - plannedExpense} icon={TrendingUp} color={(plannedIncome - plannedExpense) >= 0 ? "text-green-400" : "text-red-400"} />
                <SummaryCard title="Projected Balance" amount={projectedBalance} icon={ShieldCheck} color={projectedBalance >= 0 ? "text-green-400" : "text-red-400"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Add Planned Transaction</h2>
                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div>
                            <label className="text-slate-400 text-sm font-bold mb-2 block">Type</label>
                            <div className="flex items-center bg-slate-700 rounded-lg p-1">
                                <button type="button" onClick={() => setNewItem({...newItem, type: 'expense'})} className={`flex-1 py-2 text-sm font-medium rounded-md ${newItem.type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-300'}`}>Expense</button>
                                <button type="button" onClick={() => setNewItem({...newItem, type: 'income'})} className={`flex-1 py-2 text-sm font-medium rounded-md ${newItem.type === 'income' ? 'bg-green-500 text-white' : 'text-slate-300'}`}>Income</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="text-slate-400 text-sm font-bold mb-2 block">Description</label>
                            <input id="description" name="description" type="text" value={newItem.description} onChange={handleInputChange} placeholder="e.g., Upcoming freelance payment" className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white" required />
                        </div>
                        <div>
                            <label htmlFor="amount" className="text-slate-400 text-sm font-bold mb-2 block">Amount (£)</label>
                            <input id="amount" name="amount" type="number" value={newItem.amount} onChange={handleInputChange} placeholder="0.00" className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white" required />
                        </div>
                        <div className="text-right">
                             <button type="submit" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <Plus size={16} /> Add to Scenario
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* List of Planned Items */}
                <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Scenario Items</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {plannedItems.length > 0 ? plannedItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                                <div>
                                    <p className="text-white">{item.description}</p>
                                    <p className={`text-sm font-bold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {item.type === 'income' ? '+' : '-'} £{parseFloat(item.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <button onClick={() => handleRemoveItem(item.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        )) : (
                           <EmptyState illustration={<EmptyWalletIllustration/>} message="No planned transactions added yet."/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
