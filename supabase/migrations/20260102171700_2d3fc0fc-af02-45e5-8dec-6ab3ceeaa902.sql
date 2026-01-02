-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for news-tags relationship
CREATE TABLE public.news_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(news_id, tag_id)
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Tags are viewable by everyone
CREATE POLICY "Tags are viewable by everyone"
ON public.tags
FOR SELECT
USING (true);

-- Only admins/editors can manage tags
CREATE POLICY "Admins and editors can manage tags"
ON public.tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Enable RLS on news_tags
ALTER TABLE public.news_tags ENABLE ROW LEVEL SECURITY;

-- News tags are viewable by everyone
CREATE POLICY "News tags are viewable by everyone"
ON public.news_tags
FOR SELECT
USING (true);

-- Only admins/editors can manage news tags
CREATE POLICY "Admins and editors can manage news tags"
ON public.news_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_news_tags_news_id ON public.news_tags(news_id);
CREATE INDEX idx_news_tags_tag_id ON public.news_tags(tag_id);
CREATE INDEX idx_tags_slug ON public.tags(slug);