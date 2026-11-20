-- M1.3.17: Private test-only photo bucket for per-file real-time sync.
-- IMPORTANT: review before running in your own TEST Supabase project.
-- Does not alter existing tables or production buckets.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('ttoktti-test-photos','ttoktti-test-photos',false,10485760,
 ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']::text[])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ttoktti_test_photo_read_own" ON storage.objects;
CREATE POLICY "ttoktti_test_photo_read_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='ttoktti-test-photos' AND (storage.foldername(name))[1]=(select auth.uid())::text
 AND EXISTS (SELECT 1 FROM public.tt_users t WHERE t.id=(select auth.uid()) AND t.active IS TRUE));

DROP POLICY IF EXISTS "ttoktti_test_photo_insert_own" ON storage.objects;
CREATE POLICY "ttoktti_test_photo_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='ttoktti-test-photos' AND (storage.foldername(name))[1]=(select auth.uid())::text
 AND EXISTS (SELECT 1 FROM public.tt_users t WHERE t.id=(select auth.uid()) AND t.active IS TRUE
 AND (t.role='admin' OR (t.permissions->>'check_edit')::boolean IS TRUE)));
-- No UPDATE / DELETE policy: files are immutable, named by SHA-256 digest.
