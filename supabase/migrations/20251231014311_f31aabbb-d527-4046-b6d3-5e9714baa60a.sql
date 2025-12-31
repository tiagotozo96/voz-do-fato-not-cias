-- Create function to increment news views (bypasses RLS for public access)
CREATE OR REPLACE FUNCTION public.increment_news_views(news_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.news
  SET views = COALESCE(views, 0) + 1
  WHERE id = news_id;
END;
$$;