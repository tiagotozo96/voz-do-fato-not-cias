import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { InstagramEmbed } from '@/components/InstagramEmbed';

export interface InstagramOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    instagram: {
      setInstagramEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

const getInstagramPostId = (url: string): string | null => {
  // Match various Instagram URL formats
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/p\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

const normalizeInstagramUrl = (url: string): string | null => {
  const postId = getInstagramPostId(url);
  if (!postId) return null;
  
  // Check if it's a reel
  if (url.includes('/reel/')) {
    return `https://www.instagram.com/reel/${postId}/`;
  }
  return `https://www.instagram.com/p/${postId}/`;
};

export const InstagramExtension = Node.create<InstagramOptions>({
  name: 'instagram',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      postId: {
        default: null,
      },
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-instagram-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-instagram-embed': '' }, this.options.HTMLAttributes, HTMLAttributes),
      [
        'blockquote',
        { 
          class: 'instagram-media',
          'data-instgrm-permalink': HTMLAttributes.src,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setInstagramEmbed:
        (options) =>
        ({ commands }) => {
          const postId = getInstagramPostId(options.src);
          const normalizedUrl = normalizeInstagramUrl(options.src);
          
          if (!postId || !normalizedUrl) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              postId,
              src: normalizedUrl,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(InstagramEmbed);
  },
});
