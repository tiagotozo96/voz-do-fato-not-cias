-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true);

-- Create storage policies for news images
CREATE POLICY "News images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can upload news images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can update news images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can delete news images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'news-images');