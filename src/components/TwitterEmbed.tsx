import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
        createTweet: (tweetId: string, container: HTMLElement, options?: object) => Promise<HTMLElement>;
      };
    };
  }
}

export const TwitterEmbed = ({ node, deleteNode, selected }: NodeViewProps) => {
  const { tweetId } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widget script if not already loaded
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        if (window.twttr && containerRef.current) {
          window.twttr.widgets.createTweet(tweetId, containerRef.current, {
            theme: 'light',
            align: 'center',
          });
        }
      };
      document.body.appendChild(script);
    } else if (containerRef.current) {
      // Clear container and create new tweet
      containerRef.current.innerHTML = '';
      window.twttr.widgets.createTweet(tweetId, containerRef.current, {
        theme: 'light',
        align: 'center',
      });
    }
  }, [tweetId]);

  return (
    <NodeViewWrapper className="twitter-embed-wrapper my-4">
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
                title="Excluir tweet"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="min-h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Carregando tweet...</div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
