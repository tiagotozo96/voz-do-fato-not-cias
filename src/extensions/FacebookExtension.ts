import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FacebookEmbed } from '@/components/FacebookEmbed';

export interface FacebookOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    facebook: {
      setFacebookEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

const normalizeFacebookUrl = (url: string): string | null => {
  // Match various Facebook URL formats
  const patterns = [
    // Posts: facebook.com/user/posts/123, facebook.com/permalink.php?story_fbid=123
    /facebook\.com\/[^\/]+\/posts\/[\d]+/,
    /facebook\.com\/permalink\.php\?story_fbid=[\d]+/,
    // Photos: facebook.com/photo/?fbid=123
    /facebook\.com\/photo\/?\?fbid=[\d]+/,
    // Videos: facebook.com/watch/?v=123, facebook.com/user/videos/123
    /facebook\.com\/watch\/?\?v=[\d]+/,
    /facebook\.com\/[^\/]+\/videos\/[\d]+/,
    // Reels: facebook.com/reel/123
    /facebook\.com\/reel\/[\d]+/,
    // General post URLs with numeric IDs
    /facebook\.com\/[^\/]+\/[\d]+/,
    // Share URLs
    /facebook\.com\/share\/[\w]+/,
    // Story URLs
    /facebook\.com\/stories\/[\d]+/,
    // Page posts
    /facebook\.com\/[\w\.]+\/posts\/pfbid[\w]+/,
  ];

  // Check if URL is valid
  if (!url.includes('facebook.com')) {
    return null;
  }

  // Try to match any of the patterns
  for (const pattern of patterns) {
    if (pattern.test(url)) {
      return url;
    }
  }

  // If the URL contains facebook.com and has a numeric segment, accept it
  if (/facebook\.com.*\/[\d]+/.test(url) || /facebook\.com.*fbid=[\d]+/.test(url)) {
    return url;
  }

  // Accept any facebook.com URL with pfbid (new format)
  if (/facebook\.com.*pfbid[\w]+/.test(url)) {
    return url;
  }

  return null;
};

export const FacebookExtension = Node.create<FacebookOptions>({
  name: 'facebook',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-facebook-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-facebook-embed': '' }, this.options.HTMLAttributes, HTMLAttributes),
      [
        'div',
        { 
          class: 'fb-post',
          'data-href': HTMLAttributes.src,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setFacebookEmbed:
        (options) =>
        ({ commands }) => {
          const normalizedUrl = normalizeFacebookUrl(options.src);
          
          if (!normalizedUrl) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: normalizedUrl,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FacebookEmbed);
  },
});
