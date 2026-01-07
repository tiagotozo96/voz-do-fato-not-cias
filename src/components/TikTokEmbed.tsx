import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

export const TikTokEmbed = ({ node, deleteNode, selected }: NodeViewProps) => {
  const { videoId, src } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load TikTok embed script if not already loaded
    const loadTikTokScript = () => {
      if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    loadTikTokScript();
  }, [videoId]);

  return (
    <NodeViewWrapper className="tiktok-embed-wrapper my-4">
      <div className={`relative flex justify-center group ${selected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}>
        {/* Delete button */}
        {selected && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center gap-1 bg-background border border-border rounded-md shadow-lg p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteNode()}
                title="Excluir vídeo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="max-w-[325px] w-full">
          <blockquote
            className="tiktok-embed"
            cite={src}
            data-video-id={videoId}
            style={{
              maxWidth: '325px',
              minWidth: '325px',
            }}
          >
            <section>
              <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                Ver vídeo no TikTok
              </a>
            </section>
          </blockquote>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
