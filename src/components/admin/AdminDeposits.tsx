import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deposits:', error);
    } else {
      setDeposits(data);
    }

    setLoading(false);
  };

  const handleApprove = async (id) => {
    const { data: depositData, error: fetchError } = await supabase
      .from('deposits')
      .select('user_id, amount')
      .eq('id', id)
      .single();

    if (fetchError || !depositData) {
      console.error('Error fetching deposit:', fetchError);
      return;
    }

    const { user_id, amount } = depositData;

    const { error: updateError } = await supabase
      .from('deposits')
      .update({ status: 'approved' })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating deposit status:', updateError);
      return;
    }

    const { error: balanceError } = await supabase.rpc('increment_wallet_balance', {
      user_id_input: user_id,
      amount_input: amount,
    });

    if (balanceError) {
      console.error('Error updating wallet balance:', balanceError);
      return;
    }

    fetchDeposits();
  };

  const handleReject = async (id) => {
    await supabase
      .from('deposits')
      .update({ status: 'rejected' })
      .eq('id', id);
    fetchDeposits();
  };

  const getImageUrl = (filename: string) =>
    `https://rkjkshfesgojjxgrzekp.supabase.co/storage/v1/object/public/screenshots/${filename}`;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Deposits</h1>
      {loading ? (
        <p>Loading...</p>
      ) : deposits.length === 0 ? (
        <p>No pending deposits.</p>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div key={deposit.id} className="border p-4 rounded shadow-sm bg-blue-500">
              <p><strong>Amount:</strong> ${deposit.amount}</p>
              <p><strong>User ID:</strong> {deposit.user_id}</p>

              {deposit.screenshot_url && (
                <img
                  src={getImageUrl(deposit.screenshot_url)}
                  alt="screenshot"
                  onClick={() => setSelectedImageUrl(getImageUrl(deposit.screenshot_url))}
                  className="w-48 h-auto mt-2 border rounded cursor-pointer hover:opacity-80"
                />
              )}

              <div className="mt-3 space-x-4">
                <button
                  onClick={() => handleApprove(deposit.id)}
                  className="px-4 py-1 bg-green-600 text-white rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(deposit.id)}
                  className="px-4 py-1 bg-red-600 text-white rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for full-size image */}
      {selectedImageUrl && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="relative max-w-3xl w-full p-4">
            <img
              src={selectedImageUrl}
              alt="Full Size"
              className="w-full h-auto rounded shadow-lg"
            />
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeposits;
