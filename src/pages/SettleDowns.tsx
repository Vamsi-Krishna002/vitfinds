import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Item } from '../types';
import ItemCard from '../components/items/ItemCard';
import { toast } from 'react-hot-toast';
import { Search, Filter } from 'lucide-react';

export default function SettleDowns() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    type: 'all',
    category: 'all',
    status: 'returned'
  });

  useEffect(() => {
    fetchSettledItems();
  }, [filter]);

  const fetchSettledItems = async () => {
    try {
      let query = supabase
        .from('items')
        .select('*')
        .eq('status', 'returned')
        .order('updated_at', { ascending: false });

      if (filter.type !== 'all') {
        query = query.eq('type', filter.type);
      }
      if (filter.category !== 'all') {
        query = query.eq('category', filter.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Apply search filter if exists
      const filteredData = searchTerm
        ? data.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data;

      setItems(filteredData);
    } catch (error) {
      console.error('Error fetching settled items:', error);
      toast.error('Failed to load settled items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Settled Items</h1>
        <p className="text-gray-600">
          Browse through successfully returned items and their stories.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search settled items..."
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex gap-4">
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="all">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Books">Books</option>
            <option value="Accessories">Accessories</option>
            <option value="IDs">IDs</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading settled items...</div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No settled items found.</p>
        </div>
      )}
    </div>
  );
}