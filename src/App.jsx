import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query, setDoc, getDoc, writeBatch, updateDoc, orderBy } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, Wallet, PoundSterling, List, LayoutDashboard, Settings, Search, Calendar, Repeat, Sparkles, Bot, Target, Banknote, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Award, RefreshCw, TrendingUp, Sun, Moon, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderToStaticMarkup } from 'react-dom/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Mail } from 'lucide-react';


// --- Firebase Configuration ---
// IMPORTANT: This uses placeholder credentials.
// For the app to work, you MUST replace them with your actual
// Firebase project configuration in a .env file.
const firebaseConfig = {
    apiKey: "AIzaSyCG6J5SSaz3dapBV-fBibpI2JJkK9tJGb4",
    authDomain: "my-budget-tracker-527a3.firebaseapp.com",
    projectId: "my-budget-tracker-527a3",
    storageBucket: "my-budget-tracker-527a3.firebasestorage.app",
    messagingSenderId: "263272586943",
    appId: "1:263272586943:web:6479ebcd397db929d9700a"
  };
  
  const GEMINI_API_KEY = "AIzaSyBSxiCYsPcofbzo2lTUBA-m7IZLRABbkOs";

// --- Helper & Error Components (Defined First) ---

// function FirebaseConfigError() {
//     return (<div className="bg-gradient-to-br from-slate-900 to-black text-white min-h-screen flex items-center justify-center p-8"><div className="bg-red-900/50 backdrop-blur-md border border-red-500/50 p-8 rounded-2xl max-w-2xl text-center"><h1 className="text-3xl font-bold text-white mb-4">Configuration Error</h1><p className="text-lg text-slate-200 mb-6">It looks like you haven't configured your Firebase credentials yet.</p><p className="text-slate-300 mb-4">To fix this, open the <code className="bg-slate-700 p-1 rounded">.env</code> file in your project's root directory and add your Firebase credentials.</p></div></div>);
// }

// function GeminiConfigError() {
//     return (<div className="bg-gradient-to-br from-slate-900 to-black text-white min-h-screen flex items-center justify-center p-8"><div className="bg-red-900/50 backdrop-blur-md border border-red-500/50 p-8 rounded-2xl max-w-2xl text-center"><h1 className="text-3xl font-bold text-white mb-4">AI Features Disabled</h1><p className="text-lg text-slate-200 mb-6">The Gemini API key is missing. AI-powered features like the financial coach and smart suggestions will not work.</p><p className="text-slate-300 mb-4">To fix this, get a free API key from Google AI Studio and add it to a <code className="bg-slate-700 p-1 rounded">.env</code> file in your project's root directory.</p><div className="bg-slate-800 p-4 rounded-lg text-left text-sm text-slate-400"><pre className="whitespace-pre-wrap">{`// Create a file named .env in the root of your project and add:\nVITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"`}</pre></div></div></div>);
// }

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
        <div className="bg-gray-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-black text-gray-900 dark:text-white min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-8 rounded-2xl shadow-2xl">
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white text-center mb-2">Fin.ai</h1>
                <p className="text-gray-500 dark:text-slate-400 text-center mb-8">{isSignUp ? 'Create an account to start tracking.' : 'Welcome back! Please sign in.'}</p>
                {error && <p className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">{error}</p>}
                <form onSubmit={handleEmailPassword} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-200 dark:bg-slate-700 p-3 rounded-lg text-gray-900 dark:text-white" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-200 dark:bg-slate-700 p-3 rounded-lg text-gray-900 dark:text-white" required />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition-all duration-300 transform hover:scale-105">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
                </form>
                <div className="my-6 flex items-center"><div className="flex-grow bg-gray-300 dark:bg-slate-700 h-px"></div><span className="mx-4 text-gray-500 dark:text-slate-500">OR</span><div className="flex-grow bg-gray-300 dark:bg-slate-700 h-px"></div></div>
                <button onClick={handleGoogleSignIn} className="w-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-bold p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105">
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.508,44,29.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                    Sign in with Google
                </button>
                <p className="text-center text-gray-500 dark:text-slate-400 mt-6">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-bold ml-2">
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
    if (firebaseConfig.apiKey === "YOUR_API_KEY") return <FirebaseConfigError />;
    if (!GEMINI_API_KEY) return <GeminiConfigError />;

    // --- State Management ---
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [db, setDb] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // --- Theme Management ---
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // --- Firebase Initialization and Auth Listener ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const firebaseAuth = getAuth(app);
        const firestoreDb = getFirestore(app);

        setAuth(firebaseAuth);
        setDb(firestoreDb);

        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setUser(user);
            setLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    if (loadingAuth) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-slate-900"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    if (!user) {
        return <LoginPage auth={auth} />;
    }

    return <BudgetApp user={user} auth={auth} db={db} theme={theme} setTheme={setTheme} />;
}

