import { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction } from '../Dashboard';
import { ref, get, push } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, TrendingUp } from 'lucide-react';

interface BudgetTrackerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onRefresh: () => void;
}

export const BudgetTracker = ({ budgets, transactions, onRefresh }: BudgetTrackerProps) => {
  const { user } = useAuth();
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesRef = ref(db, 'categories');
      const snapshot = await get(categoriesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoriesArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(cat => cat.type === 'expense')
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    try {
      const budgetsRef = ref(db, `budgets/${user.uid}`);
      await push(budgetsRef, {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setShowAddBudget(false);
      setSelectedCategory('');
      setAmount('');
      onRefresh();
    } catch (error) {
      console.error('Error adding budget:', error);
    } finally {
      setLoading(false);
    }
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
        isOver: spent > Number(budget.amount)
      };
    });
  }, [budgets, transactions]);

  // Filter out categories that already have budgets
  const availableCategories = categories.filter(
    cat => !budgets.some(budget => budget.category_id === cat.id)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Budget Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">Monthly budget overview</p>
        </div>
        <button
          onClick={() => setShowAddBudget(!showAddBudget)}
          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
          disabled={availableCategories.length === 0}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAddBudget && (
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleAddBudget} className="space-y-4">
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
                Monthly Budget
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Budget'}
            </button>
          </form>
        </div>
      )}

      <div className="p-6 space-y-4">
        {budgets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No budgets set yet. Add your first budget to start tracking!</p>
          </div>
        ) : (
          budgets.map((budget, index) => {
            const progress = budgetProgress[index];
            const categoryName = categories.find(cat => cat.id === budget.category_id)?.name || 'Unknown Category';

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {categoryName}
                  </span>
                  <span className="text-sm text-gray-600">
                    ₹{progress.spent.toFixed(2)} / ₹{Number(budget.amount).toFixed(2)}
                  </span>
                </div>

                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      progress.isOver ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500">
                  {progress.isOver ? (
                    <span className="text-red-600 font-medium">
                      Over budget by ₹{(progress.spent - Number(budget.amount)).toFixed(2)}
                    </span>
                  ) : (
                    `${progress.percentage.toFixed(1)}% used`
                  )}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
