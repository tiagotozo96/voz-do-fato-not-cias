import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SpotifyEmbed = ({ node, deleteNode, selected }: NodeViewProps) => {
  const { embedUrl, embedType } = node.attrs;

  const height = embedType === 'track' ? 152 : 352;

  return (
    <NodeViewWrapper className="spotify-embed-wrapper my-4">
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
                title="Excluir embed"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl max-w-[400px]"
        />
      </div>
    </NodeViewWrapper>
  );
};
