import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  'Electronics',
  'Books',
  'Accessories',
  'IDs',
  'Keys',
  'Clothing',
  'Other',
];

export default function ItemForm() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost',
    name: '',
    description: '',
    category: '',
    date: '',
    location: '',
    image: null as File | null,
  });
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl = null;
      if (formData.image) {
        // Generate a unique file path based on user ID and file name
        const filePath = `${user.id}/${Date.now()}_${formData.image.name}`;

        // Upload the image to the private bucket
        const { error: uploadError } = await supabase.storage
          .from('lost-found-images') // Replace with your bucket name
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        // Save the file path to the database as the image_url
        imageUrl = filePath;
      }

      // Insert the form data into the 'items' table
      const { error } = await supabase.from('items').insert({
        type: formData.type,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        location: formData.location,
        image_url: imageUrl, // Save the file path from the storage bucket
        user_id: user.id,
        status: 'open',
        
      });
      

      if (error) throw error;

      toast.success('Item posted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error posting item:', error); // Log the error details
      const errorMessage = (error as any)?.message || 'Unknown error occurred'; // Extract a message if available
      toast.error(`Failed to post item: ${errorMessage}`);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Post an Item</h2>

        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="lost"
                checked={formData.type === 'lost'}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'lost' | 'found' })
                }
                className="mr-2"
              />
              Lost
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="found"
                checked={formData.type === 'found'}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'lost' | 'found' })
                }
                className="mr-2"
              />
              Found
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date(Lost/Found):</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.files?.[0] || null })
              }
              className="mt-1 block w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Item'}
        </button>
      </div>
    </form>
  );
}
