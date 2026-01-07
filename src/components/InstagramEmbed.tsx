import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: (element?: HTMLElement) => void;
      };
    };
  }
}

export const InstagramEmbed = ({ node, deleteNode, selected }: NodeViewProps) => {
  const { postId, src } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Instagram embed script if not already loaded
    const loadInstagramScript = () => {
      if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          if (window.instgrm) {
            window.instgrm.Embeds.process(containerRef.current || undefined);
          }
        };
        document.body.appendChild(script);
      } else if (window.instgrm) {
        window.instgrm.Embeds.process(containerRef.current || undefined);
      }
    };

    loadInstagramScript();
  }, [postId]);

  return (
    <NodeViewWrapper className="instagram-embed-wrapper my-4">
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
                title="Excluir post"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="max-w-[540px] w-full">
          <blockquote
            className="instagram-media"
            data-instgrm-captioned
            data-instgrm-permalink={src}
            data-instgrm-version="14"
            style={{
              background: '#FFF',
              border: 0,
              borderRadius: '3px',
              boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
              margin: '1px',
              maxWidth: '540px',
              minWidth: '326px',
              padding: 0,
              width: '100%',
            }}
          >
            <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
              Ver post no Instagram
            </a>
          </blockquote>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
