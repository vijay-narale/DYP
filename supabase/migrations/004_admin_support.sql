-- ============================================
-- 004_admin_support.sql
-- ============================================

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create live_interviews table
CREATE TABLE IF NOT EXISTS live_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
  user_answers JSONB DEFAULT '[]',
  admin_marks JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on live_interviews
ALTER TABLE live_interviews ENABLE ROW LEVEL SECURITY;

-- live_interviews Policies
CREATE POLICY "Users can view own life interviews" ON live_interviews FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');
CREATE POLICY "Users can insert own live interviews" ON live_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update live interviews" ON live_interviews FOR UPDATE USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin' OR auth.uid() = user_id);

-- Update RLS for other tables to allow Admins all-access
-- Only if not already present, though Supabase policies are additive. 
-- We can add a "System wide admin policy" for each table.

CREATE POLICY "Admins can do everything on profiles" ON profiles FOR ALL USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');
CREATE POLICY "Admins can do everything on resumes" ON resumes FOR ALL USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');
CREATE POLICY "Admins can do everything on analyses" ON analyses FOR ALL USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');
CREATE POLICY "Admins can do everything on roadmap_progress" ON roadmap_progress FOR ALL USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');
CREATE POLICY "Admins can do everything on jd_library" ON jd_library FOR ALL USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');

-- Update the handle_new_user function to include role from meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
