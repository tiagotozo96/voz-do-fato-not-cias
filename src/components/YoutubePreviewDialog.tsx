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
import { Youtube, Loader2 } from 'lucide-react';

interface YoutubePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => boolean;
}

const getYoutubeVideoId = (url: string): string | null => {
  const patterns = [
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const YoutubePreviewDialog = ({
  open,
  onOpenChange,
  onInsert,
}: YoutubePreviewDialogProps) => {
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

    const id = getYoutubeVideoId(inputUrl);
    
    if (id) {
      setVideoId(id);
      setError(null);
    } else {
      setVideoId(null);
      setError('URL inválida. Use um link do YouTube.');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview(url);
    }, 500);

    return () => clearTimeout(timer);
  }, [url, updatePreview]);

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
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            Inserir Vídeo do YouTube
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">URL do Vídeo do YouTube</Label>
            <Input
              id="youtube-url"
              placeholder="Cole aqui a URL do vídeo do YouTube..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Suporta links do youtube.com, youtu.be e YouTube Shorts
            </p>
          </div>

          {/* Preview area */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/30 min-h-[300px] flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando preview...</span>
              </div>
            ) : videoId ? (
              <div className="w-full aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  width="100%"
                  height="100%"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                <Youtube className="h-8 w-8" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                <Youtube className="h-8 w-8" />
                <span className="text-sm">Cole uma URL do YouTube para ver o preview</span>
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
