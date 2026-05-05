import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { initializeCategories } from '../utils/initializeFirebase';
import { seedSampleData } from '../utils/sampleData';
import { Header } from './dashboard/Header';
import { StatsCards } from './dashboard/StatsCards';
import { TransactionList } from './dashboard/TransactionList';
import { BudgetTracker } from './dashboard/BudgetTracker';
import { BudgetPage } from './dashboard/BudgetPage';
import { Analytics } from './dashboard/Analytics';
import { VisualDashboard } from './dashboard/VisualDashboard';
import { Alerts } from './dashboard/Alerts';
import { AddTransaction } from './dashboard/AddTransaction';
import { Chatbot } from './dashboard/Chatbot';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  merchant: string;
  source: string;
  category_id: string;
  categories?: {
    name: string;
    icon: string;
    color: string;
    type: string;
  };
}

export interface Budget {
  id: string;
  amount: number;
  period: string;
  category_id: string;
  categories?: {
    name: string;
    color: string;
  };
}

export interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing application...');
        
        // Always try to initialize categories, but don't fail if it doesn't work
        await initializeCategories();
        
        if (user) {
          await fetchData();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        // Don't show error immediately, try to continue
        if (user) {
          try {
            await fetchData();
          } catch (fetchError) {
            console.error('Error fetching data:', fetchError);
            setError('Unable to connect to Firebase. Please check your internet connection.');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    };
    initialize();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setError('');
    
    try {
      // Fetch all data in parallel for better performance
      const [categoriesSnap, transactionsSnap, budgetsSnap, alertsSnap] = await Promise.all([
        get(ref(db, 'categories')),
        get(ref(db, `transactions/${user.uid}`)),
        get(ref(db, `budgets/${user.uid}`)),
        get(ref(db, `alerts/${user.uid}`))
      ]);

      // Process categories
      const categoriesMap: any = {};
      if (categoriesSnap.exists()) {
        const data = categoriesSnap.val();
        Object.keys(data).forEach(key => {
          categoriesMap[key] = data[key];
        });
      }

      // Process transactions
      const transactionsData: Transaction[] = [];
      if (transactionsSnap.exists()) {
        const data = transactionsSnap.val();
        Object.keys(data).forEach(key => {
          const transaction = data[key];
          transactionsData.push({
            id: key,
            ...transaction,
            categories: categoriesMap[transaction.category_id] || undefined
          });
        });
        // Sort by date descending
        transactionsData.sort((a, b) => 
          new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        );
      }

      // Process budgets
      const budgetsData: Budget[] = [];
      if (budgetsSnap.exists()) {
        const data = budgetsSnap.val();
        Object.keys(data).forEach(key => {
          const budget = data[key];
          if (budget.period === 'monthly') {
            budgetsData.push({
              id: key,
              ...budget,
              categories: categoriesMap[budget.category_id] || undefined
            });
          }
        });
      }

      // Process alerts
      const alertsData: Alert[] = [];
      if (alertsSnap.exists()) {
        const data = alertsSnap.val();
        Object.keys(data).forEach(key => {
          alertsData.push({
            id: key,
            ...data[key]
          });
        });
        // Sort by date descending
        alertsData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      setTransactions(transactionsData.slice(0, 50));
      setBudgets(budgetsData);
      setAlerts(alertsData.slice(0, 10));
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load financial data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    fetchData();
  };

  const handleSeedData = async () => {
    if (!user || seeding) return;
    
    setSeeding(true);
    setError('');
    
    try {
      console.log('Starting sample data seeding process...');
      await seedSampleData(user.uid);
      console.log('Sample data seeding completed, refreshing data...');
      await fetchData();
      console.log('Sample data added successfully!');
    } catch (error: any) {
      console.error('Error seeding data:', error);
      setError(`Error adding sample data: ${error.message || 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onSignOut={signOut} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {transactions.length === 0 && !loading && !error && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Get Started</h3>
                <p className="text-blue-700">Add sample data to explore all features of FinanceGuard</p>
              </div>
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seeding ? 'Adding Data...' : 'Add Sample Data'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <StatsCards transactions={transactions} budgets={budgets} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <TransactionList transactions={transactions} onRefresh={fetchData} />
              </div>
              <div>
                <BudgetTracker budgets={budgets} transactions={transactions} onRefresh={fetchData} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <AddTransaction onTransactionAdded={handleTransactionAdded} />
            <TransactionList transactions={transactions} onRefresh={fetchData} fullView />
          </div>
        )}

        {activeTab === 'budgets' && (
          <BudgetPage budgets={budgets} transactions={transactions} onRefresh={fetchData} />
        )}

        {activeTab === 'analytics' && (
          <Analytics transactions={transactions} budgets={budgets} />
        )}

        {activeTab === 'visual' && (
          <VisualDashboard transactions={transactions} budgets={budgets} />
        )}

        {activeTab === 'alerts' && (
          <Alerts alerts={alerts} onRefresh={fetchData} />
        )}
      </main>

      <Chatbot />
    </div>
  );
};
