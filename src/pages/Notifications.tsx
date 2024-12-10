import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Bell, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';

export default function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);

      // Mark all unread notifications as read
      const unreadIds = data
        ?.filter(n => !n.read)
        .map(n => n.id);

      if (unreadIds?.length) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        Please sign in to view notifications.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Bell className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg ${
                    notification.read ? 'bg-gray-50' : 'bg-indigo-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800">{notification.content}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(notification.created_at), 'PPp')}
                      </p>
                    </div>
                    {notification.read && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}