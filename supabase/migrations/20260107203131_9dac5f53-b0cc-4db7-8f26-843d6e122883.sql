-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for backups bucket - only admins can access
CREATE POLICY "Admins can manage backups"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;