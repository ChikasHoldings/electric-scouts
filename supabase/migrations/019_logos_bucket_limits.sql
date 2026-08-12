-- ═══════════════════════════════════════════════════════════
-- 019: Constrain the public logos bucket
--
-- The bucket was public with NO size limit and NO MIME restriction, so any
-- file of any size could be placed in it. Admin now uploads provider logos
-- here directly, so the same rules the upload control applies in the browser
-- are enforced at the bucket — a bypassed client cannot put something else in
-- a bucket that is served publicly.
--
-- 2 MB and four image types; SVG is included because provider wordmarks are
-- commonly supplied that way.
-- ═══════════════════════════════════════════════════════════
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
WHERE id = 'logos';
