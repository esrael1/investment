import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, UserPackage, Transaction } from "../lib/supabase";
import { Wallet, Gift, TrendingUp, Shield, Lock } from "lucide-react";
import { format } from "date-fns";

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
  const [popupOpen, setPopupOpen] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: packages } = await supabase
        .from("user_packages")
        .select("*, packages (*)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const { count: referralsCount } = await supabase
        .from("referrals")
        .select("*", { count: "exact" })
        .eq("referrer_id", user.id);

      const { count: tasksCount } = await supabase
        .from("user_tasks")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      const totalEarned =
        transactions?.reduce((sum, t) => {
          if (t.type === "task_reward" || t.type === "referral_bonus") return sum + Number(t.amount);
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
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    const icons: Record<string, string> = {
      deposit: "💳",
      withdrawal: "💸",
      package_purchase: "📦",
      task_reward: "✅",
      referral_bonus: "🎁",
    };
    return icons[type] || "💰";
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    const colors: Record<string, string> = {
      deposit: "text-green-600",
      withdrawal: "text-red-600",
      package_purchase: "text-blue-600",
      task_reward: "text-purple-600",
      referral_bonus: "text-yellow-600",
    };
    return colors[type] || "text-gray-600";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="space-y-6 relative">

      {/* Telegram Popup */}
      {popupOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-black opacity-60" onClick={() => setPopupOpen(false)}></div>
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-2xl p-8 max-w-lg w-full z-50 transform transition-transform duration-300 scale-95 animate-scaleIn">
            <button className="absolute top-3 right-3 text-xl font-bold hover:text-red-900" onClick={() => setPopupOpen(false)}>✖</button>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-extrabold">Join our Telegram Community!</h2>
              <p>Stay updated, get tips, and connect with other members instantly.</p>
              <div className="space-x-2">
                <button onClick={() => window.open("https://t.me/+1KHuCJYmnZZhYTc0", "_blank")} className="inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">Join Telegram</button>
                <button onClick={() => window.open("https://t.me/EnviroScan_AI", "_blank")} className="inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">Subscribe Channel</button>
              </div>
              <p className="text-sm text-gray-200 mt-2">Or click ✖ to close</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Wallet Balance</p>
              <p className="text-3xl font-bold">{user?.wallet_balance?.toFixed(2) || "0.00"} ETB</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Total Earned</p>
              <p className="text-3xl font-bold">{stats.totalEarned.toFixed(2)} ETB</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-yellow-700" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Referrals</p>
              <p className="text-3xl font-bold">{stats.referrals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-200 rounded-lg shadow-sm border">
          <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-medium">Active Packages</h3>
            <span className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-medium shadow">{activePackages.length} Active</span>
          </div>
          <div className="p-6 space-y-4">
            {activePackages.length > 0 ? (
              activePackages.map((userPackage) => (
                <div key={userPackage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{userPackage.packages?.name}</h4>
                    <p className="text-sm text-gray-600">
                      Earned: {userPackage.total_earned.toFixed(2)} ETB | Tasks Today: {userPackage.tasks_completed_today}/{userPackage.packages?.daily_tasks}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{userPackage.packages?.daily_return} ETB/day</p>
                    <p className="text-xs text-gray-500">Expires: {format(new Date(userPackage.expiry_date), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No active packages</p>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Policy Section */}
      <div className="max-w-5xl mx-auto px-6 py-12 bg-cyan-100 rounded-3xl shadow-lg border border-gray-100 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy & Platform Rules</h1>
        </div>
        <div className="space-y-8 text-gray-700 leading-relaxed text-justify">
          {/* You can map sections here if you want to clean up further */}
        </div>
        <div className="mt-10 text-center border-t pt-6 text-gray-600 text-sm">
          <Lock className="inline-block w-5 h-5 mr-1 text-blue-500" />
          <span>EnviroScan AI © {new Date().getFullYear()} – All Rights Reserved. </span>
          <span><a href="https://t.me/EnviroScan_AI" className="text-blue-500 underline">Subscribe on Telegram</a></span>
        </div>
      </div>

    </div>
  );
}
