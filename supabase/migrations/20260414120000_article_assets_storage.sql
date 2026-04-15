-- Public bucket for article images (thumbnails, etc.). Thumbnails referenced via full public URLs in articles.thumbnail_url.

INSERT INTO storage.buckets (id, name, public)
VALUES ('article-assets', 'article-assets', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "article_assets_public_read" ON storage.objects;
CREATE POLICY "article_assets_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'article-assets');

DROP POLICY IF EXISTS "article_assets_admin_insert" ON storage.objects;
CREATE POLICY "article_assets_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-assets'
  AND EXISTS (SELECT 1 FROM public.admin_users u WHERE u.user_id = auth.uid())
);

DROP POLICY IF EXISTS "article_assets_admin_update" ON storage.objects;
CREATE POLICY "article_assets_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-assets'
  AND EXISTS (SELECT 1 FROM public.admin_users u WHERE u.user_id = auth.uid())
)
WITH CHECK (
  bucket_id = 'article-assets'
  AND EXISTS (SELECT 1 FROM public.admin_users u WHERE u.user_id = auth.uid())
);

DROP POLICY IF EXISTS "article_assets_admin_delete" ON storage.objects;
CREATE POLICY "article_assets_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-assets'
  AND EXISTS (SELECT 1 FROM public.admin_users u WHERE u.user_id = auth.uid())
);
