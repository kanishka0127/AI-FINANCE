import { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction } from '../Dashboard';
import { ref, get, push, remove, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, TrendingUp, AlertTriangle, Trash2, Edit3, Target, PieChart, Save, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface BudgetPageProps {
  budgets: Budget[];
  transactions: Transaction[];
  onRefresh: () => void;
}

export const BudgetPage = ({ budgets, transactions, onRefresh }: BudgetPageProps) => {
  const { user } = useAuth();
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    testFirebaseConnection();
    // Test Firebase connection
    console.log('Firebase config check:', {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Found' : '❌ Missing',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Found' : '❌ Missing',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ? '✅ Found' : '❌ Missing',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Found' : '❌ Missing',
    });
  }, []);

  const testFirebaseConnection = async () => {
    if (!user) {
      console.log('No user authenticated for Firebase test');
      return;
    }
    
    try {
      console.log('Testing Firebase connection...');
      const testRef = ref(db, `test/${user.uid}`);
      await push(testRef, {
        timestamp: new Date().toISOString(),
        message: 'Connection test'
      });
      console.log('✅ Firebase connection test successful');
    } catch (error: any) {
      console.error('❌ Firebase connection test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const categoriesRef = ref(db, 'categories');
      const snapshot = await get(categoriesRef);
      console.log('Categories snapshot exists:', snapshot.exists());
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Categories data:', data);
        const categoriesArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(cat => cat.type === 'expense')
          .sort((a, b) => a.name.localeCompare(b.name));
        console.log('Processed categories:', categoriesArray);
        setCategories(categoriesArray);
      } else {
        console.log('No categories found in database');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading || !selectedCategory || !amount) return;

    console.log('Adding budget:', { selectedCategory, amount, user: user.uid });
    setLoading(true);
    
    try {
      const budgetsRef = ref(db, `budgets/${user.uid}`);
      console.log('Budget ref path:', `budgets/${user.uid}`);
      
      const budgetData = {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Budget data to save:', budgetData);
      
      await push(budgetsRef, budgetData);
      console.log('Budget added successfully');

      setShowAddBudget(false);
      setSelectedCategory('');
      setAmount('');
      onRefresh();
    } catch (error: any) {
      console.error('Detailed error adding budget:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`Failed to add budget: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBudget = async (budgetId: string) => {
    if (!user || !editAmount || loading) return;

    setLoading(true);
    try {
      const budgetRef = ref(db, `budgets/${user.uid}/${budgetId}`);
      await update(budgetRef, {
        amount: parseFloat(editAmount),
        updated_at: new Date().toISOString(),
      });

      setEditingBudget(null);
      setEditAmount('');
      onRefresh();
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Failed to update budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user || !confirm('Are you sure you want to delete this budget?')) return;

    setDeleteLoading(budgetId);
    try {
      const budgetRef = ref(db, `budgets/${user.uid}/${budgetId}`);
      await remove(budgetRef);
      onRefresh();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const startEdit = (budget: Budget) => {
    setEditingBudget(budget.id);
    setEditAmount(budget.amount.toString());
  };

  const cancelEdit = () => {
    setEditingBudget(null);
    setEditAmount('');
  };

  // Memoize budget progress calculations to avoid recalculating on every render
  const budgetProgress = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return (
            t.category_id === budget.category_id &&
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = (spent / Number(budget.amount)) * 100;
      return {
        budgetId: budget.id,
        spent,
        percentage: Math.min(percentage, 100),
        isOver: spent > Number(budget.amount),
        remaining: Number(budget.amount) - spent
      };
    });
  }, [budgets, transactions]);

  // Calculate overall budget statistics
  const overallStats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalSpent = budgetProgress.reduce((sum, p) => sum + p.spent, 0);
    const totalRemaining = budgetProgress.reduce((sum, p) => sum + Math.max(0, p.remaining), 0);
    const overBudgetCount = budgetProgress.filter(p => p.isOver).length;
    
    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overBudgetCount,
      overallPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }, [budgets, budgetProgress]);

  // Filter out categories that already have budgets
  const availableCategories = categories.filter(
    cat => !budgets.some(budget => budget.category_id === cat.id)
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Budget Management</h1>
            <p className="text-emerald-100">Track and manage your monthly spending limits</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-sm">This Month</p>
            <p className="text-2xl font-bold">{formatCurrency(overallStats.totalSpent)}</p>
            <p className="text-emerald-100 text-sm">of {formatCurrency(overallStats.totalBudget)}</p>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(overallStats.totalBudget)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-red-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(overallStats.totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <PieChart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(overallStats.totalRemaining)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${overallStats.overBudgetCount > 0 ? 'bg-orange-50' : 'bg-teal-50'}`}>
              <AlertTriangle className={`w-6 h-6 ${overallStats.overBudgetCount > 0 ? 'text-orange-600' : 'text-teal-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Over Budget</p>
              <p className="text-xl font-bold text-gray-900">{overallStats.overBudgetCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Budget Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Budget Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your spending limits by category</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddBudget(!showAddBudget)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              disabled={availableCategories.length === 0}
            >
              <Plus className="w-4 h-4" />
              <span>Add Budget</span>
            </button>
            <button
              onClick={testFirebaseConnection}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {showAddBudget && (
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <form onSubmit={handleAddBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Budget (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="10000.00"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Budget List */}
        <div className="p-6">
          {budgets.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets set yet</h3>
              <p className="text-gray-500 mb-4">Create your first budget to start tracking your spending</p>
              <button
                onClick={() => setShowAddBudget(true)}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                disabled={availableCategories.length === 0}
              >
                Add Your First Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {budgets.map((budget, index) => {
                const progress = budgetProgress[index];
                const categoryName = categories.find(cat => cat.id === budget.category_id)?.name || 'Unknown Category';
                const categoryColor = categories.find(cat => cat.id === budget.category_id)?.color || '#6B7280';

                return (
                  <div key={budget.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">{categoryName}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingBudget === budget.id ? (
                          <>
                            <button
                              onClick={() => handleEditBudget(budget.id)}
                              disabled={loading}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(budget)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBudget(budget.id)}
                              disabled={deleteLoading === budget.id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {deleteLoading === budget.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {editingBudget === budget.id ? (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Edit Budget Amount (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="10000.00"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Spent this month</span>
                            <span className="font-medium">{formatCurrency(progress.spent)} / {formatCurrency(Number(budget.amount))}</span>
                          </div>

                          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                progress.isOver ? 'bg-red-500' : progress.percentage > 80 ? 'bg-orange-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-medium ${
                              progress.isOver ? 'text-red-600' : progress.percentage > 80 ? 'text-orange-600' : 'text-emerald-600'
                            }`}>
                              {progress.isOver ? (
                                `Over by ${formatCurrency(progress.spent - Number(budget.amount))}`
                              ) : (
                                `${formatCurrency(progress.remaining)} remaining`
                              )}
                            </span>
                            <span className="text-gray-500">
                              {progress.percentage.toFixed(1)}% used
                            </span>
                          </div>

                          {progress.percentage > 80 && (
                            <div className={`flex items-center space-x-2 p-3 rounded-lg animate-pulse ${
                              progress.isOver ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                            }`}>
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {progress.isOver ? 'Budget exceeded!' : 'Approaching budget limit'}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};