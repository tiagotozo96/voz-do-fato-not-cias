import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SpotifyEmbed } from '@/components/SpotifyEmbed';

export interface SpotifyOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spotify: {
      setSpotifyEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

interface SpotifyInfo {
  embedUrl: string;
  embedType: 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'show';
}

const getSpotifyInfo = (url: string): SpotifyInfo | null => {
  // Match various Spotify URL formats
  const patterns = [
    { regex: /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/, type: 'track' as const },
    { regex: /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/, type: 'album' as const },
    { regex: /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/, type: 'playlist' as const },
    { regex: /open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/, type: 'artist' as const },
    { regex: /open\.spotify\.com\/episode\/([a-zA-Z0-9]+)/, type: 'episode' as const },
    { regex: /open\.spotify\.com\/show\/([a-zA-Z0-9]+)/, type: 'show' as const },
  ];

  for (const { regex, type } of patterns) {
    const match = url.match(regex);
    if (match && match[1]) {
      return {
        embedUrl: `https://open.spotify.com/embed/${type}/${match[1]}?utm_source=generator&theme=0`,
        embedType: type,
      };
    }
  }

  return null;
};

export const SpotifyExtension = Node.create<SpotifyOptions>({
  name: 'spotify',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      embedUrl: {
        default: null,
      },
      embedType: {
        default: 'track',
      },
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-spotify-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-spotify-embed': '' }, this.options.HTMLAttributes, HTMLAttributes),
      [
        'iframe',
        {
          src: HTMLAttributes.embedUrl,
          width: '100%',
          height: HTMLAttributes.embedType === 'track' ? '152' : '352',
          frameborder: '0',
          allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
          loading: 'lazy',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setSpotifyEmbed:
        (options) =>
        ({ commands }) => {
          const spotifyInfo = getSpotifyInfo(options.src);
          
          if (!spotifyInfo) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              embedUrl: spotifyInfo.embedUrl,
              embedType: spotifyInfo.embedType,
              src: options.src,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpotifyEmbed);
  },
});
