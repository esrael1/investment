import React, { useEffect, useState } from 'react'; 
import { useAuth } from '../contexts/AuthContext';
import { supabase, Package, UserPackage } from '../lib/supabase';
import { Package as PackageIcon, Clock, DollarSign, CheckSquare } from 'lucide-react';

export default function Packages() {
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // New state for admin package creation
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState(0);
  const [newDailyTasks, setNewDailyTasks] = useState(0);
  const [newDailyReturn, setNewDailyReturn] = useState(0);
  const [newDuration, setNewDuration] = useState(0);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [creatingPackage, setCreatingPackage] = useState(false);

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
        amount: pkg.price
      });
      if (balanceError) throw balanceError;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

      const { error: packageError } = await supabase
        .from('user_packages')
        .insert({ user_id: user.id, package_id: pkg.id, expiry_date: expiryDate.toISOString() });
      if (packageError) throw packageError;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({ user_id: user.id, type: 'package_purchase', amount: pkg.price, description: `Purchased ${pkg.name}`, reference_id: pkg.id });
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

  const handleBgImageUpload = async (): Promise<string | null> => {
    if (!bgImageFile) return null;

    const fileExt = bgImageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `package-backgrounds/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('package-images')
      .upload(filePath, bgImageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      alert('Failed to upload background image.');
      return null;
    }

    const { data } = supabase.storage.from('package-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreatePackage = async () => {
    if (!newPackageName || newPackagePrice <= 0) {
      alert('Please fill in all required fields.');
      return;
    }
    setCreatingPackage(true);
    try {
      const bgImageUrl = await handleBgImageUpload();

      const { error } = await supabase.from('packages').insert({
        name: newPackageName,
        price: newPackagePrice,
        daily_tasks: newDailyTasks,
        daily_return: newDailyReturn,
        duration_days: newDuration,
        is_active: true,
        background_image: bgImageUrl
      });

      if (error) throw error;

      alert('Package created successfully!');
      setNewPackageName('');
      setNewPackagePrice(0);
      setNewDailyTasks(0);
      setNewDailyReturn(0);
      setNewDuration(0);
      setBgImageFile(null);
      fetchPackages();
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Failed to create package.');
    } finally {
      setCreatingPackage(false);
    }
  };

  const isPackagePurchased = (packageId: string) => userPackages.some(up => up.package_id === packageId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin create package form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Create New Package (Admin)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Package Name" value={newPackageName} onChange={e => setNewPackageName(e.target.value)} className="input"/>
          <input type="number" placeholder="Price" value={newPackagePrice} onChange={e => setNewPackagePrice(Number(e.target.value))} className="input"/>
          <input type="number" placeholder="Daily Tasks" value={newDailyTasks} onChange={e => setNewDailyTasks(Number(e.target.value))} className="input"/>
          <input type="number" placeholder="Daily Return" value={newDailyReturn} onChange={e => setNewDailyReturn(Number(e.target.value))} className="input"/>
          <input type="number" placeholder="Duration (days)" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} className="input"/>
          <input type="file" accept="image/*" onChange={e => setBgImageFile(e.target.files?.[0] || null)} />
        </div>
        <button onClick={handleCreatePackage} disabled={creatingPackage} className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md">
          {creatingPackage ? 'Creating...' : 'Create Package'}
        </button>
      </div>

      {/* Packages display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {packages.map(pkg => {
          const isPurchased = isPackagePurchased(pkg.id);
          const canAfford = user && user.wallet_balance >= pkg.price;
          return (
            <div key={pkg.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {pkg.background_image && (
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${pkg.background_image})` }} />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <PackageIcon className="h-8 w-8 text-blue-600" />
                  {isPurchased && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Owned</span>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{pkg.name}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Price</span><span className="font-semibold text-gray-900">${pkg.price}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Daily Return</span><span className="font-semibold text-green-600">${pkg.daily_return}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Daily Tasks</span><div className="flex items-center"><CheckSquare className="h-4 w-4 text-gray-400 mr-1"/><span className="font-semibold text-gray-900">{pkg.daily_tasks}</span></div></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Duration</span><div className="flex items-center"><Clock className="h-4 w-4 text-gray-400 mr-1"/><span className="font-semibold text-gray-900">{pkg.duration_days} days</span></div></div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="text-sm text-gray-600">Total Return: <span className="font-semibold text-green-600">${(pkg.daily_return * pkg.duration_days).toFixed(2)}</span></div>
                  <div className="text-sm text-gray-600">Profit: <span className="font-semibold text-green-600">${(pkg.daily_return * pkg.duration_days - pkg.price).toFixed(2)}</span></div>
                </div>
                <button onClick={() => handlePurchase(pkg)} disabled={isPurchased || !canAfford || purchasing === pkg.id} className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${isPurchased ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : canAfford ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-red-100 text-red-600 cursor-not-allowed'}`}>
                  {purchasing === pkg.id ? 'Purchasing...' : isPurchased ? 'Already Purchased' : canAfford ? 'Purchase Package' : 'Insufficient Balance'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
