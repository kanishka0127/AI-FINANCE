import { ref, get, push } from 'firebase/database';
import { db } from '../lib/firebase';

export const seedSampleData = async (userId: string) => {
  try {
    console.log('Starting sample data seeding...');
    
    // Check if sample data already exists
    const existingTransactionsRef = ref(db, `transactions/${userId}`);
    const existingTransactionsSnap = await get(existingTransactionsRef);
    
    if (existingTransactionsSnap.exists()) {
      console.log('Sample data already exists, skipping seed');
      return;
    }

    // Ensure categories exist first
    const categoriesRef = ref(db, 'categories');
    const categoriesSnap = await get(categoriesRef);

    if (!categoriesSnap.exists()) {
      console.error('No categories found - initializing categories first');
      throw new Error('Categories must be initialized before seeding sample data');
    }

    const categoriesData = categoriesSnap.val();
    const categories = Object.keys(categoriesData).map(key => ({
      id: key,
      ...categoriesData[key]
    }));

    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');

    if (expenseCategories.length === 0 || incomeCategories.length === 0) {
      throw new Error('Both expense and income categories are required');
    }

    console.log(`Found ${expenseCategories.length} expense categories and ${incomeCategories.length} income categories`);

    const today = new Date();
    const merchants = [
      'Swiggy', 'Zomato', 'BigBasket', 'Flipkart', 'Amazon India',
      'Reliance Fresh', 'DMart', 'Ola', 'Uber', 'BookMyShow',
      'Paytm Mall', 'Myntra', 'HDFC Bank', 'SBI', 'ICICI Bank',
      'Indian Oil', 'HP Petrol', 'CCD', 'Dominos', 'McDonald\'s India',
      'Local Kirana', 'Medical Store', 'Metro Cash & Carry'
    ];

    // Create transactions using individual push operations (more reliable)
    const transactionsRef = ref(db, `transactions/${userId}`);
    const transactionPromises = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const isExpense = Math.random() > 0.2;
      const categoryList = isExpense ? expenseCategories : incomeCategories;
      const category = categoryList[Math.floor(Math.random() * categoryList.length)];

      const amount = isExpense
        ? Math.random() * 5000 + 100  // ₹100 to ₹5100
        : Math.random() * 50000 + 10000; // ₹10000 to ₹60000

      const transactionData = {
        category_id: category.id,
        amount: parseFloat(amount.toFixed(2)),
        description: `${category.name} purchase`,
        transaction_date: date.toISOString(),
        merchant: merchants[Math.floor(Math.random() * merchants.length)],
        source: ['manual', 'bank_api', 'ocr'][Math.floor(Math.random() * 3)],
        confidence_score: 0.95 + Math.random() * 0.05,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      transactionPromises.push(push(transactionsRef, transactionData));
    }

    // Create budgets
    const budgetsRef = ref(db, `budgets/${userId}`);
    const budgetPromises = [];

    for (const cat of expenseCategories.slice(0, 4)) {
      const budgetData = {
        category_id: cat.id,
        amount: Math.random() * 15000 + 5000, // ₹5000 to ₹20000
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      budgetPromises.push(push(budgetsRef, budgetData));
    }

    // Create alerts
    const alertsRef = ref(db, `alerts/${userId}`);
    const sampleAlerts = [
      {
        type: 'overspending',
        title: 'Budget Alert',
        message: 'You have exceeded 80% of your Dining budget for this month.',
        severity: 'warning',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        type: 'fraud',
        title: 'Unusual Activity Detected',
        message: 'An unusual transaction pattern was detected. Please review your recent transactions.',
        severity: 'critical',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        type: 'budget_threshold',
        title: 'Budget Milestone',
        message: 'Great job! You are staying within your budget this month.',
        severity: 'info',
        is_read: true,
        created_at: new Date().toISOString(),
      },
    ];

    const alertPromises = sampleAlerts.map(alert => push(alertsRef, alert));

    // Execute all operations
    console.log('Creating transactions, budgets, and alerts...');
    await Promise.all([
      ...transactionPromises,
      ...budgetPromises,
      ...alertPromises
    ]);

    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding sample data:', error);
    throw error;
  }
};


