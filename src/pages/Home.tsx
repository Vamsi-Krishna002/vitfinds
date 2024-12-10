import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Item } from '../types';
import ItemCard from '../components/items/ItemCard';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    category: 'all'
  });
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  useEffect(() => {
    fetchItems();
  }, [filter, searchTerm]);

  const fetchItems = async () => {
    try {
      let query = supabase
        .from('items')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (filter.type !== 'all') {
        query = query.eq('type', filter.type);
      }
      if (filter.category !== 'all') {
        query = query.eq('category', filter.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setItems(filteredData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lost & Found Items</h1>
        <Link
          to="/items/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post Item
        </Link>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All Types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>

        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Accessories">Accessories</option>
          <option value="IDs">IDs</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}