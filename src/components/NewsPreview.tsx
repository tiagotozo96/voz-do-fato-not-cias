import { Calendar, Clock, User, Share2, Eye, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TagItem {
  id: string;
  name: string;
  slug: string;
}

interface NewsPreviewProps {
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  categoryName: string;
  authorName?: string;
  tags: TagItem[];
}

export const NewsPreview = ({
  title,
  excerpt,
  content,
  imageUrl,
  categoryName,
  authorName,
  tags,
}: NewsPreviewProps) => {
  const estimateReadTime = (text: string) => {
    if (!text) return "2 min";
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min`;
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto bg-background">
      <article className="max-w-3xl mx-auto p-4">
        {/* Category Badge */}
        {categoryName && (
          <span className="inline-block bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded mb-4">
            {categoryName}
          </span>
        )}

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
          {title || "Título da notícia"}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-4 border-b border-border">
          {authorName && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{authorName}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{estimateReadTime(content)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>0 visualizações</span>
          </div>
        </div>

        {/* Share Buttons (disabled in preview) */}
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Share2 className="h-4 w-4" />
            Compartilhar:
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" disabled>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" disabled>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" disabled>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* Featured Image */}
        {imageUrl && (
          <div className="relative aspect-video mb-6 rounded-lg overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={title || "Preview"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Excerpt */}
        {excerpt && (
          <p className="text-lg text-muted-foreground mb-6 font-medium italic border-l-4 border-primary pl-4">
            {excerpt}
          </p>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none [&>p]:text-foreground/90 [&>p]:leading-relaxed [&>p]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>a]:text-primary [&>a]:underline [&>img]:max-w-full [&>img]:rounded-lg [&>img]:my-4"
        >
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="text-muted-foreground italic">
              O conteúdo da notícia aparecerá aqui...
            </p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border">
            <span className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Tag className="h-4 w-4" />
              Tags:
            </span>
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};
