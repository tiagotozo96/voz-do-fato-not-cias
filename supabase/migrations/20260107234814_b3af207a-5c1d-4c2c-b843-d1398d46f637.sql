-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll votes table (track who voted to prevent duplicates)
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  voter_id TEXT NOT NULL, -- Can be user_id or anonymous session id
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, voter_id)
);

-- Create news version history table
CREATE TABLE public.news_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  image_url TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  changed_by UUID REFERENCES public.profiles(id),
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_versions ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Polls are viewable by everyone" 
ON public.polls FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage polls" 
ON public.polls FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- Poll options policies
CREATE POLICY "Poll options are viewable by everyone" 
ON public.poll_options FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage poll options" 
ON public.poll_options FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- Poll votes policies
CREATE POLICY "Poll votes are viewable by everyone" 
ON public.poll_votes FOR SELECT USING (true);

CREATE POLICY "Anyone can vote in polls" 
ON public.poll_votes FOR INSERT WITH CHECK (true);

-- News versions policies
CREATE POLICY "News versions are viewable by admins and editors" 
ON public.news_versions FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "System can insert news versions" 
ON public.news_versions FOR INSERT WITH CHECK (true);

-- Function to increment vote count
CREATE OR REPLACE FUNCTION public.increment_poll_vote(p_option_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.poll_options
  SET votes_count = votes_count + 1
  WHERE id = p_option_id;
END;
$$;

-- Function to save news version before update
CREATE OR REPLACE FUNCTION public.save_news_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_version INTEGER;
BEGIN
  -- Get current max version for this news
  SELECT COALESCE(MAX(version_number), 0) INTO current_version
  FROM public.news_versions
  WHERE news_id = OLD.id;

  -- Only save if content actually changed
  IF OLD.title != NEW.title OR OLD.content IS DISTINCT FROM NEW.content OR OLD.excerpt IS DISTINCT FROM NEW.excerpt THEN
    INSERT INTO public.news_versions (news_id, title, content, excerpt, image_url, version_number, changed_by, change_summary)
    VALUES (
      OLD.id,
      OLD.title,
      OLD.content,
      OLD.excerpt,
      OLD.image_url,
      current_version + 1,
      NEW.author_id,
      'Versão salva automaticamente antes da edição'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for version history
CREATE TRIGGER save_news_version_trigger
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.save_news_version();

-- Add updated_at trigger for polls
CREATE TRIGGER update_polls_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();