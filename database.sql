-- Create database (run this separately if needed)
-- CREATE DATABASE feedback_db;

-- Connect to the database
-- \c feedback_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_id INTEGER NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, feedback_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_feedback_id ON votes(feedback_id);

-- Insert sample data (optional)
-- Sample users
INSERT INTO users (name, email, password) VALUES
  ('John Doe', 'john@example.com', '$2a$10$YourHashedPasswordHere'),
  ('Jane Smith', 'jane@example.com', '$2a$10$YourHashedPasswordHere')
ON CONFLICT (email) DO NOTHING;

-- Sample feedbacks
-- INSERT INTO feedbacks (user_id, title, description, status) VALUES
--   (1, 'Add Dark Mode', 'Please add a dark mode feature to reduce eye strain', 'Planned'),
--   (1, 'Improve Search Speed', 'The search functionality is quite slow', 'In Progress'),
--   (2, 'Fix Login Issue', 'Sometimes login fails without error message', 'Completed')
-- ON CONFLICT DO NOTHING;

-- Display table structures
SELECT 'Users table created' as status;
SELECT 'Feedbacks table created' as status;
SELECT 'Votes table created' as status;
