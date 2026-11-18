-- M1.3.0: APPLY ONLY TO AN ISOLATED AI TEST PROJECT AFTER BACKUP.
-- DO NOT RUN ON YOUR CURRENT PRODUCTION DATABASE.
-- Requires TTOKTTI_M129_SETUP.sql and supabase_test_sync_setup.sql tables first.
BEGIN;
ALTER TABLE public.tt_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.tt_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tt_users FROM anon, PUBLIC;
GRANT SELECT ON TABLE public.tt_users TO authenticated;
-- Keep administrator-only writes through Edge Function with service role.
DROP POLICY IF EXISTS tt_users_self_read ON public.tt_users;
CREATE POLICY tt_users_self_read ON public.tt_users FOR SELECT TO authenticated USING (id=(SELECT auth.uid()));
UPDATE public.tt_users SET permissions=permissions || '{"check_delete":false}'::jsonb WHERE NOT permissions ? 'check_delete';
ALTER TABLE public.pjt_performance_test_docs_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pjt_performance_test_docs_v1 FROM anon,PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pjt_performance_test_docs_v1 TO authenticated;
-- Remove all earlier policies on THIS TEST TABLE, including legacy pjt_profiles policies.
DO $$ DECLARE old_policy record; BEGIN
 FOR old_policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='pjt_performance_test_docs_v1' LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.pjt_performance_test_docs_v1',old_policy.policyname);
 END LOOP;
END $$;
CREATE POLICY tt_m130_read ON public.pjt_performance_test_docs_v1 FOR SELECT TO authenticated USING (
 owner_id=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.tt_users u WHERE u.id=(SELECT auth.uid()) AND u.active AND
 (u.role='admin' OR (u.permissions->>'check_view'='true' AND u.permissions->>'sync'='true'))));
CREATE POLICY tt_m130_insert ON public.pjt_performance_test_docs_v1 FOR INSERT TO authenticated WITH CHECK (
 owner_id=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.tt_users u WHERE u.id=(SELECT auth.uid()) AND u.active AND
 (u.role='admin' OR (u.permissions->>'check_view'='true' AND u.permissions->>'check_edit'='true' AND u.permissions->>'sync'='true'))));
-- Snapshot deletion guard: prevents deleting a unit or clearing photos without delete rights.
-- Other field erasures need additional structured server commands before production launch.
CREATE OR REPLACE FUNCTION public.tt_m130_guard_removed_equipment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old_eq jsonb; new_eq jsonb; old_item jsonb; new_item jsonb;
BEGIN
 IF (SELECT active AND (role='admin' OR permissions->>'check_delete'='true') FROM public.tt_users WHERE id=auth.uid()) IS TRUE THEN RETURN NEW; END IF;
 IF jsonb_array_length(COALESCE(NEW.document->'equipment','[]'::jsonb)) < jsonb_array_length(COALESCE(OLD.document->'equipment','[]'::jsonb)) THEN
  RAISE EXCEPTION '점검 설비 삭제 권한이 없습니다.' USING ERRCODE='42501';
 END IF;
 FOR old_eq IN SELECT value FROM jsonb_array_elements(COALESCE(OLD.document->'equipment','[]'::jsonb)) LOOP
  SELECT value INTO new_eq FROM jsonb_array_elements(COALESCE(NEW.document->'equipment','[]'::jsonb)) WHERE value->>'uid'=old_eq->>'uid' LIMIT 1;
  IF new_eq IS NULL THEN RAISE EXCEPTION '점검 설비 삭제 권한이 없습니다.' USING ERRCODE='42501'; END IF;
  IF old_eq->>'sitePhoto' IS NOT NULL AND old_eq->>'sitePhoto'<>'' AND COALESCE(new_eq->>'sitePhoto','')='' THEN
   RAISE EXCEPTION '사진 삭제 권한이 없습니다.' USING ERRCODE='42501';
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tt_m130_guard_snapshot_remove ON public.pjt_performance_test_docs_v1;
CREATE TRIGGER tt_m130_guard_snapshot_remove BEFORE UPDATE ON public.pjt_performance_test_docs_v1 FOR EACH ROW EXECUTE FUNCTION public.tt_m130_guard_removed_equipment();
CREATE POLICY tt_m130_update ON public.pjt_performance_test_docs_v1 FOR UPDATE TO authenticated USING (
 owner_id=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.tt_users u WHERE u.id=(SELECT auth.uid()) AND u.active AND
 (u.role='admin' OR (u.permissions->>'check_view'='true' AND u.permissions->>'check_edit'='true' AND u.permissions->>'sync'='true'))))
 WITH CHECK (owner_id=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.tt_users u WHERE u.id=(SELECT auth.uid()) AND u.active AND
 (u.role='admin' OR (u.permissions->>'check_view'='true' AND u.permissions->>'check_edit'='true' AND u.permissions->>'sync'='true'))));
CREATE POLICY tt_m130_delete ON public.pjt_performance_test_docs_v1 FOR DELETE TO authenticated USING (
 owner_id=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.tt_users u WHERE u.id=(SELECT auth.uid()) AND u.active AND
 (u.role='admin' OR (u.permissions->>'check_delete'='true' AND u.permissions->>'sync'='true'))));
COMMIT;
