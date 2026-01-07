import Youtube from '@tiptap/extension-youtube';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { YoutubeEmbed } from '@/components/YoutubeEmbed';

export const YoutubeExtension = Youtube.extend({
  addNodeView() {
    return ReactNodeViewRenderer(YoutubeEmbed);
  },
});
