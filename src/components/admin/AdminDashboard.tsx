import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Users,
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activePackages: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
    todaySignups: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_admin', false);

      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount')
        .eq('status', 'approved');
      const totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('status', 'paid');
      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      const { count: activePackages } = await supabase
        .from('user_packages')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .gte('expiry_date', new Date().toISOString());

      const { count: pendingDeposits } = await supabase
        .from('deposits')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      const { data: purchases } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'package_purchase');
      const totalRevenue = purchases?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const today = new Date().toISOString().split('T')[0];
      const { count: todaySignups } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_admin', false)
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`);

      setStats({
        totalUsers: totalUsers || 0,
        totalDeposits,
        totalWithdrawals,
        activePackages: activePackages || 0,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalRevenue,
        todaySignups: todaySignups || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Deposits', value: `$${stats.totalDeposits.toFixed(2)}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Total Withdrawals', value: `$${stats.totalWithdrawals.toFixed(2)}`, icon: DollarSign, color: 'text-gray-600', bg: 'bg-gray-100' },
    { title: 'Active Packages', value: stats.activePackages, icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Pending Deposits', value: stats.pendingDeposits, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { title: "Today's Signups", value: stats.todaySignups, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of the platform activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white shadow-sm p-5 rounded-lg border">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-5 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-5 space-y-4">
            {stats.pendingDeposits > 0 && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-yellow-800">{stats.pendingDeposits} deposits pending</span>
                </div>
                <button onClick={() => navigate('/admin/deposits')} className="text-yellow-700 font-medium hover:underline">
                  Review →
                </button>
              </div>
            )}

            {stats.pendingWithdrawals > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-red-800">{stats.pendingWithdrawals} withdrawals pending</span>
                </div>
                <button onClick={() => navigate('/admin/withdrawals')} className="text-red-700 font-medium hover:underline">
                  Process →
                </button>
              </div>
            )}

            {/* ✅ Manage Bank Accounts Button */}
            <button
              onClick={() => navigate('/admin/bank-accounts')}
              className="w-full mt-2 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Manage Bank Accounts
            </button>

            {stats.pendingDeposits === 0 && stats.pendingWithdrawals === 0 && (
              <div className="text-center text-gray-500">You're all caught up! 🎉</div>
            )}
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-5 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Platform Health</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">User Growth Today</span>
              <span className="text-green-600 font-medium">+{stats.todaySignups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue vs. Withdrawals</span>
              <span className={`${stats.totalRevenue > stats.totalWithdrawals ? 'text-green-600' : 'text-red-600'} font-medium`}>
                ${(stats.totalRevenue - stats.totalWithdrawals).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Investment Rate</span>
              <span className="text-blue-600 font-medium">
                {stats.totalUsers > 0 ? ((stats.activePackages / stats.totalUsers) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