// --- Budget App Component (The main app after login) ---
// --- Budget App Component (The main app after login) ---
function BudgetApp({ user, auth, db, theme, setTheme }) {
    const [transactions, setTransactions] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [categories, setCategories] = useState({
        expense: ['Bills', 'Food', 'Health', 'Transport', 'Subscriptions', 'Entertainment', 'Shopping', 'Other'],
        income: ['Salary', 'Bonus', 'Freelance', 'Gift', 'Other', 'Rollover']
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

    const [searchQuery, setSearchQuery] = useState('');

    // --- Data Fetching ---
    useEffect(() => {
        if (!db || !user) return;
        setLoadingData(true);
        const userId = user.uid;
        const collectionsToFetch = [
            { path: `users/${userId}/transactions`, setter: setTransactions, transform: d => ({ ...d, date: d.date?.toDate ? d.date.toDate() : new Date(d.date) }), orderBy: ['date', 'desc'] },
            { path: `users/${userId}/subscriptions`, setter: setSubscriptions },
            { path: `users/${userId}/assets`, setter: setAssets },
            { path: `users/${userId}/liabilities`, setter: setLiabilities },
            { path: `users/${userId}/savingsGoals`, setter: setSavingsGoals, transform: d => ({ ...d, dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : null }) },
            { path: `users/${userId}/settings/achievements`, setter: setAchievements, isDoc: true },
            { path: `users/${userId}/settings/budgets`, setter: setBudgets, isDoc: true },
            { path: `users/${userId}/settings/categories`, setter: setCategories, isDoc: true, default: { expense: ['Bills', 'Food', 'Health', 'Transport', 'Subscriptions', 'Entertainment', 'Shopping', 'Other'], income: ['Salary', 'Bonus', 'Freelance', 'Gift', 'Other'] } }
        ];

        const unsubscribes = collectionsToFetch.map(({ path, setter, transform, isDoc, default: defaultValue, orderBy: orderByConfig }) => {
            const docOrCollRef = isDoc ? doc(db, path) : collection(db, path);
            const finalQuery = !isDoc && orderByConfig ? query(docOrCollRef, orderBy(...orderByConfig)) : docOrCollRef;

            return onSnapshot(finalQuery, (snapshot) => {
                if (isDoc) {
                    setter(snapshot.exists() ? snapshot.data() : (defaultValue || {}));
                } else {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setter(transform ? data.map(transform) : data);
                }
            }, (err) => { console.error(`Error fetching ${path}:`, err); setError(`Failed to load ${path}.`); });
        });

        setLoadingData(false);
        return () => unsubscribes.forEach(unsub => unsub());
    }, [db, user]);

    // --- Achievement Logic ---
    useEffect(() => {
        if (loadingData || !user || !db) return;

        let achievementsUpdated = false;
        const newAchievements = { ...achievements };

        const today = new Date();
        const todayString = today.toDateString();

        if (newAchievements.lastLoginDate !== todayString) {
            if (!newAchievements.dailyLogin) {
                newAchievements.dailyLogin = true;
                achievementsUpdated = true;
            }

            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const lastLogin = newAchievements.lastLoginDate ? new Date(newAchievements.lastLoginDate) : null;
            if (lastLogin && lastLogin.toDateString() === yesterday.toDateString()) {
                newAchievements.loginStreak = (newAchievements.loginStreak || 1) + 1;
            } else {
                newAchievements.loginStreak = 1;
            }

            if (newAchievements.loginStreak >= 3 && !newAchievements.onARoll) {
                newAchievements.onARoll = true;
                achievementsUpdated = true;
            }

            newAchievements.lastLoginDate = todayString;
            achievementsUpdated = true;

            if (newAchievements.lastCheckedNoSpend !== yesterday.toDateString()) {
                const hasExpenseForYesterday = transactions.some(t =>
                    t.type === 'expense' && new Date(t.date).toDateString() === yesterday.toDateString()
                );

                if (!hasExpenseForYesterday && transactions.length > 0) {
                    if (!newAchievements.noSpendDay) {
                        newAchievements.noSpendDay = true;
                        achievementsUpdated = true;
                    }
                }
                newAchievements.lastCheckedNoSpend = yesterday.toDateString();
            }
        }

        if (!newAchievements.goalGetter) {
            const hasCompletedGoal = savingsGoals.some(g => (g.currentAmount || 0) >= g.targetAmount);
            if (hasCompletedGoal) {
                newAchievements.goalGetter = true;
                achievementsUpdated = true;
            }
        }

        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        if (today.getDate() === 1 && newAchievements.lastCheckedBudgetBoss !== lastMonth.getMonth()) {
            const lastMonthYear = lastMonth.getFullYear();
            const lastMonthMonth = lastMonth.getMonth();

            const expensesLastMonth = transactions.filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && tDate.getFullYear() === lastMonthYear && tDate.getMonth() === lastMonthMonth;
            });

            const spendingByCategory = expensesLastMonth.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
                return acc;
            }, {});

            const isUnderBudget = Object.keys(budgets).every(cat =>
                (spendingByCategory[cat] || 0) <= (budgets[cat] || 0)
            );

            if (Object.keys(budgets).length > 0 && isUnderBudget && !newAchievements.budgetBoss) {
                newAchievements.budgetBoss = true;
                achievementsUpdated = true;
            }
            newAchievements.lastCheckedBudgetBoss = lastMonth.getMonth();
            achievementsUpdated = true;
        }

        if (achievementsUpdated && JSON.stringify(newAchievements) !== JSON.stringify(achievements)) {
            const achievementsRef = doc(db, `users/${user.uid}/settings/achievements`);
            setDoc(achievementsRef, newAchievements, { merge: true })
                .catch(err => console.error("Failed to update achievements:", err));
        }

    }, [loadingData, db, user, transactions, savingsGoals, budgets, achievements]);

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
            if (confirm("Are you sure?")) {
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

    const handleThemeToggle = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    if (error) return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-slate-900 text-red-500 dark:text-red-400">{error}</div>;

    return (
        <div className="bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-black text-gray-900 dark:text-white min-h-screen font-sans">
            <div className="flex">
                <aside className="w-64 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 p-6 min-h-screen flex-col hidden lg:flex">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-10">Fin.ai</h1>
                    <nav className="flex flex-col space-y-2">
                        <SideNavButton icon={LayoutDashboard} label="Dashboard" activeView={activeView} onClick={() => setActiveView('dashboard')} />
                        <SideNavButton icon={List} label="Transactions" activeView={activeView} onClick={() => setActiveView('transactions')} />
                        <SideNavButton icon={TrendingUp} label="Scenarios" activeView={activeView} onClick={() => setActiveView('scenarios')} />
                        <SideNavButton icon={Calendar} label="Calendar" activeView={activeView} onClick={() => setActiveView('calendar')} />
                        <SideNavButton icon={Repeat} label="Subscriptions" activeView={activeView} onClick={() => setActiveView('subscriptions')} />
                        <SideNavButton icon={Banknote} label="Net Worth" activeView={activeView} onClick={() => setActiveView('net worth')} />
                        <SideNavButton icon={Target} label="Goals" activeView={activeView} onClick={() => setActiveView('goals')} />
                        <SideNavButton icon={ShieldCheck} label="Debt" activeView={activeView} onClick={() => setActiveView('debt')} />
                        <SideNavButton icon={Award} label="Achievements" activeView={activeView} onClick={() => setActiveView('achievements')} />
                        <SideNavButton icon={Bot} label="Coach" activeView={activeView} onClick={() => setActiveView('coach')} />
                        <SideNavButton icon={Settings} label="Settings" activeView={activeView} onClick={() => setActiveView('settings')} />
                    </nav>
                    <div className="mt-auto">
                        <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                                    {user.email ? user.email[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">{user.displayName || user.email?.split('@')[0]}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-screen">
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hello, {user.displayName || user.email?.split('@')[0]}!</h2>
                            <p className="text-gray-500 dark:text-slate-400 mt-1">Here's your financial overview for today.</p>
                        </div>
                        <div className="flex items-center space-x-3 md:space-x-4 mt-4 sm:mt-0">
                            <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-300 dark:border-slate-700">
                                <Sun size={18} className={`text-gray-500 transition-colors ${theme === 'light' ? 'text-yellow-500' : ''}`} />
                                <button
                                    onClick={handleThemeToggle}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    role="switch"
                                    aria-checked={theme === 'dark'}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                                <Moon size={18} className={`text-gray-500 transition-colors ${theme === 'dark' ? 'text-blue-400' : ''}`} />
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" size={18} />
                                <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-48" />
                            </div>

                            <button
                                onClick={() => setIsAddTxDialogOpen(true)}
                                className="flex-shrink-0 p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors transform hover:scale-105 shadow-lg shadow-blue-600/20"
                                aria-label="Add new transaction"
                            >
                                <Plus size={18} />
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex-shrink-0 p-2.5 bg-gray-200 dark:bg-slate-800/50 hover:bg-red-100 dark:hover:bg-red-600/50 border border-gray-300 dark:border-slate-700 hover:border-red-500 text-gray-800 dark:text-white font-bold rounded-lg transition-colors"
                                aria-label="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </header>

                    <div className="lg:hidden mb-6">
                        <select onChange={(e) => setActiveView(e.target.value)} value={activeView} className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-white">
                            <option value="dashboard">Dashboard</option>
                            <option value="transactions">Transactions</option>
                            <option value="scenarios">Scenarios</option>
                            <option value="calendar">Calendar</option>
                            <option value="subscriptions">Subscriptions</option>
                            <option value="net worth">Net Worth</option>
                            <option value="goals">Goals</option>
                            <option value="debt">Debt</option>
                            <option value="achievements">Achievements</option>
                            <option value="coach">Coach</option>
                            <option value="settings">Settings</option>
                        </select>
                    </div>

                    {loadingData ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeView}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeView === 'dashboard' && <DashboardView transactions={transactions} budgets={budgets} savingsGoals={savingsGoals} onNavigate={setActiveView} onAddTransaction={transactionHandlers.add}/>}
                                {activeView === 'transactions' && <TransactionListView transactions={transactions.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()))} handleDeleteTransaction={transactionHandlers.delete} />}
                                {activeView === 'scenarios' && <ScenariosView transactions={transactions} />}
                                {activeView === 'calendar' && <CalendarView transactions={transactions} subscriptions={subscriptions} />}
                                {activeView === 'subscriptions' && <SubscriptionsView subscriptions={subscriptions} onAdd={() => setIsAddSubDialogOpen(true)} onDelete={subscriptionHandlers.delete} />}
                                {activeView === 'net worth' && <NetWorthView assets={assets} liabilities={liabilities} handlers={{ asset: assetHandlers, liability: liabilityHandlers }} />}
                                {activeView === 'goals' && <SavingsGoalsView goals={savingsGoals} handlers={savingsGoalHandlers} />}
                                {activeView === 'debt' && <DebtPlannerView />}
                                {activeView === 'achievements' && <AchievementsView achievements={achievements} />}
                                {activeView === 'coach' && <FinancialCoachView transactions={transactions} budgets={budgets} subscriptions={subscriptions} />}
                                {activeView === 'settings' && <SettingsView initialBudgets={budgets} initialCategories={categories} onSave={handleSaveSettings} subscriptions={subscriptions} />}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </main>
            </div>
            <AnimatePresence>
                {isAddTxDialogOpen && <AddTransactionDialog categories={categories} onClose={() => setIsAddTxDialogOpen(false)} onAdd={async (transaction) => { await transactionHandlers.add(transaction); setIsAddTxDialogOpen(false); }} />}
                {isAddSubDialogOpen && <AddSubscriptionDialog onClose={() => setIsAddSubDialogOpen(false)} onAdd={async (subscription) => { await subscriptionHandlers.add(subscription); setIsAddSubDialogOpen(false); }} />}
            </AnimatePresence>
        </div>
    );
}

