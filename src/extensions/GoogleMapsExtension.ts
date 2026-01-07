import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GoogleMapsEmbed } from '@/components/GoogleMapsEmbed';

export interface GoogleMapsOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    googleMaps: {
      setGoogleMapsEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

const getGoogleMapsEmbedUrl = (url: string): string | null => {
  // Handle embed URLs directly
  if (url.includes('google.com/maps/embed')) {
    return url;
  }

  // Handle share links like: https://maps.app.goo.gl/... or https://goo.gl/maps/...
  if (url.includes('goo.gl/maps') || url.includes('maps.app.goo.gl')) {
    // For short links, we need to construct a place embed
    // Extract any identifiable info - for short links we'll use place mode
    return null; // Short links require redirect following, which we can't do client-side
  }

  // Handle place URLs: https://www.google.com/maps/place/...
  const placeMatch = url.match(/google\.com\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    const placeName = placeMatch[1];
    return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(placeName.replace(/\+/g, ' '))}`;
  }

  // Handle coordinate URLs: https://www.google.com/maps/@lat,lng,zoom
  const coordMatch = url.match(/google\.com\/maps\/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/);
  if (coordMatch) {
    const [, lat, lng] = coordMatch;
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sbr!4v1`;
  }

  // Handle search URLs: https://www.google.com/maps/search/...
  const searchMatch = url.match(/google\.com\/maps\/search\/([^/]+)/);
  if (searchMatch) {
    const query = searchMatch[1];
    return `https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d10000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1s${encodeURIComponent(query)}!5e0!3m2!1sen!2sbr!4v1`;
  }

  // Handle URLs with pb parameter (most common share format)
  const pbMatch = url.match(/google\.com\/maps[^?]*\?.*pb=([^&]+)/);
  if (pbMatch) {
    return `https://www.google.com/maps/embed?pb=${pbMatch[1]}`;
  }

  // Handle simple query URLs: https://www.google.com/maps?q=...
  const queryMatch = url.match(/google\.com\/maps\?q=([^&]+)/);
  if (queryMatch) {
    const query = queryMatch[1];
    return `https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d10000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1s${encodeURIComponent(query)}!5e0!3m2!1sen!2sbr!4v1`;
  }

  return null;
};

export const GoogleMapsExtension = Node.create<GoogleMapsOptions>({
  name: 'googleMaps',

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
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-google-maps-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-google-maps-embed': '' }, this.options.HTMLAttributes, HTMLAttributes),
      [
        'iframe',
        {
          src: HTMLAttributes.embedUrl,
          width: '100%',
          height: '400',
          style: 'border: 0',
          allowfullscreen: '',
          loading: 'lazy',
          referrerpolicy: 'no-referrer-when-downgrade',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setGoogleMapsEmbed:
        (options) =>
        ({ commands }) => {
          const embedUrl = getGoogleMapsEmbedUrl(options.src);
          
          if (!embedUrl) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              embedUrl,
              src: options.src,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(GoogleMapsEmbed);
  },
});
