import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_admin', false)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching users:', error);
    else setUsers(data);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Registered Users</h1>
      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="border p-4 rounded bg-yellow-500 shadow-sm">
              <p><strong>Name:</strong> {user.full_name}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
              <p><strong>Wallet:</strong> ${user.wallet_balance}</p>
              <p><strong>Referral Code:</strong> {user.referral_code}</p>
              <p><strong>Referred By:</strong> {user.referred_by || '—'}</p>
              <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
