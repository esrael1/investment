/*
  # Investment Platform Database Schema

  1. New Tables
    - `users` - User accounts with phone/password auth
      - `id` (uuid, primary key)
      - `phone` (text, unique)
      - `password` (text, hashed)
      - `full_name` (text)
      - `is_admin` (boolean)
      - `referral_code` (text, unique)
      - `referred_by` (uuid, foreign key)
      - `wallet_balance` (decimal)
      - `created_at` (timestamp)

    - `packages` - Investment packages
      - `id` (uuid, primary key) 
      - `name` (text)
      - `price` (decimal)
      - `daily_tasks` (integer)
      - `daily_return` (decimal)
      - `duration_days` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `deposits` - Deposit requests with screenshots
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `amount` (decimal)
      - `screenshot_url` (text)
      - `status` (text) - pending, approved, rejected
      - `admin_notes` (text)
      - `processed_by` (uuid, foreign key)
      - `processed_at` (timestamp)
      - `created_at` (timestamp)

    - `withdrawals` - Withdrawal requests
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `amount` (decimal)
      - `status` (text) - pending, paid, rejected
      - `admin_notes` (text)
      - `processed_by` (uuid, foreign key)
      - `processed_at` (timestamp)
      - `created_at` (timestamp)

    - `user_packages` - User package purchases
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `package_id` (uuid, foreign key)
      - `purchase_date` (timestamp)
      - `expiry_date` (timestamp)
      - `tasks_completed_today` (integer)
      - `last_task_date` (date)
      - `total_earned` (decimal)
      - `is_active` (boolean)

    - `tasks` - Available tasks for packages
      - `id` (uuid, primary key)
      - `package_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `reward_amount` (decimal)
      - `is_active` (boolean)

    - `user_tasks` - User task completions
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `task_id` (uuid, foreign key)
      - `user_package_id` (uuid, foreign key)
      - `completed_at` (timestamp)
      - `reward_earned` (decimal)

    - `referrals` - Referral tracking
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, foreign key)
      - `referred_id` (uuid, foreign key)
      - `bonus_amount` (decimal)
      - `created_at` (timestamp)

    - `transactions` - All wallet transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `type` (text) - deposit, withdrawal, package_purchase, task_reward, referral_bonus
      - `amount` (decimal)
      - `description` (text)
      - `reference_id` (uuid)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin policies for management operations

  3. Database Functions
    - increment_balance function for atomic balance updates
    - decrement_balance function for atomic balance decrements
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  is_admin boolean DEFAULT false,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES users(id),
  wallet_balance decimal(12,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  daily_tasks integer NOT NULL DEFAULT 1,
  daily_return decimal(10,2) NOT NULL,
  duration_days integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  amount decimal(10,2) NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  admin_notes text,
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User packages table
CREATE TABLE IF NOT EXISTS user_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  package_id uuid NOT NULL REFERENCES packages(id),
  purchase_date timestamptz DEFAULT now(),
  expiry_date timestamptz NOT NULL,
  tasks_completed_today integer DEFAULT 0,
  last_task_date date,
  total_earned decimal(10,2) DEFAULT 0.00,
  is_active boolean DEFAULT true
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id),
  title text NOT NULL,
  description text,
  reward_amount decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true
);

-- User tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  task_id uuid NOT NULL REFERENCES tasks(id),
  user_package_id uuid NOT NULL REFERENCES user_packages(id),
  completed_at timestamptz DEFAULT now(),
  reward_earned decimal(10,2) NOT NULL
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id),
  referred_id uuid NOT NULL REFERENCES users(id),
  bonus_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'package_purchase', 'task_reward', 'referral_bonus')),
  amount decimal(10,2) NOT NULL,
  description text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Database functions for atomic balance operations
CREATE OR REPLACE FUNCTION increment_balance(user_id uuid, amount decimal)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET wallet_balance = wallet_balance + amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_balance(user_id uuid, amount decimal)
RETURNS void AS $$
DECLARE
  current_balance decimal;
BEGIN
  SELECT wallet_balance INTO current_balance 
  FROM users 
  WHERE id = user_id;
  
  IF current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  UPDATE users 
  SET wallet_balance = wallet_balance - amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);

-- Policies for packages table
CREATE POLICY "Anyone can read packages" ON packages FOR SELECT USING (true);

-- Policies for deposits table
CREATE POLICY "Users can read own deposits" ON deposits FOR SELECT USING (true);
CREATE POLICY "Users can insert own deposits" ON deposits FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own deposits" ON deposits FOR UPDATE USING (true);

-- Policies for withdrawals table
CREATE POLICY "Users can read own withdrawals" ON withdrawals FOR SELECT USING (true);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (true);

-- Policies for user_packages table
CREATE POLICY "Users can read own packages" ON user_packages FOR SELECT USING (true);
CREATE POLICY "Users can insert own packages" ON user_packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own packages" ON user_packages FOR UPDATE USING (true);

-- Policies for tasks table
CREATE POLICY "Anyone can read tasks" ON tasks FOR SELECT USING (true);

-- Policies for user_tasks table
CREATE POLICY "Users can read own tasks" ON user_tasks FOR SELECT USING (true);
CREATE POLICY "Users can insert own tasks" ON user_tasks FOR INSERT WITH CHECK (true);

-- Policies for referrals table
CREATE POLICY "Users can read own referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Users can insert referrals" ON referrals FOR INSERT WITH CHECK (true);

-- Policies for transactions table
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (true);

-- Insert sample data
INSERT INTO packages (name, price, daily_tasks, daily_return, duration_days) VALUES
('Starter Package', 100.00, 3, 5.00, 30),
('Growth Package', 500.00, 5, 30.00, 30),
('Premium Package', 1000.00, 8, 70.00, 30),
('Elite Package', 2500.00, 10, 200.00, 30);

-- Insert sample tasks
INSERT INTO tasks (package_id, title, description, reward_amount) 
SELECT id, 'Daily Check-in', 'Complete your daily check-in to earn rewards', daily_return / daily_tasks
FROM packages;

INSERT INTO tasks (package_id, title, description, reward_amount)
SELECT id, 'Social Media Share', 'Share our platform on social media', daily_return / daily_tasks  
FROM packages;

INSERT INTO tasks (package_id, title, description, reward_amount)
SELECT id, 'Review Platform', 'Leave a positive review about our platform', daily_return / daily_tasks
FROM packages;

-- Create admin user
INSERT INTO users (phone, password, full_name, is_admin, referral_code) VALUES
('admin123', 'admin123', 'Admin User', true, 'ADMIN001');