// --- Reusable & View Components (Order Matters) ---

const SideNavButton = ({ icon: Icon, label, activeView, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg flex items-center gap-3 transition-all duration-200 ${activeView === label.toLowerCase() ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}`}
    >
        <Icon size={20} /> <span>{label}</span>
    </button>
);

const ChartCard = ({ title, children }) => (<div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg"><h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>{children}</div>);

function SummaryCard({ title, amount, icon: Icon, color, bgColor }) {
    return (
        <motion.div
            className={`p-5 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-between ${bgColor} border border-gray-200/50 dark:border-white/10 hover:border-blue-500/50`}
            whileHover={{ y: -5 }}
        >
            <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>£{amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className={`p-3 rounded-full bg-gray-200/70 dark:bg-slate-700/50 ${color}`}>
                <Icon size={24} />
            </div>
        </motion.div>
    );
}

// --- Place this new component definition with other helper components in your App.js ---

function MonthlyRolloverCard({ transactions, onAddTransaction }) {
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Calculate the previous month's balance
    const lastMonthBalance = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const lastMonthTx = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startOfLastMonth && tDate < startOfThisMonth;
        });

        return lastMonthTx.reduce((acc, t) => {
            const amount = parseFloat(t.amount) || 0;
            return t.type === 'income' ? acc + amount : acc - amount;
        }, 0);
    }, [transactions]);

    // 2. Check if a rollover has already been added this month
    const rolloverExists = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions.some(t => 
            new Date(t.date) >= startOfThisMonth &&
            t.description === 'Previous Month Balance' &&
            t.category === 'Rollover'
        );
    }, [transactions]);

    // 3. Handler to create the new income transaction
    const handleCarryOver = async () => {
        if (lastMonthBalance <= 0 || isProcessing || rolloverExists) return;

        setIsProcessing(true);
        try {
            await onAddTransaction({
                type: 'income',
                amount: lastMonthBalance,
                category: 'Rollover', // Using a specific category is good practice
                description: 'Previous Month Balance',
                date: new Date().toISOString().split('T')[0], // Add it on today's date
            });
        } catch (error) {
            console.error("Failed to carry over balance:", error);
            alert("Could not carry over balance. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (lastMonthBalance <= 0 && !rolloverExists) {
        return (
             <ChartCard title="Monthly Rollover">
                <div className="text-center py-5">
                    <p className="text-gray-500 dark:text-slate-400 text-sm">No positive balance from last month to carry over.</p>
                </div>
            </ChartCard>
        );
    }
    
    return (
        <ChartCard title="Monthly Rollover">
            <div className="flex flex-col items-center justify-center text-center space-y-4 p-4">
                <p className="text-gray-500 dark:text-slate-400">Last month's remaining balance:</p>
                <p className="text-3xl font-bold text-green-500 dark:text-green-400">
                    £{lastMonthBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
                {rolloverExists ? (
                    <p className="text-sm text-green-600 dark:text-green-500 font-semibold flex items-center gap-2">
                        <ShieldCheck size={16} /> Balance already carried over for this month.
                    </p>
                ) : (
                    <button
                        onClick={handleCarryOver}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Add to This Month\'s Income'}
                    </button>
                )}
            </div>
        </ChartCard>
    );
}

export function ReportTemplate({ data }) {
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Your Financial Report: {data.period}</h1>

            <h2 style={styles.sectionTitle}>Monthly Summary</h2>
            <div style={styles.item}><span>Income:</span> <strong>£{data.summary.income.toFixed(2)}</strong></div>
            <div style={styles.item}><span>Expenses:</span> <strong>£{data.summary.expense.toFixed(2)}</strong></div>
            <div style={styles.item}><span>Net Balance:</span> <strong>£{data.summary.balance.toFixed(2)}</strong></div>

            <h2 style={styles.sectionTitle}>Top Spending Categories</h2>
            {data.topExpenses.map(exp => (
                <div style={styles.item} key={exp.name}>
                    <span>{exp.name}</span>
                    <strong>£{exp.value.toFixed(2)}</strong>
                </div>
            ))}
            
            <p style={styles.footer}>Report generated by Fin.ai on {new Date().toLocaleDateString()}</p>
        </div>
    );
}

function DashboardView({ transactions, budgets, savingsGoals, onNavigate, onAddTransaction }) {
    const thisMonthTx = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startOfMonth && tDate <= endOfMonth;
        });
    }, [transactions]);

    const summary = useMemo(() => thisMonthTx.reduce((acc, t) => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') acc.income += amount;
        else acc.expense += amount;
        return acc;
    }, { income: 0, expense: 0 }), [thisMonthTx]);

    const balance = summary.income - summary.expense;

    const trendData = useMemo(() => {
        const trends = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        for (let i = 0; i < 6; i++) {
            const month = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
            const monthKey = month.toLocaleString('en-GB', { month: 'short' });
            trends[monthKey] = { name: monthKey, income: 0, expense: 0 };
        }

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= sixMonthsAgo) {
                const monthKey = tDate.toLocaleString('en-GB', { month: 'short' });
                if (trends[monthKey]) {
                    trends[monthKey][t.type] += parseFloat(t.amount) || 0;
                }
            }
        });
        return Object.values(trends);
    }, [transactions]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    const [reportData, setReportData] = useState(null);
    const reportRef = useRef();

    const handleGenerateReport = () => {
        const data = {
            period: "This Month",
            summary: {
                income: summary.income,
                expense: summary.expense,
                balance: summary.income - summary.expense,
            },
            topExpenses: Object.entries(thisMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => {
                const category = t.category || 'Uncategorized';
                acc[category] = (acc[category] || 0) + t.amount;
                return acc;
            }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
        };
        // Set the data, which will trigger the useEffect hook below
        setReportData(data);
    };
    useEffect(() => {
        // Only run if there's reportData and the ref is attached to the element
        if (reportData && reportRef.current) {
            html2canvas(reportRef.current)
                .then((canvas) => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`financial-report.pdf`);

                    // Clean up by setting reportData back to null
                    setReportData(null);
                });
        }
    }, [reportData]);

        // // 2. Create a temporary element to render the report
        // const reportElement = document.createElement("div");
        // reportElement.innerHTML = renderToStaticMarkup(<ReportTemplate data={reportData} />);
        // reportElement.style.position = 'absolute';
        // reportElement.style.left = '-9999px';
        // document.body.appendChild(reportElement);

        // // 3. Generate the PDF
        // html2canvas(reportElement.firstElementChild)
        //     .then((canvas) => {
        //         const imgData = canvas.toDataURL('image/png');
        //         const pdf = new jsPDF('p', 'mm', 'a4');
        //         const pdfWidth = pdf.internal.pageSize.getWidth();
        //         const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        //         pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        //         pdf.save(`financial-report.pdf`);
        //         document.body.removeChild(reportElement);
        //     });
        // };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-12 gap-6"
        >
            {/* Main column */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard title="This Month's Income" amount={summary.income} icon={ArrowUpRight} color="text-green-500 dark:text-green-400" bgColor="bg-green-100 dark:bg-green-500/10" />
                    <SummaryCard title="This Month's Expense" amount={summary.expense} icon={ArrowDownLeft} color="text-red-500 dark:text-red-400" bgColor="bg-red-100 dark:bg-red-500/10" />
                    <SummaryCard title="This Month's Balance" amount={balance} icon={PoundSterling} color={balance >= 0 ? "text-sky-500 dark:text-sky-400" : "text-orange-500 dark:text-orange-400"} bgColor={balance >= 0 ? "bg-sky-100 dark:bg-sky-500/10" : "bg-orange-100 dark:bg-orange-500/10"} />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <ChartCard title="Cash Flow (Last 6 Months)">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(100 116 139 / 0.3)" />
                                <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)' }} />
                                <YAxis tick={{ fill: 'rgb(100 116 139)' }} tickFormatter={(v) => `£${v / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ color: 'rgb(156 163 175)' }} />
                                <Area type="monotone" dataKey="income" stroke="#4ade80" fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="#f87171" fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>

                {/* --- NEW CHART ADDED HERE --- */}
                <motion.div variants={itemVariants}>
                    <SpendingBreakdownChart transactions={transactions} />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <RecentActivity transactions={transactions.slice(0, 5)} />
                </motion.div>
            </div>

            {/* Side column */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <motion.div variants={itemVariants}>
                    <MonthlyRolloverCard transactions={transactions} onAddTransaction={onAddTransaction} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <TipOfTheDay />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <FinancialHealthScore income={summary.income} expense={summary.expense} goals={savingsGoals} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <SavingsGoalsWidget goals={savingsGoals} onNavigate={onNavigate} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <BudgetStatus budgets={budgets} expenses={thisMonthTx.filter(t => t.type === 'expense')} onNavigate={onNavigate} />
                </motion.div>
            </div>
            <div className="col-span-12 flex justify-end">
                    <button
                        onClick={handleGenerateReport}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        <Mail size={16} />
                        Send Summary Report
                    </button>
            </div>
            
        </motion.div>
    );
}

