import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const GoogleMapsEmbed = ({ node, deleteNode, selected }: NodeViewProps) => {
  const { embedUrl } = node.attrs;

  return (
    <NodeViewWrapper className="google-maps-embed-wrapper my-4">
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
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg max-w-full"
        />
      </div>
    </NodeViewWrapper>
  );
};
