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
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4">My Bank Account</h2>

      {message && (
        <p
          className={`mb-4 text-sm rounded px-4 py-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </p>
      )}

      {loading ? (
        <p>Loading bank info...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
            <input
              type="text"
              value={bankInfo.bank_name}
              onChange={(e) => setBankInfo({ ...bankInfo, bank_name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Account Number</label>
            <input
              type="text"
              value={bankInfo.account_number}
              onChange={(e) => setBankInfo({ ...bankInfo, account_number: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
            <input
              type="text"
              value={bankInfo.account_holder}
              onChange={(e) => setBankInfo({ ...bankInfo, account_holder: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
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
