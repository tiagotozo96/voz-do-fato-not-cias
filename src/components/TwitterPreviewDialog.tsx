import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Twitter, Loader2 } from 'lucide-react';

interface TwitterPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => boolean;
}

const getTweetId = (url: string): string | null => {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /twitter\.com\/i\/web\/status\/(\d+)/,
    /x\.com\/i\/web\/status\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const TwitterPreviewDialog = ({
  open,
  onOpenChange,
  onInsert,
}: TwitterPreviewDialogProps) => {
  const [url, setUrl] = useState('');
  const [tweetId, setTweetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreview = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) {
      setTweetId(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const id = getTweetId(inputUrl);
    
    if (id) {
      setTweetId(id);
      setError(null);
    } else {
      setTweetId(null);
      setError('URL inválida. Use um link do Twitter/X.');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview(url);
    }, 500);

    return () => clearTimeout(timer);
  }, [url, updatePreview]);

  // Load Twitter widget script when tweet ID changes
  useEffect(() => {
    if (!tweetId) return;

    const loadTwitterWidget = () => {
      if ((window as any).twttr) {
        (window as any).twttr.widgets.load();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).twttr) {
          (window as any).twttr.widgets.load();
        }
      };
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadTwitterWidget, 100);
    return () => clearTimeout(timer);
  }, [tweetId]);

  const handleInsert = () => {
    if (url && tweetId) {
      const success = onInsert(url);
      if (success) {
        setUrl('');
        setTweetId(null);
        setError(null);
        onOpenChange(false);
      } else {
        setError('Não foi possível inserir o tweet. Verifique a URL.');
      }
    }
  };

  const handleClose = () => {
    setUrl('');
    setTweetId(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            Inserir Tweet (Twitter/X)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitter-url">URL do Tweet</Label>
            <Input
              id="twitter-url"
              placeholder="Cole aqui a URL do tweet..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Suporta links do twitter.com e x.com
            </p>
          </div>

          {/* Preview area */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/30 min-h-[300px] max-h-[500px] overflow-y-auto flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando preview...</span>
              </div>
            ) : tweetId ? (
              <div className="w-full flex justify-center p-4">
                <blockquote className="twitter-tweet" data-dnt="true">
                  <a href={`https://twitter.com/i/web/status/${tweetId}`}>Loading tweet...</a>
                </blockquote>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                <Twitter className="h-8 w-8" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                <Twitter className="h-8 w-8" />
                <span className="text-sm">Cole uma URL do Twitter/X para ver o preview</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInsert} disabled={!tweetId || isLoading}>
            Inserir Tweet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
