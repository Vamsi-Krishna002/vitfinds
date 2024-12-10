import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Item, Message, User } from '../types';
import { useAuthStore } from '../store/authStore';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [itemOwner, setItemOwner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchItem();
      if (user) fetchMessages();
    }
  }, [id, user]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('items_with_user')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
            if (data?.image_url) {
        // Generate signed URL for the image
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('lost-found-images') // Your bucket name
          .createSignedUrl(data.image_url, 60 * 60); // Expiration time: 1 hour
  
        if (signedUrlError) {
          console.error('Error generating signed URL:', signedUrlError.message);
        } else {
          data.image_url = signedUrlData?.signedUrl; // Update image_url with signed URL
        }
      }

      setItem(data);
      setItemOwner({
        id: data.user_id,
        email: data.user_email,
        full_name: data.user_full_name,
        email_verified: true, // This comes from auth.users
        created_at: data.created_at
      });
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('messages_with_users')
        .select('*')
        .eq('item_id', id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item) return;

    if (user.id === item.user_id) {
      toast.error("You cannot message yourself.");
      return;
    }

    try {
      const { error: messageError } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: item.user_id,
        item_id: item.id,
        content: newMessage,
        is_anonymous: isAnonymous,
      });
      if (messageError) throw messageError;

      setNewMessage('');
      fetchMessages();
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    }
  };

  const handleDeleteItem = async () => {
    if (!user || !item || user.id !== item.user_id) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', item.id);
      if (error) throw error;

      toast.success('Item deleted successfully.');
      navigate('/');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-lg text-gray-600">Item not found.</div>
      </div>
    );
  }

  const canMessage = user && user.id !== item.user_id;
  const isOwner = user && user.id === item.user_id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </span>
              {isOwner && (
                <button
                  onClick={handleDeleteItem}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete Item
                </button>
              )}
            </div>
          </div>

          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <div className="space-y-4">
            <p className="text-gray-700">{item.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Posted by:</span>{' '}
                {itemOwner?.full_name}
              </div>
              <div>
                <span className="font-semibold">Category:</span> {item.category}
              </div>
              <div>
                <span className="font-semibold">Location:</span> {item.location}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {format(new Date(item.date), 'PPP')}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {item.status}
              </div>
            </div>
          </div>
        </div>

        {user ? (
          <div className="border-t p-6">
            <h2 className="text-lg font-semibold mb-4">Messages</h2>
            
            <div className="space-y-4 mb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.sender_id === user.id
                      ? 'bg-indigo-100 ml-auto'
                      : 'bg-gray-100'
                  } max-w-[80%]`}
                >
                  <p className="text-sm text-gray-600">
                    {message.is_anonymous 
                      ? 'Anonymous' 
                      : message.sender_id === user.id 
                        ? 'You' 
                        : message.sender_name}
                  </p>
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(message.created_at), 'PPp')}
                  </p>
                </div>
              ))}
            </div>

            {canMessage && (
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Type your message..."
                  required
                />
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="mr-2"
                    />
                    Send anonymously
                  </label>
                  
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            )}

            {!canMessage && isOwner && (
              <p className="text-center text-gray-600">
                This is your item. You'll receive notifications when others send messages.
              </p>
            )}
          </div>
        ) : (
          <div className="border-t p-6 text-center">
            <p className="text-gray-600">
              Please <button onClick={() => navigate('/login')} className="text-indigo-600 hover:text-indigo-800">sign in</button> to send messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}