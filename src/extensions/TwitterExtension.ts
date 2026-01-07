import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TwitterEmbed } from '@/components/TwitterEmbed';

export interface TwitterOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twitter: {
      setTwitterEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

const getTweetId = (url: string): string | null => {
  // Match various Twitter/X URL formats
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /twitter\.com\/i\/web\/status\/(\d+)/,
    /x\.com\/i\/web\/status\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const TwitterExtension = Node.create<TwitterOptions>({
  name: 'twitter',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      tweetId: {
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
        tag: 'div[data-twitter-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-twitter-embed': '' }, this.options.HTMLAttributes, HTMLAttributes),
      [
        'blockquote',
        { class: 'twitter-tweet' },
        [
          'a',
          { href: `https://twitter.com/i/web/status/${HTMLAttributes.tweetId}` },
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setTwitterEmbed:
        (options) =>
        ({ commands }) => {
          const tweetId = getTweetId(options.src);
          
          if (!tweetId) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              tweetId,
              src: options.src,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(TwitterEmbed);
  },
});