const RecentActivity = ({ transactions }) => (
    <ChartCard title="Recent Activity">
        <div className="space-y-3">
            <AnimatePresence>
                {transactions.map((tx, index) => (
                    <motion.div
                        key={tx.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between bg-gray-100 dark:bg-slate-700/30 p-3 rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400'}`}>
                                {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                            </div>
                        </div>
                        <p className={`font-bold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {tx.type === 'income' ? '+' : '-'}£{parseFloat(tx.amount).toLocaleString('en-GB')}
                        </p>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    </ChartCard>
);

const TipOfTheDay = () => {
    const [tip, setTip] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTip = async () => {
        setLoading(true);
        try {
            const prompt = `Give me a short, actionable financial tip for someone living in the UK. Make it specific and concise (1-2 sentences). For context, today is ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
            const response = await callGeminiApi(prompt, true);
            setTip(response.replace(/\"/g, "").replace(/\*\*/g, ""));
        } catch (error) {
            console.error("Failed to fetch tip:", error);
            const fallbackTips = [
                "Consider setting up a direct debit to a savings account for the day you get paid.",
                "Use a price comparison website before renewing car or home insurance.",
                "Review your monthly subscriptions and cancel any you no longer use. It all adds up!",
                "Take a packed lunch to work a few times a week. You could save over £50 a month.",
                "Check if you're eligible for tax relief on work-from-home expenses on the GOV.UK website."
            ];
            setTip(fallbackTips[Math.floor(Math.random() * fallbackTips.length)]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTip();
    }, []);

    return (
        <div className="bg-gradient-to-br from-blue-500/20 to-gray-100 dark:from-blue-600/30 dark:to-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-lg flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-200 dark:bg-blue-500/50 text-blue-800 dark:text-white p-2 rounded-full">
                        <Lightbulb size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Tip of the Day</h3>
                </div>
                <button
                    onClick={fetchTip}
                    disabled={loading}
                    className="text-gray-400 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white disabled:text-gray-600 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Get new tip"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-grow flex items-center min-h-[6rem]">
                {loading ? (
                    <div className="w-full space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                ) : (
                    <blockquote className="border-l-4 border-blue-400 pl-4">
                        <p className="text-base italic text-gray-700 dark:text-slate-200">
                            "{tip}"
                        </p>
                    </blockquote>
                )}
            </div>
        </div>
    );
};


const FinancialHealthScore = ({ income, expense, goals }) => {
    const score = useMemo(() => {
        const savingsRate = income > 0 ? (income - expense) / income : 0;
        let points = 0;
        if (savingsRate > 0.2) points += 40;
        else if (savingsRate > 0.1) points += 25;
        else if (savingsRate > 0) points += 10;

        if (goals.length > 0) points += 20;
        const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
        points += completedGoals * 10;

        points += 30; // Base points for using the app

        return Math.min(100, Math.max(0, points));
    }, [income, expense, goals]);

    const getScoreColor = (s) => {
        if (s > 75) return 'text-green-500 dark:text-green-400';
        if (s > 50) return 'text-yellow-500 dark:text-yellow-400';
        return 'text-orange-500 dark:text-orange-400';
    };

    return (
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Financial Health</h2>
            <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                        d="M18 2.0845
                         a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"
                        className="text-gray-200 dark:text-slate-700"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <motion.path
                        d="M18 2.0845
                         a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"
                        className={getScoreColor(score)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${score}, 100`}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{Math.round(score)}</span>
                </div>
            </div>
            <p className="text-gray-500 dark:text-slate-400 mt-4 text-center text-sm">A high score indicates a good savings rate and progress on goals.</p>
        </div>
    );
};

function TransactionListView({ transactions, handleDeleteTransaction }) {
    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Transactions</h2>
            {transactions.length > 0 ? <TransactionList transactions={transactions} handleDeleteTransaction={handleDeleteTransaction} /> : <EmptyState illustration={<EmptyWalletIllustration />} message="No transactions yet. Add one to get started!" />}
        </div>
    );
}

function SubscriptionsView({ subscriptions, onAdd, onDelete }) {
    const totalMonthlyCost = useMemo(() => subscriptions.reduce((total, sub) => total + (sub.amount || 0), 0), [subscriptions]);
    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Subscriptions & Bills</h2><p className="text-gray-500 dark:text-slate-400 mt-1">Total Monthly Cost: <span className="font-bold text-sky-600 dark:text-sky-400">£{totalMonthlyCost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p></div>
                <button onClick={onAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"><Plus size={16} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.sort((a, b) => a.name.localeCompare(b.name)).map(sub => (
                    <motion.div
                        key={sub.id}
                        className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg"
                        whileHover={{ scale: 1.05 }}
                        layout
                    >
                        <div className="flex justify-between items-start">
                            <div><h3 className="font-bold text-gray-900 dark:text-white">{sub.name}</h3><p className="text-sm text-gray-500 dark:text-slate-400">{sub.category}</p></div>
                            <button onClick={() => onDelete(sub.id)} className="text-gray-500 dark:text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                        <div className="mt-4 flex justify-between items-end"><p className="text-xl font-bold text-green-600 dark:text-green-400">£{sub.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                    </motion.div>
                ))}
            </div>
            {subscriptions.length === 0 && <EmptyState illustration={<EmptyCalendarIllustration />} message="No subscriptions or bills added yet." />}
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
        const prompt = `My monthly income is £${totalIncome || 2000}. My fixed monthly bills and subscriptions total £${fixedExpenses}. Suggest a monthly budget based on the 50/30/20 rule for these categories: ${categories.expense.join(', ')}.`;
        try {
            const suggestedBudgets = await callGeminiApi(prompt, false, {
                type: "OBJECT",
                properties: {
                    ...categories.expense.reduce((obj, cat) => ({ ...obj, [cat]: { type: "NUMBER" } }), {})
                }
            });

            if (suggestedBudgets) {
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
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Manage Categories</h3>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="New category name" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} className="flex-grow bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white" />
                            <select value={newCat.type} onChange={e => setNewCat(p => ({ ...p, type: e.target.value }))} className="bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white"><option value="expense">Expense</option><option value="income">Income</option></select>
                            <button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg">Add</button>
                        </div>
                        <div className="space-y-4">
                            <div><h4 className="text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">Expense Categories</h4><div className="flex flex-wrap gap-2">{(categories.expense || []).map(cat => (<span key={cat} className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1 text-sm rounded-full flex items-center gap-2">{cat} <button onClick={() => handleRemoveCategory('expense', cat)} className="text-red-400 hover:text-red-300">&times;</button></span>))}</div></div>
                            <div><h4 className="text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">Income Categories</h4><div className="flex flex-wrap gap-2">{(categories.income || []).map(cat => (<span key={cat} className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1 text-sm rounded-full flex items-center gap-2">{cat} <button onClick={() => handleRemoveCategory('income', cat)} className="text-red-400 hover:text-red-300">&times;</button></span>))}</div></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-baseline mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Set Monthly Budgets</h3>
                            <p className="text-gray-500 dark:text-slate-400">Total: <span className="font-bold text-sky-600 dark:text-sky-400">£{totalBudgeted.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                        </div>
                        <button onClick={handleGetAISuggestions} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mb-4 disabled:bg-slate-600">
                            <Sparkles size={16} /> {isGenerating ? 'Generating...' : 'Get AI Suggestions'}
                        </button>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {(categories.expense || []).map(cat => (
                                <div key={cat} className="flex justify-between items-center">
                                    <label className="text-gray-700 dark:text-slate-300">{cat}</label>
                                    <div className="flex items-center gap-2">
                                        {(cat === 'Bills' || cat === 'Subscriptions') && subscriptionTotals[cat] > 0 && (<span className="text-xs text-gray-500 dark:text-slate-400">(Current: £{subscriptionTotals[cat].toFixed(2)})</span>)}
                                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400">£</span><input type="number" value={budgets[cat] || ''} onChange={e => handleBudgetChange(cat, e.target.value)} placeholder="0.00" className="w-32 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 pl-7 pr-2 text-gray-900 dark:text-white text-right" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-right border-t border-gray-200 dark:border-slate-700 pt-8"><button onClick={() => onSave(budgets, categories)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Save All Settings</button></div>
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
            const resultText = await callGeminiApi(prompt, true);
            setAnswer(resultText);
        } catch (e) {
            console.error("Error contacting financial coach:", e);
            setAnswer("I'm sorry, I'm having trouble connecting right now. Please try again later.");
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Your AI Financial Coach</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-6">Ask anything about your finances, from saving tips to budget analysis.</p>
                <div className="space-y-4">
                    <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g., How can I save more money on groceries?" rows="3" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white"></textarea>
                    <button onClick={() => handleAskCoach(false)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600">
                        <Sparkles size={16} /> {isLoading ? 'Thinking...' : 'Ask Your Coach'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">"What-If" Scenario Planner</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-6">See how a financial change could impact your future.</p>
                <div className="space-y-4">
                    <textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="e.g., What if my salary increases by £200 a month?" rows="3" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white"></textarea>
                    <button onClick={() => handleAskCoach(true)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600">
                        <Bot size={16} /> {isLoading ? 'Analyzing...' : 'Analyze Scenario'}
                    </button>
                </div>
            </div>

            {isLoading && <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>}
            {answer && <div className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg prose dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />') }}></div>}
        </div>
    );
}

// --- Place this array definition above the AchievementsView component ---
const ALL_ACHIEVEMENTS = [
    {
        id: 'dailyLogin',
        icon: Sun,
        title: 'Daily Dedication',
        description: 'Log in for the first time on a new day.'
    },
    {
        id: 'onARoll',
        icon: TrendingUp,
        title: 'On a Roll!',
        description: 'Achieve a 3-day login streak.'
    },
    {
        id: 'budgetBoss',
        icon: Award,
        title: 'Budget Boss',
        description: 'Stay under all your budgets for a full month.'
    },
    {
        id: 'goalGetter',
        icon: Target,
        title: 'Goal Getter',
        description: 'Successfully complete one of your savings goals.'
    },
    {
        id: 'noSpendDay',
        icon: ShieldCheck,
        title: 'Frugal Friend',
        description: 'Go a full day without recording any expenses.'
    },
];


// --- Replace the old, empty AchievementsView with this new one ---
function AchievementsView({ achievements }) {
    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Achievements</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8">Unlock badges by managing your finances well!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ALL_ACHIEVEMENTS.map(ach => {
                    const isUnlocked = achievements[ach.id];
                    return (
                        <motion.div
                            key={ach.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`p-6 rounded-xl border-2 flex flex-col items-center text-center transition-all duration-300 ${
                                isUnlocked
                                    ? 'border-green-500/50 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 filter grayscale opacity-70'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                isUnlocked ? 'bg-green-100 dark:bg-green-500/20 text-green-500' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                            }`}>
                                <ach.icon size={32} />
                            </div>
                            <h3 className={`font-bold text-lg mb-1 ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                                {ach.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 flex-grow">
                                {ach.description}
                            </p>
                            <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full ${isUnlocked ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-slate-200'}`}>
                                {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

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
    // State for the input form, now including a date
    const [newItem, setNewItem] = useState({ 
        description: '', 
        amount: '', 
        type: 'expense', 
        date: new Date().toISOString().split('T')[0] 
    });

    // Calculate totals for planned items
    const projectedChange = useMemo(() => {
        return plannedItems.reduce((acc, item) => {
            const amount = parseFloat(item.amount) || 0;
            return item.type === 'income' ? acc + amount : acc - amount;
        }, 0);
    }, [plannedItems]);

    // Calculate the final projected balance
    const projectedBalance = currentBalance + projectedChange;

    // Handler to add a new item to the list
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.description || !newItem.amount || parseFloat(newItem.amount) <= 0) {
            alert('Please enter a valid description and a positive amount.');
            return;
        }
        setPlannedItems([...plannedItems, { ...newItem, id: Date.now() }]);
        // Reset form after adding
        setNewItem({ description: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0] }); 
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
                <SummaryCard title="Current Balance" amount={currentBalance} icon={Wallet} color="text-sky-500 dark:text-sky-400" bgColor="bg-sky-100 dark:bg-sky-500/10" />
                <SummaryCard title="Projected Change" amount={projectedChange} icon={TrendingUp} color={projectedChange >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"} bgColor={projectedChange >= 0 ? "bg-green-100 dark:bg-green-500/10" : "bg-red-100 dark:bg-red-500/10"} />
                <SummaryCard title="Projected Final Balance" amount={projectedBalance} icon={ShieldCheck} color={projectedBalance >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"} bgColor={projectedBalance >= 0 ? "bg-green-100 dark:bg-green-500/10" : "bg-red-100 dark:bg-red-500/10"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add a "What-If" Transaction</h2>
                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div>
                            <label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block">Type</label>
                            <div className="flex items-center bg-gray-200 dark:bg-slate-700 rounded-lg p-1">
                                <button type="button" onClick={() => setNewItem({...newItem, type: 'expense'})} className={`flex-1 py-2 text-sm font-medium rounded-md ${newItem.type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Expense</button>
                                <button type="button" onClick={() => setNewItem({...newItem, type: 'income'})} className={`flex-1 py-2 text-sm font-medium rounded-md ${newItem.type === 'income' ? 'bg-green-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Income</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block">Description</label>
                            <input id="description" name="description" type="text" value={newItem.description} onChange={handleInputChange} placeholder="e.g., New Salary" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="amount" className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block">Amount (£)</label>
                                <input id="amount" name="amount" type="number" value={newItem.amount} onChange={handleInputChange} placeholder="0.00" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required />
                            </div>
                             <div>
                                <label htmlFor="date" className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block">Date</label>
                                <input id="date" name="date" type="date" value={newItem.date} onChange={handleInputChange} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required />
                            </div>
                        </div>
                        <div className="text-right pt-2">
                             <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <Plus size={16} /> Add to Forecast
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* List of Planned Items */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Forecast Items</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {plannedItems.length > 0 ? plannedItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div>
                                    <p className="text-gray-900 dark:text-white">{item.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className={`text-sm font-bold ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {item.type === 'income' ? '+' : '-'} £{parseFloat(item.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </p>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-gray-500 dark:text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        )) : (
                           <EmptyState illustration={<EmptyWalletIllustration/>} message="Add an item to start your forecast."/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
            <div className="text-center bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl">
                <p className="text-gray-500 dark:text-slate-400 text-lg">Your Total Net Worth</p>
                <p className={`text-5xl font-bold ${netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    £{netWorth.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FinancialListComponent title="Assets" items={assets} total={totalAssets} color="text-green-600 dark:text-green-400" onDelete={handlers.asset.delete} />
                <FinancialListComponent title="Liabilities" items={liabilities} total={totalLiabilities} color="text-red-600 dark:text-red-400" onDelete={handlers.liability.delete} />
            </div>
            <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Item</h3>
                <div className="flex flex-wrap gap-4">
                    <select value={item.type} onChange={e => setItem({ ...item, type: e.target.value })} className="bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white">
                        <option value="asset">Asset</option>
                        <option value="liability">Liability</option>
                    </select>
                    <input type="text" placeholder="Item Name (e.g., Savings Account)" value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} className="flex-grow bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white" required />
                    <input type="number" placeholder="Value/Balance" value={item.value} onChange={e => setItem({ ...item, value: e.target.value })} className="w-32 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white" required />
                    {item.type === 'liability' && (
                        <>
                            <input type="number" placeholder="Interest Rate %" value={item.interestRate} onChange={e => setItem({ ...item, interestRate: e.target.value })} className="w-32 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white" />
                            <input type="number" placeholder="Min. Payment" value={item.minimumPayment} onChange={e => setItem({ ...item, minimumPayment: e.target.value })} className="w-32 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white" />
                        </>
                    )}
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg">Add Item</button>
                </div>
            </form>
        </div>
    );
}

function FinancialListComponent({ title, items, total, color, onDelete }) {
    const borderColor = color.replace('text-', 'border-').replace('-400', '-500').replace('-600', '-500');
    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl">
            <h2 className={`text-2xl font-semibold text-gray-900 dark:text-white mb-4 border-b-2 ${borderColor} pb-2`}>{title}</h2>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-100 dark:bg-slate-700/50 p-2 rounded">
                        <div>
                            <p className="text-gray-800 dark:text-white">{item.name}</p>
                            {title === 'Liabilities' && (
                                <p className="text-xs text-gray-500 dark:text-slate-400">{item.interestRate || 0}% APR | Min: £{item.minimumPayment || 0}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-900 dark:text-white">£{parseFloat(item.value).toLocaleString('en-GB')}</span>
                            <button onClick={() => onDelete(item.id)} className="text-gray-500 dark:text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-slate-700 pt-2">
                <span className="text-gray-900 dark:text-white">Total {title}</span>
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
        if (!contribution.amount || parseFloat(contribution.amount) <= 0) return;
        const newAmount = (goal.currentAmount || 0) + parseFloat(contribution.amount);
        handlers.update(goalId, { currentAmount: newAmount });
        setContribution({ id: null, amount: '' });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const percentage = goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 : 0;
                    return (
                        <div key={goal.id} className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                                <button onClick={() => handlers.delete(goal.id)} className="text-gray-500 dark:text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                            <div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                                    <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-700 dark:text-slate-300">£{parseFloat(goal.currentAmount || 0).toLocaleString('en-GB')}</span>
                                    <span className="text-gray-500 dark:text-slate-400">£{parseFloat(goal.targetAmount).toLocaleString('en-GB')}</span>
                                </div>
                                {goal.dueDate && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Due: {new Date(goal.dueDate).toLocaleDateString('en-GB')}</p>}
                            </div>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Add funds" value={contribution.id === goal.id ? contribution.amount : ''} onChange={e => setContribution({ id: goal.id, amount: e.target.value })} className="w-full bg-gray-100 dark:bg-slate-700 p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" />
                                <button onClick={() => handleAddFunds(goal.id)} className="bg-green-600 p-2 rounded-lg text-white">Add</button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {goals.length === 0 && <EmptyState illustration={<EmptyPiggyBankIllustration />} message="No savings goals yet. Create one to get started!" />}
            <form onSubmit={handleAddGoal} className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Savings Goal</h3>
                <div className="flex flex-wrap gap-4">
                    <input type="text" placeholder="Goal Name (e.g., Holiday Fund)" value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} className="flex-grow bg-gray-100 dark:bg-slate-700 p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" required />
                    <input type="number" placeholder="Target Amount" value={item.targetAmount} onChange={e => setItem({ ...item, targetAmount: e.target.value })} className="w-48 bg-gray-100 dark:bg-slate-700 p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" required />
                    <input type="date" value={item.dueDate} onChange={e => setItem({ ...item, dueDate: e.target.value })} className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" />
                    <button type="submit" className="bg-blue-600 font-bold p-2 rounded-lg text-white">Create Goal</button>
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

    const [newDebtName, setNewDebtName] = useState('');
    const [newDebtBalance, setNewDebtBalance] = useState('');
    const [newDebtInterestRate, setNewDebtInterestRate] = useState('');
    const [newDebtMinPayment, setNewDebtMinPayment] = useState('');

    const consolidatedMonthlyPayment = useMemo(() => {
        const totalMinimums = debts.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0);
        return totalMinimums + extraPayment;
    }, [debts, extraPayment]);

    const totalDebt = useMemo(() => {
        return debts.reduce((sum, debt) => sum + (debt.value || 0), 0);
    }, [debts]);

    const StatCard = ({ title, value, children }) => (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-4 rounded-xl shadow-lg text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1 truncate">{title}</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}{children}</div>
        </div>
    );

    const addDebt = () => {
        if (newDebtName && parseFloat(newDebtBalance) > 0 && parseFloat(newDebtInterestRate) >= 0 && parseFloat(newDebtMinPayment) >= 0) {
            setDebts([...debts, {
                id: Date.now(),
                name: newDebtName,
                value: parseFloat(newDebtBalance),
                balance: parseFloat(newDebtBalance),
                interestRate: parseFloat(newDebtInterestRate),
                minimumPayment: parseFloat(newDebtMinPayment)
            }]);
            setNewDebtName('');
            setNewDebtBalance('');
            setNewDebtInterestRate('');
            setNewDebtMinPayment('');
            setSchedule(null);
        } else {
            alert('Please fill in all debt fields with valid positive numbers for balance/payments and non-negative for interest rate.');
        }
    };

    const removeDebt = (id) => {
        setDebts(debts.filter(debt => debt.id !== id));
        setSchedule(null);
    };

    const calculatePaydown = () => {
        if (debts.length === 0) {
            alert('Please add at least one debt to calculate.');
            return;
        }

        let workingDebts = JSON.parse(JSON.stringify(debts.map(d => ({
            ...d,
            balance: parseFloat(d.value)
        }))));

        if (strategy === 'avalanche') {
            workingDebts.sort((a, b) => b.interestRate - a.interestRate);
        } else if (strategy === 'snowball') {
            workingDebts.sort((a, b) => a.balance - b.balance);
        }

        let months = 0;
        let totalInterestPaid = 0;
        let paymentSchedule = [];
        const maxMonths = 600;

        while (workingDebts.some(d => d.balance > 0) && months < maxMonths) {
            months++;
            let currentMonthExtraPaymentPool = extraPayment;
            let totalPaymentsThisMonth = 0;
            let currentMonthInterestAccrued = 0;

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

            for (const debt of workingDebts) {
                if (debt.balance > 0 && currentMonthExtraPaymentPool > 0) {
                    const paymentAmount = Math.min(debt.balance, currentMonthExtraPaymentPool);
                    debt.balance -= paymentAmount;
                    currentMonthExtraPaymentPool -= paymentAmount;
                    totalPaymentsThisMonth += paymentAmount;
                }
            }

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
        <div className="space-y-8 text-gray-900 dark:text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Debt" value={`£${totalDebt.toLocaleString('en-GB', {maximumFractionDigits: 0})}`} />
                <StatCard title="Consolidated Monthly Payment" value={`£${consolidatedMonthlyPayment.toLocaleString('en-GB', {maximumFractionDigits: 0})}`} />
                <StatCard title="Debt-Free Goal">
                    {schedule ? (
                        <p className="text-green-600 dark:text-green-400">
                            {new Date(new Date().setMonth(new Date().getMonth() + schedule.months)).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                        </p>
                    ) : (
                        <p className="text-lg text-gray-400 dark:text-slate-500">Calculate to see</p>
                    )}
                </StatCard>
            </div>

            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Debt Paydown Planner</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label htmlFor="strategy" className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Strategy</label>
                        <select
                            id="strategy"
                            value={strategy}
                            onChange={e => { setStrategy(e.target.value); setSchedule(null); }}
                            className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg w-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-300 dark:border-slate-600"
                        >
                            <option value="avalanche">Avalanche (Highest Interest First)</option>
                            <option value="snowball">Snowball (Lowest Balance First)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="extraPayment" className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Extra Monthly Payment (£)</label>
                        <input
                            id="extraPayment"
                            type="number"
                            value={extraPayment}
                            onChange={e => { setExtraPayment(parseFloat(e.target.value) || 0); setSchedule(null); }}
                            className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg w-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-300 dark:border-slate-600"
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

            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add a New Debt</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end mb-4">
                    <div>
                        <label htmlFor="debtName" className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Debt Name</label>
                        <input
                            id="debtName"
                            type="text"
                            value={newDebtName}
                            onChange={e => setNewDebtName(e.target.value)}
                            className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg w-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-slate-600"
                            placeholder="e.g., Credit Card A"
                        />
                    </div>
                    <div>
                        <label htmlFor="debtBalance" className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Current Balance (£)</label>
                        <input
                            id="debtBalance"
                            type="number"
                            value={newDebtBalance}
                            onChange={e => setNewDebtBalance(e.target.value)}
                            className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg w-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-slate-600"
                            placeholder="1000"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="debtInterest" className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Interest Rate (%)</label>
                        <input
                            id="debtInterest"
                            type="number"
                            value={newDebtInterestRate}
                            onChange={e => setNewDebtInterestRate(e.target.value)}
                            className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg w-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-slate-600"
                            placeholder="18.9"
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="debtMinPayment" className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Min. Payment (£)</label>
                        <input
                            id="debtMinPayment"
                            type="number"
                            value={newDebtMinPayment}
                            onChange={e => setNewDebtMinPayment(e.target.value)}
                            className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg w-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-300 dark:border-slate-600"
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

                {debts.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-3">Your Debts:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {debts.map(debt => (
                                <div key={debt.id} className="bg-gray-100 dark:bg-slate-700/70 p-4 rounded-lg flex justify-between items-center border border-gray-200 dark:border-slate-600">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{debt.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Balance: £{debt.value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Rate: {debt.interestRate}% | Min. Payment: £{debt.minimumPayment.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
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

            {schedule && (
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl text-center shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Projected Payoff</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-gray-500 dark:text-slate-400 text-lg">Payoff Time</p>
                            <p className="text-4xl font-bold text-sky-600 dark:text-sky-400">
                                {Math.floor(schedule.months / 12)}y {schedule.months % 12}m
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400 text-lg">Debt-Free By</p>
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                                {new Date(new Date().setMonth(new Date().getMonth() + schedule.months)).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400 text-lg">Total Interest Paid</p>
                            <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                                £{schedule.totalInterestPaid.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
function CalendarView({ transactions, subscriptions }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const eventsByDate = useMemo(() => {
        const events = {};
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 1. Process historical transactions
        transactions.forEach(t => {
            const date = new Date(t.date).toDateString();
            if (!events[date]) events[date] = [];
            events[date].push({ ...t, eventType: 'transaction' });
        });

        // 2. Process recurring subscriptions for the current month's view
        subscriptions.forEach(sub => {
            // Simple simulation: Use the name length to pick a billing day. 
            // A real app would store the day of the month for each bill.
            const billingDay = (sub.name.length % 28) + 1;
            const date = new Date(year, month, billingDay);

            // Ensure the simulated day exists for the current month (e.g., avoids Feb 30th)
            if (date.getMonth() === month) {
                const dateString = date.toDateString();
                if (!events[dateString]) events[dateString] = [];
                events[dateString].push({
                    id: `sub-${sub.id}`,
                    eventType: 'subscription',
                    description: sub.name,
                    amount: sub.amount,
                    type: 'expense'
                });
            }
        });

        return events;
    }, [transactions, subscriptions, currentDate]);

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const todayString = new Date().toDateString();

    const calendarGrid = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.push(<div key={`empty-${i}`} className="border-t border-r border-gray-200 dark:border-slate-700"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = date.toDateString();
        const dayEvents = eventsByDate[dateString] || [];
        const isToday = dateString === todayString;

        const dailyTotals = dayEvents.reduce((acc, event) => {
            if (event.eventType === 'transaction') {
                const amount = parseFloat(event.amount) || 0;
                if (event.type === 'income') acc.income += amount;
                else acc.expense += amount;
            }
            return acc;
        }, { income: 0, expense: 0 });

        calendarGrid.push(
            <div key={day} className={`relative border-t border-r border-gray-200 dark:border-slate-700 p-2 flex flex-col group aspect-video transition-colors duration-200 ${isToday ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                <span className={`font-semibold text-sm ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>{day}</span>
                
                <div className="flex-grow overflow-hidden mt-1">
                    {/* Event list appears on hover */}
                    <div className="transition-opacity opacity-0 group-hover:opacity-100 space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                            <div key={event.id} className="flex items-center gap-1.5">
                               <span className={`w-1.5 h-1.5 rounded-full ${event.eventType === 'subscription' ? 'bg-sky-500' : (event.type === 'income' ? 'bg-green-500' : 'bg-red-500')}`}></span>
                               <p className="truncate text-gray-700 dark:text-slate-300 text-xs">{event.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-right text-xs mt-auto font-medium">
                    {dailyTotals.income > 0 && <p className="text-green-600 dark:text-green-500">+£{dailyTotals.income.toLocaleString('en-GB', {maximumFractionDigits: 0})}</p>}
                    {dailyTotals.expense > 0 && <p className="text-red-600 dark:text-red-500">-£{dailyTotals.expense.toLocaleString('en-GB', {maximumFractionDigits: 0})}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-white/10 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{currentDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><ChevronLeft /></button>
                    <button onClick={goToToday} className="text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600">Today</button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><ChevronRight /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 border-l border-b border-gray-200 dark:border-slate-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold p-2 bg-gray-100 dark:bg-slate-900/50 text-gray-700 dark:text-gray-300 text-sm">{day}</div>
                ))}
                {calendarGrid}
            </div>
        </div>
    );
}
function TransactionList({ transactions, handleDeleteTransaction }) {
    if (transactions.length === 0) return <EmptyState illustration={<EmptyWalletIllustration />} message="No transactions match your criteria." />;
    return (<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-gray-200 dark:border-slate-700"><th className="p-3 text-sm font-semibold text-gray-500 dark:text-slate-400">Date</th><th className="p-3 text-sm font-semibold text-gray-500 dark:text-slate-400">Description</th><th className="p-3 text-sm font-semibold text-gray-500 dark:text-slate-400">Category</th><th className="p-3 text-sm font-semibold text-gray-500 dark:text-slate-400 text-right">Amount</th><th className="p-3 text-sm font-semibold text-gray-500 dark:text-slate-400 text-center">Action</th></tr></thead><tbody>{transactions.map(t => (<tr key={t.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"><td className="p-3 text-gray-700 dark:text-slate-300">{new Date(t.date).toLocaleDateString('en-GB')}</td><td className="p-3 text-gray-700 dark:text-slate-300">{t.description}</td><td className="p-3 text-gray-700 dark:text-slate-300"><span className="bg-gray-200 dark:bg-slate-700 px-2 py-1 text-xs rounded-full">{t.category}</span></td><td className={`p-3 text-right font-medium ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.type === 'income' ? '+' : '-'} £{parseFloat(t.amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="p-3 text-center"><button onClick={() => handleDeleteTransaction(t.id)} className="text-gray-500 dark:text-slate-500 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>);
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
            const suggestedCategory = await callGeminiApi(prompt, true);
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md m-4 border border-gray-200 dark:border-slate-700"
            >
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><span className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block">Transaction Type</span><div className="flex items-center bg-gray-200 dark:bg-slate-700 rounded-lg p-1"><button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-medium rounded-md ${type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Expense</button><button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-medium rounded-md ${type === 'income' ? 'bg-green-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Income</button></div></div>
                    <div><label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block" htmlFor="amount">Amount (£)</label><input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required /></div>
                    <div><label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block" htmlFor="description">Description</label><div className="flex gap-2"><input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Weekly shop at Tesco" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required /><button type="button" onClick={handleSuggestCategory} disabled={isSuggesting || type === 'income'} className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded-lg disabled:bg-slate-600"><Sparkles size={16} /></button></div></div>
                    <div><label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block" htmlFor="category">Category</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white">{(type === 'expense' ? categories.expense : categories.income).map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                    <div><label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block" htmlFor="date">Date</label><input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required /></div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-slate-200 font-bold rounded-lg">Cancel</button><button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Add Transaction</button></div>
                </form>
            </motion.div>
        </motion.div>
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
    return (<motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md m-4 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add Subscription or Bill</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4"><label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block" htmlFor="sub-name">Name</label><input id="sub-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Netflix" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required /></div>
                <div className="mb-4"><label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block" htmlFor="sub-amount">Amount (£)</label><input id="sub-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white" required /></div>
                <div className="mb-6"><label className="text-gray-500 dark:text-slate-400 text-sm font-bold mb-2 block" htmlFor="sub-category">Category</label><select id="sub-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white"><option value="Subscriptions">Subscriptions</option><option value="Bills">Bills</option></select></div>
                <div className="flex justify-end gap-4 mt-8"><button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-slate-200 font-bold rounded-lg">Cancel</button><button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Add Subscription</button></div>
            </form>
        </motion.div>
    </motion.div>
    );
}

function BudgetStatus({ budgets, expenses, onNavigate }) {
    const budgetData = useMemo(() => {
        const expenseByCategory = {};
        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (parseFloat(t.amount) || 0);
        });

        return Object.entries(budgets).map(([cat, bud]) => {
            const spent = expenseByCategory[cat] || 0;
            const percentage = bud > 0 ? (spent / bud) * 100 : 0;
            const remaining = bud - spent;
            return { cat, bud, spent, percentage, remaining };
        }).filter(b => b.bud > 0);
    }, [budgets, expenses]);

    const getProgressBarColor = (percentage) => {
        if (percentage > 100) return 'bg-red-500';
        if (percentage > 90) return 'bg-orange-500';
        if (percentage > 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (budgetData.length === 0) {
        return (
            <ChartCard title="Budget Status">
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">No budgets set. Go to Settings to create some.</p>
                    <button onClick={() => onNavigate('settings')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Go to Settings</button>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Budget Status">
            <div className="space-y-5">
                {budgetData.map(({ cat, bud, spent, percentage, remaining }) => (
                    <div key={cat}>
                        <div className="flex justify-between items-end mb-1">
                            <span className="font-medium text-gray-800 dark:text-slate-200">{cat}</span>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    £{spent.toLocaleString('en-GB', {maximumFractionDigits: 0})} / <span className="text-gray-500 dark:text-slate-400">£{bud.toLocaleString('en-GB', {maximumFractionDigits: 0})}</span>
                                </p>
                                <p className={`text-xs font-medium ${remaining >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-500'}`}>
                                    {remaining >= 0 ? `£${remaining.toFixed(2)} remaining` : `£${Math.abs(remaining).toFixed(2)} over`}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 relative">
                            <motion.div
                                className={`h-3 rounded-full ${getProgressBarColor(percentage)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(percentage, 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}
function SavingsGoalsWidget({ goals, onNavigate }) {
    if (goals.length === 0) {
        return (
            <ChartCard title="Savings Goals">
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">No savings goals set yet. Create one to get started!</p>
                    <button onClick={() => onNavigate('goals')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Create Goal</button>
                </div>
            </ChartCard>
        );
    }
    return (
        <ChartCard title="Savings Goals">
            <div className="space-y-4">
                {goals.slice(0, 3).map(goal => {
                    const percentage = goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 : 0;
                    return (
                        <div key={goal.id}>
                            <div className="flex justify-between mb-1 text-sm">
                                <span className="font-medium text-gray-700 dark:text-slate-300">{goal.name}</span>
                                <span className="text-gray-500 dark:text-slate-400">{Math.round(percentage)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ChartCard>
    );
}

const EmptyState = ({ illustration, message }) => (
    <div className="text-center py-10">
        <div className="w-24 h-24 mx-auto text-gray-400 dark:text-slate-600">{illustration}</div>
        <p className="text-gray-500 dark:text-slate-400 mt-4 text-sm">{message}</p>
    </div>
);

const EmptyWalletIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
);

const EmptyCalendarIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const EmptyPiggyBankIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.7 15.3c-1.2-1.2-2.9-1.2-4.1 0s-1.2 2.9 0 4.1c1.2 1.2 2.9 1.2 4.1 0s1.2-2.9 0-4.1z" /><path d="M11.3 15.3c-1.2-1.2-2.9-1.2-4.1 0s-1.2 2.9 0 4.1c1.2 1.2 2.9 1.2 4.1 0s1.2-2.9 0-4.1z" /><path d="M15.5 15.5c-1.2-1.2-2.9-1.2-4.1 0s-1.2 2.9 0 4.1c1.2 1.2 2.9 1.2 4.1 0s1.2-2.9 0-4.1z" /><path d="M12 3a1 1 0 0 0-1 1v2.5a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" /><path d="M12 21a1 1 0 0 0 1-1v-2.5a1 1 0 0 0-2 0V20a1 1 0 0 0 1 1z" /><path d="M3 12a1 1 0 0 0-1 1h2.5a1 1 0 0 0 0-2H2a1 1 0 0 0-1 1z" /><path d="M21 12a1 1 0 0 0 1-1h-2.5a1 1 0 0 0 0 2H22a1 1 0 0 0 1-1z" />
    </svg>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-300 dark:border-slate-700 p-3 rounded-lg shadow-lg">
                <p className="label text-gray-700 dark:text-slate-300 font-bold">{`${label}`}</p>
                {payload.map((pld, index) => (
                    <div key={index} style={{ color: pld.color }}>
                        {`${pld.name}: £${pld.value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Helper Functions for AI ---
async function callGeminiApi(prompt, isTextOnly = false, schema = null) {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (!isTextOnly && schema) {
        payload.generationConfig = {
            responseMimeType: "application/json",
        };
        const schemaPrompt = `Please respond with a JSON object that adheres to the following schema: ${JSON.stringify(schema)}. Do not include any other text or markdown formatting.`;
        payload.contents[0].parts[0].text = `${prompt}\n\n${schemaPrompt}`;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API Error:", errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0) {
            const content = result.candidates[0].content;
            if (content && content.parts && content.parts.length > 0) {
                const part = content.parts[0];
                if (isTextOnly) {
                    return part.text;
                } else {
                    const textResponse = part.text;
                    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
                    if (jsonMatch && jsonMatch[1]) {
                        return JSON.parse(jsonMatch[1]);
                    }
                    return JSON.parse(textResponse);
                }
            }
        }

        throw new Error("Invalid response structure from Gemini API.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF', '#8884d8', '#82ca9d'];

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

    return (
        <g>
            <text x={cx} y={cy - 12} dy={8} textAnchor="middle" fill={fill} className="text-lg font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy + 12} dy={8} textAnchor="middle" fill="currentColor" className="text-2xl font-bold dark:fill-white fill-gray-800">
                {`£${payload.value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            </text>
            <text x={cx} y={cy + 35} dy={8} textAnchor="middle" fill="currentColor" className="text-sm dark:fill-gray-400 fill-gray-500">
                {`(${(percent * 100).toFixed(1)}%)`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 10} // This makes the active sector pop out
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        </g>
    );
};


function SpendingBreakdownChart({ transactions }) {
    const [dateRange, setDateRange] = useState('this_month');
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const chartData = useMemo(() => {
        const now = new Date();
        let startDate;

        switch (dateRange) {
            case 'last_30_days':
                startDate = new Date();
                startDate.setDate(now.getDate() - 30);
                break;
            case 'last_90_days':
                startDate = new Date();
                startDate.setDate(now.getDate() - 90);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'this_month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const relevantTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && tDate >= startDate;
        });

        const spendingByCategory = relevantTransactions.reduce((acc, t) => {
            const category = t.category || 'Uncategorized';
            const amount = parseFloat(t.amount) || 0;
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {});

        return Object.entries(spendingByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

    }, [transactions, dateRange]);

    return (
        <ChartCard title="Spending Breakdown">
            <div className="mb-4">
                <select 
                    value={dateRange} 
                    onChange={e => setDateRange(e.target.value)}
                    className="w-full sm:w-auto bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="this_month">This Month</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="this_year">This Year</option>
                </select>
            </div>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            onMouseEnter={onPieEnter}
                            paddingAngle={5}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                 <div className="h-[300px] flex items-center justify-center">
                    <EmptyState illustration={<EmptyWalletIllustration/>} message="No spending data for the selected period."/>
                 </div>
            )}
        </ChartCard>
    );
}