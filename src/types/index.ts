export type User = {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  email_verified: boolean;
  created_at: string;
  avatar_url?: string;
};

export type Item = {
  id: string;
  type: 'lost' | 'found';
  name: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image_url?: string;
  status: 'open' | 'in_progress' | 'returned' | 'archived';
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  item_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  item_id: string;
  type: 'match' | 'message' | 'status_update' | 'item_returned';
  read: boolean;
  created_at: string;
  content: string;
};