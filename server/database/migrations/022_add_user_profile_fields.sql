-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Create index for full name searches
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
