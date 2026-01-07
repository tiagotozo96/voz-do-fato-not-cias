import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VimeoEmbed } from '@/components/VimeoEmbed';

export interface VimeoOptions {
  width: number;
  height: number;
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    vimeo: {
      setVimeoVideo: (options: { src: string }) => ReturnType;
    };
  }
}

const getVimeoEmbedUrl = (url: string): string | null => {
  // Match various Vimeo URL formats
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }

  return null;
};

export const VimeoExtension = Node.create<VimeoOptions>({
  name: 'vimeo',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      width: 640,
      height: 360,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vimeo-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-vimeo-video': '' }, this.options.HTMLAttributes),
      [
        'iframe',
        mergeAttributes(HTMLAttributes, {
          allowfullscreen: 'true',
          allow: 'autoplay; fullscreen; picture-in-picture',
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setVimeoVideo:
        (options) =>
        ({ commands }) => {
          const embedUrl = getVimeoEmbedUrl(options.src);
          
          if (!embedUrl) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: embedUrl,
              width: this.options.width,
              height: this.options.height,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(VimeoEmbed);
  },
});
