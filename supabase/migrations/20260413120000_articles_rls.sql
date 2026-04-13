-- Admin users: who may read/write articles (matches auth.users.id).
-- Bootstrap: insert into public.admin_users (user_id) values ('<uuid from auth.users>');

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;
CREATE POLICY "admin_users_select_own"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT ON TABLE public.admin_users TO authenticated;

-- Articles: public read approved only; full CRUD for rows in admin_users.

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  url text NOT NULL,
  source_url text,
  source_name text NOT NULL,
  source_domain text NOT NULL,
  thumbnail_url text NOT NULL DEFAULT '',
  summary text NOT NULL,
  category text NOT NULL CHECK (category IN ('MCP', 'API', 'Infra', 'Tooling', 'Opinion')),
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_approved boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  content text NOT NULL
);

CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles (published_at DESC);
CREATE INDEX IF NOT EXISTS articles_approved_idx ON public.articles (is_approved);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_select_public" ON public.articles;
CREATE POLICY "articles_select_public"
ON public.articles
FOR SELECT
TO anon, authenticated
USING (is_approved = true);

DROP POLICY IF EXISTS "articles_admin_all" ON public.articles;
CREATE POLICY "articles_admin_all"
ON public.articles
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.admin_users u WHERE u.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users u WHERE u.user_id = auth.uid())
);

GRANT SELECT ON TABLE public.articles TO anon, authenticated;
GRANT ALL ON TABLE public.articles TO authenticated;
GRANT ALL ON TABLE public.articles TO service_role;
