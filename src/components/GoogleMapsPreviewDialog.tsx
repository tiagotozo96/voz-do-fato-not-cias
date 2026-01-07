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
import { MapPin, Loader2 } from 'lucide-react';

interface GoogleMapsPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => boolean;
}

const getGoogleMapsEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle embed URLs directly
  if (url.includes('google.com/maps/embed')) {
    return url;
  }

  // Handle place URLs: https://www.google.com/maps/place/...
  const placeMatch = url.match(/google\.com\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    const placeName = placeMatch[1];
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s!2s${encodeURIComponent(placeName.replace(/\+/g, ' '))}!5e0!3m2!1spt-BR!2sbr`;
  }

  // Handle coordinate URLs: https://www.google.com/maps/@lat,lng,zoom
  const coordMatch = url.match(/google\.com\/maps\/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/);
  if (coordMatch) {
    const [, lat, lng] = coordMatch;
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt-BR!2sbr`;
  }

  // Handle search URLs: https://www.google.com/maps/search/...
  const searchMatch = url.match(/google\.com\/maps\/search\/([^/]+)/);
  if (searchMatch) {
    const query = searchMatch[1];
    return `https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d10000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1s${encodeURIComponent(decodeURIComponent(query))}!5e0!3m2!1spt-BR!2sbr`;
  }

  // Handle URLs with pb parameter (most common share format)
  const pbMatch = url.match(/google\.com\/maps[^?]*\?.*pb=([^&]+)/);
  if (pbMatch) {
    return `https://www.google.com/maps/embed?pb=${pbMatch[1]}`;
  }

  // Handle simple query URLs: https://www.google.com/maps?q=...
  const queryMatch = url.match(/google\.com\/maps\?q=([^&]+)/);
  if (queryMatch) {
    const query = queryMatch[1];
    return `https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d10000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1s${encodeURIComponent(decodeURIComponent(query))}!5e0!3m2!1spt-BR!2sbr`;
  }

  return null;
};

export const GoogleMapsPreviewDialog = ({
  open,
  onOpenChange,
  onInsert,
}: GoogleMapsPreviewDialogProps) => {
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

    // Debounce the preview update
    const embedUrl = getGoogleMapsEmbedUrl(inputUrl);
    
    if (embedUrl) {
      setPreviewUrl(embedUrl);
      setError(null);
    } else {
      setPreviewUrl(null);
      setError('URL inválida. Use um link do Google Maps.');
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
    if (url && previewUrl) {
      const success = onInsert(url);
      if (success) {
        setUrl('');
        setPreviewUrl(null);
        setError(null);
        onOpenChange(false);
      } else {
        setError('Não foi possível inserir o mapa. Verifique a URL.');
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
            <MapPin className="h-5 w-5" />
            Inserir Google Maps
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maps-url">URL do Google Maps</Label>
            <Input
              id="maps-url"
              placeholder="Cole aqui a URL do Google Maps..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Copie o link de compartilhamento ou embed do Google Maps
            </p>
          </div>

          {/* Preview area */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/30 min-h-[250px] flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando preview...</span>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                <MapPin className="h-8 w-8" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                <MapPin className="h-8 w-8" />
                <span className="text-sm">Cole uma URL do Google Maps para ver o preview</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInsert} disabled={!previewUrl || isLoading}>
            Inserir Mapa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
