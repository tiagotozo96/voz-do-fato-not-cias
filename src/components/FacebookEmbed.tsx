import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement) => void;
      };
    };
  }
}

export const FacebookEmbed = ({ node, deleteNode, selected }: NodeViewProps) => {
  const { src } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Facebook SDK if not already loaded
    const loadFacebookSDK = () => {
      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/pt_BR/sdk.js#xfbml=1&version=v18.0';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          if (window.FB && containerRef.current) {
            window.FB.XFBML.parse(containerRef.current);
          }
        };
        document.body.appendChild(script);
      } else if (window.FB && containerRef.current) {
        window.FB.XFBML.parse(containerRef.current);
      }
    };

    loadFacebookSDK();
  }, [src]);

  return (
    <NodeViewWrapper className="facebook-embed-wrapper my-4">
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
        
        <div ref={containerRef} className="max-w-[500px] w-full">
          <div
            className="fb-post"
            data-href={src}
            data-width="500"
            data-show-text="true"
          >
            <blockquote 
              cite={src} 
              className="fb-xfbml-parse-ignore"
            >
              <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                Ver post no Facebook
              </a>
            </blockquote>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
