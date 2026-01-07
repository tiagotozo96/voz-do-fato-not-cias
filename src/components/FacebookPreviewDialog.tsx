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
import { Facebook, Loader2 } from 'lucide-react';

interface FacebookPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => boolean;
}

const normalizeFacebookUrl = (url: string): string | null => {
  const patterns = [
    /facebook\.com\/[^\/]+\/posts\/[\d]+/,
    /facebook\.com\/permalink\.php\?story_fbid=[\d]+/,
    /facebook\.com\/photo\/?\?fbid=[\d]+/,
    /facebook\.com\/watch\/?\?v=[\d]+/,
    /facebook\.com\/[^\/]+\/videos\/[\d]+/,
    /facebook\.com\/reel\/[\d]+/,
    /facebook\.com\/[^\/]+\/[\d]+/,
    /facebook\.com\/share\/[\w]+/,
    /facebook\.com\/stories\/[\d]+/,
    /facebook\.com\/[\w\.]+\/posts\/pfbid[\w]+/,
  ];

  if (!url.includes('facebook.com')) {
    return null;
  }

  for (const pattern of patterns) {
    if (pattern.test(url)) {
      return url;
    }
  }

  if (/facebook\.com.*\/[\d]+/.test(url) || /facebook\.com.*fbid=[\d]+/.test(url)) {
    return url;
  }

  if (/facebook\.com.*pfbid[\w]+/.test(url)) {
    return url;
  }

  return null;
};

export const FacebookPreviewDialog = ({
  open,
  onOpenChange,
  onInsert,
}: FacebookPreviewDialogProps) => {
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

    const normalizedUrl = normalizeFacebookUrl(inputUrl);
    
    if (normalizedUrl) {
      setPreviewUrl(normalizedUrl);
      setError(null);
    } else {
      setPreviewUrl(null);
      setError('URL inválida. Use um link do Facebook.');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview(url);
    }, 500);

    return () => clearTimeout(timer);
  }, [url, updatePreview]);

  // Load Facebook SDK when preview URL changes
  useEffect(() => {
    if (!previewUrl) return;

    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if ((window as any).FB) {
        (window as any).FB.XFBML.parse();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/pt_BR/sdk.js#xfbml=1&version=v18.0';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if ((window as any).FB) {
          (window as any).FB.XFBML.parse();
        }
      };
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadFacebookSDK, 100);
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
            <Facebook className="h-5 w-5" />
            Inserir Post do Facebook
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook-url">URL do Post do Facebook</Label>
            <Input
              id="facebook-url"
              placeholder="Cole aqui a URL do post do Facebook..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Copie a URL de um post, foto, vídeo ou reel do Facebook
            </p>
          </div>

          {/* Preview area */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/30 min-h-[300px] max-h-[400px] overflow-y-auto flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando preview...</span>
              </div>
            ) : previewUrl ? (
              <div className="w-full p-4">
                <div 
                  className="fb-post" 
                  data-href={previewUrl}
                  data-width="500"
                  data-show-text="true"
                />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                <Facebook className="h-8 w-8" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                <Facebook className="h-8 w-8" />
                <span className="text-sm">Cole uma URL do Facebook para ver o preview</span>
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
