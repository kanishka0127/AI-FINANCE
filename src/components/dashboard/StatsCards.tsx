import { Transaction, Budget } from '../Dashboard';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface StatsCardsProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const StatsCards = ({ transactions, budgets }: StatsCardsProps) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter((t) => t.categories?.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = monthlyTransactions
    .filter((t) => t.categories?.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const budgetUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  const stats = [
    {
      label: 'Total Income',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      label: 'Net Balance',
      value: formatCurrency(totalIncome - totalExpenses),
      icon: Wallet,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Budget Usage',
      value: totalBudget > 0 ? `${budgetUsed.toFixed(1)}%` : 'No Budget',
      icon: AlertTriangle,
      color: budgetUsed > 80 ? 'orange' : 'teal',
      bgColor: budgetUsed > 80 ? 'bg-orange-50' : 'bg-teal-50',
      textColor: budgetUsed > 80 ? 'text-orange-600' : 'text-teal-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};
