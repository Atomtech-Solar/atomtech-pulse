-- Relaxa tipos MIME do bucket de anexos de leads: browsers enviam variações (pjpeg, heic, etc.)
-- e alguns dispositivos mandam application/octet-stream — o cliente força Content-Type na upload.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
]::text[]
where id = 'lead-attachments';
