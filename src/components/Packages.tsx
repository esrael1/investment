import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Package, UserPackage } from '../lib/supabase';
import { Package as PackageIcon, Clock, CheckSquare } from 'lucide-react';

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
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price');
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchUserPackages = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_packages')
        .select(`*, packages (*)`)
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      setUserPackages(data || []);
    } catch (error) {
      console.error('Error fetching user packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (!user || user.wallet_balance < pkg.price) {
      alert('Insufficient balance. Please deposit funds first.');
      return;
    }
    setPurchasing(pkg.id);
    try {
      const { error: balanceError } = await supabase.rpc('decrement_balance', {
        user_id: user.id,
        amount: pkg.price,
      });
      if (balanceError) throw balanceError;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

      const { error: packageError } = await supabase.from('user_packages').insert({
        user_id: user.id,
        package_id: pkg.id,
        expiry_date: expiryDate.toISOString(),
      });
      if (packageError) throw packageError;

      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'package_purchase',
        amount: pkg.price,
        description: `Purchased ${pkg.name}`,
        reference_id: pkg.id,
      });
      if (transactionError) throw transactionError;

      await refreshUser();
      await fetchUserPackages();
      alert('Package purchased successfully!');
    } catch (error) {
      console.error('Error purchasing package:', error);
      alert('Failed to purchase package. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const isPackagePurchased = (packageId: string) => {
    return userPackages.some(up => up.package_id === packageId);
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
          <span className="font-semibold text-indigo-400">Choose a package to start earning daily returns</span>
        </p>
        <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {packages.map(pkg => {
          const isPurchased = isPackagePurchased(pkg.id);
          const canAfford = user && user.wallet_balance >= pkg.price;

          return (
            <div key={pkg.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Background Image */}

               {pkg.background_image && (
                <img
                  src={pkg.background_image}
                  alt="Background"
                  className="w-full h-32 object-cover rounded mb-2"
                />
              {pkg.background_image && (
                <div
                  className="w-full h-32 object-cover rounded-t-lg"
                  style={{
                    backgroundImage: `url(${pkg.background_image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )} 
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <PackageIcon className="h-8 w-8 text-blue-600" />
                  {isPurchased && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Owned
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">{pkg.name}</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Packaged Price</span>
                    <span className="font-semibold text-gray-900">${pkg.price}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Return</span>
                    <span className="font-semibold text-green-600">${pkg.daily_return}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Tasks</span>
                    <div className="flex items-center">
                      <CheckSquare className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="font-semibold text-gray-900">{pkg.daily_tasks}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="font-semibold text-gray-900">{pkg.duration_days} days</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="text-sm text-gray-600">
                    Total Return:{' '}
                    <span className="font-semibold text-green-600">
                      ${(pkg.daily_return * pkg.duration_days).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Profit:{' '}
                    <span className="font-semibold text-green-600">
                      ${(pkg.daily_return * pkg.duration_days - pkg.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isPurchased || !canAfford || purchasing === pkg.id}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    isPurchased
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : canAfford
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-red-100 text-red-600 cursor-not-allowed'
                  }`}
                >
                  {purchasing === pkg.id
                    ? 'Purchasing...'
                    : isPurchased
                    ? 'Already Purchased'
                    : canAfford
                    ? 'Purchase Package'
                    : 'Insufficient Balance'}
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
