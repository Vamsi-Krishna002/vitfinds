import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Item } from '../types';
import ItemCard from '../components/items/ItemCard';

export default function Archive() {
  const [archivedItems, setArchivedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedItems();
  }, []);

  const fetchArchivedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'archived')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setArchivedItems(data || []);
    } catch (error) {
      console.error('Error fetching archived items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Archived Items</h1>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedItems.map((item) => (
            <ItemCard key={item.id} item={item} showArchiveStatus />
          ))}
        </div>
      )}
    </div>
  );
}