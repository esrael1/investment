import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({});

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
    } else {
      setWithdrawals(data);
      await fetchCustomerBankInfo(data);
    }

    setLoading(false);
  };

  const fetchCustomerBankInfo = async (withdrawalsList) => {
    const userIds = withdrawalsList.map((w) => w.user_id);

    const { data, error } = await supabase
      .from('customer_bank_accounts')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('Error fetching customer bank info:', error);
      return;
    }

    const infoMap = {};
    data.forEach((item) => {
      infoMap[item.user_id] = item;
    });

    setCustomerInfo(infoMap);
  };

  const handleApprove = async (withdrawal) => {
    const { id, user_id, amount } = withdrawal;

    const { error: balanceError } = await supabase.rpc('decrement_balance', {
      user_id,
      amount,
    });

    if (balanceError) {
      console.error('Failed to deduct balance:', balanceError.message);
      alert('Failed to approve: ' + balanceError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'paid',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update withdrawal:', updateError.message);
      alert('Failed to mark withdrawal as paid.');
    } else {
      fetchWithdrawals();
    }
  };

  const handleReject = async (id) => {
    const { error: rejectError } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (rejectError) {
      console.error('Failed to reject withdrawal:', rejectError.message);
      alert('Failed to reject withdrawal.');
    } else {
      fetchWithdrawals();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Withdrawals</h1>
      {loading ? (
        <p>Loading...</p>
      ) : withdrawals.length === 0 ? (
        <p>No pending withdrawals.</p>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div key={withdrawal.id} className="border p-4 rounded shadow-sm bg-blue-500">
              <p><strong>Withdraw Request:</strong> {withdrawal.amount} birr</p>
              <p><strong>Paid:</strong> {(withdrawal.amount) * 0.13} birr</p>
              <p><strong>User ID:</strong> {withdrawal.user_id}</p>
              <p><strong>User Name:</strong> {withdrawal.name}</p>
              <p><strong>Status:</strong> {withdrawal.status}</p>

              {/* Customer Bank Info */}
              {customerInfo[withdrawal.user_id] ? (
                <div className="mt-4 border-t pt-3 text-sm text-gray-800">
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Bank Info</h4>
                  <p><strong>Bank Name:</strong> {customerInfo[withdrawal.user_id].bank_name}</p>
                  <p><strong>Account Holder:</strong> {customerInfo[withdrawal.user_id].account_holder}</p>
                  <p><strong>Account Number:</strong> {customerInfo[withdrawal.user_id].account_number}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-red-600">No bank info found for this customer.</p>
              )}

              {/* Action Buttons */}
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => handleApprove(withdrawal)}
                  className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => handleReject(withdrawal.id)}
                  className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
