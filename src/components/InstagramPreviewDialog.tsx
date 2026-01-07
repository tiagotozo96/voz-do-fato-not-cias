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
import { Instagram, Loader2 } from 'lucide-react';

interface InstagramPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => boolean;
}

const getInstagramPostId = (url: string): string | null => {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/p\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

const normalizeInstagramUrl = (url: string): string | null => {
  const postId = getInstagramPostId(url);
  if (!postId) return null;
  
  if (url.includes('/reel/')) {
    return `https://www.instagram.com/reel/${postId}/`;
  }
  return `https://www.instagram.com/p/${postId}/`;
};

export const InstagramPreviewDialog = ({
  open,
  onOpenChange,
  onInsert,
}: InstagramPreviewDialogProps) => {
  const [url, setUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreview = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) {
      setPreviewUrl(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const normalizedUrl = normalizeInstagramUrl(inputUrl);
    
    if (normalizedUrl) {
      setPreviewUrl(normalizedUrl);
      setError(null);
    } else {
      setPreviewUrl(null);
      setError('URL inválida. Use um link do Instagram.');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview(url);
    }, 500);

    return () => clearTimeout(timer);
  }, [url, updatePreview]);

  // Load Instagram embed script when preview URL changes
  useEffect(() => {
    if (!previewUrl) return;

    const loadInstagramEmbed = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
        }
      };
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadInstagramEmbed, 100);
    return () => clearTimeout(timer);
  }, [previewUrl]);

  const handleInsert = () => {
    if (url && previewUrl) {
      const success = onInsert(url);
      if (success) {
        setUrl('');
        setPreviewUrl(null);
        setError(null);
        onOpenChange(false);
      } else {
        setError('Não foi possível inserir o post. Verifique a URL.');
      }
    }
  };

  const handleClose = () => {
    setUrl('');
    setPreviewUrl(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Inserir Post do Instagram
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram-url">URL do Post do Instagram</Label>
            <Input
              id="instagram-url"
              placeholder="Cole aqui a URL do post do Instagram..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Copie a URL de um post ou reel do Instagram
            </p>
          </div>

          {/* Preview area */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/30 min-h-[350px] max-h-[500px] overflow-y-auto flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando preview...</span>
              </div>
            ) : previewUrl ? (
              <div className="w-full flex justify-center p-4">
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={previewUrl}
                  data-instgrm-version="14"
                  style={{ 
                    maxWidth: '540px', 
                    width: '100%',
                    margin: '0 auto'
                  }}
                />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                <Instagram className="h-8 w-8" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                <Instagram className="h-8 w-8" />
                <span className="text-sm">Cole uma URL do Instagram para ver o preview</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInsert} disabled={!previewUrl || isLoading}>
            Inserir Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
