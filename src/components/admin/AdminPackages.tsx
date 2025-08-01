import React, { useEffect, useState } from 'react'; 
import { supabase } from '../../lib/supabase';

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    price: '',
    daily_tasks: '',
    daily_return: '',
    duration_days: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching packages:', error);
    else setPackages(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price),
      daily_tasks: parseInt(form.daily_tasks),
      daily_return: parseFloat(form.daily_return),
      duration_days: parseInt(form.duration_days),
    };

    if (editingId) {
      await supabase.from('packages').update(payload).eq('id', editingId);
    } else {
      await supabase.from('packages').insert(payload);
    }

    setForm({ name: '', price: '', daily_tasks: '', daily_return: '', duration_days: '' });
    setEditingId(null);
    fetchPackages();
  };

  const handleEdit = (pkg) => {
    setForm(pkg);
    setEditingId(pkg.id);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this package?')) {
      await supabase.from('packages').delete().eq('id', id);
      fetchPackages();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Investment Packages</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow mb-6">
        <input
          className="w-full border p-2 rounded bg-yellow-500"
          placeholder="Package Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded bg-yellow-500"
          type="number"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded bg-yellow-500"
          type="number"
          placeholder="Daily Tasks"
          value={form.daily_tasks}
          onChange={(e) => setForm({ ...form, daily_tasks: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded bg-yellow-500"
          type="number"
          step="0.01"
          placeholder="Daily Return"
          value={form.daily_return}
          onChange={(e) => setForm({ ...form, daily_return: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded bg-yellow-500"
          type="number"
          placeholder="Duration (days)"
          value={form.duration_days}
          onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
          required
        />
        <button type="submit" className="bg-blue-600 text- px-4 py-2 rounded">
          {editingId ? 'Update Package' : 'Create Package'}
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : packages.length === 0 ? (
        <p>No packages available.</p>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="border p-4 rounded bg-yellow-500 shadow-sm">
              <p><strong>Name:</strong> {pkg.name}</p>
              <p><strong>Price:</strong> ${pkg.price}</p>
              <p><strong>Daily Tasks:</strong> {pkg.daily_tasks}</p>
              <p><strong>Daily Return:</strong> ${pkg.daily_return}</p>
              <p><strong>Duration (days):</strong> {pkg.duration_days}</p>
              <p><strong>Status:</strong> {pkg.is_active ? 'Active' : 'Inactive'}</p>
              <p><strong>Created:</strong> {new Date(pkg.created_at).toLocaleString()}</p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPackages;
