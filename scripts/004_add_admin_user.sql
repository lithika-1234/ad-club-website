-- Add Admin User Script
-- Run this AFTER signing in with Google for the first time
-- This will promote the most recently created user to super_admin

-- First, let's see all users in the auth.users table
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Option 1: Add admin by email (replace with your actual email)
-- Uncomment and modify the email below:

INSERT INTO admin_profiles (id, name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) as name,
  email,
  'super_admin'
FROM auth.users
WHERE email = 'your-email@gmail.com'  -- CHANGE THIS to your Google email
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin';

-- Option 2: Make the most recent user an admin (useful for testing)
-- Uncomment the following if you want to use this approach instead:

-- INSERT INTO admin_profiles (id, name, email, role)
-- SELECT 
--   id,
--   COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) as name,
--   email,
--   'super_admin'
-- FROM auth.users
-- ORDER BY created_at DESC
-- LIMIT 1
-- ON CONFLICT (id) DO UPDATE SET
--   role = 'super_admin';
