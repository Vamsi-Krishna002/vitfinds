import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { MessageCircle, MapPin, Calendar } from 'lucide-react';
import { Item } from '../../types';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        if (item.image_url) {
          console.log('Attempting to generate signed URL for:', item.image_url);
          const { data, error } = await supabase.storage
            .from('lost-found-images')
            .createSignedUrl(item.image_url, 60 * 60); // 1 hour expiration

          if (data?.signedUrl) {
            setSignedUrl(data.signedUrl);
          } else {
            console.error('Error generating signed URL:', error?.message);
            setError(error?.message || 'Unknown error generating signed URL.');
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching signed URL:', err);
        setError('Unexpected error fetching signed URL.');
      }
    };

    fetchSignedUrl();
  }, [item.image_url]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {signedUrl ? (
        <img
          src={signedUrl}
          alt={item.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          {error ? <span className="text-red-500">{error}</span> : 'Loading...'}
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <span
            className={`px-2 py-1 rounded text-sm ${
              item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            {item.location}
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {format(new Date(item.date), 'PPP')}
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <Link
            to={`/items/${item.id}`}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Contact
          </Link>
          <span className="text-sm text-gray-500">
            Posted On: {format(new Date(item.created_at), 'PP')}
          </span>
        </div>
      </div>
    </div>
  );
}
