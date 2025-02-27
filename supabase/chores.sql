-- Create chores table
CREATE TABLE chores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample chores
INSERT INTO chores (name, description, points) VALUES
  ('Wash dishes', 'Clean all dishes in the sink', 2),
  ('Take out trash', 'Empty all trash cans and take to curb', 1),
  ('Make bed', 'Straighten sheets and arrange pillows', 1),
  ('Vacuum living room', 'Vacuum the entire living room floor', 3),
  ('Clean bathroom', 'Clean toilet, sink, and shower', 4),
  ('Fold laundry', 'Fold clean clothes and put away', 2),
  ('Mow lawn', 'Cut grass in front and back yard', 5),
  ('Feed pets', 'Give food and water to all pets', 1),
  ('Sweep kitchen', 'Sweep kitchen floor', 2),
  ('Dust furniture', 'Dust all surfaces in living areas', 2); 