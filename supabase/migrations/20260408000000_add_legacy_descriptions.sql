-- Add legacy_description column to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS legacy_description TEXT;
