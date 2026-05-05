/*
  # Financial Management Platform Schema

  ## Overview
  Complete database schema for a financial management platform with ML-powered analytics,
  fraud detection, and comprehensive transaction tracking.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `categories`
  Transaction categories for classification
  - `id` (uuid, PK)
  - `name` (text) - e.g., "Groceries", "Utilities", "Entertainment"
  - `icon` (text) - icon name for UI
  - `color` (text) - color code for visualization
  - `type` (text) - "income" or "expense"
  - `created_at` (timestamptz)

  ### 3. `transactions`
  All financial transactions
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `category_id` (uuid, FK to categories)
  - `amount` (decimal)
  - `description` (text)
  - `transaction_date` (timestamptz)
  - `source` (text) - "manual", "bank_api", "ocr", "sms", "email"
  - `merchant` (text)
  - `is_recurring` (boolean)
  - `confidence_score` (decimal) - ML classification confidence
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `budgets`
  Budget tracking per category
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `category_id` (uuid, FK to categories)
  - `amount` (decimal)
  - `period` (text) - "monthly", "weekly", "yearly"
  - `start_date` (date)
  - `end_date` (date)
  - `created_at` (timestamptz)

  ### 5. `alerts`
  Overspending and custom alerts
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `type` (text) - "overspending", "fraud", "budget_threshold", "unusual_activity"
  - `title` (text)
  - `message` (text)
  - `severity` (text) - "info", "warning", "critical"
  - `is_read` (boolean)
  - `related_transaction_id` (uuid, FK to transactions, nullable)
  - `created_at` (timestamptz)

  ### 6. `fraud_alerts`
  ML-detected fraud and anomalies
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `transaction_id` (uuid, FK to transactions)
  - `anomaly_score` (decimal) - score from Isolation Forest
  - `detection_method` (text) - "isolation_forest", "anomaly_detection", "pattern_analysis"
  - `risk_level` (text) - "low", "medium", "high"
  - `status` (text) - "pending", "confirmed", "false_positive"
  - `created_at` (timestamptz)

  ### 7. `predictions`
  Financial predictions and forecasts
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `prediction_type` (text) - "expense_forecast", "lstm_prediction", "arima_forecast"
  - `category_id` (uuid, FK to categories, nullable)
  - `predicted_amount` (decimal)
  - `confidence_interval` (jsonb) - {lower, upper}
  - `prediction_date` (date)
  - `model_version` (text)
  - `created_at` (timestamptz)

  ### 8. `spending_patterns`
  Behavior analysis results from clustering
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `pattern_name` (text) - "Weekend Spender", "Impulse Buyer", etc.
  - `characteristics` (jsonb)
  - `identified_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admin policies for system-generated data (categories)

  ## Indexes
  - Fast lookups on user_id for all user-specific tables
  - Date indexes for time-series queries
  - Category indexes for aggregations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table (shared across users)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT 'circle',
  color text DEFAULT '#3B82F6',
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  amount decimal(12, 2) NOT NULL,
  description text,
  transaction_date timestamptz DEFAULT now(),
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'bank_api', 'ocr', 'sms', 'email')),
  merchant text,
  is_recurring boolean DEFAULT false,
  confidence_score decimal(5, 4),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  amount decimal(12, 2) NOT NULL,
  period text DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('overspending', 'fraud', 'budget_threshold', 'unusual_activity')),
  title text NOT NULL,
  message text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read boolean DEFAULT false,
  related_transaction_id uuid REFERENCES transactions(id),
  created_at timestamptz DEFAULT now()
);

-- Create fraud_alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id),
  anomaly_score decimal(5, 4),
  detection_method text DEFAULT 'anomaly_detection',
  risk_level text DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'false_positive')),
  created_at timestamptz DEFAULT now()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_type text NOT NULL CHECK (prediction_type IN ('expense_forecast', 'lstm_prediction', 'arima_forecast')),
  category_id uuid REFERENCES categories(id),
  predicted_amount decimal(12, 2) NOT NULL,
  confidence_interval jsonb,
  prediction_date date NOT NULL,
  model_version text DEFAULT 'v1.0',
  created_at timestamptz DEFAULT now()
);

-- Create spending_patterns table
CREATE TABLE IF NOT EXISTS spending_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_name text NOT NULL,
  characteristics jsonb,
  identified_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for categories (readable by all authenticated users)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for budgets
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for alerts
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for fraud_alerts
CREATE POLICY "Users can view own fraud alerts"
  ON fraud_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own fraud alerts"
  ON fraud_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for predictions
CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for spending_patterns
CREATE POLICY "Users can view own spending patterns"
  ON spending_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, icon, color, type) VALUES
  ('Salary', 'dollar-sign', '#10B981', 'income'),
  ('Investment', 'trending-up', '#059669', 'income'),
  ('Freelance', 'briefcase', '#34D399', 'income'),
  ('Groceries', 'shopping-cart', '#3B82F6', 'expense'),
  ('Utilities', 'zap', '#6366F1', 'expense'),
  ('Transportation', 'car', '#8B5CF6', 'expense'),
  ('Entertainment', 'tv', '#EC4899', 'expense'),
  ('Healthcare', 'heart', '#EF4444', 'expense'),
  ('Shopping', 'shopping-bag', '#F59E0B', 'expense'),
  ('Dining', 'coffee', '#F97316', 'expense'),
  ('Education', 'book', '#14B8A6', 'expense'),
  ('Travel', 'plane', '#06B6D4', 'expense')
ON CONFLICT DO NOTHING;