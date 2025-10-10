import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const Packages = () => {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.from('packages').select('*');
      if (error) throw error;
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <h1 className="text-2xl font-bold text-center mb-8">Available Packages</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Background Image with Overlay */}
            {pkg.background_image ? (
              <div
                className="relative w-full h-36 bg-cover bg-center rounded-t-lg"
                style={{ backgroundImage: `url("${pkg.background_image}")` }}
              >
                {/* Overlay for better text visibility */}
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-t-lg"></div>

                {/* Overlaid text */}
                <div className="absolute bottom-2 left-3 text-white">
                  <h2 className="text-lg font-bold drop-shadow-md">{pkg.name}</h2>
                  <p className="text-sm text-gray-200">${pkg.price}</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-36 bg-gray-200 flex items-center justify-center rounded-t-lg">
                <span className="text-gray-500 text-lg">{pkg.name}</span>
              </div>
            )}

            {/* Package Details */}
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-2">{pkg.description}</p>
              <p className="text-gray-900 font-semibold mb-3">Daily Tasks: {pkg.tasks_per_day}</p>

              <Link
                to={`/packages/${pkg.id}`}
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Packages;
