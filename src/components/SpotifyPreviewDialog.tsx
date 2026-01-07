import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Loader2, Music } from 'lucide-react';

interface SpotifyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => boolean;
}

interface SpotifyInfo {
  embedUrl: string;
  embedType: 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'show';
}

const getSpotifyInfo = (url: string): SpotifyInfo | null => {
  const patterns = [
    { regex: /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/, type: 'track' as const },
    { regex: /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/, type: 'album' as const },
    { regex: /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/, type: 'playlist' as const },
    { regex: /open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/, type: 'artist' as const },
    { regex: /open\.spotify\.com\/episode\/([a-zA-Z0-9]+)/, type: 'episode' as const },
    { regex: /open\.spotify\.com\/show\/([a-zA-Z0-9]+)/, type: 'show' as const },
  ];

  for (const { regex, type } of patterns) {
    const match = url.match(regex);
    if (match && match[1]) {
      return {
        embedUrl: `https://open.spotify.com/embed/${type}/${match[1]}?utm_source=generator&theme=0`,
        embedType: type,
      };
    }
  }

  return null;
};

export const SpotifyPreviewDialog = ({
  open,
  onOpenChange,
  onInsert,
}: SpotifyPreviewDialogProps) => {
  const [inputUrl, setInputUrl] = useState('');
  const [previewInfo, setPreviewInfo] = useState<SpotifyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updatePreview = useCallback((url: string) => {
    if (!url.trim()) {
      setPreviewInfo(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const info = getSpotifyInfo(url);
    if (info) {
      setPreviewInfo(info);
      setError(null);
      setIsLoading(false);
    } else {
      setPreviewInfo(null);
      setError('URL do Spotify inválida. Use o formato: open.spotify.com/track/... ou /album/... ou /playlist/...');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputUrl.trim()) {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        updatePreview(inputUrl);
      }, 500);
    } else {
      setPreviewInfo(null);
      setError(null);
      setIsLoading(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputUrl, updatePreview]);

  const handleInsert = useCallback(() => {
    if (inputUrl && previewInfo) {
      const success = onInsert(inputUrl);
      if (success) {
        setInputUrl('');
        setPreviewInfo(null);
        setError(null);
        onOpenChange(false);
      }
    }
  }, [inputUrl, previewInfo, onInsert, onOpenChange]);

  const handleClose = useCallback(() => {
    setInputUrl('');
    setPreviewInfo(null);
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const getHeight = () => {
    if (!previewInfo) return 152;
    return previewInfo.embedType === 'track' ? 152 : 352;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Inserir Spotify
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="spotify-url">URL do Spotify</Label>
            <Input
              id="spotify-url"
              placeholder="https://open.spotify.com/track/..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cole a URL de uma música, álbum, playlist, artista ou podcast do Spotify
            </p>
          </div>

          {/* Preview area */}
          <div className="border rounded-lg p-4 min-h-[180px] flex items-center justify-center bg-muted/30">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando preview...</span>
              </div>
            ) : error ? (
              <div className="text-sm text-destructive text-center">{error}</div>
            ) : previewInfo ? (
              <iframe
                src={previewInfo.embedUrl}
                width="100%"
                height={getHeight()}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
              />
            ) : (
              <div className="text-sm text-muted-foreground text-center">
                Cole uma URL do Spotify para ver o preview
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInsert} disabled={!previewInfo}>
            Inserir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
