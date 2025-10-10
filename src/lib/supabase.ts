import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  phone: string;
  full_name: string;
  is_admin: boolean;
  referral_code: string;
  referred_by?: string;
  wallet_balance: number;
  created_at: string;
}

export interface Package {
  [x: string]: any;
  background_image: any;
  id: string;
  name: string;
  price: number;
  daily_tasks: number;
  daily_return: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  screenshot_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  users?: User;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  users?: User;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  purchase_date: string;
  expiry_date: string;
  tasks_completed_today: number;
  last_task_date?: string;
  total_earned: number;
  is_active: boolean;
  packages?: Package;
}

export interface Task {
  id: string;
  package_id: string;
  title: string;
  description?: string;
  reward_amount: number;
  is_active: boolean;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  user_package_id: string;
  completed_at: string;
  reward_earned: number;
  tasks?: Task;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'package_purchase' | 'task_reward' | 'referral_bonus';
  amount: number;
  description?: string;
  reference_id?: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_amount: number;
  created_at: string;
  users?: User;
}