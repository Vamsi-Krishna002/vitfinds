import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqemoffofjabanmfucuc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZW1vZmZvZmphYmFubWZ1Y3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MDM4NDMsImV4cCI6MjA0OTA3OTg0M30.-gWnIa7AXDiH3trWrlay2T35j5lvcP5jpsIJkbYJVkQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize storage bucket for item images
const initializeStorage = async () => {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(bucket => bucket.name === 'items')) {
    await supabase.storage.createBucket('items', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
    });
  }
};

initializeStorage();