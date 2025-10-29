/*
  # Create Public Ratings System

  1. New Tables
    - `public_ratings`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the person rating
      - `email` (text) - Email address
      - `phone` (text) - Phone number
      - `relationship` (text) - Relationship to school (Parent, Student, Alumni, etc.)
      - `rating` (integer) - Rating from 1 to 5
      - `comment` (text) - Optional comment
      - `status` (text) - Status: pending, approved, rejected
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `public_ratings` table
    - Allow anyone (including anonymous) to insert ratings
    - Only authenticated admins can view all ratings
    - Public can only view approved ratings

  3. Notes
    - This allows anyone to submit ratings without being logged in
    - Admin must approve ratings before they appear publicly
*/

CREATE TABLE IF NOT EXISTS public_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  relationship text NOT NULL CHECK (relationship IN ('Parent', 'Student', 'Alumni', 'Guardian', 'Other')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit ratings"
  ON public_ratings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all ratings"
  ON public_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Public can view approved ratings"
  ON public_ratings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Admins can update ratings"
  ON public_ratings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_public_ratings_status ON public_ratings(status);
CREATE INDEX IF NOT EXISTS idx_public_ratings_created_at ON public_ratings(created_at DESC);
