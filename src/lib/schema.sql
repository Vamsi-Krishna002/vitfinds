-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tables
create table if not exists public.items (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('lost', 'found')),
  name text not null,
  description text not null,
  category text not null,
  date date not null,
  location text not null,
  image_url text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'returned', 'archived')),
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  item_id uuid references public.items(id) not null,
  content text not null,
  is_anonymous boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  item_id uuid references public.items(id) not null,
  type text not null check (type in ('match', 'message', 'status_update', 'item_returned')),
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.items enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Create policies
create policy "Users can view all items"
  on public.items for select
  using (true);

create policy "Users can insert their own items"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on public.items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own items"
  on public.items for delete
  using (auth.uid() = user_id);

create policy "Users can view messages they're involved in"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can view their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Create views for better data access
create or replace view public.items_with_user as
select 
  i.*,
  u.email as user_email,
  u.raw_user_meta_data->>'full_name' as user_full_name
from public.items i
join auth.users u on i.user_id = u.id;

create or replace view public.messages_with_users as
select 
  m.*,
  sender.raw_user_meta_data->>'full_name' as sender_name,
  receiver.raw_user_meta_data->>'full_name' as receiver_name
from public.messages m
join auth.users sender on m.sender_id = sender.id
join auth.users receiver on m.receiver_id = receiver.id;

-- Create function to handle new messages
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create notification for the receiver
  insert into public.notifications (user_id, item_id, type, content)
  values (
    NEW.receiver_id,
    NEW.item_id,
    'message',
    case 
      when NEW.is_anonymous then 'Someone sent you a message about your item'
      else (select raw_user_meta_data->>'full_name' from auth.users where id = NEW.sender_id) || ' sent you a message about your item'
    end
  );
  return NEW;
end;
$$;

-- Create trigger for new messages
create trigger on_new_message
  after insert on public.messages
  for each row execute procedure public.handle_new_message();

-- Create function to handle item status updates
create or replace function public.handle_item_status_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if NEW.status != OLD.status then
    -- Create notification for the item owner
    insert into public.notifications (user_id, item_id, type, content)
    values (
      NEW.user_id,
      NEW.id,
      'status_update',
      'Your item "' || NEW.name || '" has been marked as ' || NEW.status
    );
  end if;
  return NEW;
end;
$$;

-- Create trigger for item status updates
create trigger on_item_status_update
  after update on public.items
  for each row execute procedure public.handle_item_status_update();