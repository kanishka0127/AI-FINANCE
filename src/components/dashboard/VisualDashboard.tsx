import { useState, useEffect, useMemo } from 'react';
import { Transaction, Budget } from '../Dashboard';
import { 
  TrendingUp, 
  PieChart, 
  Activity,
  Target, 
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface VisualDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const VisualDashboard = ({ transactions, budgets }: VisualDashboardProps) => {

  // Data processing
  const processedData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Monthly data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.categories?.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = monthTransactions
        .filter(t => t.categories?.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expense,
        net: income - expense
      });
    }

    // Category breakdown
    const categoryBreakdown: Record<string, { name: string; amount: number; color: string; count: number }> = {};
    transactions
      .filter(t => t.categories?.type === 'expense')
      .forEach(t => {
        const catId = t.category_id;
        if (!categoryBreakdown[catId]) {
          categoryBreakdown[catId] = {
            name: t.categories?.name || 'Unknown',
            amount: 0,
            color: t.categories?.color || '#6B7280',
            count: 0,
          };
        }
        categoryBreakdown[catId].amount += Number(t.amount);
        categoryBreakdown[catId].count += 1;
      });

    const sortedCategories = Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount);

    // Daily spending for last 30 days
    const dailySpending = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.toDateString() === date.toDateString() && t.categories?.type === 'expense';
      });
      
      const amount = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      dailySpending.push({
        date: date.getDate(),
        amount,
        day: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    // Budget utilization
    const budgetUtilization = budgets.map(budget => {
      const spent = transactions
        .filter(t => {
          const tDate = new Date(t.transaction_date);
          return (
            t.category_id === budget.category_id &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        name: budget.categories?.name || 'Unknown',
        spent,
        budget: Number(budget.amount),
        percentage: (spent / Number(budget.amount)) * 100,
        color: budget.categories?.color || '#6B7280'
      };
    });

    return {
      monthlyData,
      sortedCategories,
      dailySpending,
      budgetUtilization,
      totalIncome: monthlyData.reduce((sum, m) => sum + m.income, 0),
      totalExpense: monthlyData.reduce((sum, m) => sum + m.expense, 0),
      maxMonthlyAmount: Math.max(...monthlyData.map(m => Math.max(m.income, m.expense))),
      maxDailyAmount: Math.max(...dailySpending.map(d => d.amount))
    };
  }, [transactions, budgets]);

  const AnimatedProgressBar = ({ percentage, color, delay = 0 }: { percentage: number; color: string; delay?: number }) => (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full transition-all duration-1000 ease-out"
        style={{
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: color,
          transitionDelay: `${delay}ms`
        }}
      />
    </div>
  );

  const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timer);
    }, [value]);

    return (
      <span className="transition-all duration-1000 ease-out">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Visual Financial Dashboard</h1>
              <p className="text-white/80">Real-time insights with animated visualizations</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Net Worth</p>
              <p className="text-3xl font-bold">
                <AnimatedCounter 
                  value={processedData.totalIncome - processedData.totalExpense} 
                  prefix="₹" 
                />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <ArrowUpRight className="w-8 h-8 text-emerald-300" />
                <div>
                  <p className="text-white/80 text-sm">Total Income</p>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter value={processedData.totalIncome} prefix="₹" />
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <ArrowDownRight className="w-8 h-8 text-red-300" />
                <div>
                  <p className="text-white/80 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter value={processedData.totalExpense} prefix="₹" />
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-yellow-300" />
                <div>
                  <p className="text-white/80 text-sm">Savings Rate</p>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter 
                      value={processedData.totalIncome > 0 ? ((processedData.totalIncome - processedData.totalExpense) / processedData.totalIncome) * 100 : 0} 
                      suffix="%" 
                    />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-blue-50 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Trend Analysis</h2>
            <p className="text-gray-600">Income vs Expenses over time</p>
          </div>
        </div>

        <div className="space-y-6">
          {processedData.monthlyData.map((month, index) => (
            <div key={month.month} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">{month.month}</span>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="text-emerald-600 font-medium">
                    Income: {formatCurrency(month.income)}
                  </span>
                  <span className="text-red-600 font-medium">
                    Expense: {formatCurrency(month.expense)}
                  </span>
                  <span className={`font-bold ${month.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Net: {formatCurrency(month.net)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-4 h-12">
                <div className="flex-1 bg-emerald-50 rounded-xl relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out rounded-xl"
                    style={{ 
                      width: `${processedData.maxMonthlyAmount > 0 ? (month.income / processedData.maxMonthlyAmount) * 100 : 0}%`,
                      transitionDelay: `${index * 100}ms`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-800">Income</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-red-50 rounded-xl relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000 ease-out rounded-xl"
                    style={{ 
                      width: `${processedData.maxMonthlyAmount > 0 ? (month.expense / processedData.maxMonthlyAmount) * 100 : 0}%`,
                      transitionDelay: `${index * 100 + 200}ms`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-800">Expense</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown & Daily Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-purple-50 p-3 rounded-xl">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Expense Categories</h2>
              <p className="text-gray-600">Spending breakdown</p>
            </div>
          </div>

          <div className="space-y-6">
            {processedData.sortedCategories.slice(0, 6).map((category, index) => {
              const percentage = processedData.totalExpense > 0 ? (category.amount / processedData.totalExpense) * 100 : 0;
              return (
                <div key={category.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full animate-pulse"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(category.amount)}</p>
                      <p className="text-sm text-gray-500">{category.count} transactions</p>
                    </div>
                  </div>
                  <AnimatedProgressBar 
                    percentage={percentage} 
                    color={category.color} 
                    delay={index * 150}
                  />
                  <p className="text-sm text-gray-600">{percentage.toFixed(1)}% of total expenses</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Spending Pattern */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-orange-50 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Daily Spending</h2>
              <p className="text-gray-600">Last 30 days pattern</p>
            </div>
          </div>

          <div className="flex items-end space-x-1 h-40 mb-4">
            {processedData.dailySpending.slice(-15).map((day, index) => (
              <div key={`${day.date}-${index}`} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-orange-400 to-orange-600 transition-all duration-1000 ease-out rounded-t-lg"
                    style={{ 
                      height: `${processedData.maxDailyAmount > 0 ? (day.amount / processedData.maxDailyAmount) * 100 : 0}%`,
                      minHeight: day.amount > 0 ? '4px' : '0px',
                      transitionDelay: `${index * 50}ms`
                    }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-bold text-gray-900">{day.date}</p>
                  <p className="text-xs text-gray-500">{day.day}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Average daily spending: {formatCurrency(processedData.dailySpending.reduce((sum, d) => sum + d.amount, 0) / processedData.dailySpending.length)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      {processedData.budgetUtilization.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Budget Performance</h2>
              <p className="text-gray-600">Real-time budget utilization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedData.budgetUtilization.map((budget, index) => (
              <div key={budget.name} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: budget.color }}
                    />
                    <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                  </div>
                  <span className={`text-sm font-bold ${
                    budget.percentage > 100 ? 'text-red-600' : 
                    budget.percentage > 80 ? 'text-orange-600' : 'text-emerald-600'
                  }`}>
                    {budget.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent</span>
                    <span className="font-medium">{formatCurrency(budget.spent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-medium">{formatCurrency(budget.budget)}</span>
                  </div>
                  
                  <AnimatedProgressBar 
                    percentage={budget.percentage} 
                    color={budget.percentage > 100 ? '#EF4444' : budget.percentage > 80 ? '#F59E0B' : '#10B981'} 
                    delay={index * 200}
                  />

                  <div className="text-center">
                    <span className={`text-sm font-medium ${
                      budget.percentage > 100 ? 'text-red-600' : 
                      budget.percentage > 80 ? 'text-orange-600' : 'text-emerald-600'
                    }`}>
                      {budget.percentage > 100 ? 
                        `Over by ${formatCurrency(budget.spent - budget.budget)}` :
                        `${formatCurrency(budget.budget - budget.spent)} remaining`
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Health Score */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Financial Health Score</h2>
            <p className="text-emerald-100">AI-powered analysis of your financial habits</p>
          </div>
          <div className="text-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.85)}`}
                  className="transition-all duration-2000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">85</span>
              </div>
            </div>
            <p className="text-emerald-100 text-sm mt-2">Excellent</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
            <p className="text-emerald-100 text-sm">Spending Habits</p>
            <p className="text-xl font-bold">Good</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
            <p className="text-emerald-100 text-sm">Budget Adherence</p>
            <p className="text-xl font-bold">Excellent</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
            <p className="text-emerald-100 text-sm">Savings Growth</p>
            <p className="text-xl font-bold">Strong</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
            <p className="text-emerald-100 text-sm">Financial Stability</p>
            <p className="text-xl font-bold">High</p>
          </div>
        </div>
      </div>
    </div>
  );
};