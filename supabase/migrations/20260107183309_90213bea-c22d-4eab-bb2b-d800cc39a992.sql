-- Create table for daily view history
CREATE TABLE public.news_views_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(news_id, view_date)
);

-- Enable RLS
ALTER TABLE public.news_views_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and editors can view all history" 
ON public.news_views_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "System can insert/update history" 
ON public.news_views_history 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_news_views_history_date ON public.news_views_history(view_date);
CREATE INDEX idx_news_views_history_news_id ON public.news_views_history(news_id);

-- Update the increment_news_views function to also record history
CREATE OR REPLACE FUNCTION public.increment_news_views(news_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update total views
  UPDATE public.news
  SET views = COALESCE(views, 0) + 1
  WHERE id = news_id;
  
  -- Insert or update daily history
  INSERT INTO public.news_views_history (news_id, view_date, view_count)
  VALUES (news_id, CURRENT_DATE, 1)
  ON CONFLICT (news_id, view_date) 
  DO UPDATE SET 
    view_count = news_views_history.view_count + 1,
    updated_at = now();
END;
$function$;

-- Add trigger for updated_at
CREATE TRIGGER update_news_views_history_updated_at
BEFORE UPDATE ON public.news_views_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();