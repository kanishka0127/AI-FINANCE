import { useState, useEffect } from 'react';
import { ref, push, get, set } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Upload, Mail, MessageSquare, AlertCircle } from 'lucide-react';

interface AddTransactionProps {
  onTransactionAdded: () => void;
}

export const AddTransaction = ({ onTransactionAdded }: AddTransactionProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    merchant: '',
    transaction_date: new Date().toISOString().split('T')[0],
    source: 'manual',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesRef = ref(db, 'categories');
      const categoriesSnap = await get(categoriesRef);
      const categoriesData: any[] = [];
      
      if (categoriesSnap.exists()) {
        const data = categoriesSnap.val();
        Object.keys(data).forEach(key => {
          categoriesData.push({
            id: key,
            ...data[key]
          });
        });
        // Sort by name
        categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (!formData.category_id) {
      setError('Please select a category');
      return false;
    }
    if (!formData.transaction_date) {
      setError('Please select a date');
      return false;
    }
    // Check if date is not in the future
    const selectedDate = new Date(formData.transaction_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (selectedDate > today) {
      setError('Transaction date cannot be in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const transactionsRef = ref(db, `transactions/${user.uid}`);
      const newTransactionRef = push(transactionsRef);
      
      // Get confidence score based on source
      const getConfidenceScore = (source: string) => {
        switch (source) {
          case 'manual': return 1.0;
          case 'ocr': return 0.85 + Math.random() * 0.1; // 0.85-0.95
          case 'email': return 0.90 + Math.random() * 0.05; // 0.90-0.95
          case 'sms': return 0.80 + Math.random() * 0.1; // 0.80-0.90
          default: return 1.0;
        }
      };
      
      await set(newTransactionRef, {
        ...formData,
        user_id: user.uid,
        amount: parseFloat(formData.amount),
        confidence_score: getConfidenceScore(formData.source),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Reset form
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        merchant: '',
        transaction_date: new Date().toISOString().split('T')[0],
        source: 'manual',
      });
      
      onTransactionAdded();
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (source: string) => {
    setFormData({ ...formData, source });
  };

  const sourceOptions = [
    { value: 'manual', label: 'Manual Input', icon: Plus, available: true },
    { value: 'ocr', label: 'OCR Bill Scan', icon: Upload, available: true },
    { value: 'email', label: 'Email', icon: Mail, available: true },
    { value: 'sms', label: 'SMS', icon: MessageSquare, available: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Transaction</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="500.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Coffee at CCD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="CCD / Swiggy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.transaction_date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) =>
                setFormData({ ...formData, transaction_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <div className="flex space-x-2">
              {sourceOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSourceChange(option.value)}
                    className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg border transition-all ${
                      formData.source === option.value
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};
