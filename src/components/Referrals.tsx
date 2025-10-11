import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Referral, User } from '../lib/supabase';
import { Gift, Copy, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<(Referral & { users: User; bonus_amount: number })[]>([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalBonus: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Step 1: Get all referrals made by this user
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          users!referrals_referred_id_fkey (id, full_name)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Step 2: For each referred user, get all their purchases
      const updatedReferrals = await Promise.all(
        (referralsData || []).map(async (ref) => {
          const { data: purchases, error: purchasesError } = await supabase
            .from('purchases')
            .select('package_price')
            .eq('user_id', ref.referred_id);

          if (purchasesError) throw purchasesError;

          const totalPurchases = purchases?.reduce(
            (sum, p) => sum + Number(p.package_price || 0),
            0
          ) || 0;

          const bonus_amount = totalPurchases * 0.1; // ✅ 10% of every purchase

          return { ...ref, bonus_amount };
        })
      );

      const totalReferrals = updatedReferrals.length;
      const totalBonus = updatedReferrals.reduce((sum, r) => sum + r.bonus_amount, 0) || 0;

      setReferrals(updatedReferrals);
      setStats({ totalReferrals, totalBonus });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!user?.referral_code) return;
    const referralLink = `${window.location.origin}/register?ref=${user.referral_code}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyReferralCode = async () => {
    if (!user?.referral_code) return;
    try {
      await navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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
      {/* Header */}
      <div className="text-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-8 rounded-2xl">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Referral Program
        </h1>
        <p className="mt-3 text-gray-300 text-lg tracking-wide">
          <span className="font-semibold text-indigo-400">
            Invite friends and earn 10% from every package they purchase
          </span>
        </p>
        <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Total Referrals</p>
              <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Total Earnings</p>
              <p className="text-2xl font-bold">{stats.totalBonus.toFixed(2)} ETB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Your Referral Tools</h3>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Referral Code</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={user?.referral_code || ''}
                readOnly
                className="flex-1 px-3 py-2 rounded-md bg-blue-500"
              />
              <button
                onClick={copyReferralCode}
                className="px-4 py-2 bg-blue-600 rounded-md"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Referral Link</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={`${window.location.origin}/register?ref=${user?.referral_code || ''}`}
                readOnly
                className="flex-1 px-3 py-2 rounded-md bg-blue-500"
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-green-600 rounded-md"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Referral History</h3>
        {referrals.length > 0 ? (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <Gift className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="font-medium text-black">
                      {referral.users.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Joined {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    +{referral.bonus_amount.toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-gray-500">Bonus earned</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p>No referrals yet. Start sharing your link!</p>
          </div>
        )}
      </div>
    </div>
  );
}
