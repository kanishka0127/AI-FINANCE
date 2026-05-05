import { useState } from 'react';
import { Transaction } from '../Dashboard';
import { Calendar, Tag, Building2, Trash2 } from 'lucide-react';
import { ref, remove } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import * as Icons from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: () => void;
  fullView?: boolean;
}

export const TransactionList = ({ transactions, onRefresh, fullView }: TransactionListProps) => {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const displayTransactions = fullView ? transactions : transactions.slice(0, 10);

  const handleDelete = async (id: string) => {
    if (!user || deletingId) return;
    
    if (confirm('Are you sure you want to delete this transaction?')) {
      setDeletingId(id);
      try {
        const transactionRef = ref(db, `transactions/${user.uid}/${id}`);
        await remove(transactionRef);
        onRefresh();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Circle;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <p className="text-sm text-gray-500 mt-1">
          {displayTransactions.length} transactions shown
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {displayTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No transactions yet. Add your first transaction to get started!</p>
          </div>
        ) : (
          displayTransactions.map((transaction) => {
            const Icon = getIcon(transaction.categories?.icon || 'Circle');
            const isExpense = transaction.categories?.type === 'expense';

            return (
              <div
                key={transaction.id}
                className="p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: `${transaction.categories?.color}15`,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: transaction.categories?.color }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 truncate">
                          {transaction.description || 'Transaction'}
                        </p>
                        <span
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: `${transaction.categories?.color}15`,
                            color: transaction.categories?.color,
                          }}
                        >
                          {transaction.categories?.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                        {transaction.merchant && (
                          <span className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3" />
                            <span>{transaction.merchant}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span className="capitalize">{transaction.source}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-lg font-semibold ${
                        isExpense ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}₹{Number(transaction.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      disabled={deletingId === transaction.id}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all disabled:opacity-50"
                    >
                      {deletingId === transaction.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
