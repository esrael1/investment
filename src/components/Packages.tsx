import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, Package, UserPackage } from "../lib/supabase";
import { Package as PackageIcon, Clock, CheckSquare } from "lucide-react";

export default function Packages() {
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
    if (user) fetchUserPackages();
  }, [user]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("price");
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const fetchUserPackages = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_packages")
        .select(`*, packages (*)`)
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (error) throw error;
      setUserPackages(data || []);
    } catch (error) {
      console.error("Error fetching user packages:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ New: Reward referrer with 10% bonus on every purchase
  const rewardReferrerForPurchase = async (purchasingUserId, packagePrice) => {
    try {
      // Check if user was referred
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("id, referrer_id, bonus_amount")
        .eq("referred_id", purchasingUserId)
        .single();

      if (referralError || !referralData) {
        console.log("No referrer found, skipping referral reward.");
        return;
      }

      const { referrer_id, bonus_amount } = referralData;
      const bonus = Number(packagePrice) * 0.1; // 10% bonus

      // Update total bonus for this referral
      const { error: updateError } = await supabase
        .from("referrals")
        .update({
          bonus_amount: (Number(bonus_amount) || 0) + bonus,
        })
        .eq("referred_id", purchasingUserId);

      if (updateError) throw updateError;

      // Optionally add referral earning history (recommended)
      await supabase.from("referral_earnings").insert([
        {
          referrer_id,
          referred_id: purchasingUserId,
          amount: bonus,
          package_price: packagePrice,
          created_at: new Date(),
        },
      ]);

      console.log(`Referral bonus of ${bonus} ETB credited to referrer ${referrer_id}`);
    } catch (error) {
      console.error("Error rewarding referrer:", error);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (!user || user.wallet_balance < pkg.price) {
      alert("Insufficient balance. Please deposit funds first.");
      return;
    }
    setPurchasing(pkg.id);
    try {
      // Deduct balance
      const { error: balanceError } = await supabase.rpc("decrement_balance", {
        user_id: user.id,
        amount: pkg.price,
      });
      if (balanceError) throw balanceError;

      // Add package to user_packages
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

      const { error: packageError } = await supabase
        .from("user_packages")
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          expiry_date: expiryDate.toISOString(),
        });
      if (packageError) throw packageError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "package_purchase",
          amount: pkg.price,
          description: `Purchased ${pkg.name}`,
          reference_id: pkg.id,
        });
      if (transactionError) throw transactionError;

      // ✅ Reward referrer after purchase
      await rewardReferrerForPurchase(user.id, pkg.price);

      await refreshUser();
      await fetchUserPackages();
      alert("Package purchased successfully!");
    } catch (error) {
      console.error("Error purchasing package:", error);
      alert("Failed to purchase package. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const isPackagePurchased = (packageId: string) => {
    return userPackages.some((up) => up.package_id === packageId);
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
      <div className="text-center bg-gradient-to-br from-gray-0 via-gray-900 to-red-0 p-8 rounded-2xl">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Investment Packages
        </h1>
        <p className="mt-3 text-gray-300 text-lg tracking-wide">
          <span className="font-semibold text-indigo-400">
            Choose a package to start earning daily returns
          </span>
        </p>
        <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
      </div>

      {/* package list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {packages.map((pkg) => {
          const isPurchased = isPackagePurchased(pkg.id);
          const canAfford = user && user.wallet_balance >= pkg.price;

          return (
            <div
              key={pkg.id}
              className="group relative bg-gradient-to-b from-gray-100 to-cyan-400 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div
                className="relative w-full h-40 bg-cover bg-center"
                style={{
                  backgroundImage: pkg.background_image
                    ? `url("${pkg.background_image}")`
                    : `linear-gradient(to right, #ce1c1cf3, #003cb3f1)`,
                }}
              >
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="backdrop-blur-sm bg-purple/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 transition-all duration-300 shadow-md">
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide drop-shadow-sm animate-glow">
                      {pkg.name}
                    </h3>
                    <p className="text-blue-900 text-xs mt-0.5">
                      Price{" "}
                      <span className="text-blue-900 font-medium">
                        {pkg.price}: ETB
                      </span>
                    </p>
                  </div>

                  {isPurchased && (
                    <span className="px-1 py-1 bg-green-500/90 text-white text-xs font-semibold rounded-full shadow-md">
                      Owned
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Daily Return:</span>
                  </div>
                  <span className="text-green-600 font-semibold">
                    ${pkg.daily_return}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Tasks:</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {pkg.daily_tasks}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Duration:</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {pkg.duration_days} days
                  </span>
                </div>

                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Return</span>
                    <span className="font-semibold text-green-600">
                      ${(pkg.daily_return * pkg.duration_days).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit</span>
                    <span className="font-semibold text-green-600">
                      $
                      {(
                        pkg.daily_return * pkg.duration_days -
                        pkg.price
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isPurchased || !canAfford || purchasing === pkg.id}
                  className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    isPurchased
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : canAfford
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
                      : "bg-red-100 text-red-600 cursor-not-allowed"
                  }`}
                >
                  {purchasing === pkg.id
                    ? "Purchasing..."
                    : isPurchased
                    ? "Already Purchased"
                    : canAfford
                    ? "Purchase Package"
                    : "Insufficient Balance"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-12">
          <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No packages available at the moment</p>
        </div>
      )}
    </div>
  );
}
