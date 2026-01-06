import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ImageAlign = 'left' | 'center' | 'right';

export const ResizableImage = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const align = (node.attrs.align as ImageAlign) || 'center';

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

  const wrapperClasses = cn(
    "my-2",
    align === 'center' && "flex justify-center",
    align === 'left' && "flex justify-start",
    align === 'right' && "flex justify-end"
  );

  return (
    <NodeViewWrapper className={wrapperClasses}>
      <div 
        className={cn(
          "relative inline-block group",
          selected && "ring-2 ring-primary ring-offset-2",
          isResizing && "select-none"
        )}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={{ width: node.attrs.width ? `${node.attrs.width}px` : 'auto' }}
          className="max-w-full rounded-lg block"
          draggable={false}
        />
        
        {/* Controls - only show when selected */}
        {selected && (
          <>
            {/* Alignment toolbar */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg shadow-lg flex gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>

            {/* Resize handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-left')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-right')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
            />
            
            {/* Size indicator */}
            {node.attrs.width && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-foreground/80 text-background text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {Math.round(node.attrs.width)}px
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};
