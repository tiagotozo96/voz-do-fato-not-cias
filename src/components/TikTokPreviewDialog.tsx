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
import { Music, Loader2 } from 'lucide-react';

interface TikTokPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => boolean;
}

const getTikTokVideoId = (url: string): string | null => {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/t\/(\w+)/,
    /vm\.tiktok\.com\/(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const TikTokPreviewDialog = ({
  open,
  onOpenChange,
  onInsert,
}: TikTokPreviewDialogProps) => {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreview = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) {
      setVideoId(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const id = getTikTokVideoId(inputUrl);
    
    if (id) {
      setVideoId(id);
      setError(null);
    } else {
      setVideoId(null);
      setError('URL inválida. Use um link do TikTok.');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview(url);
    }, 500);

    return () => clearTimeout(timer);
  }, [url, updatePreview]);

  // Load TikTok embed script when video ID changes
  useEffect(() => {
    if (!videoId) return;

    const loadTikTokEmbed = () => {
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadTikTokEmbed, 100);
    return () => clearTimeout(timer);
  }, [videoId]);

  const handleInsert = () => {
    if (url && videoId) {
      const success = onInsert(url);
      if (success) {
        setUrl('');
        setVideoId(null);
        setError(null);
        onOpenChange(false);
      } else {
        setError('Não foi possível inserir o vídeo. Verifique a URL.');
      }
    }
  };

  const handleClose = () => {
    setUrl('');
    setVideoId(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Inserir Vídeo do TikTok
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tiktok-url">URL do Vídeo do TikTok</Label>
            <Input
              id="tiktok-url"
              placeholder="Cole aqui a URL do vídeo do TikTok..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Suporta links do tiktok.com e vm.tiktok.com
            </p>
          </div>

          {/* Preview area */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/30 min-h-[400px] max-h-[500px] overflow-y-auto flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando preview...</span>
              </div>
            ) : videoId ? (
              <div className="w-full flex justify-center p-4">
                <blockquote
                  className="tiktok-embed"
                  cite={url}
                  data-video-id={videoId}
                  style={{ maxWidth: '325px', minWidth: '250px' }}
                >
                  <section></section>
                </blockquote>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                <Music className="h-8 w-8" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                <Music className="h-8 w-8" />
                <span className="text-sm">Cole uma URL do TikTok para ver o preview</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInsert} disabled={!videoId || isLoading}>
            Inserir Vídeo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
