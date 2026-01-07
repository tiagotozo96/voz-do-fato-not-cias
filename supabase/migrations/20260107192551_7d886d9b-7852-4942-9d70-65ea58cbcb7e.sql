-- Add confirmation fields to newsletter_subscribers
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_token TEXT,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmation_token ON public.newsletter_subscribers(confirmation_token);

-- Update existing subscribers to be confirmed (they're already subscribed)
UPDATE public.newsletter_subscribers SET is_confirmed = true WHERE is_active = true;