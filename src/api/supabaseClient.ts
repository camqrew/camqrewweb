import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lwvmtjraqvniknstcvpk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dm10anJhcXZuaWtuc3RjdnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTkxMjksImV4cCI6MjEwMjA5NTEyOX0.z0qaKfucC8CrFIy_XvXs4XYZi7h_WvMbSvGrtLiKGkY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
