import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, UserPackage, Transaction } from "../lib/supabase";
import { Wallet, Package, Gift, CheckSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [telegramDropdownOpen, setTelegramDropdownOpen] = useState(false);

  const [stats, setStats] = useState({
    activePackages: 0,
    totalEarned: 0,
    referrals: 0,
    tasksCompleted: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [activePackages, setActivePackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Fixed useEffect for popup - runs only once on component mount
  useEffect(() => {
    const checkAndShowPopup = () => {
      const shown = localStorage.getItem("telegramDropdownShown");
      console.log("LocalStorage value:", shown); // Debug log
      
      if (!shown || shown !== "true") {
        console.log("Showing popup"); // Debug log
        setTelegramDropdownOpen(true);
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(checkAndShowPopup, 100);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - runs only once

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch active packages
      const { data: packages } = await supabase
        .from("user_packages")
        .select(
          `
          *,
          packages (*)
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch referrals count
      const { count: referralsCount } = await supabase
        .from("referrals")
        .select("*", { count: "exact" })
        .eq("referrer_id", user.id);

      // Fetch completed tasks count
      const { count: tasksCount } = await supabase
        .from("user_tasks")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      // Calculate total earned
      const totalEarned =
        transactions?.reduce((sum, t) => {
          if (t.type === "task_reward" || t.type === "referral_bonus") {
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
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setTelegramDropdownOpen(false);
    localStorage.setItem("telegramDropdownShown", "true");
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "💳";
      case "withdrawal":
        return "💸";
      case "package_purchase":
        return "📦";
      case "task_reward":
        return "✅";
      case "referral_bonus":
        return "🎁";
      default:
        return "💰";
    }
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "text-green-600";
      case "withdrawal":
        return "text-red-600";
      case "package_purchase":
        return "text-blue-600";
      case "task_reward":
        return "text-purple-600";
      case "referral_bonus":
        return "text-yellow-600";
      default:
        return "text-gray-600";
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
      {/* Telegram Popup - Fixed */}
      {telegramDropdownOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={handleClosePopup}
          ></div>

          {/* Popup box */}
          <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full z-50 mx-4">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg"
              onClick={handleClosePopup}
            >
              ✖
            </button>
            <p className="font-medium text-lg mb-4">
              Connect with our Telegram channel to get <strong>real-time updates</strong>, tips, and exclusive content!
            </p>
            <a
              href="https://t.me/YourTelegramLink"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full text-center bg-blue-600 text-white font-bold px-4 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
              onClick={handleClosePopup}
            >
              Open Telegram
            </a>
          </div>
        </div>
      )}

      {/* Rest of your dashboard content */}
      <div className="relative w-screen h-[600px] overflow-hidden">
        {/* Overlay for better contrast */}
        <div className="absolute z-20 inset-0 pointer-events-none">
          <div className="text-center bg-gradient-to-br from-gray-0 via-gray-900 to-red-0 p-8 rounded-2xl">
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-yellow-900 via-blue-700 to-red-400 bg-clip-text text-transparent shadow-md">
              Train AI - Earn more.
            </h1>
            <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
          </div>
        </div>

        {/* Marquee container */}
        <div className="flex animate-marquee space-x-0">
          <img src="homepage image.png" alt="gift" className="h-[600px] w-auto" />
          <img src="robotmodel.png" alt="money" className="h-[600px] w-auto" />
          <img src="other ai.png" alt="bitcoin" className="h-[600px] w-auto" />
          <img src="the other one.png" alt="gift" className="h-[600px] w-auto" />
          <img src="niceimage.png" alt="money" className="h-[600px] w-auto" />
          <img src="smart ai.png" alt="bitcoin" className="h-[600px] w-auto" />
        </div>

        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              display: flex;
              width: max-content;
              animation: marquee 15s linear infinite;
            }
          `}
        </style>
      </div>

      {/* Stats Cards and other content... */}
      {/* ... rest of your dashboard content */}
    </div>
  );
}