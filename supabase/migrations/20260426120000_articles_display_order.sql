-- Manual homepage ordering: lower display_order appears first within the same featured tier.

ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Preserve current visual order (featured first, then newest) as explicit ranks.
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (ORDER BY is_featured DESC, published_at DESC) - 1)::integer AS ord
  FROM public.articles
)
UPDATE public.articles AS a
SET display_order = r.ord
FROM ranked AS r
WHERE a.id = r.id;

CREATE INDEX IF NOT EXISTS articles_public_feed_order_idx
ON public.articles (is_featured DESC, display_order ASC, published_at DESC)
WHERE is_approved = true;
