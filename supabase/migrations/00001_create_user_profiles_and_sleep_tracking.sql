-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  full_name text,
  age integer,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create sleep records table
CREATE TABLE public.sleep_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sleep_date date NOT NULL,
  sleep_hours numeric(4,2) NOT NULL,
  sleep_quality text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create analysis results table
CREATE TABLE public.analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_type text NOT NULL, -- 'face' or 'hrv'
  fatigue_level integer NOT NULL CHECK (fatigue_level >= 0 AND fatigue_level <= 100),
  alertness_score integer NOT NULL CHECK (alertness_score >= 0 AND alertness_score <= 100),
  recommended_rest_minutes integer NOT NULL,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_sleep_records_user_id ON public.sleep_records(user_id);
CREATE INDEX idx_sleep_records_date ON public.sleep_records(sleep_date DESC);
CREATE INDEX idx_analysis_results_user_id ON public.analysis_results(user_id);
CREATE INDEX idx_analysis_results_created ON public.analysis_results(created_at DESC);

-- Create trigger function to sync auth.users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (remove @miaoda.com)
  extracted_username := REPLACE(NEW.email, '@miaoda.com', '');
  
  -- Insert profile synced with auth user
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    extracted_username,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger to sync users on confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Sleep records policies
CREATE POLICY "Users can view their own sleep records" ON sleep_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep records" ON sleep_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep records" ON sleep_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep records" ON sleep_records
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to sleep records" ON sleep_records
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Analysis results policies
CREATE POLICY "Users can view their own analysis results" ON analysis_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis results" ON analysis_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to analysis results" ON analysis_results
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Create public view for shareable profile info
CREATE VIEW public_profiles AS
  SELECT id, username, role FROM profiles;