-- ============================================
-- PlaceIQ v2 — Storage Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create the 'resumes' bucket if it doesn't exist
-- Note: 'public: false' means it's a private bucket, which is safer as we use signed URLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
-- (This is usually enabled by default in Supabase)

-- 3. Policy: Allow users to upload their own resumes
-- Folder structure: resumes/<user_id>/<filename>
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Allow users to view their own resumes
CREATE POLICY "Users can view own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
