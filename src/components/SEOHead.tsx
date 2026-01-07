import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

const defaultMeta = {
  title: "Voz do Fato - Portal de Notícias",
  description: "Portal de notícias com informações atualizadas sobre Brasil, mundo, economia, esportes e entretenimento.",
  image: "https://lovable.dev/opengraph-image-p98pqg.png",
  siteName: "Voz do Fato",
  twitterHandle: "@VozDoFato",
};

export const SEOHead = ({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
}: SEOHeadProps) => {
  const pageTitle = title ? `${title} | ${defaultMeta.siteName}` : defaultMeta.title;
  const pageDescription = description || defaultMeta.description;
  const pageImage = image || defaultMeta.image;
  const pageUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    // Update document title
    document.title = pageTitle;

    // Update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Basic meta tags
    updateMeta("description", pageDescription);
    updateMeta("author", author || "Voz do Fato");

    // Open Graph
    updateMeta("og:title", title || defaultMeta.title, true);
    updateMeta("og:description", pageDescription, true);
    updateMeta("og:image", pageImage, true);
    updateMeta("og:url", pageUrl, true);
    updateMeta("og:type", type, true);
    updateMeta("og:site_name", defaultMeta.siteName, true);
    updateMeta("og:locale", "pt_BR", true);

    if (type === "article") {
      if (publishedTime) {
        updateMeta("article:published_time", publishedTime, true);
      }
      if (modifiedTime) {
        updateMeta("article:modified_time", modifiedTime, true);
      }
      if (author) {
        updateMeta("article:author", author, true);
      }
      if (section) {
        updateMeta("article:section", section, true);
      }
      tags.forEach((tag, index) => {
        updateMeta(`article:tag:${index}`, tag, true);
      });
    }

    // Twitter Card
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:site", defaultMeta.twitterHandle);
    updateMeta("twitter:title", title || defaultMeta.title);
    updateMeta("twitter:description", pageDescription);
    updateMeta("twitter:image", pageImage);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrl);
  }, [pageTitle, pageDescription, pageImage, pageUrl, type, publishedTime, modifiedTime, author, section, tags, title]);

  return null;
};
