-- Add scheduled_at column to news table
ALTER TABLE public.news 
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Create index for efficient querying of scheduled news
CREATE INDEX idx_news_scheduled_at ON public.news (scheduled_at) 
WHERE scheduled_at IS NOT NULL AND is_published = false;

-- Add comment explaining the column
COMMENT ON COLUMN public.news.scheduled_at IS 'Date and time when the news should be automatically published';