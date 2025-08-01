import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';

const AdminBankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_holder: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    const { data, error } = await supabase
      .from('admin_bank_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bank accounts:', error);
    } else {
      setAccounts(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      const { error } = await supabase
        .from('admin_bank_accounts')
        .update(form)
        .eq('id', editingId);

      if (error) console.error('Error updating bank account:', error);
    } else {
      const { error } = await supabase.from('admin_bank_accounts').insert([form]);
      if (error) console.error('Error adding bank account:', error);
    }

    setForm({ bank_name: '', account_number: '', account_holder: '' });
    setEditingId(null);
    setLoading(false);
    fetchBankAccounts();
  };

  const handleEdit = (account) => {
    setForm({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder: account.account_holder,
    });
    setEditingId(account.id);
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this bank account?');
    if (!confirm) return;

    const { error } = await supabase.from('admin_bank_accounts').delete().eq('id', id);
    if (error) console.error('Error deleting bank account:', error);
    fetchBankAccounts();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Bank Accounts</h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-white p-4 rounded shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700">Bank Name</label>
          <input
            type="text"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Number</label>
          <input
            type="text"
            value={form.account_number}
            onChange={(e) => setForm({ ...form, account_number: e.target.value })}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Holder</label>
          <input
            type="text"
            value={form.account_holder}
            onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? 'Update' : 'Add'} Account
        </button>
      </form>

      <div className="space-y-4">
        {accounts.length === 0 ? (
          <p className="text-gray-600">No bank accounts found.</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="border p-4 rounded shadow-sm flex justify-between items-center">
              <div>
                <p className="font-semibold">{account.bank_name}</p>
                <p>Account: {account.account_number}</p>
                <p>Holder: {account.account_holder}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(account)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBankAccounts;
