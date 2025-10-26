import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, Deposit, Withdrawal, Transaction } from "../lib/supabase";
import { Upload, Download, Plus, Minus, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWithdrawHistoryModal, setWithdrawHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositScreenshot, setDepositScreenshot] = useState<File | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [adminBankAccounts, setAdminBankAccounts] = useState<
    {
      id: number;
      bank_name: string;
      account_number: string;
      account_holder: string;
      branch_name: string | null;
    }[]
  >([]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchAdminBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_bank_accounts")
        .select("*");
      if (error) throw error;
      setAdminBankAccounts(data || []);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    }
  };

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      const { data: depositsData } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      await fetchAdminBankAccounts();

      setDeposits(depositsData || []);
      setWithdrawals(withdrawalsData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositLoading(true);
    try {
      let screenshotUrl = null;
      if (depositScreenshot) {
        screenshotUrl = `screenshot_${Date.now()}.jpg`;
      }
      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: parseFloat(depositAmount),
        screenshot_url: screenshotUrl,
      });
      if (error) throw error;
      setDepositAmount("");
      setDepositScreenshot(null);
      setShowDepositModal(false);
      await fetchWalletData();
      alert(
        "Deposit request submitted successfully! It will be reviewed by an admin."
      );
    } catch (error) {
      console.error("Error submitting deposit:", error);
      alert("Failed to submit deposit request. Please try again.");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return;

    const amount = parseFloat(withdrawAmount);
    if (amount > user.wallet_balance) {
      alert("Insufficient balance");
      return;
    }

    const hasPending = withdrawals.some((w) => w.status === "pending");
    if (hasPending) {
      alert(
        "You already have a pending withdrawal request. Please wait until it is processed."
      );
      return;
    }

    setWithdrawLoading(true);

    try {
      const { error } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: amount,
      });
      if (error) throw error;
      setWithdrawAmount("");
      setShowWithdrawModal(false);
      await fetchWalletData();
      alert(
        "Withdrawal request submitted successfully! A 13% withdrawal fee will be deducted from the total amount.."
      );
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert("Failed to submit withdrawal request. Please try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      paid: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]
          }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "withdrawal":
        return <Minus className="h-4 w-4 text-red-600" />;
      case "package_purchase":
        return <Download className="h-4 w-4 text-blue-600" />;
      case "task_reward":
        return <Plus className="h-4 w-4 text-purple-600" />;
      case "referral_bonus":
        return <Plus className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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
      <div className="flex items-center justify-between">
        <div className="inset-0 relative">
          <div className="absolute z-50 bottom-0 left-center flex space-x-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Withdraw
            </button>
          </div>
          <div className="text-center bg-gradient-to-br from-gray-0 via-gray-900 to-red-0 p-8 rounded-2xl">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Your Wallets
            </h1>
            <p className="mt-3 text-gray-300 text-lg tracking-wide">
              <span className="font-semibold text-indigo-400">
                Manage your deposits, withdrawals, and transactions
              </span>
            </p>
            <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Current Balance</h3>
        <p className="text-3xl font-bold">
          {user?.wallet_balance?.toFixed(2) || "0.00"} ETB
        </p>
        <button
          onClick={() => navigate("/wallet/bank-info")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-gray-100"
        >
          My Bank Info
        </button>
      </div>

      {/* ... the rest of the component remains unchanged ... */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deposits */}
        <div className="bg-gray-200 rounded-lg shadow-sm border">
          <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white-900">
              Recent Deposits
            </h3>
          </div>
          <div className="p-6">
            {deposits.length > 0 ? (
              <div className="space-y-4">
                {deposits.slice(0, 5).map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {deposit.amount.toFixed(2)} ETB
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(deposit.created_at), "MMM dd, HH:mm")}
                      </p>
                    </div>
                    {getStatusBadge(deposit.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No deposits yet</p>
            )}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-gray-200 rounded-lg shadow-sm border">
          <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white-900">
              Recent Withdrawals
            </h3>
            <button
              onClick={() => setWithdrawHistoryModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Detail
            </button>

          </div>
          <div className="p-6">
            {withdrawals.length > 0 ? (
              <div className="space-y-4">
                {withdrawals.slice(0, 5).map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {withdrawal.amount.toFixed(2)} ETB
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(
                          new Date(withdrawal.created_at),
                          "MMM dd, HH:mm"
                        )}
                      </p>
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No withdrawals yet
              </p>
            )}
          </div>
        </div>





        {/* Recent Transactions */}
        <div className="bg-gray-200 rounded-lg shadow-sm border">
          <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white-900">
              Recent Transactions
            </h3>
          </div>
          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {transaction.type.replace("_", " ")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(
                            new Date(transaction.created_at),
                            "MMM dd, HH:mm"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${transaction.type === "withdrawal" ||
                          transaction.type === "package_purchase"
                          ? "text-red-600"
                          : "text-green-600"
                          }`}
                      >
                        {transaction.type === "withdrawal" ||
                          transaction.type === "package_purchase"
                          ? "-"
                          : "+"}
                        {transaction.amount.toFixed(2)} ETB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No transactions yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Make a Deposit
              </h3>
            </div>

            {/* Admin Bank Accounts Section */}
            <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h4 className="text-md font-semibold mb-2 text-gray-700">
                Bank Accounts for Deposit
              </h4>
              {adminBankAccounts.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2 text-gray-800">
                  {adminBankAccounts.map((account) => (
                    <li
                      key={account.id}
                      className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-green-800 font-bold text-lg">
                          {account.bank_name}
                        </h4>
                        <span className="text-xs font-semibold bg-green-200 text-green-800 px-2 py-1 rounded-full">
                          Verified
                        </span>
                      </div>
                      <p className="text-sm">
                        <strong className="text-gray-700">Name:</strong>{" "}
                        <span className="text-gray-900">{account.account_holder}</span>
                      </p>
                      <p className="text-sm mt-1">
                        <strong className="text-gray-700">Account No:</strong>{" "}
                        <span className="text-gray-900">{account.account_number}</span>
                      </p>
                      {account.branch_name && (
                        <p className="text-sm mt-1">
                          <strong className="text-gray-700">Branch:</strong>{" "}
                          <span className="text-gray-900">{account.branch_name}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>

              ) : (
                <p className="text-red-600">
                  No bank account information available.
                </p>
              )}
            </div>


            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  !user ||
                  !depositAmount ||
                  parseFloat(depositAmount) <= 0 ||
                  !depositScreenshot
                ) {
                  alert("Please fill in all fields and upload a screenshot.");
                  return;
                }

                setDepositLoading(true);
                try {
                  // Step 1: Upload screenshot to Supabase Storage
                  const filename = `screenshot_${Date.now()}.${depositScreenshot.name
                    .split(".")
                    .pop()}`;
                  const { error: uploadError } = await supabase.storage
                    .from("screenshots")
                    .upload(filename, depositScreenshot);

                  if (uploadError) throw uploadError;

                  // Step 2: Insert deposit record
                  const { error: insertError } = await supabase
                    .from("deposits")
                    .insert({
                      user_id: user.id,
                      amount: parseFloat(depositAmount),
                      screenshot_url: filename,
                    });

                  if (insertError) throw insertError;

                  // Reset form
                  setDepositAmount("");
                  setDepositScreenshot(null);
                  setShowDepositModal(false);
                  await fetchWalletData();
                  alert(
                    "Deposit request submitted successfully! It will be reviewed by an admin."
                  );
                } catch (error) {
                  console.error("Error submitting deposit:", error);
                  alert("Failed to submit deposit request. Please try again.");
                } finally {
                  setDepositLoading(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount (ETB)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[700, 1500, 3000, 5000, 10000, 20000, 30000, 50000, 100000, 200000, 500000, 1000000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDepositAmount(amount)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border 
                      ${depositAmount === amount
                          ? "bg-blue-600 text-white border-blue-700 shadow-md"
                          : "bg-green-100 hover:bg-blue-100 border-gray-300 text-gray-700"
                        }`}
                    >
                      {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 text-green-900  border border-green-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter custom amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Screenshot <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDepositScreenshot(file);
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      const previewImg = document.getElementById("imagePreview") as HTMLImageElement;
                      if (previewImg) previewImg.src = previewUrl;
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-green-900"
                />
                <img
                  id="imagePreview"
                  alt="Preview"
                  className="mt-3 w-full max-w-xs rounded-lg border border-gray-300 shadow-md hidden"
                  onLoad={(e) => e.currentTarget.classList.remove("hidden")}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {depositLoading ? "Submitting..." : "Submit Deposit"}
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  Please complete your payment and upload a clear screenshot of
                  the transaction as proof of deposit. Once your payment has
                  been submitted, our admin team will carefully review and
                  verify the details. After successful verification, your
                  deposit will be approved and reflected in your account
                  balance.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Request Withdrawal
              </h3>
            </div>
            <form onSubmit={handleWithdraw} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount (ETB)
                </label>
                <input
                  type="number"
                  min="100"
                  max={user?.wallet_balance || 0}
                  step="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 text-green-900  border border-green-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-sm text-yellow-800">
                  Available balance: {user?.wallet_balance?.toFixed(2)} ETB
                  <br />
                  For your security, each withdrawal request undergoes a
                  short verification process. A 13% fee will be deducted, and
                  your funds will be sent to your verified payment method after
                  approval. Any types of cheating activity leads to Acount bane!!!{" "}
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {withdrawLoading ? "Submitting..." : "Submit Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Withdrawal History Modal */}
      {showWithdrawHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-100 animate-fadeIn">

            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2">
                💸 Withdrawal History
              </h2>
              <button
                onClick={() => setWithdrawHistoryModal(false)}
                className="text-white bg-white/20 hover:bg-white/30 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Available Balance */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200 px-6 py-4 flex justify-between items-center">
              <p className="text-yellow-800 font-medium">
                Available Balance:{" "}
                <span className="font-bold text-yellow-900">
                  {user?.wallet_balance?.toFixed(2)} ETB
                </span>
              </p>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                Active Wallet
              </span>
            </div>

            {/* Scrollable List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {withdrawals.length > 0 ? (
                <div className="space-y-5">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          Asked:{" "}
                          <span className="text-gray-900">
                            {withdrawal.amount.toFixed(2)} ETB
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Paid:{" "}
                          <span className="font-semibold text-green-600">
                            {(withdrawal.amount - withdrawal.amount * 0.13).toFixed(2)} ETB
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(withdrawal.created_at), "MMM dd, yyyy • HH:mm")}
                        </p>
                      </div>

                      {/* Smart Status Badge */}
                      <div className="flex items-center gap-2">
                        {withdrawal.status === "paid" ? (
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full border border-green-200 shadow-sm">
                            ✅ Successful
                          </span>
                        ) : withdrawal.status === "pending" ? (
                          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-sm font-medium px-3 py-1 rounded-full border border-yellow-200 shadow-sm animate-pulse">
                            ⏳ Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full border border-red-200 shadow-sm">
                            ❌ Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 italic">
                  No withdrawal history yet 🚫
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="bg-green-50 border-t border-green-100 text-center py-3 px-6 rounded-b-2xl">
              <p className="text-green-700 font-semibold text-sm">
                ✅ All successful withdrawals are processed securely and verified in real-time.
              </p>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
