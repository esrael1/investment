import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, UserPackage, Transaction } from "../lib/supabase";
import { Wallet, Package, Gift, CheckSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Shield, Lock, FileText } from "lucide-react";

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
  const [popupOpen, setPopupOpen] = useState(true); // <-- Popup state

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
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
    <div className="space-y-6 relative">
      
     {/* Advanced Telegram Popup */}
{popupOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black opacity-60"
      onClick={() => setPopupOpen(false)}
    ></div>

    {/* Modal Box */}
    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-2xl p-8 max-w-lg w-full z-50 transform transition-transform duration-300 scale-95 animate-scaleIn">
      {/* Close Button */}
      <button
        className="absolute top-3 right-3 text-red hover:text-red-900 text-xl font-bold"
        onClick={() => setPopupOpen(false)}
      >
        ✖
      </button>

      {/* Content */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-extrabold">
          Join our Telegram Community!
        </h2>
        <p className="text-md">
          Stay updated, get tips, and connect with other members instantly.
        </p>
        <button
          onClick={() => window.open("https://t.me/+1KHuCJYmnZZhYTc0", "_blank")}
          className="mt-4 inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Join Telegram
        </button>
        <button
          onClick={() => window.open("https://t.me/EnviroScan_AI", "_blank")}
          className="mt-4 inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Subscribe Telegram Channel
        </button>
        <p className="text-sm text-gray-200 mt-2">
          Or click ✖ to close
        </p>
      </div>
    </div>

    {/* Tailwind Animations */}
    <style>
      {`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        .animate-scaleIn { animation: scaleIn 0.4s ease-out; }

      `}
    </style>
  </div>
)}


      {/* Hero Section */}
      <div className="relative w-screen h-[600px] overflow-hidden">
        <div className="absolute z-20 inset-0 pointer-events-none">
          <div className="text-center bg-gradient-to-br from-gray-0 via-gray-900 to-red-0 p-8 rounded-2xl">
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-yellow-900 via-blue-700 to-red-400 bg-clip-text text-transparent shadow-md">
              Train AI - Earn more.
            </h1>
            <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
          </div>
        </div>
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
              th, td, .caveat-text {
                font-family: 'oswald';
                letter-spacing: -0.02em;
                font-stretch: extra-condensed; /* or semi-condensed, extra-condensed */
              }
          `}
        </style>
      </div>




<table className="table-auto w-full text-center border-[3px] border-yellow-400 rounded-xl font-[Caveat_Brush] overflow-hidden">
  <thead className="bg-gradient-to-r from-purple-500 to-blue-500 text-yellow-400 text-lg">
    <tr>
      
    <th className="border-[2px] border-yellow-400 py-2 rounded-tl-xl">
      <span className="block origin-bottom-left rotate-[-95deg] translate-y-2">Package</span>
    </th>
    <th className="border-[2px] border-yellow-400 py-2">
      <span className="block origin-bottom-left rotate-[-95deg] translate-y-2">Invest (ETB)</span>
    </th>
    <th className="border-[2px] border-yellow-400 py-2">
      <span className="block origin-bottom-left rotate-[-95deg] translate-y-2">Daily Income (ETB)</span>
    </th>
    <th className="border-[2px] border-yellow-400 py-2">
      <span className="block origin-bottom-left rotate-[-45deg] translate-y-2">Period</span>
    </th>
    <th className="border-[2px] border-yellow-400 py-2 rounded-tr-xl">
      <span className="block origin-bottom-left rotate-[-45deg] translate-y-2">Total Income (ETB)</span>
    </th>
</tr>
  </thead>
  <tbody>
    {[
      { name: "Bronze Package", invest: 500, daily: 100, period: "60 days", total: 3000 },
      { name: "Silver Package", invest: 2000, daily: 500, period: "60 days", total: 15000 },
      { name: "Gold Package", invest: 6000, daily: 1700, period: "60 days", total: 51000 },
      { name: "Platinum Package", invest: 15000, daily: 5000, period: "60 days", total: 150000 },
      { name: "Diamond Package", invest: 40000, daily: 15000, period: "60 days", total: 450000 },
      { name: "VIP Package", invest: 80000, daily: 32000, period: "60 days", total: 960000 },
    ].map((pkg, idx) => (
      <tr
        key={pkg.name}
        className={`${
          idx % 2 === 0 ? "bg-gradient-to-r from-purple-100 to-blue-100" : "bg-gradient-to-r from-purple-200 to-blue-200"
        }`}
      >
        <td className="border-[2px] border-yellow-400  py-2">{pkg.name}</td>
        <td className="border-[2px] border-yellow-400  py-2">{pkg.invest}</td>
        <td className="border-[2px] border-yellow-400  py-2">{pkg.daily}</td>
        <td className="border-[2px] border-yellow-400  py-2">{pkg.period}</td>
        <td className="border-[2px] border-yellow-400  py-2 font-bold text-red-600">{pkg.total.toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
</table>






<div className="max-w-5xl mx-auto px-6 py-12 bg-cyan-100  rounded-3xl shadow-lg border border-gray-100 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">
          Privacy Policy & Platform Rules
        </h1>
      </div>

      <div className="space-y-8 text-gray-700 leading-relaxed text-justify">
        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">1. Introduction</h2>
          <p>
            EnviroScan AI is committed to protecting your privacy and ensuring
            that your personal data and contributions are handled securely and
            transparently. This document explains how we collect, use, and
            protect your data, as well as the rules all users must follow when
            participating in our AI training platform.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">2. Purpose of Data Collection</h2>
          <p>
            The primary purpose of EnviroScan AI is to gather authentic environmental image and video
            data from users worldwide. These contributions are used to train
            artificial intelligence systems that can recognize real-world
            environments, objects, and human activities more accurately and ethically.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">3. User Consent</h2>
          <p>
            By registering and using the platform, you agree to our terms, rules, and privacy
            practices. You consent to the collection and processing of your personal information
            and the images or videos you upload, which are used strictly for AI training and research
            purposes.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">4. Personal Data We Collect</h2>
          <p>
            We collect basic personal data such as your full name, email address, profile photo
            (optional), and wallet or payment information for withdrawals. Additionally, we store
            your uploaded environmental images, descriptions, and other task-related data that
            contribute to AI learning.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">5. Image and Video Data Usage</h2>
          <p>
            Every image or video uploaded to EnviroScan AI becomes part of our training dataset. This
            data may be processed by AI algorithms, securely stored in cloud infrastructure, and used
            for research, model improvement, or academic collaboration — always in compliance with
            privacy standards.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">6. Ownership and Rights</h2>
          <p>
            While you retain ownership of your original media, by uploading content to EnviroScan AI
            you grant us a non-exclusive, royalty-free license to use, process, and analyze your data
            for AI training and model development purposes. Your content will never be sold or shared
            with third parties for unrelated commercial use.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">7. Data Storage and Security</h2>
          <p>
            All user data is stored securely using encrypted databases and protected server
            infrastructure. We employ modern cybersecurity measures such as SSL encryption,
            token-based authentication, and periodic security audits to prevent unauthorized access
            or misuse of data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">8. User Identity Protection</h2>
          <p>
            EnviroScan AI never publicly displays your personal identity alongside your uploaded
            data. All visual and textual submissions are anonymized before being used in AI model
            training. Your name, email, and wallet details remain private and inaccessible to
            external parties.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">9. Image Capture Guidelines</h2>
          <p>
            Users must capture or upload images that represent their natural environment — such as
            landscapes, buildings, roads, trees, or other non-sensitive areas. Uploading private
            individuals, personal documents, or restricted government areas is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">10. Ethical and Legal Responsibilities</h2>
          <p>
            All users must comply with local laws when capturing images. It is your responsibility to
            ensure that no copyright, privacy, or security regulations are violated. EnviroScan AI
            will not be responsible for any unlawful content uploaded by users.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">11. Content Moderation</h2>
          <p>
            To maintain high-quality data for AI training, all submissions go through automated and
            manual review. Content that is inappropriate, fake, AI-generated, or irrelevant to
            environmental learning may be rejected. Repeated violations can result in suspension or
            account termination.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">12. Earning Rules</h2>
          <p>
            Users earn rewards based on their active training package and the number of approved
            image submissions. Each valid contribution is reviewed before reward approval. Fraudulent,
            repetitive, or low-quality submissions may lead to deductions or account penalties.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">13. Withdrawal and Financial Policy</h2>
          <p>
            Users can withdraw their earnings once they meet the platform’s minimum threshold.
            EnviroScan AI processes payments through secure channels. However, users are responsible
            for providing correct wallet or bank details to avoid transaction failures.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">14. Account Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials.
            EnviroScan AI will never ask for your password or payment PIN. Any suspicious activity
            should be reported immediately to the platform’s support team for investigation.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">15. Data Retention Period</h2>
          <p>
            We retain your uploaded data for as long as it is necessary for AI model development and
            system training. If you decide to delete your account, we will anonymize or permanently
            remove your personal information from our servers within a defined time frame.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">16. User Rights</h2>
          <p>
            You have full rights to access, correct, or delete your personal information at any time.
            Requests related to data removal or modification can be made directly through your account
            settings or by contacting our support center.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">17. Age Requirement</h2>
          <p>
            EnviroScan AI is open to individuals aged 18 years or older. Users under this age must
            obtain consent from a legal guardian before participating. This ensures ethical and safe
            participation in our AI training ecosystem.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">18. Prohibited Actions</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI-generated or manipulated media.</li>
            <li>Content with violent, offensive, or sexual themes.</li>
            <li>Duplicated submissions or spam.</li>
            <li>Images violating privacy or copyright laws.</li>
          </ul>
          <p className="mt-2">Violators may face temporary suspension or permanent banning.</p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">19. Platform Integrity</h2>
          <p>
            To maintain fairness, EnviroScan AI reserves the right to audit user activities, track
            submission patterns, and enforce disciplinary actions when rules are violated. Automated
            monitoring ensures transparent reward distribution and system integrity.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-gray-900 mb-2">20. Future Policy Updates</h2>
          <p>
            EnviroScan AI may update these privacy rules as our technology evolves. Any major changes
            will be communicated to users through email or Telegram announcements. Continued use of
            the platform signifies your acceptance of the revised terms.
          </p>
        </section>
      </div>

      <div className="mt-10 text-center border-t pt-6 text-gray-600 text-sm">
        <Lock className="inline-block w-5 h-5 mr-1 text-blue-500" />
        <span>EnviroScan AI © {new Date().getFullYear()} – All Rights Reserved.</span>
        {/* add telegram link */}
        <span> <a href="https://t.me/EnviroScan_AI">Subscribe on telegram</a></span>
      </div>
    </div>








      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="mb-12 bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Wallet Balance</p>
              <p className="text-3xl font-bold">
                {user?.wallet_balance?.toFixed(2) || "0.00"} ETB
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg mb-8">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Total Earned</p>
              <p className="text-3xl font-bold">
                {stats.totalEarned.toFixed(2)} ETB
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg mb-8">
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-yellow-700" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Referrals</p>
              <p className="text-3xl font-bold">{stats.referrals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Packages & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active Packages */}
        <div className="bg-green-200 rounded-lg shadow-sm border mb-8">
          <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
            <h3 className="text-lg font-large mb-2">Active Packages</h3>
            <span className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-medium shadow">
              {activePackages.length} Active
            </span>
          </div>
          <div className="p-6">
            {activePackages.length > 0 ? (
              <div className="space-y-4">
                {activePackages.map((userPackage) => (
                  <div
                    key={userPackage.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {userPackage.packages?.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Earned: {userPackage.total_earned.toFixed(2)} ETB | Tasks Today:{" "}
                        {userPackage.tasks_completed_today}/{userPackage.packages?.daily_tasks}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {userPackage.packages?.daily_return} ETB/day
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires: {format(new Date(userPackage.expiry_date), "MMM dd, yyyy")}
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

        {/* Recent Transactions
        <div className="bg-green-200 rounded-lg shadow-sm border mb-8">
          <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
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
                          {transaction.type.replace("_", " ")}
                        </p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === "withdrawal" || transaction.type === "package_purchase"
                          ? "-"
                          : "+"}
                        {transaction.amount.toFixed(2)} ETB
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.created_at), "MMM dd, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions yet</p>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
