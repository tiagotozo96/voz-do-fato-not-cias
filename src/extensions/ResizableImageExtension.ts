import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImage } from '@/components/ResizableImage';

export const ResizableImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('width') || element.style.width;
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      align: {
        default: 'center',
        parseHTML: element => {
          const style = element.style.display;
          if (style === 'block' && element.style.marginLeft === 'auto' && element.style.marginRight === 'auto') {
            return 'center';
          }
          if (element.style.float === 'left') return 'left';
          if (element.style.float === 'right') return 'right';
          return element.getAttribute('data-align') || 'center';
        },
        renderHTML: attributes => {
          const align = attributes.align || 'center';
          let style = `width: ${attributes.width ? attributes.width + 'px' : 'auto'};`;
          
          if (align === 'center') {
            style += ' display: block; margin-left: auto; margin-right: auto;';
          } else if (align === 'left') {
            style += ' float: left; margin-right: 1rem;';
          } else if (align === 'right') {
            style += ' float: right; margin-left: 1rem;';
          }
          
          return {
            'data-align': align,
            style,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage);
  },
});
