-- Bucket para fotos de estações (upload via Storage).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'station-photos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'station-photos',
      'station-photos',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can upload station photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload station photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'station-photos');

DROP POLICY IF EXISTS "Public read access for station photos" ON storage.objects;
CREATE POLICY "Public read access for station photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'station-photos');
