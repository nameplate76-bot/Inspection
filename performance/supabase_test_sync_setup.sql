-- M1.0.3 성능점검표 독립모듈 전용 시험자료 동기화.
-- 기존 pjt_records, pjt_shared_state, 운영 성능점검표 및 사용자 데이터는 수정하지 않습니다.
-- 계정별 owner_id를 강제하여 같은 계정의 PC/모바일에서만 공유합니다.
CREATE TABLE IF NOT EXISTS public.pjt_performance_test_docs_v1 (
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_key text NOT NULL DEFAULT 'demo/current',
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pjt_performance_test_docs_v1_pkey PRIMARY KEY (owner_id, doc_key),
  CONSTRAINT pjt_performance_test_docs_v1_key_check CHECK (doc_key = 'demo/current')
);
ALTER TABLE public.pjt_performance_test_docs_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pjt_performance_test_docs_v1 FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pjt_performance_test_docs_v1 TO authenticated;

DROP POLICY IF EXISTS "m103_select_approved_own" ON public.pjt_performance_test_docs_v1;
CREATE POLICY "m103_select_approved_own" ON public.pjt_performance_test_docs_v1
FOR SELECT TO authenticated
USING (
 owner_id = (SELECT auth.uid()) AND
 EXISTS (SELECT 1 FROM public.pjt_profiles p WHERE p.id=(SELECT auth.uid()) AND p.approved IS TRUE)
);
DROP POLICY IF EXISTS "m103_insert_approved_own" ON public.pjt_performance_test_docs_v1;
CREATE POLICY "m103_insert_approved_own" ON public.pjt_performance_test_docs_v1
FOR INSERT TO authenticated
WITH CHECK (
 owner_id = (SELECT auth.uid()) AND
 EXISTS (SELECT 1 FROM public.pjt_profiles p WHERE p.id=(SELECT auth.uid()) AND p.approved IS TRUE)
);
DROP POLICY IF EXISTS "m103_update_approved_own" ON public.pjt_performance_test_docs_v1;
CREATE POLICY "m103_update_approved_own" ON public.pjt_performance_test_docs_v1
FOR UPDATE TO authenticated
USING (
 owner_id = (SELECT auth.uid()) AND
 EXISTS (SELECT 1 FROM public.pjt_profiles p WHERE p.id=(SELECT auth.uid()) AND p.approved IS TRUE)
)
WITH CHECK (
 owner_id = (SELECT auth.uid()) AND
 EXISTS (SELECT 1 FROM public.pjt_profiles p WHERE p.id=(SELECT auth.uid()) AND p.approved IS TRUE)
);

-- Postgres Changes: 원격 변경 알림 (WebSocket 실패 시 클라이언트가 12초마다 재확인).
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
 AND NOT EXISTS (
   SELECT 1 FROM pg_publication_tables
   WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='pjt_performance_test_docs_v1'
 ) THEN
   ALTER PUBLICATION supabase_realtime ADD TABLE public.pjt_performance_test_docs_v1;
 END IF;
END $$;
