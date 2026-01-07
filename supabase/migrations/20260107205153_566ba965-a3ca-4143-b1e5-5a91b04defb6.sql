-- Create table for restoration history
CREATE TABLE public.restoration_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restored_by UUID REFERENCES auth.users(id),
  restored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  backup_filename TEXT,
  backup_date TIMESTAMP WITH TIME ZONE,
  options JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.restoration_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins and editors can view restoration history"
ON public.restoration_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "System can insert restoration history"
ON public.restoration_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete restoration history"
ON public.restoration_history
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));