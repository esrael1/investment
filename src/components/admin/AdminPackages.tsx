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
    background_image: '', // NEW field
  });
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  // Fetch all packages
  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching packages:', error);
    else setPackages(data || []);
    setLoading(false);
  };

  // Handle create/update package
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      price: parseFloat(form.price),
      daily_tasks: parseInt(form.daily_tasks),
      daily_return: parseFloat(form.daily_return),
      duration_days: parseInt(form.duration_days),
    };

    try {
      if (editingId) {
        await supabase.from('packages').update(payload).eq('id', editingId);
      } else {
        await supabase.from('packages').insert(payload);
      }

      setForm({
        name: '',
        price: '',
        daily_tasks: '',
        daily_return: '',
        duration_days: '',
        background_image: '',
      });
      setEditingId(null);
      fetchPackages();
    } catch (err) {
      console.error('Error saving package:', err);
      alert('Failed to save package');
    }
  };

  // Handle edit package
  const handleEdit = (pkg) => {
    setForm(pkg);
    setEditingId(pkg.id);
  };

  // Handle delete package
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this package?')) {
      await supabase.from('packages').delete().eq('id', id);
      fetchPackages();
    }
  };

  // Handle background image upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;

    try {
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('package-images') // bucket name
        .upload(`package-backgrounds/${fileName}`, file, { upsert: true });

      if (error) throw error;

      // Correctly get public URL
      const { data: publicData, error: urlError } = supabase.storage
        .from('package-images')
        .getPublicUrl(`package-backgrounds/${fileName}`);

      if (urlError) throw urlError;

      setForm({ ...form, background_image: publicData.publicUrl });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Investment Packages</h1>

      {/* Package form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow mb-6">
        <input
          className="w-full border p-2 rounded"
          placeholder="Package Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          type="number"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          type="number"
          placeholder="Daily Tasks"
          value={form.daily_tasks}
          onChange={(e) => setForm({ ...form, daily_tasks: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          type="number"
          step="0.01"
          placeholder="Daily Return"
          value={form.daily_return}
          onChange={(e) => setForm({ ...form, daily_return: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          type="number"
          placeholder="Duration (days)"
          value={form.duration_days}
          onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
          required
        />

        {/* File upload */}
        <input type="file" accept="image/*" onChange={handleFileUpload} />
        {uploading && <p>Uploading image...</p>}
        {form.background_image && (
          <img
            src={form.background_image}
            alt="Background Preview"
            className="mt-2 w-32 h-20 object-cover rounded"
          />
        )}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update Package' : 'Create Package'}
        </button>
      </form>

      {/* Packages list */}
      {loading ? (
        <p>Loading...</p>
      ) : packages.length === 0 ? (
        <p>No packages available.</p>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="border p-4 rounded shadow-sm">
              {pkg.background_image && (
                <img
                  src={pkg.background_image}
                  alt="Background"
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <p><strong>Name:</strong> {pkg.name}</p>
              <p><strong>Price:</strong> ${pkg.price}</p>
              <p><strong>Daily Tasks:</strong> {pkg.daily_tasks}</p>
              <p><strong>Daily Return:</strong> ${pkg.daily_return}</p>
              <p><strong>Duration (days):</strong> {pkg.duration_days}</p>
              <p><strong>Status:</strong> {pkg.is_active ? 'Active' : 'Inactive'}</p>
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
