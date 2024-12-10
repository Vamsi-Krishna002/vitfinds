import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { User as UserIcon, Mail, Calendar, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Item } from '../types';
import ItemCard from '../components/items/ItemCard';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuthStore();
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserItems();
    }
  }, [user]);

  const fetchUserItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserItems(data || []);
    } catch (error) {
      console.error('Error fetching user items:', error);
      toast.error('Failed to load your items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      // Delete associated messages first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('item_id', itemId);

      if (messagesError) throw messagesError;

      // Delete associated notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('item_id', itemId);

      if (notificationsError) throw notificationsError;

      // Delete the item's image if it exists
      const item = userItems.find(i => i.id === itemId);
      if (item?.image_url) {
        const { error: storageError } = await supabase.storage
          .from('lost-found-images')
          .remove([item.image_url]);
        if (storageError) throw storageError;
      }

      // Finally delete the item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setUserItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-4 rounded-full">
              <UserIcon className="h-12 w-12 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <Calendar className="h-4 w-4 mr-2" />
                Joined {format(new Date(user.created_at), 'PP')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Posted Items</h2>
        {loading ? (
          <div className="text-center py-8">Loading your items...</div>
        ) : userItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userItems.map((item) => (
              <div key={item.id} className="relative">
                <ItemCard item={item} />
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="absolute top-2 right-2 p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You haven't posted any items yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}