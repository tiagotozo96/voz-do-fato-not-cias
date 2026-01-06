import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ImageAlign = 'left' | 'center' | 'right';

export const ResizableImage = ({ node, updateAttributes, selected, deleteNode }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const align = (node.attrs.align as ImageAlign) || 'center';
  const caption = (node.attrs.caption as string) || '';

  const handleMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imageRef.current) return;
    
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = imageRef.current.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = corner.includes('right') 
        ? moveEvent.clientX - startXRef.current 
        : startXRef.current - moveEvent.clientX;
      
      const newWidth = Math.max(100, startWidthRef.current + deltaX);
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  const setAlignment = (newAlign: ImageAlign) => {
    updateAttributes({ align: newAlign });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ caption: e.target.value });
  };

  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingCaption(false);
    }
    if (e.key === 'Escape') {
      setIsEditingCaption(false);
    }
  };

  const wrapperClasses = cn(
    "my-2",
    align === 'center' && "flex justify-center",
    align === 'left' && "flex justify-start",
    align === 'right' && "flex justify-end"
  );

  return (
    <NodeViewWrapper className={wrapperClasses}>
      <figure 
        className={cn(
          "relative inline-block group",
          selected && "ring-2 ring-primary ring-offset-2 rounded-lg",
          isResizing && "select-none"
        )}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || caption || ''}
          style={{ width: node.attrs.width ? `${node.attrs.width}px` : 'auto' }}
          className="max-w-full rounded-lg block"
          draggable={false}
        />
        
        {/* Caption */}
        <figcaption className="mt-2 text-center">
          {isEditingCaption ? (
            <input
              ref={captionInputRef}
              type="text"
              value={caption}
              onChange={handleCaptionChange}
              onKeyDown={handleCaptionKeyDown}
              onBlur={() => setIsEditingCaption(false)}
              placeholder="Adicionar legenda..."
              className="w-full text-sm text-muted-foreground bg-transparent border-b border-primary/50 focus:border-primary outline-none text-center px-2 py-1"
              autoFocus
            />
          ) : (
            <span
              onClick={() => selected && setIsEditingCaption(true)}
              className={cn(
                "text-sm text-muted-foreground block px-2 py-1 min-h-[28px]",
                selected && "cursor-text hover:bg-muted/50 rounded transition-colors",
                !caption && selected && "italic opacity-60"
              )}
            >
              {caption || (selected ? "Clique para adicionar legenda..." : "")}
            </span>
          )}
        </figcaption>
        
        {/* Controls - only show when selected */}
        {selected && (
          <>
            {/* Alignment toolbar */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg shadow-lg flex gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                type="button"
                variant={align === 'left' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setAlignment('left')}
                title="Alinhar à esquerda"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={align === 'center' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setAlignment('center')}
                title="Centralizar"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={align === 'right' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setAlignment('right')}
                title="Alinhar à direita"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-border mx-0.5 self-center" />
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteNode()}
                title="Excluir imagem"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Resize handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-left')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-right')}
            />
            <div
              className="absolute bottom-8 left-0 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
            />
            <div
              className="absolute bottom-8 right-0 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
            />
            
            {/* Size indicator */}
            {node.attrs.width && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-foreground/80 text-background text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {Math.round(node.attrs.width)}px
              </div>
            )}
          </>
        )}
      </figure>
    </NodeViewWrapper>
  );
};
