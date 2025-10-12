import React, { useEffect, useState } from 'react';  
import { useAuth } from '../contexts/AuthContext';
import { supabase, Referral, User } from '../lib/supabase';
import { Gift, Copy, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<(Referral & { users: User })[]>([]);
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

    try {
      // Fetch referrals made by this user
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          *,
          users!referrals_referred_id_fkey (*)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      // Calculate stats
      const totalReferrals = referralsData?.length || 0;
      const totalBonus = referralsData?.reduce((sum, ref) => sum + Number(ref.bonus_amount), 0) || 0;

      setReferrals(referralsData || []);
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
      <div className="text-center bg-gradient-to-br from-gray-0 via-gray-900 to-red-0 p-8 rounded-2xl">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Referral Program
        </h1>
        <p className="mt-3 text-gray-300 text-lg tracking-wide">
          <span className="font-semibold text-indigo-400">Invite friends and earn 100 Birr for each successful referral</span>
        </p>
        <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Total Referrals</p>
              <p className="text-2xl font-bold text-white-900">{stats.totalReferrals}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-lg font-medium mb-2">Total Earnings</p>
              <p className="text-2xl font-bold text-white-900">{stats.totalBonus.toFixed(2)} ETB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Tools */}
      <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium mb-2">Your Referral Tools</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={user?.referral_code || ''}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-cyan-500"
              />
              <button
                onClick={copyReferralCode}
                className="flex items-center px-4 py-2 bg-cyan-300 text-white rounded-md hover:bg-blue-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${window.location.origin}/register?ref=${user?.referral_code || ''}`}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-cyan-300"
              />
              <button
                onClick={copyReferralLink}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share your referral code or link with friends</li>
              <li>• They sign up using your referral code</li>
              <li>• When they purchase their first package, you earn 10 %</li>
              <li>• There's no limit to how many people you can refer!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-gradient-to-r from-red-400 to-blue-400 text-white p-6 rounded-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium mb-2">Referral History</h3>
        </div>
        <div className="p-6">
          {referrals.length > 0 ? (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Gift className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="font-medium text-cyan-900">{referral.users.full_name}</p>
                      <p className="text-sm text-white-600">
                        Joined on {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+{referral.bonus_amount.toFixed(2)} ETB</p>
                    <p className="text-sm text-white-500">Bonus earned</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-white-500">No referrals yet. Start sharing your code to earn bonuses!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
