import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TikTokEmbed } from '@/components/TikTokEmbed';

export interface TikTokOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tiktok: {
      setTikTokEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

const getTikTokVideoId = (url: string): string | null => {
  // Match various TikTok URL formats
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/t\/(\w+)/,
    /vm\.tiktok\.com\/(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const TikTokExtension = Node.create<TikTokOptions>({
  name: 'tiktok',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      videoId: {
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
        tag: 'div[data-tiktok-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-tiktok-embed': '' }, this.options.HTMLAttributes, HTMLAttributes),
      [
        'blockquote',
        { 
          class: 'tiktok-embed',
          cite: HTMLAttributes.src,
          'data-video-id': HTMLAttributes.videoId,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setTikTokEmbed:
        (options) =>
        ({ commands }) => {
          const videoId = getTikTokVideoId(options.src);
          
          if (!videoId) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              videoId,
              src: options.src,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(TikTokEmbed);
  },
});
