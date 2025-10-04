import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserPackage, Transaction } from '../lib/supabase';
import { Wallet, Package, Gift, CheckSquare, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activePackages: 0,
    totalEarned: 0,
    referrals: 0,
    tasksCompleted: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activePackages, setActivePackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch active packages
      const { data: packages } = await supabase
        .from('user_packages')
        .select(`
          *,
          packages (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch referrals count
      const { count: referralsCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact' })
        .eq('referrer_id', user.id);

      // Fetch completed tasks count
      const { count: tasksCount } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Calculate total earned
      const totalEarned = transactions?.reduce((sum, t) => {
        if (t.type === 'task_reward' || t.type === 'referral_bonus') {
          return sum + Number(t.amount);
        }
        return sum;
      }, 0) || 0;

      setStats({
        activePackages: packages?.length || 0,
        totalEarned,
        referrals: referralsCount || 0,
        tasksCompleted: tasksCount || 0,
      });

      setRecentTransactions(transactions || []);
      setActivePackages(packages || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return '💳';
      case 'withdrawal': return '💸';
      case 'package_purchase': return '📦';
      case 'task_reward': return '✅';
      case 'referral_bonus': return '🎁';
      default: return '💰';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'text-green-600';
      case 'withdrawal': return 'text-red-600';
      case 'package_purchase': return 'text-blue-600';
      case 'task_reward': return 'text-purple-600';
      case 'referral_bonus': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>


      </div>
      
    );
  }

  return (
    <div className="space-y-6">
      import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function WelcomeHeader({ user }) {
  return (
    <motion.div
      className="text-center py-10 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-2xl shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="flex items-center justify-center gap-2 mb-3"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Sparkles className="w-6 h-6 text-yellow-300" />
        <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">
          Welcome back, {user?.full_name || "Investor"}!
        </h1>
      </motion.div>

      <p className="text-indigo-100 text-lg tracking-wide">
        Here's your <span className="font-semibold text-yellow-200">investment overview</span>
      </p>
    </motion.div>
  );
}

   
<div
  className="h-[50vh] rounded-lg shadow-sm border"
  style={{
    backgroundImage: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTc0czcwYmNmMnptM3pjZnB5M3ZicW5xOGJlN2RpczJudWgzaXBiNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BfFFYPSVYr9UR6EtEL/giphy.gif')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  }}
>
  <div className="p-6 border-b  rounded-t-lg h-full">
    <h3 className="text-lg font-semibold text-gray-900"></h3>
  </div>
</div>



   
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Wallet Balance</p>
              <p className="text-3xl font-bold">${user?.wallet_balance?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Active Packages</p>
              <p className="text-3xl font-bold">{stats.activePackages}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Total Earned</p>
              <p className="text-3xl font-bold">${stats.totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Referrals</p>
              <p className="text-3xl font-bold">{stats.referrals}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        
        {/* Active Packages */}
        <div className="bg-green-500 rounded-lg shadow-sm border">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Active Packages</h3>
          </div>
          <div className="p-6">
            {activePackages.length > 0 ? (
              <div className="space-y-4">
                {activePackages.map((userPackage) => (
                  <div key={userPackage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{userPackage.packages?.name}</h4>
                      <p className="text-sm text-gray-600">
                        Earned: ${userPackage.total_earned.toFixed(2)} | 
                        Tasks Today: {userPackage.tasks_completed_today}/{userPackage.packages?.daily_tasks}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        ${userPackage.packages?.daily_return}/day
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires: {format(new Date(userPackage.expiry_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No active packages</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-green-500 rounded-lg shadow-sm border">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
          </div>
          <div className="p-6">
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTransactionIcon(transaction.type)}</span>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'withdrawal' || transaction.type === 'package_purchase' ? '-' : '+'}
                        ${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
