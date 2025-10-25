import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CustomerBankInfo = () => {
  const { user } = useAuth();

  const [bankInfo, setBankInfo] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchBankInfo();
    }
  }, [user]);

  const fetchBankInfo = async () => {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from('customer_bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching customer bank info:', error);
      setMessage({ type: 'error', text: 'Failed to fetch bank info.' });
    }

    if (data) {
      setBankInfo({
        bank_name: data.bank_name,
        account_number: data.account_number,
        account_holder: data.account_holder,
      });
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('customer_bank_accounts')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('customer_bank_accounts')
          .update(bankInfo)
          .eq('user_id', user?.id);

        if (error) throw error;

        setMessage({ type: 'success', text: 'Bank info updated successfully.' });
      } else {
        const { error } = await supabase
          .from('customer_bank_accounts')
          .insert([{ ...bankInfo, user_id: user?.id }]);

        if (error) throw error;

        setMessage({ type: 'success', text: 'Bank info saved successfully.' });
      }

      await fetchBankInfo(); // Refresh view
    } catch (error) {
      console.error('Error saving bank info:', error);
      setMessage({ type: 'error', text: 'Failed to save bank info.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-800">
        My Bank Account
      </h2>

      {message && (
        <p
          className={`mb-4 text-sm sm:text-base rounded-lg px-4 py-2 text-center font-medium transition-all ${message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
            }`}
        >
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="text-center text-gray-600">Loading bank info...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5 text-gray-700"
        >
          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium mb-1 sm:mb-2 text-gray-700">
              Bank Name
            </label>
            <input
              type="text"
              value={bankInfo.bank_name}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, bank_name: e.target.value })
              }
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              required
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium mb-1 sm:mb-2 text-gray-700">
              Account Number
            </label>
            <input
              type="text"
              value={bankInfo.account_number}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, account_number: e.target.value })
              }
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              required
            />
          </div>

          {/* Account Holder */}
          <div>
            <label className="block text-sm font-medium mb-1 sm:mb-2 text-gray-700">
              Account Holder Name
            </label>
            <input
              type="text"
              value={bankInfo.account_holder}
              onChange={(e) =>
                setBankInfo({ ...bankInfo, account_holder: e.target.value })
              }
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-4 py-2.5 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 ${saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {saving ? 'Saving...' : 'Save Bank Info'}
          </button>
        </form>
      )}
    </div>

  );
};

export default CustomerBankInfo;
