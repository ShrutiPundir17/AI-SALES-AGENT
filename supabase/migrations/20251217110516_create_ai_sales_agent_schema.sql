/*
  # AI Sales Agent Database Schema

  ## Overview
  Creates a complete database schema for an AI-powered sales agent that manages leads,
  conversations, intent detection, and lead scoring.

  ## New Tables

  ### 1. `leads`
  Stores information about potential customers and their engagement metrics.
  - `id` (uuid, primary key) - Unique lead identifier
  - `name` (text) - Lead's full name
  - `email` (text, unique) - Lead's email address
  - `phone` (text, nullable) - Lead's phone number
  - `company` (text, nullable) - Company name
  - `lead_score` (integer) - Engagement score (0-100)
  - `lead_status` (text) - Status: cold, warm, hot, converted, not_interested
  - `last_interaction` (timestamptz) - Last conversation timestamp
  - `total_messages` (integer) - Total number of messages sent
  - `created_at` (timestamptz) - When lead was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `conversations`
  Stores all chat messages between leads and the AI agent.
  - `id` (uuid, primary key) - Unique message identifier
  - `lead_id` (uuid, foreign key) - Reference to leads table
  - `message` (text) - Message content
  - `sender` (text) - Either 'user' or 'agent'
  - `intent` (text, nullable) - Detected intent
  - `confidence` (numeric, nullable) - Intent confidence score (0-1)
  - `next_action` (text, nullable) - Suggested next action
  - `created_at` (timestamptz) - Message timestamp

  ### 3. `lead_activities`
  Tracks significant lead activities and engagement events.
  - `id` (uuid, primary key) - Unique activity identifier
  - `lead_id` (uuid, foreign key) - Reference to leads table
  - `activity_type` (text) - Type of activity
  - `details` (jsonb) - Additional activity details
  - `created_at` (timestamptz) - Activity timestamp

  ## Security
  - Enable RLS on all tables
  - Public access policies for demo purposes (in production, use proper auth)
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  company text,
  lead_score integer DEFAULT 0,
  lead_status text DEFAULT 'cold',
  last_interaction timestamptz DEFAULT now(),
  total_messages integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'agent')),
  intent text,
  confidence numeric,
  next_action text,
  created_at timestamptz DEFAULT now()
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, these should be restricted to authenticated users

CREATE POLICY "Allow public read access to leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to leads"
  ON leads FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to conversations"
  ON conversations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to conversations"
  ON conversations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to lead_activities"
  ON lead_activities FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to lead_activities"
  ON lead_activities FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create function to update lead's updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_timestamp();