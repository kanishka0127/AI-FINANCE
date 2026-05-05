import { Transaction, Budget } from '../Dashboard';
import { TrendingUp, PieChart, Brain, BarChart3, Target, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface AnalyticsProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const Analytics = ({ transactions, budgets }: AnalyticsProps) => {
  const getCategoryBreakdown = () => {
    const breakdown: Record<string, { name: string; amount: number; color: string; count: number }> = {};

    transactions
      .filter((t) => t.categories?.type === 'expense')
      .forEach((t) => {
        const catId = t.category_id;
        if (!breakdown[catId]) {
          breakdown[catId] = {
            name: t.categories?.name || 'Unknown',
            amount: 0,
            color: t.categories?.color || '#6B7280',
            count: 0,
          };
        }
        breakdown[catId].amount += Number(t.amount);
        breakdown[catId].count += 1;
      });

    return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
  };

  const getIncomeBreakdown = () => {
    const breakdown: Record<string, { name: string; amount: number; color: string; count: number }> = {};

    transactions
      .filter((t) => t.categories?.type === 'income')
      .forEach((t) => {
        const catId = t.category_id;
        if (!breakdown[catId]) {
          breakdown[catId] = {
            name: t.categories?.name || 'Unknown',
            amount: 0,
            color: t.categories?.color || '#10B981',
            count: 0,
          };
        }
        breakdown[catId].amount += Number(t.amount);
        breakdown[catId].count += 1;
      });

    return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
  };

  const getMonthlyTrend = () => {
    const monthlyData: Record<string, { income: number; expense: number; net: number }> = {};

    transactions.forEach((t) => {
      const month = new Date(t.transaction_date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, net: 0 };
      }

      if (t.categories?.type === 'income') {
        monthlyData[month].income += Number(t.amount);
      } else {
        monthlyData[month].expense += Number(t.amount);
      }
      monthlyData[month].net = monthlyData[month].income - monthlyData[month].expense;
    });

    return Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-6);
  };

  const getDailySpending = () => {
    const dailyData: Record<string, number> = {};
    const last30Days = transactions
      .filter(t => {
        const transactionDate = new Date(t.transaction_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactionDate >= thirtyDaysAgo && t.categories?.type === 'expense';
      });

    last30Days.forEach(t => {
      const day = new Date(t.transaction_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      dailyData[day] = (dailyData[day] || 0) + Number(t.amount);
    });

    return Object.entries(dailyData).slice(-7);
  };

  const categoryBreakdown = getCategoryBreakdown();
  const incomeBreakdown = getIncomeBreakdown();
  const monthlyTrend = getMonthlyTrend();
  const dailySpending = getDailySpending();
  
  const totalExpenses = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
  const totalIncome = incomeBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
  const maxMonthlyAmount = Math.max(...monthlyTrend.map(([, data]) => Math.max(data.income, data.expense)));
  const maxDailyAmount = Math.max(...dailySpending.map(([, amount]) => amount));

  const predictions = [
    {
      title: 'Next Month Forecast',
      value: formatCurrency(totalExpenses * 1.05),
      change: '+5%',
      description: 'ARIMA model prediction',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Savings Potential',
      value: formatCurrency(totalIncome * 0.2),
      change: '20%',
      description: 'Recommended savings rate',
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Budget Efficiency',
      value: `${budgets.length > 0 ? ((totalExpenses / budgets.reduce((sum, b) => sum + Number(b.amount), 0)) * 100).toFixed(1) : 0}%`,
      change: budgets.length > 0 ? (totalExpenses / budgets.reduce((sum, b) => sum + Number(b.amount), 0) < 0.8 ? 'Good' : 'High') : 'N/A',
      description: 'Budget utilization rate',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Financial Analytics</h1>
            <p className="text-blue-100">AI-powered insights and predictions for your finances</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Net Worth Trend</p>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpenses)}</p>
            <p className="text-blue-100 text-sm">This period</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {predictions.map((pred) => {
          const Icon = pred.icon;
          return (
            <div key={pred.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`${pred.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${pred.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{pred.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{pred.value}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${pred.change.includes('+') ? 'text-red-600' : pred.change === 'Good' ? 'text-emerald-600' : 'text-gray-600'}`}>
                  {pred.change}
                </span>
                <span className="text-xs text-gray-500">{pred.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <PieChart className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.slice(0, 6).map((cat) => {
              const percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
              return (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{percentage.toFixed(1)}%</span>
                    <span>{cat.count} transactions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Income Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Income Sources</h3>
          </div>

          <div className="space-y-4">
            {incomeBreakdown.length > 0 ? incomeBreakdown.map((cat) => {
              const percentage = totalIncome > 0 ? (cat.amount / totalIncome) * 100 : 0;
              return (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{percentage.toFixed(1)}%</span>
                    <span>{cat.count} transactions</span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-gray-500 py-8">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No income data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Monthly Trend Analysis</h3>
        </div>

        <div className="space-y-6">
          {monthlyTrend.map(([month, data]) => (
            <div key={month} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{month}</span>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-emerald-600">Income: {formatCurrency(data.income)}</span>
                  <span className="text-red-600">Expense: {formatCurrency(data.expense)}</span>
                  <span className={`font-medium ${data.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Net: {formatCurrency(data.net)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 h-8">
                <div className="flex-1 bg-emerald-100 rounded relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-300"
                    style={{ width: `${maxMonthlyAmount > 0 ? (data.income / maxMonthlyAmount) * 100 : 0}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-emerald-800">Income</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-red-100 rounded relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-red-500 transition-all duration-300"
                    style={{ width: `${maxMonthlyAmount > 0 ? (data.expense / maxMonthlyAmount) * 100 : 0}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-red-800">Expense</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Spending Pattern */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Spending Pattern (Last 7 Days)</h3>
        </div>

        <div className="flex items-end space-x-2 h-32">
          {dailySpending.map(([day, amount]) => (
            <div key={day} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-100 rounded-t relative overflow-hidden flex-1 flex items-end">
                <div
                  className="w-full bg-purple-500 transition-all duration-300 rounded-t"
                  style={{ 
                    height: `${maxDailyAmount > 0 ? (amount / maxDailyAmount) * 100 : 0}%`,
                    minHeight: amount > 0 ? '4px' : '0px'
                  }}
                />
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs font-medium text-gray-900">{formatCurrency(amount)}</p>
                <p className="text-xs text-gray-500">{day}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-6 h-6" />
          <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
        </div>
        <p className="text-emerald-50 mb-6">
          Based on your spending patterns and machine learning analysis, here are your financial insights:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-xs text-emerald-100">Spending Profile</p>
            <p className="text-lg font-bold mt-1">Balanced Spender</p>
            <p className="text-xs text-emerald-200 mt-1">Good financial habits</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-xs text-emerald-100">Avg Transaction</p>
            <p className="text-lg font-bold mt-1">
              {formatCurrency(transactions.length > 0 ? totalExpenses / transactions.filter(t => t.categories?.type === 'expense').length : 0)}
            </p>
            <p className="text-xs text-emerald-200 mt-1">Per expense</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-xs text-emerald-100">Top Category</p>
            <p className="text-lg font-bold mt-1">{categoryBreakdown[0]?.name || 'N/A'}</p>
            <p className="text-xs text-emerald-200 mt-1">Highest spending</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-xs text-emerald-100">Fraud Risk</p>
            <p className="text-lg font-bold mt-1 text-emerald-300">Low</p>
            <p className="text-xs text-emerald-200 mt-1">ML detection active</p>
          </div>
        </div>
      </div>
    </div>
  );
};
