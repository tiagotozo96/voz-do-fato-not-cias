-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_title TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and editors can view activity logs
CREATE POLICY "Admins and editors can view activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- System can insert logs (via triggers or edge functions)
CREATE POLICY "System can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Only admins can delete logs
CREATE POLICY "Admins can delete activity logs"
ON public.activity_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create function to log news activities
CREATE OR REPLACE FUNCTION public.log_news_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  user_name TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if it was published
    IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
      action_type := 'published';
    ELSE
      action_type := 'updated';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
  END IF;

  -- Get user name from profiles
  SELECT full_name INTO user_name FROM public.profiles WHERE id = COALESCE(NEW.author_id, OLD.author_id);

  -- Insert log
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, entity_title, details)
  VALUES (
    COALESCE(NEW.author_id, OLD.author_id),
    action_type,
    'news',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.title, OLD.title),
    jsonb_build_object(
      'user_name', user_name,
      'old_title', CASE WHEN TG_OP = 'UPDATE' THEN OLD.title ELSE NULL END,
      'new_title', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.title ELSE NULL END
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for news table
CREATE TRIGGER log_news_insert
  AFTER INSERT ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.log_news_activity();

CREATE TRIGGER log_news_update
  AFTER UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.log_news_activity();

CREATE TRIGGER log_news_delete
  AFTER DELETE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.log_news_activity();